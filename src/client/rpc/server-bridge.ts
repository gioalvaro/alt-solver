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

export function validateModel(modelDoc: unknown): Promise<{ ok: boolean; errors?: string[] }> {
  return call<{ ok: boolean; errors?: string[] }>('validateModel', modelDoc);
}

export interface ExtractResponse {
  ok: boolean;
  linearForm?: unknown;
  snapshot?: unknown;
  warnings?: string[];
  errors?: string[];
}

export function extractLinearForm(modelDoc: unknown): Promise<ExtractResponse> {
  return call<ExtractResponse>('extractLinearForm', modelDoc);
}

export interface WriteResultsRequest {
  modelDoc: unknown;
  solveResult: { variableValuesFlat: number[]; objectiveValue: number; isMip: boolean };
  answerMatrix: unknown[][] | null;
  sensitivityMatrix: unknown[][] | null;
  snapshot: unknown;
  keepSolution: boolean;
  writeReports: { answer: boolean; sensitivity: boolean };
}

export function writeResults(req: WriteResultsRequest): Promise<{ ok: boolean; sheetNames: string[] }> {
  return call<{ ok: boolean; sheetNames: string[] }>('writeResults', req);
}

export function restoreSnapshot(modelDoc: unknown, snapshot: unknown): Promise<void> {
  return call<void>('restoreSnapshot', modelDoc, snapshot);
}
