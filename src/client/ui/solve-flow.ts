import type { ModelDraft } from '../state/model-draft';
import {
  extractLinearForm,
  writeResults,
  restoreSnapshot,
  preflight,
} from '../rpc/server-bridge';
import { runSolve } from '../solver/solve';
import { buildAnswerMatrix } from '../reports/answer';
import { buildSensitivityMatrix } from '../reports/sensitivity';
import { buildGraphicalPng } from '../reports/graphical';
import { openResultsModal } from './results-modal';
import type { LinearForm, SolveResult } from '../../shared/linear-form';

interface SolveCache {
  fingerprint: string;
  lf: LinearForm;
  sr: SolveResult;
  snapshot: unknown;
  graphicalPngBase64: string | null;
  graphicalError: string | null;
}

// Module-scoped cache: most recent successful extraction + solve.
// Cleared automatically when the sidebar re-mounts (e.g., template insertion).
let lastSolveCache: SolveCache | null = null;

export async function runSolveFlow(host: HTMLElement, draft: ModelDraft): Promise<void> {
  const modelDoc = draft.toDocument();

  const overlay = document.createElement('div');
  overlay.className = 'solving-overlay';
  overlay.innerHTML = `
    <div class="spinner"></div>
    <div class="muted" id="solvePhase">Validando modelo…</div>
    <div class="muted small" id="solveHint">Esto puede tardar algunos segundos. La hoja se va a actualizar mientras AltSolver mide los coeficientes de cada variable.</div>
  `;
  host.appendChild(overlay);
  const phaseEl = overlay.querySelector<HTMLDivElement>('#solvePhase')!;
  const setPhase = (msg: string): void => { phaseEl.textContent = msg; };

  try {
    setPhase('Validando modelo…');
    // Single RPC: validate + compute fingerprint at once. Saves one
    // ~500ms round-trip vs. doing them in sequence.
    const pre = await preflight(modelDoc);
    if (pre == null) {
      throw new Error('El servidor no devolvió respuesta. ¿Refrescaste la hoja después del último push?');
    }
    if (!pre.validation.ok) {
      throw new Error((pre.validation.errors ?? ['Error de validación']).join('\n'));
    }
    const fingerprint = pre.fingerprint;

    let lf: LinearForm;
    let sr: SolveResult;
    let snapshot: unknown;
    let graphicalPngBase64: string | null = null;
    let graphicalError: string | null = null;
    let cacheHit = false;

    if (fingerprint && lastSolveCache && lastSolveCache.fingerprint === fingerprint) {
      setPhase('Modelo sin cambios — usando resultado anterior…');
      lf = lastSolveCache.lf;
      sr = lastSolveCache.sr;
      snapshot = lastSolveCache.snapshot;
      graphicalPngBase64 = lastSolveCache.graphicalPngBase64;
      graphicalError = lastSolveCache.graphicalError;
      cacheHit = true;
    } else {
      setPhase('Extrayendo coeficientes del modelo (esto es lo más lento)…');
      const ex = await extractLinearForm(modelDoc);
      if (ex == null) {
        throw new Error('La extracción no devolvió respuesta. Probablemente el modelo contiene valores infinitos o NaN que la RPC no puede serializar.');
      }
      if (!ex.ok || !ex.linearForm) {
        throw new Error((ex.errors ?? ['Error de extracción']).join('\n'));
      }
      lf = ex.linearForm as LinearForm;
      snapshot = ex.snapshot;

      // Sanity check: if no constraint's coefficients depend on any variable,
      // the user's LHS formulas don't actually reference the variables.
      // HiGHS will reject this as "Empty model" / parser error.
      const objHasCoef = lf.objective.coefs.some((c) => Math.abs(c) > 1e-12);
      const allRowsZero = lf.rows.length > 0 && lf.rows.every(
        (r) => r.coefs.every((c) => Math.abs(c) <= 1e-12),
      );
      if (!objHasCoef && allRowsZero) {
        throw new Error(
          'Ni el objetivo ni las restricciones dependen de las variables. ' +
          'Las celdas LHS (' + lf.rows.map((r) => r.lhsA1).join(', ') +
          ') y la celda objetivo (' + lf.objective.cellA1 + ') probablemente contienen ' +
          'constantes en lugar de fórmulas que multipliquen los coeficientes por las variables. ' +
          'Por ejemplo: =SUMPRODUCT(coeficientes, variables).',
        );
      }
      if (allRowsZero) {
        throw new Error(
          'Ninguna de las restricciones depende de las variables. Las celdas ' +
          lf.rows.map((r) => r.lhsA1).join(', ') +
          ' probablemente contienen constantes en lugar de fórmulas. ' +
          'Necesitás fórmulas como =SUMPRODUCT(coeficientes, variables) o =B7*B2 + C7*C2.',
        );
      }

      setPhase('Cargando motor (HiGHS) y resolviendo…');
      sr = await runSolve(lf, {
        timeLimitSec: modelDoc.options.timeLimitSec,
        mipRelGap: modelDoc.options.mipGap,
      });

      setPhase('Listo. Preparando reportes…');
      try {
        graphicalPngBase64 = buildGraphicalPng(lf, sr);
        if (!graphicalPngBase64) {
          graphicalError = 'No se pudo construir la solución gráfica (sólo soportada para 2 variables continuas con región factible no vacía).';
        }
      } catch (e) {
        graphicalError = 'Error al renderizar el gráfico: ' + (e as Error).message;
        console.error('[AltSolver] buildGraphicalPng threw:', e);
      }

      if (fingerprint) {
        lastSolveCache = { fingerprint, lf, sr, snapshot, graphicalPngBase64, graphicalError };
      }
    }

    const ctx = {
      sheetName: '',
      timestamp: new Date().toLocaleString('es-AR'),
    };
    const answerMatrix = buildAnswerMatrix(lf, sr, ctx);
    const sensitivityMatrix = buildSensitivityMatrix(lf, sr, ctx);

    if (cacheHit) {
      console.warn('[AltSolver] Cache hit — skipping extraction and solve.');
    }

    overlay.remove();

    openResultsModal(host, {
      lf,
      sr,
      onAccept: async (choice) => {
        const reqOverlay = document.createElement('div');
        reqOverlay.className = 'solving-overlay';
        reqOverlay.innerHTML = `<div class="spinner"></div><div class="muted">Escribiendo reportes…</div>`;
        host.appendChild(reqOverlay);
        try {
          if (!choice.keepSolution) {
            await restoreSnapshot(modelDoc, snapshot);
          }
          if (
            choice.keepSolution ||
            choice.writeAnswer ||
            choice.writeSensitivity ||
            choice.writeGraphical
          ) {
            await writeResults({
              modelDoc,
              solveResult: {
                variableValuesFlat: sr.variables.map((v) => v.primal),
                objectiveValue: sr.objective,
                isMip: sr.isMip,
              },
              answerMatrix: choice.writeAnswer ? answerMatrix : null,
              sensitivityMatrix: choice.writeSensitivity ? sensitivityMatrix : null,
              graphicalPngBase64,
              graphicalError,
              snapshot,
              keepSolution: choice.keepSolution,
              writeReports: {
                answer: choice.writeAnswer,
                sensitivity: choice.writeSensitivity,
                graphical: choice.writeGraphical,
              },
            });
          }
        } finally {
          reqOverlay.remove();
        }
        try {
          google.script.host?.close?.();
        } catch {
          /* ignore */
        }
      },
      onCancel: async () => {
        await restoreSnapshot(modelDoc, snapshot);
      },
    });
  } catch (e) {
    overlay.remove();
    alert(`AltSolver — ${(e as Error).message}`);
  }
}
