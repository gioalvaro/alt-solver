import { getActiveRangeA1 } from '../rpc/server-bridge';

/**
 * Range picker: two-step toggle that lets the user select a range on
 * the sheet while the dialog stays open (Excel-Solver-style).
 *
 * 1st click on the ⌖ button:
 *   - reads the current spreadsheet selection IMMEDIATELY into the input
 *     (so if the user already had the range selected, one click suffices)
 *   - enters "picking" mode (button highlighted blue)
 *   - starts a polling loop: every POLL_MS the dialog re-reads the active
 *     range and updates the input live (Excel-like cursor tracking)
 *
 * 2nd click on the ⌖ button:
 *   - stops the polling, exits "picking" mode
 *
 * Requires the host dialog to be *modeless* — see Dialog.gs's
 * showModelessDialog. Modal dialogs block the sheet so the user can't
 * click cells while one is open.
 *
 * The `google` global is declared in src/client/google.d.ts.
 */
export interface RangePicker {
  toggle(): Promise<void>;
  isPicking(): boolean;
}

const POLL_MS = 600;

export function makeRangePicker(input: HTMLInputElement, button: HTMLElement): RangePicker {
  let mode: 'idle' | 'picking' = 'idle';
  let pollTimer: number | null = null;
  let inflight = false;

  function applyCapturedValue(a1: string): void {
    if (a1 && a1 !== input.value) {
      input.value = a1;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  async function tick(): Promise<void> {
    if (inflight || mode !== 'picking') return;
    inflight = true;
    try {
      const a1 = await getActiveRangeA1();
      applyCapturedValue(a1);
    } catch {
      /* ignore transient errors */
    } finally {
      inflight = false;
    }
  }

  function stopPolling(): void {
    if (pollTimer !== null) {
      window.clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  return {
    isPicking(): boolean {
      return mode === 'picking';
    },
    async toggle(): Promise<void> {
      if (mode === 'idle') {
        mode = 'picking';
        button.classList.add('picking');
        button.setAttribute('aria-pressed', 'true');
        button.title = 'Seguí seleccionando — clic acá cuando termines';
        try {
          google.script.host?.editor.focus();
        } catch {
          /* host bridge unavailable in unit tests */
        }
        // Immediate read so an already-selected range lands in the input
        // on the very first click.
        void tick();
        // Live updates while the user changes the selection.
        pollTimer = window.setInterval(() => {
          void tick();
        }, POLL_MS);
        return;
      }

      // mode === 'picking' → stop and confirm whatever's in the input.
      stopPolling();
      mode = 'idle';
      button.classList.remove('picking');
      button.setAttribute('aria-pressed', 'false');
      button.title = 'Seleccioná un rango en la hoja';
      // One last sync to capture a selection that happened between ticks.
      try {
        const a1 = await getActiveRangeA1();
        applyCapturedValue(a1);
      } catch {
        /* ignore */
      }
    },
  };
}
