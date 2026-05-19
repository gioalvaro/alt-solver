import type { SolveResult, LinearForm } from '../../shared/linear-form';
import { t } from '../i18n/i18n';
import { errorMessage } from '../errors/error-messages';

export interface ResultsModalChoice {
  keepSolution: boolean;
  writeAnswer: boolean;
  writeSensitivity: boolean;
  writeGraphical: boolean;
}

interface OpenOpts {
  lf: LinearForm;
  sr: SolveResult;
  onAccept: (choice: ResultsModalChoice) => void | Promise<void>;
  onCancel?: () => void;
}

export function openResultsModal(parent: HTMLElement, opts: OpenOpts): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay results-overlay';
  const banner = bannerHtml(opts.sr);
  const objective = objectiveHtml(opts.sr, opts.lf);
  const summary = summaryHtml(opts.sr, opts.lf);
  const choices = choicesHtml(opts.sr);

  overlay.innerHTML = `
    <div class="modal modal-results" role="dialog" aria-label="Resultados del Solver">
      ${banner}
      ${objective}
      ${summary}
      ${choices}
      <div class="actions">
        <button type="button" data-action="cancel">${t('btn.cancel')}</button>
        <button type="button" data-action="accept" class="primary">Aceptar</button>
      </div>
    </div>
  `;
  parent.appendChild(overlay);

  overlay.addEventListener('click', async (e) => {
    const action = (e.target as HTMLElement).dataset.action;
    if (action === 'cancel') {
      overlay.remove();
      opts.onCancel?.();
    } else if (action === 'accept') {
      const keepEl = overlay.querySelector<HTMLInputElement>('input[name="keep"]:checked');
      const keep = keepEl?.value === 'keep';
      const writeAnswer = overlay.querySelector<HTMLInputElement>('#chk-answer')?.checked ?? true;
      const writeSensitivity = overlay.querySelector<HTMLInputElement>('#chk-sensitivity')?.checked ?? false;
      const writeGraphical = overlay.querySelector<HTMLInputElement>('#chk-graphical')?.checked ?? false;
      overlay.remove();
      await opts.onAccept({ keepSolution: keep, writeAnswer, writeSensitivity, writeGraphical });
    }
  });
}

function bannerHtml(sr: SolveResult): string {
  const cls = sr.status === 'optimal' ? 'banner-ok'
            : sr.status === 'infeasible' || sr.status === 'unbounded' || sr.status === 'error' ? 'banner-err'
            : 'banner-warn';
  const title = sr.status === 'optimal' ? 'AltSolver encontró una solución'
              : sr.status === 'infeasible' ? errorMessage('solver_infeasible', {})
              : sr.status === 'unbounded' ? errorMessage('solver_unbounded', {})
              : sr.status === 'time_limit' ? errorMessage('solver_time_limit_feasible', { gap: sr.mipGap ?? 0 })
              : sr.status === 'error' ? errorMessage('solver_error', {})
              : 'Resultado del Solver';
  const detail = sr.message ? `<div class="banner-detail">${escapeHtml(sr.message)}</div>` : '';
  return `<div class="banner ${cls}"><span class="dot"></span><strong>${escapeHtml(title)}</strong></div>${detail}`;
}

function objectiveHtml(sr: SolveResult, lf: LinearForm): string {
  if (sr.status !== 'optimal' && sr.status !== 'time_limit') return '';
  const value = sr.objective.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const orig = lf.objective.originalValue;
  const delta = sr.objective - orig;
  const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
  return `
    <div class="section">
      <div class="muted small">Valor objetivo</div>
      <div class="big-number">${escapeHtml(value)} <span class="delta">${escapeHtml(deltaStr)}</span></div>
      <div class="muted small">${escapeHtml(lf.objective.name)}</div>
    </div>
  `;
}

function summaryHtml(sr: SolveResult, lf: LinearForm): string {
  const integers = lf.vars.filter((v) => v.integral).length;
  const continuous = lf.vars.length - integers;
  const binding = sr.rows.filter((r) => r.status === 'upper' || r.status === 'lower').length;
  return `
    <div class="section">
      <div class="muted small">Resumen</div>
      <table class="kv">
        <tr><td>Estado</td><td>${escapeHtml(statusLabel(sr.status))}</td></tr>
        <tr><td>Motor</td><td>${escapeHtml(sr.isMip ? 'Simplex + B&B (HiGHS)' : 'Simplex LP (HiGHS)')}</td></tr>
        <tr><td>Tiempo</td><td>${(sr.time * 1000).toFixed(0)} ms</td></tr>
        <tr><td>Variables</td><td>${continuous} continuas, ${integers} enteras</td></tr>
        <tr><td>Restricciones</td><td>${lf.rows.length} (${binding} vinculantes)</td></tr>
      </table>
    </div>
  `;
}

function choicesHtml(sr: SolveResult): string {
  const isFeasible = sr.status === 'optimal' || sr.status === 'time_limit';
  if (!isFeasible) return '';
  const sensitivityDisabled = sr.isMip ? 'disabled' : '';
  const sensitivityNote = sr.isMip ? '<div class="muted small">No disponible para problemas enteros (igual que Excel).</div>' : '';
  const canGraph = sr.variables.length === 2 && !sr.isMip;
  const graphicalRow = canGraph
    ? `<br/><label><input id="chk-graphical" type="checkbox" checked /> Solución gráfica</label>
       <div class="muted small">Plot de la región factible, vértices, y nivel objetivo (sólo 2 variables).</div>`
    : '';
  return `
    <div class="section">
      <div class="muted small">Solución</div>
      <label><input type="radio" name="keep" value="keep" checked /> Conservar la solución en la hoja</label><br/>
      <label><input type="radio" name="keep" value="restore" /> Restaurar los valores originales</label>
    </div>
    <div class="section">
      <div class="muted small">Informes a generar</div>
      <label><input id="chk-answer" type="checkbox" checked /> Respuesta</label><br/>
      <label><input id="chk-sensitivity" type="checkbox" ${sr.isMip ? '' : 'checked'} ${sensitivityDisabled} /> Sensibilidad</label>
      ${sensitivityNote}
      ${graphicalRow}
    </div>
  `;
}

function statusLabel(s: SolveResult['status']): string {
  if (s === 'optimal') return 'Óptimo';
  if (s === 'infeasible') return 'Infactible';
  if (s === 'unbounded') return 'No acotado';
  if (s === 'time_limit') return 'No óptimo (tiempo)';
  if (s === 'iter_limit') return 'No óptimo (iteraciones)';
  return 'Error';
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
