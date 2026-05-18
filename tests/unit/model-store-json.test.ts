import { describe, it, expect } from 'vitest';
import { serializeModel, deserializeModel } from '../../src/shared/model-store-json';
import { blankModelDocument } from '../../src/shared/model-schema';

describe('model-store-json', () => {
  it('round-trips a blank model', () => {
    const doc = blankModelDocument(123, 'Sheet1');
    const s = serializeModel(doc);
    const back = deserializeModel(s);
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.doc).toEqual(doc);
  });

  it('rejects malformed JSON', () => {
    const r = deserializeModel('not-json');
    expect(r.ok).toBe(false);
  });

  it('rejects schema violations', () => {
    const r = deserializeModel('{"version": 99, "sheetId": 1}');
    expect(r.ok).toBe(false);
  });

  it('serializes to compact JSON (no trailing whitespace)', () => {
    const doc = blankModelDocument(1, 'X');
    const s = serializeModel(doc);
    expect(s).toBe(JSON.stringify(doc));
  });
});
