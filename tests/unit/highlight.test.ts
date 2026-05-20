import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the server-bridge RPCs the coordinator depends on. Each test
// inspects the recorded calls and seeds return values via `nextSnapshot`.
const applyMock = vi.fn();
const clearMock = vi.fn();

vi.mock('../../src/client/rpc/server-bridge', () => ({
  applyHighlights: (prev: unknown, items: unknown) => applyMock(prev, items),
  clearHighlights: (snap: unknown) => clearMock(snap),
}));

// The coordinator schedules its work on window.setTimeout. In node we
// expose node's timer globals through a window shim so the production
// code can stay free of branching for tests.
beforeEach(() => {
  vi.stubGlobal('window', {
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
  });
  applyMock.mockReset();
  clearMock.mockReset();
});

async function flushDebounce(ms = 220): Promise<void> {
  await new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms));
}

describe('HighlightCoordinator', () => {
  it('paints the focused range with the role color', async () => {
    applyMock.mockResolvedValue({ entries: [{ rangeA1: 'B12', backgrounds: [['#ffffff']] }] });
    const { HighlightCoordinator } = await import('../../src/client/ui/highlight');
    const c = new HighlightCoordinator();

    c.highlight('objective', ['B12']);
    await flushDebounce();

    expect(applyMock).toHaveBeenCalledTimes(1);
    const [prev, items] = applyMock.mock.calls[0]!;
    expect(prev).toBeNull();
    expect(items).toEqual([{ rangeA1: 'B12', color: '#cfe2ff' }]);
  });

  it('passes the previous snapshot when the focus moves to a new field', async () => {
    const firstSnap = { entries: [{ rangeA1: 'B12', backgrounds: [['#ffffff']] }] };
    const secondSnap = { entries: [{ rangeA1: 'B3:B7', backgrounds: [[null]] }] };
    applyMock.mockResolvedValueOnce(firstSnap).mockResolvedValueOnce(secondSnap);

    const { HighlightCoordinator } = await import('../../src/client/ui/highlight');
    const c = new HighlightCoordinator();

    c.highlight('objective', ['B12']);
    await flushDebounce();
    c.highlight('variables', ['B3:B7']);
    await flushDebounce();

    expect(applyMock).toHaveBeenCalledTimes(2);
    expect(applyMock.mock.calls[1]![0]).toBe(firstSnap);
    expect(applyMock.mock.calls[1]![1]).toEqual([{ rangeA1: 'B3:B7', color: '#d1f0d9' }]);
  });

  it('uses the orange color and includes both LHS and RHS for a constraint', async () => {
    applyMock.mockResolvedValue({ entries: [] });
    const { HighlightCoordinator } = await import('../../src/client/ui/highlight');
    const c = new HighlightCoordinator();

    c.highlight('constraint', ['D12', 'F12']);
    await flushDebounce();

    expect(applyMock).toHaveBeenCalledTimes(1);
    expect(applyMock.mock.calls[0]![1]).toEqual([
      { rangeA1: 'D12', color: '#fde6c8' },
      { rangeA1: 'F12', color: '#fde6c8' },
    ]);
  });

  it('clear() sends a null color so the server only restores the snapshot', async () => {
    const snap = { entries: [{ rangeA1: 'B12', backgrounds: [['#ffffff']] }] };
    applyMock.mockResolvedValueOnce(snap).mockResolvedValueOnce({ entries: [] });

    const { HighlightCoordinator } = await import('../../src/client/ui/highlight');
    const c = new HighlightCoordinator();

    c.highlight('objective', ['B12']);
    await flushDebounce();
    c.clear();
    await flushDebounce();

    expect(applyMock).toHaveBeenCalledTimes(2);
    expect(applyMock.mock.calls[1]![0]).toBe(snap);
    expect(applyMock.mock.calls[1]![1]).toEqual([]);
  });

  it('coalesces rapid focus changes into a single RPC (debounce)', async () => {
    applyMock.mockResolvedValue({ entries: [] });
    const { HighlightCoordinator } = await import('../../src/client/ui/highlight');
    const c = new HighlightCoordinator();

    c.highlight('objective', ['B12']);
    c.highlight('variables', ['B3:B7']);
    c.highlight('objective', ['B14']);
    await flushDebounce();

    expect(applyMock).toHaveBeenCalledTimes(1);
    expect(applyMock.mock.calls[0]![1]).toEqual([{ rangeA1: 'B14', color: '#cfe2ff' }]);
  });

  it('drops empty and whitespace-only ranges before sending', async () => {
    applyMock.mockResolvedValue({ entries: [] });
    const { HighlightCoordinator } = await import('../../src/client/ui/highlight');
    const c = new HighlightCoordinator();

    c.highlight('constraint', ['D12', '', '   ']);
    await flushDebounce();

    expect(applyMock).toHaveBeenCalledTimes(1);
    expect(applyMock.mock.calls[0]![1]).toEqual([{ rangeA1: 'D12', color: '#fde6c8' }]);
  });

  it('clearNow() fires clearHighlights synchronously with the prior snapshot', async () => {
    const snap = { entries: [{ rangeA1: 'B12', backgrounds: [['#ffffff']] }] };
    applyMock.mockResolvedValueOnce(snap);
    clearMock.mockResolvedValue(undefined);

    const { HighlightCoordinator } = await import('../../src/client/ui/highlight');
    const c = new HighlightCoordinator();

    c.highlight('objective', ['B12']);
    await flushDebounce();
    c.clearNow();

    expect(clearMock).toHaveBeenCalledTimes(1);
    expect(clearMock.mock.calls[0]![0]).toBe(snap);
  });

  it('clearNow() with no prior snapshot is a no-op', async () => {
    const { HighlightCoordinator } = await import('../../src/client/ui/highlight');
    const c = new HighlightCoordinator();

    c.clearNow();

    expect(applyMock).not.toHaveBeenCalled();
    expect(clearMock).not.toHaveBeenCalled();
  });

  it('clearNow() cancels a pending debounced highlight', async () => {
    const { HighlightCoordinator } = await import('../../src/client/ui/highlight');
    const c = new HighlightCoordinator();

    c.highlight('objective', ['B12']);
    c.clearNow();
    await flushDebounce();

    expect(applyMock).not.toHaveBeenCalled();
    expect(clearMock).not.toHaveBeenCalled();
  });

  it('serializes flushes: a second flush waits for the first inflight to settle', async () => {
    let resolveFirst!: (snap: unknown) => void;
    const firstSnap = { entries: [{ rangeA1: 'B12', backgrounds: [['#ffffff']] }] };
    applyMock.mockImplementationOnce(() => new Promise((res) => { resolveFirst = res; }));
    applyMock.mockResolvedValueOnce({ entries: [] });

    const { HighlightCoordinator } = await import('../../src/client/ui/highlight');
    const c = new HighlightCoordinator();

    c.highlight('objective', ['B12']);
    await flushDebounce();
    // The first applyHighlights is now inflight (not yet resolved).
    c.highlight('variables', ['B3:B7']);
    await flushDebounce();

    // Only the first RPC has been observed; the second is queued.
    expect(applyMock).toHaveBeenCalledTimes(1);

    resolveFirst(firstSnap);
    await flushDebounce(0);

    expect(applyMock).toHaveBeenCalledTimes(2);
    expect(applyMock.mock.calls[1]![0]).toBe(firstSnap);
  });
});
