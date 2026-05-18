import { isValidA1 } from '../../shared/a1';
import type { ModelDraft } from '../state/model-draft';
import { t } from '../i18n/i18n';
import { mountConstraintsList } from './constraints-list';
import { openOptionsModal } from './options-modal';
import { makeRangePicker } from './range-picker';

interface Opts {
  draft: ModelDraft;
  onSave: () => Promise<void>;
}

export function mountForm(host: HTMLElement, opts: Opts): void {
  const doc = opts.draft.toDocument();
  host.innerHTML = `
    <form id="solverForm" autocomplete="off">
      <div class="field">
        <label for="objCell">${t('label.objective')}</label>
        <div class="input-row">
          <input id="objCell" type="text" value="${esc(doc.objective.cellA1)}" />
          <button type="button" data-action="pick-obj">⌖</button>
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

      <div class="field">
        <label for="varsRange">${t('label.variables')}</label>
        <div class="input-row">
          <input id="varsRange" type="text" value="${esc(doc.variables.rangeA1)}" />
          <button type="button" data-action="pick-vars">⌖</button>
        </div>
        <div class="hint" id="varsError"></div>
      </div>

      <div class="field">
        <label>${t('label.constraints')}</label>
        <div id="constraintsHost"></div>
      </div>

      <div class="field">
        <label><input id="assumeNN" type="checkbox" ${doc.options.assumeNonNegative ? 'checked' : ''} />
          ${t('label.assumeNonNegative')}</label>
      </div>

      <div class="field">
        <label for="method">${t('label.method')}</label>
        <select id="method"><option value="simplexLp" selected>${t('method.simplexLp')}</option></select>
        <button type="button" data-action="options">⚙ ${t('btn.options')}</button>
      </div>

      <div class="actions">
        <button type="button" data-action="save">${t('btn.save')}</button>
        <button type="button" data-action="solve" disabled title="${t('btn.solve.disabled')}">${t('btn.solve')}</button>
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
  const savedMessage = host.querySelector<HTMLDivElement>('#savedMessage')!;

  const objPickBtn = host.querySelector<HTMLButtonElement>('[data-action="pick-obj"]')!;
  const varsPickBtn = host.querySelector<HTMLButtonElement>('[data-action="pick-vars"]')!;
  const objPicker = makeRangePicker(objCell, objPickBtn);
  const varsPicker = makeRangePicker(varsRange, varsPickBtn);

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
        onAccept: (newOpts) => opts.draft.setOptions(newOpts),
      });
    } else if (action === 'save') {
      await opts.onSave();
      savedMessage.style.display = '';
      setTimeout(() => {
        savedMessage.style.display = 'none';
      }, 2000);
    }
  });
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
