/**
 * Thin wrappers over google.script.run.
 * Centralizes RPC so the rest of the client doesn't deal with callbacks.
 * The `google` global is declared in src/client/google.d.ts.
 */

interface ServerContext {
  json: string | null;
  sheetName: string;
  sheetId: number;
  locale: string;
}

function call<T>(fnName: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const runner = google.script.run
      .withSuccessHandler((r: unknown) => resolve(r as T))
      .withFailureHandler((err: Error) => reject(err));
    runner[fnName](...args);
  });
}

export function getActiveSheetContext(): Promise<ServerContext> {
  return call<ServerContext>('getActiveSheetContext');
}

export function saveModel(jsonString: string): Promise<{ ok: boolean }> {
  return call<{ ok: boolean }>('saveModel', jsonString);
}

export function getActiveRangeA1(): Promise<string> {
  return call<string>('getActiveRangeA1');
}
