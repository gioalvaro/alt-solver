/**
 * Lazy-loads HiGHS WASM. The factory function returns a Promise resolving
 * to a HighsModule the first time it is called; subsequent calls reuse the
 * cached module.
 */

export interface HighsColumn {
  Index: number;
  Status: string;
  Lower: number;
  Upper: number;
  Primal: number;
  Dual: number;
  Type: string;
  Name: string;
}

export interface HighsRow {
  Index: number;
  Name: string;
  Status: string;
  Lower: number;
  Upper: number;
  Primal: number;
  Dual: number;
}

export interface HighsRawResult {
  Status: string;
  ObjectiveValue: number;
  Columns: Record<string, HighsColumn>;
  Rows: HighsRow[];
  IsLinear?: boolean;
}

interface HighsModule {
  solve(lp: string, options?: Record<string, unknown>): HighsRawResult;
}

let modulePromise: Promise<HighsModule> | null = null;

export async function getHighs(): Promise<HighsModule> {
  if (modulePromise) return modulePromise;
  modulePromise = (async () => {
    const highsMod = (await import('highs')) as unknown as {
      default: (opts: Record<string, unknown>) => Promise<unknown>;
    };
    const mod = (await highsMod.default({
      locateFile: (file: string): string => file,
    })) as HighsModule;
    return mod;
  })();
  return modulePromise;
}
