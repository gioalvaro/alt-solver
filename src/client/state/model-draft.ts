import {
  blankModelDocument,
  validateModelDocument,
  type Constraint,
  type ModelDocument,
  type Objective,
  type SolverOptions,
  type Variables,
} from '../../shared/model-schema';

export class ModelDraft {
  private doc: ModelDocument;

  private constructor(doc: ModelDocument) {
    this.doc = doc;
  }

  static fromBlank(sheetId: number, sheetName: string): ModelDraft {
    return new ModelDraft(blankModelDocument(sheetId, sheetName));
  }

  static fromJson(raw: string): ModelDraft | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    const v = validateModelDocument(parsed);
    if (!v.ok) return null;
    return new ModelDraft(parsed as ModelDocument);
  }

  toDocument(): ModelDocument {
    return this.doc;
  }

  toJson(): string {
    return JSON.stringify(this.doc);
  }

  private touch(): void {
    this.doc.meta.updatedAt = new Date().toISOString();
  }

  setObjective(o: Objective): void {
    this.doc.objective = { ...o };
    this.touch();
  }

  setVariables(v: Variables): void {
    this.doc.variables = { ...v };
    this.touch();
  }

  setOptions(o: Partial<SolverOptions>): void {
    this.doc.options = { ...this.doc.options, ...o };
    this.touch();
  }

  addConstraint(c: Constraint): void {
    this.doc.constraints.push(c);
    this.touch();
  }

  updateConstraint(index: number, c: Constraint): void {
    if (index < 0 || index >= this.doc.constraints.length) {
      throw new Error(`updateConstraint: index ${index} out of bounds`);
    }
    this.doc.constraints[index] = c;
    this.touch();
  }

  removeConstraint(index: number): void {
    if (index < 0 || index >= this.doc.constraints.length) {
      throw new Error(`removeConstraint: index ${index} out of bounds`);
    }
    this.doc.constraints.splice(index, 1);
    this.touch();
  }
}
