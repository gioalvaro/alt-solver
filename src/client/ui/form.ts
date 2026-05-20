import { isValidA1 } from '../../shared/a1';
import type { ModelDraft } from '../state/model-draft';
import { t } from '../i18n/i18n';
import { mountConstraintsList } from './constraints-list';
import { openOptionsModal } from './options-modal';
import { makeRangePicker } from './range-picker';
import { openTemplatesModal } from './templates-modal';
import { reloadApp } from '../app';
import { HighlightCoordinator } from './highlight';
import { runSolveFlow } from './solve-flow';
import { showToast } from './toast';

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

  const highlighter = new HighlightCoordinator();
  window.addEventListener('beforeunload', () => highlighter.clearNow());

  function refreshHighlight(role: 'objective' | 'variables', input: HTMLInputElement): void {
    const v = input.value;
    if (v && isValidA1(v)) highlighter.highlight(role, [v]);
    else highlighter.clear();
  }
  objCell.addEventListener('focus', () => refreshHighlight('objective', objCell));
  objCell.addEventListener('input', () => refreshHighlight('objective', objCell));
  varsRange.addEventListener('focus', () => refreshHighlight('variables', varsRange));
  varsRange.addEventListener('input', () => refreshHighlight('variables', varsRange));
  objCell.addEventListener('blur', () => highlighter.clear());
  varsRange.addEventListener('blur', () => highlighter.clear());
  window.addEventListener('pagehide', () => highlighter.clearNow());

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
    onSelect: (_i, c) => {
      if (!c) { highlighter.clear(); return; }
      const ranges: string[] = [c.lhsA1];
      if ('rhsA1OrValue' in c) ranges.push(c.rhsA1OrValue);
      highlighter.highlight('constraint', ranges);
    },
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
      highlighter.clearNow();
      await runSolveFlow(host, opts.draft);
    }
  });
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
