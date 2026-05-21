/**
 * Lazy-loads HiGHS WASM. The factory function returns a Promise resolving
 * to a HighsModule the first time it is called; subsequent calls reuse the
 * cached module.
 *
 * NOTE — the WASM is NOT embedded in the bundle. Apps Script truncates
 * inline HtmlService content above ~150KB, and embedding 2.7MB of WASM
 * as base64 in the bundle blew through that limit and corrupted the
 * delivered JS. The WASM is hosted on GitHub Pages alongside the rest
 * of the docs site and fetched at runtime. The Apps Script sandbox
 * allows HTTPS fetches as long as the target sends permissive CORS
 * headers — GitHub Pages does (`Access-Control-Allow-Origin: *`).
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

const WASM_URL = 'https://gioalvaro.github.io/alt-solver/highs.wasm';

let modulePromise: Promise<HighsModule> | null = null;

export async function getHighs(): Promise<HighsModule> {
  if (modulePromise) return modulePromise;
  modulePromise = (async () => {
    const highsMod = (await import('highs')) as unknown as {
      default: (opts: Record<string, unknown>) => Promise<unknown>;
    };
    // Fetch the WASM as an ArrayBuffer and feed it to highs-js via the
    // `wasmBinary` option. Doing the fetch here (instead of relying on
    // emscripten's locateFile + fetch path) means we control the URL and
    // can surface a clean error if the network call fails.
    const res = await fetch(WASM_URL, { credentials: 'omit' });
    if (!res.ok) {
      throw new Error(`AltSolver: no se pudo descargar el motor (HTTP ${res.status} desde ${WASM_URL}). Verificá tu conexión a internet.`);
    }
    const wasmBytes = new Uint8Array(await res.arrayBuffer());
    const mod = (await highsMod.default({
      wasmBinary: wasmBytes,
      locateFile: (file: string): string => file,
    })) as HighsModule;
    return mod;
  })();
  return modulePromise;
}
