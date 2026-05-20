import { listTemplates, insertTemplate, type TemplateInfo } from '../rpc/server-bridge';
import { t } from '../i18n/i18n';

interface OpenOpts {
  onApplied: (modelJson: string, sheetName: string) => void | Promise<void>;
  onCancel?: () => void;
}

/**
 * Opens an overlay listing the built-in example models. Clicking one
 * inserts the example as a new sheet (via the insertTemplate RPC) and
 * notifies the caller so the sidebar can re-mount with the new model.
 */
export function openTemplatesModal(parent: HTMLElement, opts: OpenOpts): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-label="Insertar ejemplo">
      <h2>📋 Insertar ejemplo</h2>
      <div class="muted small" style="margin-bottom:12px;">
        Crea una hoja nueva con un modelo listo para resolver. No toca lo que ya tenés.
      </div>
      <div id="templatesList" class="templates-list">
        <div class="muted small" style="text-align:center;padding:24px;">Cargando…</div>
      </div>
      <div class="actions">
        <button type="button" data-action="cancel">${t('btn.cancel')}</button>
      </div>
    </div>
  `;
  parent.appendChild(overlay);

  const listEl = overlay.querySelector<HTMLDivElement>('#templatesList')!;
  let inflight = false;

  listTemplates()
    .then((tpls) => {
      renderList(tpls);
    })
    .catch((err: Error) => {
      listEl.innerHTML = `<div class="muted small" style="color:#d93025;">Error: ${escapeHtml(err.message)}</div>`;
    });

  function renderList(tpls: TemplateInfo[]): void {
    if (tpls.length === 0) {
      listEl.innerHTML = '<div class="muted small" style="text-align:center;">No hay templates disponibles.</div>';
      return;
    }
    listEl.innerHTML = tpls
      .map(
        (tpl) => `
        <button type="button" class="template-card" data-template-id="${escapeHtml(tpl.id)}">
          <div class="template-label">${escapeHtml(tpl.label)}</div>
          <div class="template-summary muted small">${escapeHtml(tpl.summary)}</div>
        </button>
      `,
      )
      .join('');
  }

  overlay.addEventListener('click', async (e) => {
    if (inflight) return;
    const target = e.target as HTMLElement;
    if (target.dataset.action === 'cancel') {
      overlay.remove();
      opts.onCancel?.();
      return;
    }
    const card = target.closest<HTMLButtonElement>('[data-template-id]');
    if (card) {
      inflight = true;
      const id = card.dataset.templateId!;
      card.classList.add('loading');
      listEl.querySelectorAll<HTMLButtonElement>('.template-card').forEach((c) => {
        if (c !== card) c.setAttribute('disabled', 'true');
      });
      try {
        const res = await insertTemplate(id);
        overlay.remove();
        await opts.onApplied(res.modelJson, res.sheetName);
      } catch (err) {
        card.classList.remove('loading');
        card.removeAttribute('disabled');
        alert('AltSolver — No se pudo insertar el ejemplo: ' + (err as Error).message);
        inflight = false;
      }
    }
  });
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
