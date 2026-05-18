import type { Constraint } from '../../shared/model-schema';
import { t } from '../i18n/i18n';
import { openConstraintModal } from './constraint-modal';

interface Opts {
  parent: HTMLElement;
  getList: () => Constraint[];
  onAdd: (c: Constraint) => void;
  onUpdate: (i: number, c: Constraint) => void;
  onRemove: (i: number) => void;
}

export function mountConstraintsList(host: HTMLElement, opts: Opts): { render: () => void } {
  host.innerHTML = `
    <div class="constraints">
      <div class="list" role="list"></div>
      <div class="list-actions">
        <button type="button" data-action="add">+ ${t('btn.add')}</button>
        <button type="button" data-action="edit">${t('btn.edit')}</button>
        <button type="button" data-action="remove">${t('btn.remove')}</button>
      </div>
    </div>
  `;

  const list = host.querySelector<HTMLDivElement>('.list')!;
  let selectedIndex: number | null = null;

  function render(): void {
    const items = opts.getList();
    list.innerHTML = items
      .map((c, i) => {
        const rhs = 'rhsA1OrValue' in c ? `   ${c.op}   ${c.rhsA1OrValue}` : `   ${c.op}`;
        return `
          <div class="constraint-row" data-index="${i}" role="listitem"
               aria-selected="${i === selectedIndex}">
            <span>${escapeHtml(c.lhsA1)}${escapeHtml(rhs)}</span>
          </div>
        `;
      })
      .join('');
    list.querySelectorAll<HTMLDivElement>('.constraint-row').forEach((row) => {
      row.addEventListener('click', () => {
        selectedIndex = Number(row.dataset.index);
        render();
      });
    });
  }

  host.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    if (action === 'add') {
      openConstraintModal(opts.parent, {
        onAccept: (c) => {
          opts.onAdd(c);
          render();
        },
      });
    } else if (action === 'edit') {
      if (selectedIndex === null) return;
      const idx = selectedIndex;
      openConstraintModal(opts.parent, {
        initial: opts.getList()[idx] ?? undefined,
        onAccept: (c) => {
          opts.onUpdate(idx, c);
          render();
        },
      });
    } else if (action === 'remove') {
      if (selectedIndex === null) return;
      opts.onRemove(selectedIndex);
      selectedIndex = null;
      render();
    }
  });

  render();
  return { render };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
