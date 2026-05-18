import type { SolverOptions } from '../../shared/model-schema';
import { t } from '../i18n/i18n';

interface OpenOpts {
  initial: SolverOptions;
  onAccept: (o: SolverOptions) => void;
  onCancel?: () => void;
}

export function openOptionsModal(parent: HTMLElement, opts: OpenOpts): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-label="${t('options.modal.title')}">
      <h2>${t('options.modal.title')}</h2>
      <div class="row">
        <label for="timeLimit">${t('options.timeLimit')}</label>
        <input id="timeLimit" type="number" min="1" step="1" value="${opts.initial.timeLimitSec}" />
      </div>
      <div class="row">
        <label for="iterLimit">${t('options.iterLimit')}</label>
        <input id="iterLimit" type="number" min="1" step="1" value="${opts.initial.iterLimit ?? ''}" />
      </div>
      <div class="row">
        <label for="mipGap">${t('options.mipGap')}</label>
        <input id="mipGap" type="number" min="0" step="0.0001" value="${opts.initial.mipGap}" />
      </div>
      <div class="row">
        <label for="intTol">${t('options.integerTolerance')}</label>
        <input id="intTol" type="number" min="0.0000001" step="0.0000001" value="${opts.initial.integerTolerance}" />
      </div>
      <div class="actions">
        <button type="button" data-action="cancel">${t('btn.cancel')}</button>
        <button type="button" data-action="accept" class="primary">OK</button>
      </div>
    </div>
  `;
  parent.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.dataset.action === 'cancel') {
      overlay.remove();
      opts.onCancel?.();
    } else if (target.dataset.action === 'accept') {
      const time = Number((overlay.querySelector<HTMLInputElement>('#timeLimit')!).value);
      const iterStr = (overlay.querySelector<HTMLInputElement>('#iterLimit')!).value;
      const iter = iterStr === '' ? null : Number(iterStr);
      const gap = Number((overlay.querySelector<HTMLInputElement>('#mipGap')!).value);
      const intTol = Number((overlay.querySelector<HTMLInputElement>('#intTol')!).value);
      opts.onAccept({
        assumeNonNegative: opts.initial.assumeNonNegative,
        timeLimitSec: time,
        iterLimit: iter,
        mipGap: gap,
        integerTolerance: intTol,
      });
      overlay.remove();
    }
  });
}
