import { describe, it, expect } from 'vitest';
import { ModelDraft } from '../../src/client/state/model-draft';
import { blankModelDocument } from '../../src/shared/model-schema';

describe('ModelDraft', () => {
  it('starts from a blank model', () => {
    const d = ModelDraft.fromBlank(7, 'Sheet1');
    expect(d.toDocument().sheetId).toBe(7);
  });

  it('hydrates from JSON', () => {
    const blank = blankModelDocument(1, 'X');
    const d = ModelDraft.fromJson(JSON.stringify(blank));
    expect(d).not.toBeNull();
    expect(d!.toDocument().sheetId).toBe(1);
  });

  it('returns null on invalid JSON', () => {
    expect(ModelDraft.fromJson('garbage')).toBeNull();
    expect(ModelDraft.fromJson('{"version":99}')).toBeNull();
  });

  it('mutates objective and updates updatedAt', async () => {
    const d = ModelDraft.fromBlank(1, 'X');
    const before = d.toDocument().meta.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    d.setObjective({ cellA1: 'B12', sense: 'MAX', targetValue: null });
    const after = d.toDocument().meta.updatedAt;
    expect(after).not.toBe(before);
    expect(d.toDocument().objective.cellA1).toBe('B12');
  });

  it('adds and removes constraints', () => {
    const d = ModelDraft.fromBlank(1, 'X');
    d.addConstraint({ lhsA1: 'D12', op: '<=', rhsA1OrValue: 'F12', type: 'linear' });
    d.addConstraint({ lhsA1: 'B3:B7', op: 'int' });
    expect(d.toDocument().constraints).toHaveLength(2);
    d.removeConstraint(0);
    expect(d.toDocument().constraints).toHaveLength(1);
    expect(d.toDocument().constraints[0]!.op).toBe('int');
  });

  it('serializes back to valid JSON', () => {
    const d = ModelDraft.fromBlank(1, 'X');
    d.setObjective({ cellA1: 'B12', sense: 'MAX', targetValue: null });
    d.setVariables({ rangeA1: 'B3:B7', names: [], assumeNonNegative: true });
    const json = d.toJson();
    const reparsed = ModelDraft.fromJson(json);
    expect(reparsed).not.toBeNull();
    expect(reparsed!.toDocument().objective.cellA1).toBe('B12');
  });
});
