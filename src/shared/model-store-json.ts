import { validateModelDocument, type ModelDocument } from './model-schema';

export function serializeModel(doc: ModelDocument): string {
  return JSON.stringify(doc);
}

export type DeserializeResult =
  | { ok: true; doc: ModelDocument }
  | { ok: false; reason: 'json' | 'schema'; errors: string[] };

export function deserializeModel(raw: string): DeserializeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, reason: 'json', errors: [(e as Error).message] };
  }
  const v = validateModelDocument(parsed);
  if (!v.ok) return { ok: false, reason: 'schema', errors: v.errors };
  return { ok: true, doc: parsed as ModelDocument };
}
