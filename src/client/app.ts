import { ModelDraft } from './state/model-draft';
import { setLocale, t } from './i18n/i18n';
import { getActiveSheetContext, saveModel } from './rpc/server-bridge';
import { mountForm } from './ui/form';

export async function mountApp(root: HTMLElement): Promise<void> {
  root.innerHTML = `<div class="loading">${t('dialog.title')}…</div>`;
  let ctx: Awaited<ReturnType<typeof getActiveSheetContext>>;
  try {
    ctx = await getActiveSheetContext();
  } catch (e) {
    root.innerHTML = `<div class="error">Error: ${(e as Error).message}</div>`;
    return;
  }
  setLocale(ctx.locale);
  const draft = ctx.json
    ? ModelDraft.fromJson(ctx.json) ?? ModelDraft.fromBlank(ctx.sheetId, ctx.sheetName)
    : ModelDraft.fromBlank(ctx.sheetId, ctx.sheetName);

  mountForm(root, {
    draft,
    onSave: async () => {
      await saveModel(draft.toJson());
    },
  });
}
