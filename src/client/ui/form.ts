import { isValidA1 } from '../../shared/a1';
import type { ModelDraft } from '../state/model-draft';
import { t } from '../i18n/i18n';
import { mountConstraintsList } from './constraints-list';
import { openOptionsModal } from './options-modal';
import { makeRangePicker } from './range-picker';
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
import { openTemplatesModal } from './templates-modal';
import { reloadApp } from '../app';
import { openResultsModal } from './results-modal';
import type { LinearForm, SolveResult } from '../../shared/linear-form';

interface Opts {
  draft: ModelDraft;
  onSave: () => Promise<void>;
}

export function mountForm(host: HTMLElement, opts: Opts): void {
  const doc = opts.draft.toDocument();
  host.innerHTML = `
    <div class="sidebar-header">
      <button type="button" class="ghost" data-action="load-example">📋 Insertar ejemplo</button>
    </div>
    <form id="solverForm" autocomplete="off">
      <div class="section-label">Función objetivo</div>

      <div class="field">
        <label for="objCell">${t('label.objective')}</label>
        <div class="input-row">
          <input id="objCell" type="text" value="${esc(doc.objective.cellA1)}" placeholder="Ej: B12" />
          <button type="button" class="pick-btn" data-action="pick-obj" title="Seleccioná un rango en la hoja">⌖</button>
        </div>
        <div class="hint" id="objError"></div>
      </div>

      <fieldset class="field">
        <legend>${t('label.sense')}</legend>
        <label><input type="radio" name="sense" value="MAX" ${doc.objective.sense === 'MAX' ? 'checked' : ''} /> ${t('sense.max')}</label>
        <label><input type="radio" name="sense" value="MIN" ${doc.objective.sense === 'MIN' ? 'checked' : ''} /> ${t('sense.min')}</label>
        <label>
          <input type="radio" name="sense" value="TARGET" ${doc.objective.sense === 'TARGET' ? 'checked' : ''} />
          ${t('sense.target')}:
          <input id="targetValue" type="number" step="any" value="${doc.objective.targetValue ?? ''}" />
        </label>
      </fieldset>

      <div class="section-label">Variables de decisión</div>

      <div class="field">
        <label for="varsRange">${t('label.variables')}</label>
        <div class="input-row">
          <input id="varsRange" type="text" value="${esc(doc.variables.rangeA1)}" placeholder="Ej: B3:B7" />
          <button type="button" class="pick-btn" data-action="pick-vars" title="Seleccioná un rango en la hoja">⌖</button>
        </div>
        <div class="hint" id="varsError"></div>
        <div id="varsSummary" class="summary-inline"></div>
      </div>

      <div class="section-label">Restricciones</div>

      <div class="field">
        <div id="constraintsHost"></div>
      </div>

      <div class="section-label">Opciones</div>

      <div class="field">
        <label><input id="assumeNN" type="checkbox" ${doc.options.assumeNonNegative ? 'checked' : ''} />
          ${t('label.assumeNonNegative')}</label>
      </div>

      <div class="field">
        <label for="method">${t('label.method')}</label>
        <div class="input-row">
          <select id="method" style="flex:1;"><option value="simplexLp" selected>${t('method.simplexLp')}</option></select>
          <button type="button" data-action="options">⚙ ${t('btn.options')}</button>
        </div>
        <div id="optsSummary" class="options-summary"></div>
      </div>

      <div class="actions">
        <button type="button" data-action="save">💾 ${t('btn.save')}</button>
        <div class="right">
          <button type="button" data-action="solve" class="primary">▶ ${t('btn.solve')}</button>
        </div>
      </div>
      <div id="savedMessage" class="msg" style="display:none;">${t('msg.saved')}</div>
    </form>
  `;

  const objCell = host.querySelector<HTMLInputElement>('#objCell')!;
  const varsRange = host.querySelector<HTMLInputElement>('#varsRange')!;
  const objError = host.querySelector<HTMLDivElement>('#objError')!;
  const varsError = host.querySelector<HTMLDivElement>('#varsError')!;
  const assumeNN = host.querySelector<HTMLInputElement>('#assumeNN')!;
  const targetValue = host.querySelector<HTMLInputElement>('#targetValue')!;
  const constraintsHost = host.querySelector<HTMLDivElement>('#constraintsHost')!;

  const objPickBtn = host.querySelector<HTMLButtonElement>('[data-action="pick-obj"]')!;
  const varsPickBtn = host.querySelector<HTMLButtonElement>('[data-action="pick-vars"]')!;
  const varsSummary = host.querySelector<HTMLDivElement>('#varsSummary')!;
  const optsSummary = host.querySelector<HTMLDivElement>('#optsSummary')!;
  const objPicker = makeRangePicker(objCell, objPickBtn);
  const varsPicker = makeRangePicker(varsRange, varsPickBtn);

  function updateVarsSummary(): void {
    const r = varsRange.value;
    if (r === '' || !isValidA1(r)) { varsSummary.textContent = ''; return; }
    // Best-effort count from A1 range
    const m = r.match(/(\$?[A-Z]+\$?[1-9][0-9]{0,6})(?::(\$?[A-Z]+\$?[1-9][0-9]{0,6}))?$/);
    if (!m) { varsSummary.textContent = ''; return; }
    const start = m[1]!.replace(/\$/g, '');
    const end = m[2] ? m[2].replace(/\$/g, '') : start;
    const parse = (s: string): [number, number] | null => {
      const mm = s.match(/^([A-Z]+)([0-9]+)$/);
      if (!mm) return null;
      const col = mm[1]!.split('').reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0);
      const row = Number(mm[2]);
      return [row, col];
    };
    const s = parse(start);
    const e = parse(end);
    if (!s || !e) { varsSummary.textContent = ''; return; }
    const count = (Math.abs(e[0] - s[0]) + 1) * (Math.abs(e[1] - s[1]) + 1);
    varsSummary.textContent = `${count} ${count === 1 ? 'variable detectada' : 'variables detectadas'}`;
  }

  function updateOptsSummary(): void {
    const o = opts.draft.toDocument().options;
    optsSummary.innerHTML =
      `<span class="chip">Tiempo máx ${o.timeLimitSec}s</span>` +
      `<span class="chip">Gap MIP ${(o.mipGap * 100).toFixed(2)}%</span>` +
      `<span class="chip">Tol entera ${o.integerTolerance}</span>`;
  }
  updateVarsSummary();
  updateOptsSummary();

  mountConstraintsList(constraintsHost, {
    parent: host,
    getList: () => opts.draft.toDocument().constraints,
    onAdd: (c) => opts.draft.addConstraint(c),
    onUpdate: (i, c) => opts.draft.updateConstraint(i, c),
    onRemove: (i) => opts.draft.removeConstraint(i),
  });

  function syncObjective(): void {
    const cell = objCell.value;
    const senseInput = host.querySelector<HTMLInputElement>('input[name="sense"]:checked');
    const sense = (senseInput?.value ?? 'MIN') as 'MAX' | 'MIN' | 'TARGET';
    const tv = sense === 'TARGET' ? Number(targetValue.value) : null;
    objError.textContent = cell !== '' && !isValidA1(cell) ? t('msg.invalidA1') : '';
    opts.draft.setObjective({ cellA1: cell, sense, targetValue: tv });
  }

  function syncVariables(): void {
    const r = varsRange.value;
    varsError.textContent = r !== '' && !isValidA1(r) ? t('msg.invalidA1') : '';
    opts.draft.setVariables({
      rangeA1: r,
      names: [],
      assumeNonNegative: assumeNN.checked,
    });
    updateVarsSummary();
  }

  objCell.addEventListener('change', syncObjective);
  varsRange.addEventListener('change', syncVariables);
  assumeNN.addEventListener('change', syncVariables);
  targetValue.addEventListener('change', syncObjective);
  host.querySelectorAll<HTMLInputElement>('input[name="sense"]').forEach((r) => {
    r.addEventListener('change', syncObjective);
  });

  host.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    if (action === 'pick-obj') {
      await objPicker.toggle();
      syncObjective();
    } else if (action === 'pick-vars') {
      await varsPicker.toggle();
      syncVariables();
    } else if (action === 'options') {
      openOptionsModal(host, {
        initial: opts.draft.toDocument().options,
        onAccept: (newOpts) => {
          opts.draft.setOptions(newOpts);
          updateOptsSummary();
        },
      });
    } else if (action === 'save') {
      await opts.onSave();
      showToast(t('msg.saved'));
    } else if (action === 'load-example') {
      openTemplatesModal(host, {
        onApplied: async () => {
          showToast('Ejemplo insertado — cargando modelo…');
          await reloadApp();
        },
      });
    } else if (action === 'solve') {
      await runSolveFlow(host, opts.draft);
    }
  });
}

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

async function runSolveFlow(host: HTMLElement, draft: ModelDraft): Promise<void> {
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

      // Cache for next solve.
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

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showToast(message: string): void {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.2s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 2500);
}
