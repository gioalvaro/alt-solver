import { t } from '../i18n/i18n';
import { isValidA1 } from '../../shared/a1';
import type { Constraint, ConstraintOp } from '../../shared/model-schema';
import { makeRangePicker } from './range-picker';

interface OpenOpts {
  initial?: Constraint;
  onAccept: (c: Constraint) => void;
  onCancel?: () => void;
}

const OPS: ConstraintOp[] = ['<=', '=', '>=', 'int', 'bin'];

export function openConstraintModal(parent: HTMLElement, opts: OpenOpts): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-label="${t('constraint.modal.title')}">
      <h2>${t('constraint.modal.title')}</h2>
      <div class="row">
        <label for="lhs">${t('constraint.lhs')}</label>
        <div class="input-row">
          <input id="lhs" type="text" autocomplete="off" />
          <button type="button" data-action="pick-lhs">⌖</button>
        </div>
        <div class="hint" id="lhsError"></div>
      </div>
      <div class="row">
        <label for="op">${t('constraint.op')}</label>
        <select id="op">
          ${OPS.map((o) => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>
      <div class="row" id="rhsRow">
        <label for="rhs">${t('constraint.rhs')}</label>
        <div class="input-row">
          <input id="rhs" type="text" autocomplete="off" />
          <button type="button" data-action="pick-rhs">⌖</button>
        </div>
        <div class="hint" id="rhsError"></div>
      </div>
      <div class="row" id="opHint" style="display:none;"></div>
      <div class="actions">
        <button type="button" data-action="cancel">${t('btn.cancel')}</button>
        <button type="button" data-action="accept" class="primary">OK</button>
      </div>
    </div>
  `;
  parent.appendChild(overlay);

  const lhs = overlay.querySelector<HTMLInputElement>('#lhs')!;
  const op = overlay.querySelector<HTMLSelectElement>('#op')!;
  const rhs = overlay.querySelector<HTMLInputElement>('#rhs')!;
  const rhsRow = overlay.querySelector<HTMLDivElement>('#rhsRow')!;
  const opHint = overlay.querySelector<HTMLDivElement>('#opHint')!;
  const lhsError = overlay.querySelector<HTMLDivElement>('#lhsError')!;
  const rhsError = overlay.querySelector<HTMLDivElement>('#rhsError')!;

  if (opts.initial) {
    lhs.value = opts.initial.lhsA1;
    op.value = opts.initial.op;
    if (opts.initial.op !== 'int' && opts.initial.op !== 'bin') {
      rhs.value = (opts.initial as { rhsA1OrValue: string }).rhsA1OrValue;
    }
  }

  function applyOpVisibility(): void {
    const o = op.value as ConstraintOp;
    if (o === 'int') {
      rhsRow.style.display = 'none';
      opHint.style.display = '';
      opHint.textContent = t('constraint.intHint');
    } else if (o === 'bin') {
      rhsRow.style.display = 'none';
      opHint.style.display = '';
      opHint.textContent = t('constraint.binHint');
    } else {
      rhsRow.style.display = '';
      opHint.style.display = 'none';
    }
  }
  applyOpVisibility();
  op.addEventListener('change', applyOpVisibility);

  const lhsPickBtn = overlay.querySelector<HTMLButtonElement>('[data-action="pick-lhs"]')!;
  const rhsPickBtn = overlay.querySelector<HTMLButtonElement>('[data-action="pick-rhs"]')!;
  const lhsPicker = makeRangePicker(lhs, lhsPickBtn);
  const rhsPicker = makeRangePicker(rhs, rhsPickBtn);

  overlay.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    if (action === 'pick-lhs') {
      await lhsPicker.toggle();
    } else if (action === 'pick-rhs') {
      await rhsPicker.toggle();
    } else if (action === 'cancel') {
      overlay.remove();
      opts.onCancel?.();
    } else if (action === 'accept') {
      if (!validate()) return;
      opts.onAccept(build());
      overlay.remove();
    }
  });

  function validate(): boolean {
    let valid = true;
    if (!isValidA1(lhs.value)) {
      lhsError.textContent = t('msg.invalidA1');
      valid = false;
    } else {
      lhsError.textContent = '';
    }
    const o = op.value as ConstraintOp;
    if (o !== 'int' && o !== 'bin') {
      const isA1 = isValidA1(rhs.value);
      const isNumber = rhs.value.trim() !== '' && !Number.isNaN(Number(rhs.value));
      if (!isA1 && !isNumber) {
        rhsError.textContent = t('msg.invalidA1');
        valid = false;
      } else {
        rhsError.textContent = '';
      }
    }
    return valid;
  }

  function build(): Constraint {
    const o = op.value as ConstraintOp;
    if (o === 'int' || o === 'bin') {
      return { lhsA1: lhs.value, op: o };
    }
    return { lhsA1: lhs.value, op: o, rhsA1OrValue: rhs.value, type: 'linear' };
  }
}
