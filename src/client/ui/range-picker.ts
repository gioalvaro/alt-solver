import { getActiveRangeA1 } from '../rpc/server-bridge';

/**
 * Range picker: a single-click "capture current selection" button.
 *
 * Apps Script's google.script.run round-trip is 1-5 seconds and there is no
 * event for spreadsheet selection changes, so trying to mirror the sheet
 * cursor in real time is not viable. Instead, each click on the ⌖ button
 * grabs whatever the user currently has selected on the sheet.
 *
 * Flow:
 *  - User clicks a cell or drags a range on the sheet.
 *  - User clicks the ⌖ button next to the input.
 *  - The button shows a spinner while the active-range RPC is in flight.
 *  - When it returns, the input is updated with the qualified A1 string.
 *  - Re-clicking captures the (potentially different) current selection.
 *
 * The button is disabled (cursor:progress, click ignored) while a capture
 * is in flight so the user can't queue overlapping calls.
 */
export interface RangePicker {
  toggle(): Promise<void>;
  isPicking(): boolean;
}

export function makeRangePicker(input: HTMLInputElement, button: HTMLElement): RangePicker {
  let inflight = false;
  const originalLabel = button.innerHTML;

  return {
    isPicking(): boolean {
      return inflight;
    },
    async toggle(): Promise<void> {
      if (inflight) return;
      inflight = true;
      button.classList.add('capturing');
      button.setAttribute('aria-disabled', 'true');
      button.innerHTML = '<span class="pick-spinner"></span>';
      const oldTitle = button.title;
      button.title = 'Leyendo selección…';
      try {
        const a1 = await getActiveRangeA1();
        if (a1) {
          input.value = a1;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } catch {
        /* swallow — user can retry */
      } finally {
        inflight = false;
        button.classList.remove('capturing');
        button.removeAttribute('aria-disabled');
        button.innerHTML = originalLabel;
        button.title = oldTitle || 'Capturar selección de la hoja';
      }
    },
  };
}
