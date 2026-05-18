import { getActiveRangeA1 } from '../rpc/server-bridge';

/**
 * Range picker: while active, minimizes the dialog so the user can select
 * a range on the sheet, then reads it back.
 *
 * Apps Script provides google.script.host.editor.focus() to return focus to the
 * editor. The dialog stays open but the sheet becomes interactive.
 * The `google` global is declared in src/client/google.d.ts.
 */
export interface RangePicker {
  start(): Promise<void>;
  capture(): Promise<string>;
}

export function makeRangePicker(input: HTMLInputElement): RangePicker {
  return {
    async start(): Promise<void> {
      // Pass focus back to the sheet so user can click cells.
      try {
        google.script.host?.editor.focus();
      } catch {
        /* host bridge unavailable in unit tests */
      }
    },
    async capture(): Promise<string> {
      const a1 = await getActiveRangeA1();
      input.value = a1;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return a1;
    },
  };
}
