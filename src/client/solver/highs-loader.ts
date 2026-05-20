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

// Embed the WASM binary at build time so HiGHS can run inside the Apps Script
// iframe (which can't fetch external files). Esbuild's `binary` loader gives us
// a Uint8Array.
// @ts-expect-error esbuild binary loader produces a Uint8Array; no type defs
import wasmBinary from 'highs/runtime';

let modulePromise: Promise<HighsModule> | null = null;

export async function getHighs(): Promise<HighsModule> {
  if (modulePromise) return modulePromise;
  modulePromise = (async () => {
    const highsMod = (await import('highs')) as unknown as {
      default: (opts: Record<string, unknown>) => Promise<unknown>;
    };
    const mod = (await highsMod.default({
      wasmBinary: wasmBinary as Uint8Array,
      locateFile: (file: string): string => file,
    })) as HighsModule;
    return mod;
  })();
  return modulePromise;
}
