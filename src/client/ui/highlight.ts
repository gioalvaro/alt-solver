import { applyHighlights, clearHighlights } from '../rpc/server-bridge';

export type HighlightRole = 'objective' | 'variables' | 'constraint';

interface HighlightItem {
  rangeA1: string;
  color: string | null;
}

const COLORS: Record<HighlightRole, string> = {
  objective: '#cfe2ff',
  variables: '#d1f0d9',
  constraint: '#fde6c8',
};

const DEBOUNCE_MS = 180;

/**
 * Coordinates which cells of the active model are highlighted on the sheet.
 * Debounces focus-driven RPCs and serializes them so quick focus changes
 * don't leak overlapping snapshots. The snapshot from the last apply is
 * held in memory and shipped back when a new highlight (or clear) lands.
 */
export class HighlightCoordinator {
  private snapshot: unknown = null;
  private inflight: Promise<unknown> | null = null;
  private debounceTimer: number | null = null;
  private pendingRanges: string[] | null = null;
  private pendingRole: HighlightRole | null = null;

  highlight(role: HighlightRole, rangesA1: string[]): void {
    this.pendingRole = role;
    this.pendingRanges = rangesA1.filter((r) => r && r.trim() !== '');
    this.scheduleFlush();
  }

  clear(): void {
    this.pendingRole = null;
    this.pendingRanges = [];
    this.scheduleFlush();
  }

  /** Synchronous clear meant for "page is unloading" — no debounce. */
  clearNow(): void {
    if (this.debounceTimer != null) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    const snap = this.snapshot;
    this.snapshot = null;
    if (snap) {
      // Best-effort fire-and-forget; the sidebar is about to close.
      clearHighlights(snap).catch(() => { /* ignore */ });
    }
  }

  private scheduleFlush(): void {
    if (this.debounceTimer != null) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      void this.flush();
    }, DEBOUNCE_MS);
  }

  private async flush(): Promise<void> {
    if (this.inflight) {
      await this.inflight.catch(() => { /* ignore */ });
    }
    const role = this.pendingRole;
    const ranges = this.pendingRanges ?? [];
    this.pendingRole = null;
    this.pendingRanges = null;

    const color = role ? COLORS[role] : null;
    const items: HighlightItem[] = ranges.map((r) => ({ rangeA1: r, color }));

    const prev = this.snapshot;
    this.inflight = applyHighlights(prev, items)
      .then((snap) => {
        this.snapshot = snap;
      })
      .catch((e) => {
        console.warn('[AltSolver] highlight failed:', e);
      })
      .finally(() => {
        this.inflight = null;
      });
    await this.inflight;
  }
}
