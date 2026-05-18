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
  let mode: 'idle' | 'picking' = 'idle';

  return {
    isPicking(): boolean {
      return mode === 'picking';
    },
    async toggle(): Promise<void> {
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
      const a1 = await getActiveRangeA1();
      if (a1) {
        input.value = a1;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      mode = 'idle';
      button.classList.remove('picking');
      button.setAttribute('aria-pressed', 'false');
      button.title = 'Seleccioná un rango en la hoja';
    },
  };
}
