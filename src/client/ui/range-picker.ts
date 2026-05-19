import { getActiveRangeA1 } from '../rpc/server-bridge';

/**
 * Range picker: two-step toggle that lets the user select a range on
 * the sheet while the dialog stays open (Excel-Solver-style).
 *
 * First call to `toggle()`:
 *   - enters "picking" mode (button highlights via the `picking` class)
 *   - returns focus to the sheet so cell clicks register there
 *
 * Second call to `toggle()`:
 *   - reads the sheet's current active range
 *   - writes it into the input, dispatches a change event
 *   - exits "picking" mode
 *
 * Requires the host dialog to be *modeless* — see Dialog.gs's
 * showModelessDialog. Modal dialogs block the sheet and the user can't
 * click cells while one is open.
 *
 * The `google` global is declared in src/client/google.d.ts.
 */
export interface RangePicker {
  toggle(): Promise<void>;
  isPicking(): boolean;
}

export function makeRangePicker(input: HTMLInputElement, button: HTMLElement): RangePicker {
  let mode: 'idle' | 'picking' | 'capturing' = 'idle';
  const originalLabel = button.innerHTML;

  return {
    isPicking(): boolean {
      return mode === 'picking';
    },
    async toggle(): Promise<void> {
      // Block clicks while we're already capturing — Apps Script RPC can
      // take a couple of seconds. Otherwise the user clicks again and we
      // end up with overlapping toggle calls.
      if (mode === 'capturing') return;

      if (mode === 'idle') {
        mode = 'picking';
        button.classList.add('picking');
        button.setAttribute('aria-pressed', 'true');
        button.title = 'Seleccioná un rango en la hoja y clic acá para confirmar';
        try {
          google.script.host?.editor.focus();
        } catch {
          /* host bridge unavailable in unit tests */
        }
        return;
      }

      // mode === 'picking' → capturing the active range from the sheet.
      mode = 'capturing';
      button.classList.remove('picking');
      button.classList.add('capturing');
      button.setAttribute('aria-disabled', 'true');
      button.innerHTML = '<span class="pick-spinner"></span>';
      button.title = 'Leyendo selección…';

      try {
        const a1 = await getActiveRangeA1();
        if (a1) {
          input.value = a1;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } finally {
        mode = 'idle';
        button.classList.remove('capturing');
        button.removeAttribute('aria-disabled');
        button.innerHTML = originalLabel;
        button.setAttribute('aria-pressed', 'false');
        button.title = 'Seleccioná un rango en la hoja';
      }
    },
  };
}
