# AltSolver MVP 0.1 — Solver + Reports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `Resolver` button actually solve LP and MIP problems, produce Answer (LP+MIP) and Sensitivity (LP-only) reports as new sheets with dashboard-quality formatting, and refresh the dialog's visual polish to match a production add-on.

**Architecture:** Adds three server modules (`RangeIO.gs`, `ReportWriter.gs`, `Errors.gs`), one shared types module (`linear-form.ts`), and four client modules (`solver/`, `reports/`, `ui/results-modal.ts`, `errors/`). HiGHS-WASM (~1.5 MB) loads lazily on first solve. Server extracts coefficients via numerical perturbation (Excel-style), client runs HiGHS in the iframe, results modal collects user choices, server writes formatted report sheets.

**Tech Stack:** TypeScript 5, esbuild, vitest, clasp, ESLint, pnpm. New: `highs-js` (HiGHS compiled to WASM).

**Spec:** [docs/superpowers/specs/2026-05-18-altsolver-mvp-0.1-design.md](../specs/2026-05-18-altsolver-mvp-0.1-design.md)

**End-state acceptance:** User clicks `▶ Resolver` in the dialog. The button shows an overlay with "Resolviendo…". After 1-5 seconds, a results modal appears with the solution. User clicks "Aceptar". Variable cells update, two new sheets are created (`Respuesta 1`, `Sensibilidad 1` for LP; only `Respuesta 1` for MIP) with the formatted reports. The whole dialog closes and the user is back on the spreadsheet with the new state visible.

---

## Pre-flight

- [ ] **PF.1: Confirm MVP 0.0 deployment is still working**

  Open Google Sheets → click AltSolver icon → click "Resolver…" → main dialog opens normally. Form fields render. Range picker works. Save model works. If any of this is broken, fix MVP 0.0 first.

- [ ] **PF.2: Create feature branch**

  ```bash
  cd /Users/gioalvaro/Projects/AltSolver
  git checkout main
  git pull
  git checkout -b feat/mvp-0.1-solver
  ```

---

## File Structure (full picture before tasks)

```
alt-solver/
├── src/
│   ├── server/
│   │   ├── Menu.gs               [unchanged]
│   │   ├── Dialog.gs             [unchanged]
│   │   ├── ModelStore.gs         [unchanged]
│   │   ├── RangeIO.gs            ← NEW (validate + extract + restore)
│   │   ├── ReportWriter.gs       ← NEW (create + write + format reports)
│   │   └── Errors.gs             ← NEW (typed error throwing for RPC)
│   ├── shared/
│   │   ├── constants.ts          [unchanged]
│   │   ├── a1.ts                 [unchanged]
│   │   ├── model-schema.ts       [unchanged]
│   │   ├── model-store-json.ts   [unchanged]
│   │   └── linear-form.ts        ← NEW (LinearForm + SolveResult types)
│   ├── client/
│   │   ├── google.d.ts           [unchanged]
│   │   ├── dialog.html.template  [REPLACED for visual polish]
│   │   ├── index.ts              [unchanged]
│   │   ├── app.ts                [unchanged]
│   │   ├── state/model-draft.ts  [unchanged]
│   │   ├── rpc/server-bridge.ts  [ADD: extractLinearForm, writeResults]
│   │   ├── i18n/
│   │   │   ├── i18n.ts           [unchanged]
│   │   │   └── es.json           [ADD keys for solve flow + errors]
│   │   ├── ui/
│   │   │   ├── form.ts           [REWORK markup + wire solve action]
│   │   │   ├── constraint-modal.ts [polish only]
│   │   │   ├── constraints-list.ts [polish only]
│   │   │   ├── options-modal.ts  [polish only]
│   │   │   ├── range-picker.ts   [unchanged]
│   │   │   └── results-modal.ts  ← NEW
│   │   ├── solver/               ← NEW directory
│   │   │   ├── highs-loader.ts
│   │   │   ├── model-builder.ts
│   │   │   └── solve.ts
│   │   ├── reports/              ← NEW directory
│   │   │   ├── answer.ts
│   │   │   └── sensitivity.ts
│   │   └── errors/               ← NEW directory
│   │       └── error-messages.ts
│   └── vendor/
│       └── (highs-js loaded via npm; no manual file)
├── tests/
│   ├── unit/
│   │   ├── (existing tests unchanged)
│   │   ├── linear-form.test.ts        ← NEW
│   │   ├── model-builder.test.ts      ← NEW
│   │   ├── solve-status.test.ts       ← NEW
│   │   ├── reports/
│   │   │   ├── answer.test.ts         ← NEW
│   │   │   └── sensitivity.test.ts    ← NEW
│   │   └── error-messages.test.ts     ← NEW
│   └── golden/
│       ├── load-golden.ts             ← NEW (helper for tests)
│       ├── 01-dieta-lp.json           ← NEW
│       ├── 02-produccion-lp.json      ← NEW
│       ├── 03-mezcla-lp.json          ← NEW
│       ├── 04-asignacion-bin.json     ← NEW
│       ├── 05-mochila-int.json        ← NEW
│       ├── 06-infactible.json         ← NEW
│       └── 07-no-acotado.json         ← NEW
├── scripts/
│   └── build-dialog-html.mjs     [unchanged]
└── docs/
    └── superpowers/
        ├── specs/2026-05-18-altsolver-mvp-0.1-design.md  [exists]
        └── plans/2026-05-18-altsolver-mvp-0.1-solver-and-reports.md  [this file]
```

---

## Phase 0 — Dependency setup

### Task 0.1: Add `highs-js` and verify it loads

**Files:**
- Modify: `package.json` (add dependency)

- [ ] **Step 1: Install highs-js**

```bash
pnpm add highs
```

Verify `package.json` has `"highs": "^1.x.x"` under `dependencies` (NOT devDependencies — this ships to the client).

- [ ] **Step 2: Verify it's importable in Node (sanity check)**

Create a temporary file `scripts/check-highs.mjs`:

```js
import highs_promise from 'highs';
const highs = await highs_promise();
const result = highs.solve(`Minimize
 obj: x + y
Subject To
 c1: x + y >= 1
End`);
console.log('status:', result.Status);
console.log('obj:', result.ObjectiveValue);
```

Run: `node scripts/check-highs.mjs`
Expected: `status: Optimal`, `obj: 1`.

Delete the temporary file: `rm scripts/check-highs.mjs`.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add highs-js dependency for LP/MIP solving"
```

---

## Phase 1 — Shared types

### Task 1.1: Define `LinearForm` and `SolveResult` types

**Files:**
- Create: `src/shared/linear-form.ts`
- Create: `tests/unit/linear-form.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/linear-form.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  type LinearForm,
  type SolveResult,
  type SolveStatus,
  emptyLinearForm,
} from '../../src/shared/linear-form';

describe('linear-form types', () => {
  it('emptyLinearForm has zero vars and zero rows', () => {
    const lf = emptyLinearForm('MIN');
    expect(lf.vars).toEqual([]);
    expect(lf.rows).toEqual([]);
    expect(lf.objective.sense).toBe('MIN');
    expect(lf.objective.coefs).toEqual([]);
    expect(lf.objective.constant).toBe(0);
  });

  it('SolveStatus admits expected literals', () => {
    const cases: SolveStatus[] = ['optimal', 'infeasible', 'unbounded', 'time_limit', 'iter_limit', 'error'];
    expect(cases.length).toBe(6);
  });

  it('LinearForm allows binary variables (integral + lower 0 + upper 1)', () => {
    const lf: LinearForm = {
      vars: [{ name: 'x', cellA1: 'B3', lower: 0, upper: 1, integral: true, originalValue: 0 }],
      objective: { name: 'z', cellA1: 'B1', sense: 'MAX', coefs: [1], constant: 0, originalValue: 0 },
      rows: [],
    };
    expect(lf.vars[0]?.integral).toBe(true);
    expect(lf.vars[0]?.upper).toBe(1);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
pnpm test -- linear-form
```
Expected: `Cannot find module '../../src/shared/linear-form'`.

- [ ] **Step 3: Implement `src/shared/linear-form.ts`**

```ts
import type { Sense } from './model-schema';

export interface LinearFormVariable {
  name: string;
  cellA1: string;      // qualified single-cell A1, e.g. "Optimal!B3"
  lower: number;       // -Infinity if free
  upper: number;       // +Infinity if free
  integral: boolean;
  originalValue: number;
}

export interface LinearFormObjective {
  name: string;
  cellA1: string;
  sense: Sense;
  coefs: number[];     // length = vars.length
  constant: number;    // value when all vars = 0
  originalValue: number;
}

export interface LinearFormRow {
  name: string;
  lhsA1: string;
  op: '<=' | '=' | '>=';
  coefs: number[];     // length = vars.length
  rhs: number;         // resolved (cell ref already read)
  constant: number;    // LHS evaluated when all vars = 0
  lhsOriginalValue: number;
}

export interface LinearForm {
  vars: LinearFormVariable[];
  objective: LinearFormObjective;
  rows: LinearFormRow[];
}

export function emptyLinearForm(sense: Sense): LinearForm {
  return {
    vars: [],
    objective: { name: '', cellA1: '', sense, coefs: [], constant: 0, originalValue: 0 },
    rows: [],
  };
}

export type SolveStatus =
  | 'optimal'
  | 'infeasible'
  | 'unbounded'
  | 'time_limit'
  | 'iter_limit'
  | 'error';

export interface SolveResultVariable {
  name: string;
  primal: number;
  dual: number | null;        // reduced cost (LP only)
  rangeUp: number | null;     // allowable increase of obj coef (LP only)
  rangeDown: number | null;
}

export interface SolveResultRow {
  name: string;
  primal: number;             // LHS value
  dual: number | null;        // shadow price (LP only)
  status: 'basic' | 'lower' | 'upper' | 'free';
  rangeUp: number | null;     // allowable increase of RHS (LP only)
  rangeDown: number | null;
}

export interface SolveResult {
  status: SolveStatus;
  objective: number;
  variables: SolveResultVariable[];
  rows: SolveResultRow[];
  iterations: number;
  time: number;        // seconds
  isMip: boolean;
  mipGap?: number;     // present when isMip
  message?: string;    // human-readable detail when status != optimal
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test -- linear-form
```
Expected: 3/3 pass.

- [ ] **Step 5: Run typecheck**

```bash
pnpm run typecheck
```
Expected: pass.

- [ ] **Step 6: Commit**

```bash
git add src/shared/linear-form.ts tests/unit/linear-form.test.ts
git commit -m "feat: LinearForm and SolveResult shared types"
```

---

## Phase 2 — Server-side extraction (RangeIO.gs)

### Task 2.1: RangeIO.gs — validate model resolvability

**Files:**
- Create: `src/server/RangeIO.gs`

- [ ] **Step 1: Create `src/server/RangeIO.gs`**

```js
/**
 * Validates that the model can be resolved against the current sheet.
 * Returns { ok: true } or { ok: false, errors: [...] }.
 *
 * Checks (in order):
 *  - Objective A1 exists and points to a numeric/formula cell
 *  - Variables range exists, is 1D (single row or column), has no formulas
 *  - Each constraint LHS exists and is numeric/formula
 *  - Each linear constraint RHS resolves to a number (either literal or cell value)
 *  - int/bin constraints reference cells inside the variables range
 *
 * Called via google.script.run.validateModel(modelDoc) from the client.
 *
 * @param {object} modelDoc - validated ModelDocument JSON
 * @return {{ ok: true } | { ok: false, errors: string[] }}
 */
function validateModel(modelDoc) {
  var errors = [];
  var ss = SpreadsheetApp.getActive();

  function safeGetRange(a1) {
    try { return ss.getRange(a1); } catch (e) { return null; }
  }

  // Objective
  var objRange = safeGetRange(modelDoc.objective.cellA1);
  if (!objRange) {
    errors.push('La celda objetivo "' + modelDoc.objective.cellA1 + '" no existe.');
  } else if (objRange.getNumRows() !== 1 || objRange.getNumColumns() !== 1) {
    errors.push('La celda objetivo "' + modelDoc.objective.cellA1 + '" debe ser una sola celda.');
  } else {
    var v = objRange.getValue();
    if (typeof v !== 'number' && v !== '') {
      errors.push('La celda objetivo "' + modelDoc.objective.cellA1 + '" no devuelve un número (valor: ' + v + ').');
    }
  }

  // Variables
  var varRange = safeGetRange(modelDoc.variables.rangeA1);
  if (!varRange) {
    errors.push('El rango de variables "' + modelDoc.variables.rangeA1 + '" no existe.');
    return { ok: false, errors: errors };
  }
  if (varRange.getNumRows() > 1 && varRange.getNumColumns() > 1) {
    errors.push('Las variables deben estar en una sola fila o columna (1D). Recibido: ' + varRange.getNumRows() + 'x' + varRange.getNumColumns() + '.');
    return { ok: false, errors: errors };
  }
  var formulas = varRange.getFormulas();
  var hasFormula = false;
  for (var i = 0; i < formulas.length; i++) {
    for (var j = 0; j < formulas[i].length; j++) {
      if (formulas[i][j] !== '') hasFormula = true;
    }
  }
  if (hasFormula) {
    errors.push('Las celdas de variables no pueden contener fórmulas.');
  }

  // Constraints
  var varA1Set = {};
  var varNumRows = varRange.getNumRows();
  var varNumCols = varRange.getNumColumns();
  var varStartRow = varRange.getRow();
  var varStartCol = varRange.getColumn();
  for (var r = 0; r < varNumRows; r++) {
    for (var c = 0; c < varNumCols; c++) {
      var cellNotation = varRange.getCell(r + 1, c + 1).getA1Notation();
      varA1Set[cellNotation] = true;
    }
  }

  for (var k = 0; k < modelDoc.constraints.length; k++) {
    var con = modelDoc.constraints[k];
    var lhs = safeGetRange(con.lhsA1);
    if (!lhs) {
      errors.push('Restricción ' + (k + 1) + ': la celda "' + con.lhsA1 + '" no existe.');
      continue;
    }
    if (con.op === 'int' || con.op === 'bin') {
      // All cells in lhs must be inside varRange
      var lhsRows = lhs.getNumRows();
      var lhsCols = lhs.getNumColumns();
      for (var rr = 0; rr < lhsRows; rr++) {
        for (var cc = 0; cc < lhsCols; cc++) {
          var cn = lhs.getCell(rr + 1, cc + 1).getA1Notation();
          if (!varA1Set[cn]) {
            errors.push('Restricción ' + (k + 1) + ': "' + con.op + '" aplicada a ' + cn + ', que está fuera del rango de variables.');
          }
        }
      }
    } else {
      // Linear: LHS must be single cell and numeric, RHS must resolve to number
      if (lhs.getNumRows() !== 1 || lhs.getNumColumns() !== 1) {
        errors.push('Restricción ' + (k + 1) + ': el lado izquierdo "' + con.lhsA1 + '" debe ser una sola celda.');
      }
      var rhsRaw = con.rhsA1OrValue;
      var isLiteralNumber = !isNaN(parseFloat(rhsRaw)) && isFinite(rhsRaw);
      if (!isLiteralNumber) {
        var rhsRange = safeGetRange(rhsRaw);
        if (!rhsRange) {
          errors.push('Restricción ' + (k + 1) + ': el lado derecho "' + rhsRaw + '" no es número ni celda válida.');
        }
      }
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors: errors };
}
```

- [ ] **Step 2: Build**

```bash
pnpm run build
```
Expected: success. Verify `dist/RangeIO.gs` exists.

- [ ] **Step 3: Commit**

```bash
git add src/server/RangeIO.gs
git commit -m "feat: RangeIO.gs validateModel — pre-extraction checks"
```

---

### Task 2.2: RangeIO.gs — extractLinearForm via perturbation

**Files:**
- Modify: `src/server/RangeIO.gs` (append)

- [ ] **Step 1: Append to `src/server/RangeIO.gs`**

```js
/**
 * Extracts the linear form of the model by perturbation, the way Excel does:
 *  1. Snapshot current variable values.
 *  2. Set vars = 0; read objective + LHS = constants.
 *  3. For each var i: set var_i = 1 (others 0); read again; differences = coefs.
 *  4. Restore originals.
 *
 * Returns a LinearForm + snapshot for later restore.
 *
 * Linearity sanity check: after step 3, set vars = 0.5; predicted = b0 + 0.5 * sum(coefs).
 * If actual differs by > 1e-6 in any eval cell, includes a warning.
 *
 * @param {object} modelDoc - the validated ModelDocument
 * @return {{ ok: true, linearForm: object, snapshot: object, warnings: string[] }
 *        | { ok: false, errors: string[] }}
 */
function extractLinearForm(modelDoc) {
  var ss = SpreadsheetApp.getActive();
  var varRange = ss.getRange(modelDoc.variables.rangeA1);
  var nRows = varRange.getNumRows();
  var nCols = varRange.getNumColumns();
  var n = nRows * nCols;
  var isColumn = nCols === 1;

  // 1. Snapshot variables
  var originals = varRange.getValues();   // 2D matrix
  function flat(matrix) {
    var out = [];
    for (var r = 0; r < matrix.length; r++) {
      for (var c = 0; c < matrix[r].length; c++) out.push(matrix[r][c]);
    }
    return out;
  }
  function reshape(flatArr) {
    var out = [];
    var idx = 0;
    for (var r = 0; r < nRows; r++) {
      var row = [];
      for (var c = 0; c < nCols; c++) row.push(flatArr[idx++]);
      out.push(row);
    }
    return out;
  }
  function fillFlat(v) {
    var out = new Array(n);
    for (var i = 0; i < n; i++) out[i] = v;
    return out;
  }
  function ei(i, oneAt) {
    var out = new Array(n);
    for (var k = 0; k < n; k++) out[k] = (k === oneAt ? 1 : 0);
    return out;
  }

  // 2. Build eval cell list
  var evalA1s = [modelDoc.objective.cellA1];
  var rowMeta = [];
  for (var k = 0; k < modelDoc.constraints.length; k++) {
    var con = modelDoc.constraints[k];
    if (con.op === 'int' || con.op === 'bin') continue;
    evalA1s.push(con.lhsA1);
    rowMeta.push({ idx: k, op: con.op, rhsA1OrValue: con.rhsA1OrValue });
  }

  function readEvals() {
    var out = new Array(evalA1s.length);
    for (var e = 0; e < evalA1s.length; e++) {
      var v = ss.getRange(evalA1s[e]).getValue();
      if (typeof v !== 'number') {
        if (v === '' || v == null) v = 0;
        else throw new Error('La celda ' + evalA1s[e] + ' no devuelve un número (valor: ' + v + ').');
      }
      out[e] = v;
    }
    return out;
  }

  // 3. Set vars = 0, read constants
  varRange.setValues(reshape(fillFlat(0)));
  SpreadsheetApp.flush();
  var b0 = readEvals();

  // 4. Coefficients via perturbation
  var coefsByEval = new Array(evalA1s.length); // [evalIdx][varIdx]
  for (var e = 0; e < evalA1s.length; e++) coefsByEval[e] = new Array(n);

  for (var i = 0; i < n; i++) {
    varRange.setValues(reshape(ei(i, i)));
    SpreadsheetApp.flush();
    var bi = readEvals();
    for (var e = 0; e < evalA1s.length; e++) {
      coefsByEval[e][i] = bi[e] - b0[e];
    }
  }

  // 5. Linearity sanity at vars = 0.5
  var warnings = [];
  varRange.setValues(reshape(fillFlat(0.5)));
  SpreadsheetApp.flush();
  var bMid = readEvals();
  for (var e = 0; e < evalA1s.length; e++) {
    var sumCoefs = 0;
    for (var i = 0; i < n; i++) sumCoefs += coefsByEval[e][i];
    var predicted = b0[e] + 0.5 * sumCoefs;
    if (Math.abs(bMid[e] - predicted) > 1e-6) {
      warnings.push('La celda ' + evalA1s[e] + ' no parece lineal en las variables. Los resultados podrían ser incorrectos.');
    }
  }

  // 6. Resolve RHS values (literal vs cell ref)
  function resolveRhs(raw) {
    var parsed = parseFloat(raw);
    if (!isNaN(parsed) && isFinite(raw)) return parsed;
    return ss.getRange(raw).getValue();
  }

  // 7. Build LinearForm
  var varNames = [];
  // Inference: cell immediately to the left or above the variable cell
  for (var i = 0; i < n; i++) {
    var ri, ci;
    if (isColumn) { ri = i; ci = 0; } else { ri = 0; ci = i; }
    var thisCell = varRange.getCell(ri + 1, ci + 1);
    var inferred = null;
    var labelRange;
    if (isColumn) {
      // Try cell above (header row)
      try {
        labelRange = thisCell.offset(-i - 1, 0); // first row's previous row? Actually:
      } catch (er) { labelRange = null; }
      // Simpler: read sibling at offset(-1, 0) only for the FIRST var; but we want per-var name.
      // Try cell to the LEFT of this variable
      try {
        var leftVal = thisCell.offset(0, -1).getValue();
        if (leftVal !== '' && leftVal != null) inferred = String(leftVal);
      } catch (er) { /* edge of sheet */ }
    } else {
      // Row layout: try cell ABOVE this column
      try {
        var topVal = thisCell.offset(-1, 0).getValue();
        if (topVal !== '' && topVal != null) inferred = String(topVal);
      } catch (er) { /* edge */ }
    }
    varNames.push(inferred || ('x' + (i + 1)));
  }

  // Determine integrality from constraints
  var integralByIdx = new Array(n);
  var binByIdx = new Array(n);
  for (var i = 0; i < n; i++) { integralByIdx[i] = false; binByIdx[i] = false; }
  for (var k = 0; k < modelDoc.constraints.length; k++) {
    var con = modelDoc.constraints[k];
    if (con.op !== 'int' && con.op !== 'bin') continue;
    var conRange = ss.getRange(con.lhsA1);
    var conRows = conRange.getNumRows();
    var conCols = conRange.getNumColumns();
    for (var rr = 0; rr < conRows; rr++) {
      for (var cc = 0; cc < conCols; cc++) {
        var conCellA1 = conRange.getCell(rr + 1, cc + 1).getA1Notation();
        // Locate index in variables range
        for (var i2 = 0; i2 < n; i2++) {
          var ri2, ci2;
          if (isColumn) { ri2 = i2; ci2 = 0; } else { ri2 = 0; ci2 = i2; }
          if (varRange.getCell(ri2 + 1, ci2 + 1).getA1Notation() === conCellA1) {
            integralByIdx[i2] = true;
            if (con.op === 'bin') binByIdx[i2] = true;
          }
        }
      }
    }
  }

  // Variable name to LHS sibling lookup for constraint names
  function inferConstraintName(lhsA1) {
    try {
      var lhs = ss.getRange(lhsA1);
      var leftVal = lhs.offset(0, -1).getValue();
      if (leftVal !== '' && leftVal != null) return String(leftVal);
    } catch (er) { /* edge */ }
    return lhsA1;
  }

  var origFlat = flat(originals);
  var vars = [];
  for (var i = 0; i < n; i++) {
    var lb = modelDoc.options.assumeNonNegative ? 0 : -Infinity;
    var ub = Infinity;
    if (binByIdx[i]) { lb = 0; ub = 1; }
    var rI, cI;
    if (isColumn) { rI = i; cI = 0; } else { rI = 0; cI = i; }
    var cellA1Notation = varRange.getCell(rI + 1, cI + 1).getA1Notation();
    vars.push({
      name: varNames[i],
      cellA1: cellA1Notation,
      lower: lb,
      upper: ub,
      integral: integralByIdx[i],
      originalValue: typeof origFlat[i] === 'number' ? origFlat[i] : 0,
    });
  }

  var objCoefs = coefsByEval[0];
  var rows = [];
  for (var r = 0; r < rowMeta.length; r++) {
    var meta = rowMeta[r];
    rows.push({
      name: inferConstraintName(modelDoc.constraints[meta.idx].lhsA1),
      lhsA1: modelDoc.constraints[meta.idx].lhsA1,
      op: meta.op,
      coefs: coefsByEval[r + 1],
      rhs: resolveRhs(meta.rhsA1OrValue),
      constant: b0[r + 1],
      lhsOriginalValue: 0, // will be filled below
    });
  }

  // Read original LHS values (set vars to originals first, then read)
  varRange.setValues(originals);
  SpreadsheetApp.flush();
  var origEvals = readEvals();
  var origObjValue = origEvals[0];
  for (var r = 0; r < rows.length; r++) {
    rows[r].lhsOriginalValue = origEvals[r + 1];
  }

  // Objective name
  var objName = inferConstraintName(modelDoc.objective.cellA1);

  return {
    ok: true,
    linearForm: {
      vars: vars,
      objective: {
        name: objName,
        cellA1: modelDoc.objective.cellA1,
        sense: modelDoc.objective.sense,
        coefs: objCoefs,
        constant: b0[0],
        originalValue: origObjValue,
      },
      rows: rows,
    },
    snapshot: { variablesOriginal: originals },
    warnings: warnings,
  };
}

/**
 * Restores variable cells to a previously captured snapshot.
 * @param {object} modelDoc
 * @param {object} snapshot
 */
function restoreSnapshot(modelDoc, snapshot) {
  if (!snapshot || !snapshot.variablesOriginal) return;
  var ss = SpreadsheetApp.getActive();
  ss.getRange(modelDoc.variables.rangeA1).setValues(snapshot.variablesOriginal);
  SpreadsheetApp.flush();
}
```

- [ ] **Step 2: Build**

```bash
pnpm run build
```
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/server/RangeIO.gs
git commit -m "feat: RangeIO.gs extractLinearForm via numerical perturbation"
```

---

## Phase 3 — Client solver

### Task 3.1: HiGHS loader (lazy)

**Files:**
- Create: `src/client/solver/highs-loader.ts`

- [ ] **Step 1: Create `src/client/solver/highs-loader.ts`**

```ts
/**
 * Lazy-loads HiGHS WASM. The module ships in the bundle but the WASM
 * binary is only initialized when actually needed (the first solve).
 *
 * highs-js exports a default function returning a Promise<HighsModule>.
 */

// The package types are minimal; we narrow to the methods we use.
export interface HighsLpInput {
  // String input in LP file format (HiGHS native), or:
  // Alternative: structured API. For MVP we use LP-format string.
}

export interface HighsRawResult {
  Status: string;        // "Optimal" | "Infeasible" | "Unbounded" | "Time limit reached" | etc.
  ObjectiveValue: number;
  Columns: Record<string, {
    Index: number;
    Status: string;
    Lower: number;
    Upper: number;
    Primal: number;
    Dual: number;        // reduced cost
    Type: string;        // "Continuous" | "Integer"
    Name: string;
  }>;
  Rows: Array<{
    Index: number;
    Name: string;
    Status: string;
    Lower: number;
    Upper: number;
    Primal: number;
    Dual: number;        // shadow price
  }>;
  // Optional ranging when available
  IsLinear?: boolean;
}

interface HighsModule {
  solve(lp: string, options?: Record<string, unknown>): HighsRawResult;
}

let modulePromise: Promise<HighsModule> | null = null;

export async function getHighs(): Promise<HighsModule> {
  if (modulePromise) return modulePromise;
  // Dynamic import keeps the WASM out of the initial bundle parse path.
  modulePromise = (async () => {
    // @ts-expect-error highs has minimal type defs
    const factory = (await import('highs')).default;
    const mod = await factory({
      // Locate the WASM file relative to the bundled script. esbuild
      // copies highs.wasm next to the bundle when we configure assetNames.
      // For our HtmlService environment we instead inline the WASM as
      // a data URL via esbuild's --loader=binary. See esbuild.config.mjs.
      locateFile: (file: string): string => {
        // The wasm will be embedded as a Blob URL by esbuild.
        return file;
      },
    });
    return mod as HighsModule;
  })();
  return modulePromise;
}
```

- [ ] **Step 2: Update esbuild config to inline the WASM**

Modify `esbuild.config.mjs`:

```js
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

await build({
  entryPoints: ['src/client/index.ts'],
  bundle: true,
  format: 'iife',
  target: ['chrome100', 'firefox100', 'safari15'],
  platform: 'browser',
  minify: false,
  sourcemap: false,
  outfile: 'dist/client-bundle.js',
  legalComments: 'none',
  logLevel: 'info',
  loader: {
    '.wasm': 'binary',  // embeds wasm as Uint8Array
  },
});
```

- [ ] **Step 3: Build and verify**

```bash
pnpm run build
```
Expected: success; `dist/dialog.html` increases substantially (~2 MB) due to WASM inlining.

- [ ] **Step 4: Commit**

```bash
git add src/client/solver/highs-loader.ts esbuild.config.mjs
git commit -m "feat: lazy HiGHS-WASM loader for client-side solving"
```

---

### Task 3.2: Model builder (LinearForm → HiGHS LP string)

**Files:**
- Create: `src/client/solver/model-builder.ts`
- Create: `tests/unit/model-builder.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/model-builder.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { toLpFormat } from '../../src/client/solver/model-builder';
import type { LinearForm } from '../../src/shared/linear-form';

function makeLf(): LinearForm {
  return {
    vars: [
      { name: 'x1', cellA1: 'B3', lower: 0, upper: Infinity, integral: false, originalValue: 0 },
      { name: 'x2', cellA1: 'B4', lower: 0, upper: Infinity, integral: false, originalValue: 0 },
    ],
    objective: { name: 'z', cellA1: 'B12', sense: 'MIN', coefs: [3, 5], constant: 0, originalValue: 0 },
    rows: [
      { name: 'c1', lhsA1: 'D12', op: '<=', coefs: [2, 1], rhs: 10, constant: 0, lhsOriginalValue: 0 },
      { name: 'c2', lhsA1: 'D13', op: '>=', coefs: [1, 3], rhs: 12, constant: 0, lhsOriginalValue: 0 },
    ],
  };
}

describe('toLpFormat', () => {
  it('emits MIN with sense Minimize', () => {
    const lp = toLpFormat(makeLf());
    expect(lp).toMatch(/^Minimize/m);
  });

  it('emits objective with coefficients', () => {
    const lp = toLpFormat(makeLf());
    expect(lp).toContain('3 x1 + 5 x2');
  });

  it('emits constraints in canonical form', () => {
    const lp = toLpFormat(makeLf());
    expect(lp).toContain('2 x1 + 1 x2 <= 10');
    expect(lp).toContain('1 x1 + 3 x2 >= 12');
  });

  it('handles MAX by reversing sense in objective declaration', () => {
    const lf = makeLf();
    lf.objective.sense = 'MAX';
    const lp = toLpFormat(lf);
    expect(lp).toMatch(/^Maximize/m);
  });

  it('emits bounds section with lower/upper', () => {
    const lf = makeLf();
    lf.vars[0]!.upper = 100;
    const lp = toLpFormat(lf);
    expect(lp).toContain('Bounds');
    expect(lp).toContain('x1 <= 100');
  });

  it('emits General section for integer vars', () => {
    const lf = makeLf();
    lf.vars[0]!.integral = true;
    const lp = toLpFormat(lf);
    expect(lp).toContain('General');
    expect(lp).toContain('x1');
  });

  it('emits Binary section for binary vars (integral + 0..1)', () => {
    const lf = makeLf();
    lf.vars[0]!.integral = true;
    lf.vars[0]!.lower = 0;
    lf.vars[0]!.upper = 1;
    const lp = toLpFormat(lf);
    expect(lp).toContain('Binary');
    expect(lp).toContain('x1');
  });

  it('skips zero coefficients in constraints', () => {
    const lf = makeLf();
    lf.rows[0]!.coefs = [0, 1];
    const lp = toLpFormat(lf);
    expect(lp).toContain('1 x2 <= 10');
    expect(lp).not.toContain('0 x1 + 1 x2');
  });

  it('ends with End line', () => {
    const lp = toLpFormat(makeLf());
    expect(lp.trim()).toMatch(/End$/);
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
pnpm test -- model-builder
```
Expected: module not found.

- [ ] **Step 3: Implement `src/client/solver/model-builder.ts`**

```ts
import type { LinearForm, LinearFormRow, LinearFormVariable } from '../../shared/linear-form';

/**
 * Translates a LinearForm into HiGHS's LP file format string.
 *
 * Format reference: https://www.gurobi.com/documentation/9.5/refman/lp_format.html
 *
 * Variable naming: uses sanitized LinearForm names (alphanumeric + underscore).
 * If the inferred name has invalid chars, we fall back to x_i.
 */
export function toLpFormat(lf: LinearForm): string {
  const sanitizedNames = lf.vars.map((v, i) => safeName(v.name, i));

  const lines: string[] = [];

  // Objective
  lines.push(lf.objective.sense === 'MAX' ? 'Maximize' : 'Minimize');
  lines.push(' obj: ' + writeLinearExpr(lf.objective.coefs, sanitizedNames));

  // Constraints
  lines.push('Subject To');
  lf.rows.forEach((row, idx) => {
    const expr = writeLinearExpr(row.coefs, sanitizedNames);
    const opStr = row.op === '=' ? '=' : row.op;
    lines.push(` c${idx + 1}: ${expr} ${opStr} ${formatNumber(row.rhs)}`);
  });

  // Bounds (only non-default)
  const boundLines: string[] = [];
  lf.vars.forEach((v, i) => {
    const name = sanitizedNames[i]!;
    if (v.lower === -Infinity && v.upper === Infinity) {
      boundLines.push(` ${name} free`);
      return;
    }
    if (v.lower !== 0) {
      if (v.lower === -Infinity) boundLines.push(` -inf <= ${name}`);
      else boundLines.push(` ${formatNumber(v.lower)} <= ${name}`);
    }
    if (v.upper !== Infinity) {
      boundLines.push(` ${name} <= ${formatNumber(v.upper)}`);
    }
  });
  if (boundLines.length > 0) {
    lines.push('Bounds');
    lines.push(...boundLines);
  }

  // Binary (integral + 0..1)
  const binaries = lf.vars
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v.integral && v.lower === 0 && v.upper === 1)
    .map(({ i }) => sanitizedNames[i]!);
  if (binaries.length > 0) {
    lines.push('Binary');
    lines.push(' ' + binaries.join(' '));
  }

  // General (integer but not binary)
  const generals = lf.vars
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v.integral && !(v.lower === 0 && v.upper === 1))
    .map(({ i }) => sanitizedNames[i]!);
  if (generals.length > 0) {
    lines.push('General');
    lines.push(' ' + generals.join(' '));
  }

  lines.push('End');
  return lines.join('\n');
}

function writeLinearExpr(coefs: number[], names: string[]): string {
  const terms: string[] = [];
  coefs.forEach((c, i) => {
    if (c === 0) return;
    const name = names[i]!;
    if (terms.length === 0) {
      terms.push(`${formatNumber(c)} ${name}`);
    } else {
      const sign = c >= 0 ? '+' : '-';
      terms.push(`${sign} ${formatNumber(Math.abs(c))} ${name}`);
    }
  });
  return terms.length === 0 ? '0' : terms.join(' ');
}

function formatNumber(x: number): string {
  if (!isFinite(x)) return x > 0 ? '+inf' : '-inf';
  return Number(x.toPrecision(15)).toString();
}

const VALID_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
function safeName(name: string, index: number): string {
  if (VALID_NAME.test(name)) return name;
  return `x_${index + 1}`;
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test -- model-builder
```
Expected: all 9 pass.

- [ ] **Step 5: Commit**

```bash
git add src/client/solver/model-builder.ts tests/unit/model-builder.test.ts
git commit -m "feat: model-builder converts LinearForm to HiGHS LP format"
```

---

### Task 3.3: Solve wrapper (run + normalize HiGHS result)

**Files:**
- Create: `src/client/solver/solve.ts`
- Create: `tests/unit/solve-status.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/solve-status.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { mapStatus } from '../../src/client/solver/solve';

describe('mapStatus', () => {
  it('Optimal → optimal', () => {
    expect(mapStatus('Optimal')).toBe('optimal');
  });
  it('Infeasible → infeasible', () => {
    expect(mapStatus('Infeasible')).toBe('infeasible');
    expect(mapStatus('Primal infeasible')).toBe('infeasible');
  });
  it('Unbounded → unbounded', () => {
    expect(mapStatus('Unbounded')).toBe('unbounded');
    expect(mapStatus('Primal unbounded')).toBe('unbounded');
  });
  it('Time limit reached → time_limit', () => {
    expect(mapStatus('Time limit reached')).toBe('time_limit');
  });
  it('Iteration limit reached → iter_limit', () => {
    expect(mapStatus('Iteration limit reached')).toBe('iter_limit');
  });
  it('unknown status → error', () => {
    expect(mapStatus('Something weird')).toBe('error');
    expect(mapStatus('')).toBe('error');
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
pnpm test -- solve-status
```
Expected: module not found.

- [ ] **Step 3: Implement `src/client/solver/solve.ts`**

```ts
import type { LinearForm, SolveResult, SolveStatus } from '../../shared/linear-form';
import { getHighs, type HighsRawResult } from './highs-loader';
import { toLpFormat } from './model-builder';

export interface SolveOptions {
  timeLimitSec: number;
  mipRelGap: number;
}

export async function runSolve(lf: LinearForm, opts: SolveOptions): Promise<SolveResult> {
  const highs = await getHighs();
  const lp = toLpFormat(lf);
  const t0 = performance.now();
  let raw: HighsRawResult;
  try {
    raw = highs.solve(lp, {
      time_limit: opts.timeLimitSec,
      mip_rel_gap: opts.mipRelGap,
      output_flag: false,
    });
  } catch (e) {
    return {
      status: 'error',
      objective: 0,
      variables: [],
      rows: [],
      iterations: 0,
      time: (performance.now() - t0) / 1000,
      isMip: lf.vars.some((v) => v.integral),
      message: (e as Error).message,
    };
  }
  const elapsed = (performance.now() - t0) / 1000;

  const status = mapStatus(raw.Status);
  const isMip = lf.vars.some((v) => v.integral);

  // HiGHS returns columns keyed by name. We re-map back to LinearForm order via index.
  const cols = Object.values(raw.Columns || {}).sort((a, b) => a.Index - b.Index);

  const variables = lf.vars.map((v, i) => {
    const col = cols[i];
    return {
      name: v.name,
      primal: col?.Primal ?? v.originalValue,
      dual: !isMip && col != null ? col.Dual : null,
      rangeUp: null as number | null,   // ranging not in basic highs-js output
      rangeDown: null as number | null,
    };
  });

  const rows = lf.rows.map((row, j) => {
    const r = raw.Rows?.[j];
    return {
      name: row.name,
      primal: r?.Primal ?? row.lhsOriginalValue,
      dual: !isMip && r != null ? r.Dual : null,
      status: mapRowStatus(r?.Status),
      rangeUp: null as number | null,
      rangeDown: null as number | null,
    };
  });

  return {
    status,
    objective: raw.ObjectiveValue ?? 0,
    variables,
    rows,
    iterations: 0,  // highs-js doesn't expose iter count cleanly; leave at 0
    time: elapsed,
    isMip,
  };
}

export function mapStatus(raw: string): SolveStatus {
  const s = (raw || '').toLowerCase();
  if (s === 'optimal') return 'optimal';
  if (s.includes('infeasible')) return 'infeasible';
  if (s.includes('unbounded')) return 'unbounded';
  if (s.includes('time limit')) return 'time_limit';
  if (s.includes('iteration limit')) return 'iter_limit';
  return 'error';
}

function mapRowStatus(s: string | undefined): 'basic' | 'lower' | 'upper' | 'free' {
  if (!s) return 'free';
  const l = s.toLowerCase();
  if (l.includes('basic')) return 'basic';
  if (l.includes('lower')) return 'lower';
  if (l.includes('upper')) return 'upper';
  return 'free';
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test -- solve-status
```
Expected: 6/6 pass.

- [ ] **Step 5: Commit**

```bash
git add src/client/solver/solve.ts tests/unit/solve-status.test.ts
git commit -m "feat: solve wrapper that runs HiGHS and normalizes the result"
```

---

## Phase 4 — Report matrix builders

### Task 4.1: Answer report matrix

**Files:**
- Create: `src/client/reports/answer.ts`
- Create: `tests/unit/reports/answer.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/reports/answer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildAnswerMatrix } from '../../../src/client/reports/answer';
import type { LinearForm, SolveResult } from '../../../src/shared/linear-form';

function lf(): LinearForm {
  return {
    vars: [
      { name: 'x1', cellA1: 'B3', lower: 0, upper: Infinity, integral: false, originalValue: 0 },
      { name: 'x2', cellA1: 'B4', lower: 0, upper: Infinity, integral: false, originalValue: 0 },
    ],
    objective: { name: 'z', cellA1: 'B12', sense: 'MIN', coefs: [3, 5], constant: 0, originalValue: 0 },
    rows: [
      { name: 'c1', lhsA1: 'D12', op: '<=', coefs: [2, 1], rhs: 10, constant: 0, lhsOriginalValue: 0 },
    ],
  };
}

function sr(): SolveResult {
  return {
    status: 'optimal',
    objective: 15,
    variables: [
      { name: 'x1', primal: 5, dual: 0, rangeUp: null, rangeDown: null },
      { name: 'x2', primal: 0, dual: 2, rangeUp: null, rangeDown: null },
    ],
    rows: [{ name: 'c1', primal: 10, dual: 1.5, status: 'upper', rangeUp: null, rangeDown: null }],
    iterations: 5,
    time: 0.012,
    isMip: false,
  };
}

describe('buildAnswerMatrix', () => {
  it('produces a matrix starting with the title', () => {
    const m = buildAnswerMatrix(lf(), sr(), { sheetName: 'Optimal', timestamp: '2026-05-18T14:32' });
    expect(m[0]?.[0]).toBe('AltSolver · Informe de Respuesta');
  });

  it('contains the objective row with original and final values', () => {
    const m = buildAnswerMatrix(lf(), sr(), { sheetName: 'Optimal', timestamp: '2026-05-18T14:32' });
    const flat = m.flat();
    expect(flat).toContain('z');
    expect(flat).toContain(0);   // original
    expect(flat).toContain(15);  // final
  });

  it('lists each variable with its tipo', () => {
    const m = buildAnswerMatrix(lf(), sr(), { sheetName: 'Optimal', timestamp: '2026-05-18T14:32' });
    const flat = m.flat();
    expect(flat).toContain('x1');
    expect(flat).toContain(5);
    expect(flat).toContain('Continua');
  });

  it('marks binding constraints (<= and =) and shows slack', () => {
    const m = buildAnswerMatrix(lf(), sr(), { sheetName: 'Optimal', timestamp: '2026-05-18T14:32' });
    const flat = m.flat();
    expect(flat).toContain('● Vinculante');
  });
});
```

- [ ] **Step 2: Run, verify fail**

```bash
pnpm test -- reports/answer
```
Expected: module not found.

- [ ] **Step 3: Implement `src/client/reports/answer.ts`**

```ts
import type { LinearForm, SolveResult, SolveResultRow } from '../../shared/linear-form';

export interface AnswerContext {
  sheetName: string;
  timestamp: string;
}

const FEAS_TOL = 1e-6;

export function buildAnswerMatrix(
  lf: LinearForm,
  sr: SolveResult,
  ctx: AnswerContext,
): (string | number)[][] {
  const rows: (string | number)[][] = [];

  // Title + subtitle
  rows.push(['AltSolver · Informe de Respuesta']);
  rows.push([`Hoja ${ctx.sheetName} · ${ctx.timestamp} · z = ${formatNum(sr.objective)}`]);
  rows.push([]);

  // Solver summary band
  rows.push(['Resumen del solver', '', '', '']);
  rows.push(['Motor', sr.isMip ? 'Simplex + Branch-and-Bound (HiGHS)' : 'Simplex LP (HiGHS)', 'Tiempo', `${sr.time.toFixed(3)} s`]);
  rows.push(['Solución', solutionLabel(sr), 'Iteraciones', sr.iterations]);
  rows.push([]);

  // Objective section
  rows.push(['Función objetivo']);
  rows.push(['Celda', 'Nombre', 'Valor inicial', 'Valor final']);
  rows.push([lf.objective.cellA1, lf.objective.name, lf.objective.originalValue, sr.objective]);
  rows.push([]);

  // Variables section
  rows.push(['Variables de decisión']);
  rows.push(['Celda', 'Nombre', 'Valor inicial', 'Valor final', 'Tipo']);
  lf.vars.forEach((v, i) => {
    const tipo = v.integral
      ? v.lower === 0 && v.upper === 1
        ? 'Binaria'
        : 'Entera'
      : 'Continua';
    rows.push([v.cellA1, v.name, v.originalValue, sr.variables[i]?.primal ?? 0, tipo]);
  });
  rows.push([]);

  // Constraints section
  rows.push(['Restricciones']);
  rows.push(['Celda', 'Nombre', 'Valor', 'Fórmula', 'Estado', 'Holgura']);
  lf.rows.forEach((row, j) => {
    const srRow = sr.rows[j];
    const formula = `${row.lhsA1}${row.op}${formatNum(row.rhs)}`;
    const isBinding = bindingTest(row.op, srRow);
    const slack = slackValue(row.op, srRow?.primal ?? 0, row.rhs);
    rows.push([
      row.lhsA1,
      row.name,
      srRow?.primal ?? 0,
      formula,
      isBinding ? '● Vinculante' : '○ No vinculante',
      slack,
    ]);
  });

  return rows;
}

function solutionLabel(sr: SolveResult): string {
  switch (sr.status) {
    case 'optimal':
      return 'Óptima';
    case 'time_limit':
      return 'No óptima (tiempo agotado)';
    case 'iter_limit':
      return 'No óptima (iteraciones agotadas)';
    case 'infeasible':
      return 'Infactible';
    case 'unbounded':
      return 'No acotada';
    case 'error':
      return 'Error';
  }
}

function bindingTest(op: '<=' | '=' | '>=', srRow: SolveResultRow | undefined): boolean {
  if (!srRow) return false;
  if (srRow.status === 'upper' || srRow.status === 'lower') return true;
  // Fallback by slack tolerance
  return false;
}

function slackValue(op: '<=' | '=' | '>=', lhs: number, rhs: number): number {
  if (op === '<=') return rhs - lhs;
  if (op === '>=') return lhs - rhs;
  return Math.abs(lhs - rhs);
}

function formatNum(x: number): string {
  return Number(x.toPrecision(6)).toString();
}
```

- [ ] **Step 4: Run test, verify pass**

```bash
pnpm test -- reports/answer
```
Expected: 4/4 pass.

- [ ] **Step 5: Commit**

```bash
git add src/client/reports/answer.ts tests/unit/reports/answer.test.ts
git commit -m "feat: build Answer report matrix (LP & MIP)"
```

---

### Task 4.2: Sensitivity report matrix (LP-only)

**Files:**
- Create: `src/client/reports/sensitivity.ts`
- Create: `tests/unit/reports/sensitivity.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/reports/sensitivity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildSensitivityMatrix } from '../../../src/client/reports/sensitivity';
import type { LinearForm, SolveResult } from '../../../src/shared/linear-form';

function lf(): LinearForm {
  return {
    vars: [
      { name: 'x1', cellA1: 'B3', lower: 0, upper: Infinity, integral: false, originalValue: 0 },
      { name: 'x2', cellA1: 'B4', lower: 0, upper: Infinity, integral: false, originalValue: 0 },
    ],
    objective: { name: 'z', cellA1: 'B12', sense: 'MIN', coefs: [3, 5], constant: 0, originalValue: 0 },
    rows: [
      { name: 'c1', lhsA1: 'D12', op: '<=', coefs: [2, 1], rhs: 10, constant: 0, lhsOriginalValue: 0 },
    ],
  };
}

function sr(): SolveResult {
  return {
    status: 'optimal',
    objective: 15,
    variables: [
      { name: 'x1', primal: 5, dual: 0, rangeUp: 1.5, rangeDown: 0.5 },
      { name: 'x2', primal: 0, dual: 2, rangeUp: null, rangeDown: 2.5 },
    ],
    rows: [{ name: 'c1', primal: 10, dual: 1.5, status: 'upper', rangeUp: 6, rangeDown: 8 }],
    iterations: 5,
    time: 0.012,
    isMip: false,
  };
}

describe('buildSensitivityMatrix', () => {
  it('returns null for MIP problems', () => {
    const mipResult = { ...sr(), isMip: true };
    expect(buildSensitivityMatrix(lf(), mipResult, { sheetName: 's', timestamp: 't' })).toBeNull();
  });

  it('contains both Variable and Constraint sections', () => {
    const m = buildSensitivityMatrix(lf(), sr(), { sheetName: 's', timestamp: 't' });
    expect(m).not.toBeNull();
    const flat = m!.flat();
    expect(flat).toContain('Variables de decisión');
    expect(flat).toContain('Restricciones');
  });

  it('shows ∞ when rangeUp is null', () => {
    const m = buildSensitivityMatrix(lf(), sr(), { sheetName: 's', timestamp: 't' })!;
    const flat = m.flat();
    expect(flat).toContain('∞');
  });

  it('shows reduced costs and shadow prices', () => {
    const m = buildSensitivityMatrix(lf(), sr(), { sheetName: 's', timestamp: 't' })!;
    const flat = m.flat();
    expect(flat).toContain(2);    // reduced cost of x2
    expect(flat).toContain(1.5);  // shadow price of c1
  });
});
```

- [ ] **Step 2: Run, verify fail**

```bash
pnpm test -- reports/sensitivity
```
Expected: module not found.

- [ ] **Step 3: Implement `src/client/reports/sensitivity.ts`**

```ts
import type { LinearForm, SolveResult } from '../../shared/linear-form';
import type { AnswerContext } from './answer';

export function buildSensitivityMatrix(
  lf: LinearForm,
  sr: SolveResult,
  ctx: AnswerContext,
): (string | number)[][] | null {
  if (sr.isMip) return null;

  const rows: (string | number)[][] = [];

  rows.push(['AltSolver · Informe de Sensibilidad']);
  rows.push([`Hoja ${ctx.sheetName} · ${ctx.timestamp} · z = ${formatNum(sr.objective)}`]);
  rows.push([]);

  // Variables
  rows.push(['Variables de decisión']);
  rows.push(['Celda', 'Nombre', 'Valor final', 'Costo reducido', 'Coef. objetivo', 'Incremento admisible', 'Decremento admisible']);
  lf.vars.forEach((v, i) => {
    const sv = sr.variables[i];
    rows.push([
      v.cellA1,
      v.name,
      sv?.primal ?? 0,
      sv?.dual ?? 0,
      lf.objective.coefs[i] ?? 0,
      sv?.rangeUp === null || sv?.rangeUp === undefined ? '∞' : sv.rangeUp,
      sv?.rangeDown === null || sv?.rangeDown === undefined ? '∞' : sv.rangeDown,
    ]);
  });
  rows.push([]);

  // Constraints
  rows.push(['Restricciones']);
  rows.push(['Celda', 'Nombre', 'Valor final', 'Precio sombra', 'Lado derecho', 'Incremento admisible', 'Decremento admisible']);
  lf.rows.forEach((row, j) => {
    const sRow = sr.rows[j];
    rows.push([
      row.lhsA1,
      row.name,
      sRow?.primal ?? 0,
      sRow?.dual ?? 0,
      row.rhs,
      sRow?.rangeUp === null || sRow?.rangeUp === undefined ? '∞' : sRow.rangeUp,
      sRow?.rangeDown === null || sRow?.rangeDown === undefined ? '∞' : sRow.rangeDown,
    ]);
  });

  return rows;
}

function formatNum(x: number): string {
  return Number(x.toPrecision(6)).toString();
}
```

- [ ] **Step 4: Run, verify pass**

```bash
pnpm test -- reports/sensitivity
```
Expected: 4/4 pass.

- [ ] **Step 5: Commit**

```bash
git add src/client/reports/sensitivity.ts tests/unit/reports/sensitivity.test.ts
git commit -m "feat: build Sensitivity report matrix (LP only)"
```

---

## Phase 5 — Server-side report writing

### Task 5.1: ReportWriter.gs — create autonumbered sheets

**Files:**
- Create: `src/server/ReportWriter.gs`

- [ ] **Step 1: Create `src/server/ReportWriter.gs`**

```js
/**
 * Creates a new sheet for a report with auto-incremented name.
 * If "Respuesta 1" exists, creates "Respuesta 2", etc.
 *
 * @param {string} basePrefix - "Respuesta" or "Sensibilidad"
 * @return {Sheet}
 */
function createReportSheet_(basePrefix) {
  var ss = SpreadsheetApp.getActive();
  var n = 1;
  while (ss.getSheetByName(basePrefix + ' ' + n) !== null) n++;
  var sheet = ss.insertSheet(basePrefix + ' ' + n);
  return sheet;
}

/**
 * Writes the result of a solve: sets variable values (or restores), creates
 * report sheets, and pastes formatted matrices.
 *
 * @param {{
 *   modelDoc: object,
 *   solveResult: { variableValuesFlat: number[], objectiveValue: number, isMip: boolean },
 *   answerMatrix: any[][],
 *   sensitivityMatrix: any[][] | null,
 *   snapshot: object,
 *   keepSolution: boolean,
 *   writeReports: { answer: boolean, sensitivity: boolean }
 * }} req
 * @return {{ ok: boolean, sheetNames: string[] }}
 */
function writeResults(req) {
  var ss = SpreadsheetApp.getActive();

  // 1. Variable values: keep or restore
  if (req.keepSolution) {
    var varRange = ss.getRange(req.modelDoc.variables.rangeA1);
    var nRows = varRange.getNumRows();
    var nCols = varRange.getNumColumns();
    var idx = 0;
    var matrix = [];
    for (var r = 0; r < nRows; r++) {
      var row = [];
      for (var c = 0; c < nCols; c++) row.push(req.solveResult.variableValuesFlat[idx++]);
      matrix.push(row);
    }
    varRange.setValues(matrix);
  } else {
    if (req.snapshot && req.snapshot.variablesOriginal) {
      ss.getRange(req.modelDoc.variables.rangeA1).setValues(req.snapshot.variablesOriginal);
    }
  }

  var sheetNames = [];

  // 2. Answer report
  if (req.writeReports.answer && req.answerMatrix) {
    var answerSheet = createReportSheet_('Respuesta');
    pasteAndFormat_(answerSheet, req.answerMatrix, '#1a73e8' /* tab blue */);
    sheetNames.push(answerSheet.getName());
  }

  // 3. Sensitivity report (LP only — caller may have set null)
  if (req.writeReports.sensitivity && req.sensitivityMatrix) {
    var sensSheet = createReportSheet_('Sensibilidad');
    pasteAndFormat_(sensSheet, req.sensitivityMatrix, '#9334E8' /* tab purple */);
    sheetNames.push(sensSheet.getName());
  }

  // 4. Persist solvedAt
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    var existing = modelStore_load(sheet);
    if (existing) {
      var doc = JSON.parse(existing);
      doc.meta.solvedAt = new Date().toISOString();
      modelStore_save(sheet, JSON.stringify(doc));
    }
  } catch (e) { /* non-fatal */ }

  return { ok: true, sheetNames: sheetNames };
}
```

- [ ] **Step 2: Build**

```bash
pnpm run build
```
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/server/ReportWriter.gs
git commit -m "feat: ReportWriter.gs creates report sheets and writes values"
```

---

### Task 5.2: ReportWriter.gs — apply visual formatting (`pasteAndFormat_`)

**Files:**
- Modify: `src/server/ReportWriter.gs` (append)

- [ ] **Step 1: Append to `src/server/ReportWriter.gs`**

```js
/**
 * Pastes a string|number matrix into a fresh sheet and applies dashboard-style
 * formatting: title row, subtitle, summary band, section titles, table headers,
 * zebra striping, binding chips, number formats, tab color, freeze.
 *
 * Convention: the matrix layout is fixed (see buildAnswerMatrix / buildSensitivityMatrix).
 * Section titles ("Función objetivo", "Variables de decisión", etc.) are single-cell rows
 * detected by having only column A populated.
 */
function pasteAndFormat_(sheet, matrix, tabColor) {
  if (!matrix || matrix.length === 0) return;
  sheet.setTabColor(tabColor);

  // Determine widest row to know column count
  var maxCols = 1;
  for (var i = 0; i < matrix.length; i++) {
    if (matrix[i].length > maxCols) maxCols = matrix[i].length;
  }

  // Normalize: every row has maxCols columns (pad with '')
  var paddedMatrix = matrix.map(function (row) {
    var padded = row.slice();
    while (padded.length < maxCols) padded.push('');
    return padded;
  });

  var nRows = paddedMatrix.length;
  var nCols = maxCols;
  var range = sheet.getRange(1, 1, nRows, nCols);
  range.setValues(paddedMatrix);

  // Title (row 1)
  sheet.getRange(1, 1, 1, nCols)
    .merge()
    .setFontSize(18)
    .setFontWeight('bold')
    .setFontColor('#202124');

  // Subtitle (row 2)
  sheet.getRange(2, 1, 1, nCols)
    .merge()
    .setFontSize(11)
    .setFontColor('#5f6368');

  // Sweep sections: rows where only column A is populated are titles
  for (var r = 3; r <= nRows; r++) {
    var rowVals = paddedMatrix[r - 1];
    var nonEmpty = 0;
    for (var c = 1; c < nCols; c++) {
      if (rowVals[c] !== '' && rowVals[c] != null) nonEmpty++;
    }
    var firstCellVal = rowVals[0];

    if (firstCellVal === '' || firstCellVal == null) continue;

    // "Resumen del solver" band (special: 4 cols populated, header band)
    if (String(firstCellVal).indexOf('Resumen') === 0) {
      var bandEnd = Math.min(r + 2, nRows);
      sheet.getRange(r, 1, bandEnd - r + 1, nCols)
        .setBackground('#E8F0FE')
        .setFontWeight('normal');
      sheet.getRange(r, 1, 1, nCols)
        .setFontWeight('bold')
        .setFontSize(13);
      r += 2;
      continue;
    }

    // Section title (only col A populated)
    if (nonEmpty === 0 && firstCellVal !== '' && firstCellVal != null) {
      sheet.getRange(r, 1, 1, nCols)
        .setFontSize(14)
        .setFontWeight('bold')
        .setFontColor('#202124')
        .setBackground(null);
      continue;
    }

    // Header row: contains 'Celda' as first cell
    if (firstCellVal === 'Celda') {
      sheet.getRange(r, 1, 1, nCols)
        .setBackground('#F1F3F4')
        .setFontWeight('bold')
        .setFontColor('#202124');
      sheet.setRowHeight(r, 28);
      continue;
    }

    // Data rows: zebra
    var isOdd = (r % 2) === 1;
    sheet.getRange(r, 1, 1, nCols)
      .setBackground(isOdd ? '#FFFFFF' : '#FAFAFA');

    // Format columns with numbers: detect numeric cells
    for (var c = 0; c < nCols; c++) {
      var v = rowVals[c];
      if (typeof v === 'number') {
        sheet.getRange(r, c + 1).setNumberFormat('#,##0.00');
        // Grey out zero values
        if (v === 0) sheet.getRange(r, c + 1).setFontColor('#9aa0a6');
      }
      // Binding chip green
      if (typeof v === 'string' && v.indexOf('● Vinculante') === 0) {
        sheet.getRange(r, c + 1).setFontColor('#137333').setFontWeight('bold');
      }
      if (typeof v === 'string' && v.indexOf('○ No vinculante') === 0) {
        sheet.getRange(r, c + 1).setFontColor('#9aa0a6');
      }
    }
  }

  // Auto-resize
  for (var c = 1; c <= nCols; c++) sheet.autoResizeColumn(c);

  // Freeze rows up to (and including) first 'Celda' header in objective section (row ~7)
  sheet.setFrozenRows(2);

  // Subtle border between rows (horizontal only)
  sheet.getRange(3, 1, nRows - 2, nCols)
    .setBorder(null, null, null, null, null, true, '#DADCE0', SpreadsheetApp.BorderStyle.SOLID);
}
```

- [ ] **Step 2: Build**

```bash
pnpm run build
```
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/server/ReportWriter.gs
git commit -m "feat: dashboard-style formatting for report sheets"
```

---

## Phase 6 — Errors module

### Task 6.1: Error catalog and i18n keys

**Files:**
- Create: `src/client/errors/error-messages.ts`
- Modify: `src/client/i18n/es.json` (add solve-related keys)
- Create: `tests/unit/error-messages.test.ts`

- [ ] **Step 1: Write failing test**

Create `tests/unit/error-messages.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { errorMessage, ErrorCode } from '../../src/client/errors/error-messages';

describe('error-messages', () => {
  it('returns the right key for each error code', () => {
    const codes: ErrorCode[] = [
      'objective_empty', 'variables_empty', 'a1_invalid',
      'eval_not_number', 'var_has_formula', 'linearity_warning',
      'integrality_outside_vars', 'solver_infeasible', 'solver_unbounded',
      'solver_time_limit_feasible', 'solver_time_limit_no_feasible',
      'solver_error', 'rpc_failed', 'wasm_load_failed', 'quota_exceeded',
    ];
    for (const code of codes) {
      const msg = errorMessage(code, {});
      expect(msg.length).toBeGreaterThan(5);
    }
  });

  it('interpolates parameters', () => {
    const msg = errorMessage('eval_not_number', { cell: 'D12', value: '#REF!' });
    expect(msg).toContain('D12');
    expect(msg).toContain('#REF!');
  });
});
```

- [ ] **Step 2: Run, verify fail**

```bash
pnpm test -- error-messages
```
Expected: module not found.

- [ ] **Step 3: Implement `src/client/errors/error-messages.ts`**

```ts
import { t } from '../i18n/i18n';

export type ErrorCode =
  | 'objective_empty'
  | 'variables_empty'
  | 'a1_invalid'
  | 'eval_not_number'
  | 'var_has_formula'
  | 'linearity_warning'
  | 'integrality_outside_vars'
  | 'solver_infeasible'
  | 'solver_unbounded'
  | 'solver_time_limit_feasible'
  | 'solver_time_limit_no_feasible'
  | 'solver_error'
  | 'rpc_failed'
  | 'wasm_load_failed'
  | 'quota_exceeded';

export interface ErrorParams {
  cell?: string;
  value?: string;
  cells?: string[];
  reason?: string;
  gap?: number;
}

const TEMPLATES: Record<ErrorCode, string> = {
  objective_empty: 'err.objective_empty',
  variables_empty: 'err.variables_empty',
  a1_invalid: 'err.a1_invalid',
  eval_not_number: 'err.eval_not_number',
  var_has_formula: 'err.var_has_formula',
  linearity_warning: 'err.linearity_warning',
  integrality_outside_vars: 'err.integrality_outside_vars',
  solver_infeasible: 'err.solver_infeasible',
  solver_unbounded: 'err.solver_unbounded',
  solver_time_limit_feasible: 'err.solver_time_limit_feasible',
  solver_time_limit_no_feasible: 'err.solver_time_limit_no_feasible',
  solver_error: 'err.solver_error',
  rpc_failed: 'err.rpc_failed',
  wasm_load_failed: 'err.wasm_load_failed',
  quota_exceeded: 'err.quota_exceeded',
};

export function errorMessage(code: ErrorCode, params: ErrorParams): string {
  const template = t(TEMPLATES[code]);
  return interpolate(template, params);
}

function interpolate(template: string, params: ErrorParams): string {
  return template
    .replace('{cell}', params.cell ?? '')
    .replace('{value}', params.value ?? '')
    .replace('{cells}', (params.cells ?? []).join(', '))
    .replace('{reason}', params.reason ?? '')
    .replace('{gap}', params.gap != null ? `${(params.gap * 100).toFixed(2)}%` : '');
}
```

- [ ] **Step 4: Add keys to `src/client/i18n/es.json`**

Append (before the closing `}`):

```json
,
"err.objective_empty": "Definí la celda objetivo antes de resolver.",
"err.variables_empty": "Definí al menos una celda de variable.",
"err.a1_invalid": "Referencia inválida.",
"err.eval_not_number": "La celda {cell} no devuelve un número (valor: {value}). Revisá la fórmula.",
"err.var_has_formula": "Las celdas de variables no pueden contener fórmulas. Encontradas: {cells}.",
"err.linearity_warning": "El modelo no parece lineal en la celda {cell}. Los resultados podrían ser incorrectos.",
"err.integrality_outside_vars": "La restricción {reason} apunta a una celda fuera del rango de variables.",
"err.solver_infeasible": "El modelo no tiene solución factible. Revisá restricciones contradictorias.",
"err.solver_unbounded": "La función objetivo es no acotada. Probablemente falta una cota superior en alguna variable.",
"err.solver_time_limit_feasible": "Solución encontrada pero no óptima (se agotó el tiempo). Gap actual: {gap}.",
"err.solver_time_limit_no_feasible": "Se agotó el tiempo sin encontrar una solución factible. Probá aumentar el tiempo máximo en Opciones.",
"err.solver_error": "Error interno del solver. Copiá el diagnóstico técnico desde el botón al pie.",
"err.rpc_failed": "Error de comunicación con la hoja. Reintentando…",
"err.wasm_load_failed": "El navegador no pudo cargar el motor de cálculo. Probá refrescar o usar Chrome/Firefox actualizado.",
"err.quota_exceeded": "Google limitó las operaciones del add-on. Esperá unos minutos."
```

- [ ] **Step 5: Run tests**

```bash
pnpm test -- error-messages
```
Expected: 2/2 pass.

- [ ] **Step 6: Commit**

```bash
git add src/client/errors/error-messages.ts src/client/i18n/es.json tests/unit/error-messages.test.ts
git commit -m "feat: error catalog with i18n keys for solve flow"
```

---

## Phase 7 — Results modal

### Task 7.1: Results modal component

**Files:**
- Create: `src/client/ui/results-modal.ts`

- [ ] **Step 1: Create `src/client/ui/results-modal.ts`**

```ts
import type { SolveResult, LinearForm } from '../../shared/linear-form';
import { t } from '../i18n/i18n';
import { errorMessage } from '../errors/error-messages';

export interface ResultsModalChoice {
  keepSolution: boolean;
  writeAnswer: boolean;
  writeSensitivity: boolean;
}

interface OpenOpts {
  lf: LinearForm;
  sr: SolveResult;
  onAccept: (choice: ResultsModalChoice) => void | Promise<void>;
  onCancel?: () => void;
}

export function openResultsModal(parent: HTMLElement, opts: OpenOpts): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay results-overlay';
  const banner = bannerHtml(opts.sr);
  const objective = objectiveHtml(opts.sr, opts.lf);
  const summary = summaryHtml(opts.sr, opts.lf);
  const choices = choicesHtml(opts.sr);

  overlay.innerHTML = `
    <div class="modal modal-results" role="dialog" aria-label="Resultados del Solver">
      ${banner}
      ${objective}
      ${summary}
      ${choices}
      <div class="actions">
        <button type="button" data-action="cancel">${t('btn.cancel')}</button>
        <button type="button" data-action="accept" class="primary">Aceptar</button>
      </div>
    </div>
  `;
  parent.appendChild(overlay);

  overlay.addEventListener('click', async (e) => {
    const action = (e.target as HTMLElement).dataset.action;
    if (action === 'cancel') {
      overlay.remove();
      opts.onCancel?.();
    } else if (action === 'accept') {
      const keep = (overlay.querySelector<HTMLInputElement>('input[name="keep"]:checked'))?.value === 'keep';
      const writeAnswer = (overlay.querySelector<HTMLInputElement>('#chk-answer'))?.checked ?? true;
      const writeSensitivity = (overlay.querySelector<HTMLInputElement>('#chk-sensitivity'))?.checked ?? false;
      overlay.remove();
      await opts.onAccept({ keepSolution: keep, writeAnswer, writeSensitivity });
    }
  });
}

function bannerHtml(sr: SolveResult): string {
  const cls = sr.status === 'optimal' ? 'banner-ok'
            : sr.status === 'infeasible' || sr.status === 'unbounded' || sr.status === 'error' ? 'banner-err'
            : 'banner-warn';
  const title = sr.status === 'optimal' ? 'AltSolver encontró una solución'
              : sr.status === 'infeasible' ? errorMessage('solver_infeasible', {})
              : sr.status === 'unbounded' ? errorMessage('solver_unbounded', {})
              : sr.status === 'time_limit' ? errorMessage('solver_time_limit_feasible', { gap: sr.mipGap ?? 0 })
              : sr.status === 'error' ? errorMessage('solver_error', {})
              : 'Resultado del Solver';
  return `<div class="banner ${cls}"><span class="dot"></span><strong>${escapeHtml(title)}</strong></div>`;
}

function objectiveHtml(sr: SolveResult, lf: LinearForm): string {
  if (sr.status !== 'optimal' && sr.status !== 'time_limit') return '';
  const value = sr.objective.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const orig = lf.objective.originalValue;
  const delta = sr.objective - orig;
  const deltaStr = delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2);
  return `
    <div class="section">
      <div class="muted small">Valor objetivo</div>
      <div class="big-number">${escapeHtml(value)} <span class="delta">${escapeHtml(deltaStr)}</span></div>
      <div class="muted small">${escapeHtml(lf.objective.name)}</div>
    </div>
  `;
}

function summaryHtml(sr: SolveResult, lf: LinearForm): string {
  const integers = lf.vars.filter((v) => v.integral).length;
  const continuous = lf.vars.length - integers;
  const binding = sr.rows.filter((r) => r.status === 'upper' || r.status === 'lower').length;
  return `
    <div class="section">
      <div class="muted small">Resumen</div>
      <table class="kv">
        <tr><td>Estado</td><td>${escapeHtml(statusLabel(sr.status))}</td></tr>
        <tr><td>Motor</td><td>${escapeHtml(sr.isMip ? 'Simplex + B&B (HiGHS)' : 'Simplex LP (HiGHS)')}</td></tr>
        <tr><td>Tiempo</td><td>${(sr.time * 1000).toFixed(0)} ms</td></tr>
        <tr><td>Variables</td><td>${continuous} continuas, ${integers} enteras</td></tr>
        <tr><td>Restricciones</td><td>${lf.rows.length} (${binding} vinculantes)</td></tr>
      </table>
    </div>
  `;
}

function choicesHtml(sr: SolveResult): string {
  const isFeasible = sr.status === 'optimal' || sr.status === 'time_limit';
  if (!isFeasible) return '';
  const sensitivityDisabled = sr.isMip ? 'disabled' : '';
  const sensitivityNote = sr.isMip ? '<div class="muted small">No disponible para problemas enteros (igual que Excel).</div>' : '';
  return `
    <div class="section">
      <div class="muted small">Solución</div>
      <label><input type="radio" name="keep" value="keep" checked /> Conservar la solución en la hoja</label><br/>
      <label><input type="radio" name="keep" value="restore" /> Restaurar los valores originales</label>
    </div>
    <div class="section">
      <div class="muted small">Informes a generar</div>
      <label><input id="chk-answer" type="checkbox" checked /> Respuesta</label><br/>
      <label><input id="chk-sensitivity" type="checkbox" ${sr.isMip ? '' : 'checked'} ${sensitivityDisabled} /> Sensibilidad</label>
      ${sensitivityNote}
    </div>
  `;
}

function statusLabel(s: SolveResult['status']): string {
  if (s === 'optimal') return 'Óptimo';
  if (s === 'infeasible') return 'Infactible';
  if (s === 'unbounded') return 'No acotado';
  if (s === 'time_limit') return 'No óptimo (tiempo)';
  if (s === 'iter_limit') return 'No óptimo (iteraciones)';
  return 'Error';
}

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

- [ ] **Step 2: Build**

```bash
pnpm run build
```
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/client/ui/results-modal.ts
git commit -m "feat: results modal with banner, summary, and report choices"
```

---

## Phase 8 — Wire everything together

### Task 8.1: Add new RPC bridges

**Files:**
- Modify: `src/client/rpc/server-bridge.ts` (append)

- [ ] **Step 1: Append to `src/client/rpc/server-bridge.ts`**

```ts
export function validateModel(modelDoc: unknown): Promise<{ ok: boolean; errors?: string[] }> {
  return call<{ ok: boolean; errors?: string[] }>('validateModel', modelDoc);
}

export interface ExtractResponse {
  ok: boolean;
  linearForm?: unknown;   // typed elsewhere via shared/linear-form.ts
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
```

- [ ] **Step 2: Build**

```bash
pnpm run build
```
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/client/rpc/server-bridge.ts
git commit -m "feat: RPC bridges for validate, extract, write, restore"
```

---

### Task 8.2: Wire the Solve action into form.ts

**Files:**
- Modify: `src/client/ui/form.ts`

- [ ] **Step 1: Enable the Solve button in the form template**

In `src/client/ui/form.ts`, find the action button section and replace:

```ts
        <button type="button" data-action="solve" disabled title="${t('btn.solve.disabled')}">${t('btn.solve')}</button>
```

with:

```ts
        <button type="button" data-action="solve" class="primary">${t('btn.solve')}</button>
```

- [ ] **Step 2: Add the Solve handler**

In `src/client/ui/form.ts`, find the click handler block:

```ts
    } else if (action === 'save') {
      await opts.onSave();
      savedMessage.style.display = '';
      setTimeout(() => {
        savedMessage.style.display = 'none';
      }, 2000);
    }
```

Add immediately before the closing `});` of the click handler:

```ts
    } else if (action === 'solve') {
      await runSolveFlow(host, opts.draft);
    }
```

- [ ] **Step 3: Add the `runSolveFlow` function at the bottom of `form.ts`**

```ts
import { validateModel, extractLinearForm, writeResults, restoreSnapshot } from '../rpc/server-bridge';
import { runSolve } from '../solver/solve';
import { buildAnswerMatrix } from '../reports/answer';
import { buildSensitivityMatrix } from '../reports/sensitivity';
import { openResultsModal } from './results-modal';
import { errorMessage } from '../errors/error-messages';
import type { LinearForm } from '../../shared/linear-form';
import type { ModelDraft } from '../state/model-draft';

async function runSolveFlow(host: HTMLElement, draft: ModelDraft): Promise<void> {
  const modelDoc = draft.toDocument();

  // Show overlay
  const overlay = document.createElement('div');
  overlay.className = 'solving-overlay';
  overlay.innerHTML = `<div class="spinner"></div><div class="muted">Resolviendo…</div>`;
  host.appendChild(overlay);

  try {
    // 1. Validate
    const v = await validateModel(modelDoc);
    if (!v.ok) {
      throw new Error((v.errors ?? ['Error de validación']).join('\n'));
    }

    // 2. Extract linear form
    const ex = await extractLinearForm(modelDoc);
    if (!ex.ok || !ex.linearForm) {
      throw new Error((ex.errors ?? ['Error de extracción']).join('\n'));
    }
    const lf = ex.linearForm as LinearForm;

    // 3. Solve client-side
    const sr = await runSolve(lf, {
      timeLimitSec: modelDoc.options.timeLimitSec,
      mipRelGap: modelDoc.options.mipGap,
    });

    // 4. Build report matrices
    const ctx = {
      sheetName: '',
      timestamp: new Date().toLocaleString('es-AR'),
    };
    const answerMatrix = buildAnswerMatrix(lf, sr, ctx);
    const sensitivityMatrix = buildSensitivityMatrix(lf, sr, ctx);

    // 5. Remove overlay before opening results modal
    overlay.remove();

    // 6. Show results modal
    openResultsModal(host, {
      lf,
      sr,
      onAccept: async (choice) => {
        const reqOverlay = document.createElement('div');
        reqOverlay.className = 'solving-overlay';
        reqOverlay.innerHTML = `<div class="spinner"></div><div class="muted">Escribiendo reportes…</div>`;
        host.appendChild(reqOverlay);
        try {
          if (!choice.keepSolution) {
            await restoreSnapshot(modelDoc, ex.snapshot);
          }
          if (choice.keepSolution || choice.writeAnswer || choice.writeSensitivity) {
            await writeResults({
              modelDoc,
              solveResult: {
                variableValuesFlat: sr.variables.map((v) => v.primal),
                objectiveValue: sr.objective,
                isMip: sr.isMip,
              },
              answerMatrix: choice.writeAnswer ? answerMatrix : null,
              sensitivityMatrix: choice.writeSensitivity ? sensitivityMatrix : null,
              snapshot: ex.snapshot,
              keepSolution: choice.keepSolution,
              writeReports: { answer: choice.writeAnswer, sensitivity: choice.writeSensitivity },
            });
          }
        } finally {
          reqOverlay.remove();
        }
        google.script.host?.close?.();
      },
      onCancel: async () => {
        await restoreSnapshot(modelDoc, ex.snapshot);
      },
    });
  } catch (e) {
    overlay.remove();
    alert(`AltSolver — ${(e as Error).message}`);
  }
}
```

- [ ] **Step 4: Add overlay/spinner styles to `src/client/dialog.html.template`**

Add to the `<style>` block:

```css
.solving-overlay {
  position: fixed; inset: 0; background: rgba(255,255,255,0.85);
  display: flex; align-items: center; justify-content: center;
  flex-direction: column; gap: 12px; z-index: 1000;
}
.spinner {
  width: 40px; height: 40px;
  border: 3px solid #dadce0; border-top-color: #1a73e8;
  border-radius: 50%; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.muted { color: #5f6368; font-size: 14px; }
.banner { padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 8px; }
.banner .dot { width: 10px; height: 10px; border-radius: 50%; }
.banner-ok { background: #E6F4EA; color: #137333; }
.banner-ok .dot { background: #137333; }
.banner-warn { background: #FEF7E0; color: #B06000; }
.banner-warn .dot { background: #B06000; }
.banner-err { background: #FCE8E6; color: #C5221F; }
.banner-err .dot { background: #C5221F; }
.section { margin-bottom: 16px; }
.section .small { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.big-number { font-size: 32px; font-weight: 500; color: #202124; }
.big-number .delta { font-size: 14px; color: #5f6368; margin-left: 8px; }
.kv { width: 100%; border-collapse: collapse; }
.kv td { padding: 6px 4px; font-size: 13px; }
.kv td:first-child { color: #5f6368; width: 35%; }
```

- [ ] **Step 5: Build + verify lint + test**

```bash
pnpm run build && pnpm run typecheck && pnpm run lint && pnpm test
```
Expected: all green; build size grows substantially (WASM bundle).

- [ ] **Step 6: Commit**

```bash
git add src/client/ui/form.ts src/client/dialog.html.template
git commit -m "feat: wire solve flow — validate, extract, solve, report"
```

---

### Task 8.3: Deploy and smoke test on a real model

**Files:** none — this is a deployment + manual test.

- [ ] **Step 1: Push to Apps Script**

```bash
pnpm run push
```

- [ ] **Step 2: In a Google Sheet, build a tiny LP:**

Cells:
- `A1` = "x1", `B1` = 0 (variable)
- `A2` = "x2", `B2` = 0 (variable)
- `A4` = "z (min)", `B4` = `=3*B1 + 5*B2`
- `A5` = "c1", `B5` = `=2*B1 + B2`, `C5` = 10
- `A6` = "c2", `B6` = `=B1 + 3*B2`, `C6` = 12

- [ ] **Step 3: Open AltSolver, configure model:**
- Objective: `B4`, sense MIN
- Variables: `B1:B2`
- Constraints: `B5 <= C5`, `B6 >= C6`
- Save model, click `▶ Resolver`

- [ ] **Step 4: Expected outcome:**
- Overlay "Resolviendo…" appears for ~2-4 seconds
- Results modal opens showing Status: Óptimo, Valor objetivo ≈ 20.0
- Click Aceptar
- Variables update to optimal values
- New sheet "Respuesta 1" with formatted dashboard layout
- New sheet "Sensibilidad 1" with shadow prices and reduced costs

If anything is off, fix before committing the rest of the plan.

---

## Phase 9 — Golden test suite

### Task 9.1: Golden loader helper

**Files:**
- Create: `tests/golden/load-golden.ts`

- [ ] **Step 1: Create `tests/golden/load-golden.ts`**

```ts
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LinearForm, SolveResult } from '../../src/shared/linear-form';

export interface GoldenCase {
  name: string;
  linearForm: LinearForm;
  expected: {
    status: SolveResult['status'];
    objective: number;
    variableValues: number[];
    tolerance: number;
  };
}

const DIR = dirname(fileURLToPath(import.meta.url));

export function loadGolden(file: string): GoldenCase {
  const path = join(DIR, file);
  return JSON.parse(readFileSync(path, 'utf-8')) as GoldenCase;
}
```

- [ ] **Step 2: Commit**

```bash
git add tests/golden/load-golden.ts
git commit -m "chore: golden test loader helper"
```

---

### Task 9.2: First three golden cases (LP)

> **Note for the implementer:** every variable entry in these JSON files must include a `cellA1` field (per `LinearFormVariable` in Task 1.1). The stubs below sometimes omit it for brevity — add `"cellA1": "B<n>"` (or whatever single-cell A1 makes sense for the case) when finalizing each variable.

**Files:**
- Create: `tests/golden/01-dieta-lp.json`
- Create: `tests/golden/02-produccion-lp.json`
- Create: `tests/golden/03-mezcla-lp.json`
- Create: `tests/unit/golden-lp.test.ts`

- [ ] **Step 1: Create `tests/golden/01-dieta-lp.json` (classic diet problem, 4 nutrients, 6 foods, known optimum)**

```json
{
  "name": "Dieta (Hillier-Lieberman 3.4)",
  "linearForm": {
    "vars": [
      { "name": "x1", "lower": 0, "upper": null, "integral": false, "originalValue": 0 },
      { "name": "x2", "lower": 0, "upper": null, "integral": false, "originalValue": 0 },
      { "name": "x3", "lower": 0, "upper": null, "integral": false, "originalValue": 0 },
      { "name": "x4", "lower": 0, "upper": null, "integral": false, "originalValue": 0 }
    ],
    "objective": {
      "name": "Costo",
      "cellA1": "B10",
      "sense": "MIN",
      "coefs": [0.4, 0.2, 0.15, 0.1],
      "constant": 0,
      "originalValue": 0
    },
    "rows": [
      { "name": "Calorías", "lhsA1": "B11", "op": ">=", "coefs": [200, 90, 300, 110], "rhs": 2000, "constant": 0, "lhsOriginalValue": 0 },
      { "name": "Proteínas", "lhsA1": "B12", "op": ">=", "coefs": [50, 20, 15, 4], "rhs": 50, "constant": 0, "lhsOriginalValue": 0 },
      { "name": "Grasas", "lhsA1": "B13", "op": "<=", "coefs": [5, 1, 10, 2], "rhs": 65, "constant": 0, "lhsOriginalValue": 0 }
    ]
  },
  "expected": {
    "status": "optimal",
    "objective": 1.6,
    "variableValues": [0, 0, 6.0, 6.36],
    "tolerance": 1e-2
  }
}
```

(Adjusted: the textbook diet problem has known optimum ~1.6 cost units — but the precise values depend on the textbook. The engineer authoring the JSON should solve this manually with a verified solver and record the exact result. This stub is for the file structure; the engineer replaces with verified data.)

- [ ] **Step 2: Create `tests/golden/02-produccion-lp.json` (production mix, 3 products)**

```json
{
  "name": "Producción (Taha 3.1)",
  "linearForm": {
    "vars": [
      { "name": "x1", "lower": 0, "upper": null, "integral": false, "originalValue": 0 },
      { "name": "x2", "lower": 0, "upper": null, "integral": false, "originalValue": 0 }
    ],
    "objective": {
      "name": "Utilidad",
      "cellA1": "B5",
      "sense": "MAX",
      "coefs": [5, 4],
      "constant": 0,
      "originalValue": 0
    },
    "rows": [
      { "name": "M1", "lhsA1": "B6", "op": "<=", "coefs": [6, 4], "rhs": 24, "constant": 0, "lhsOriginalValue": 0 },
      { "name": "M2", "lhsA1": "B7", "op": "<=", "coefs": [1, 2], "rhs": 6, "constant": 0, "lhsOriginalValue": 0 }
    ]
  },
  "expected": {
    "status": "optimal",
    "objective": 21,
    "variableValues": [3, 1.5],
    "tolerance": 1e-3
  }
}
```

- [ ] **Step 3: Create `tests/golden/03-mezcla-lp.json`**

```json
{
  "name": "Mezcla (Winston 3.1)",
  "linearForm": {
    "vars": [
      { "name": "x1", "lower": 0, "upper": null, "integral": false, "originalValue": 0 },
      { "name": "x2", "lower": 0, "upper": null, "integral": false, "originalValue": 0 },
      { "name": "x3", "lower": 0, "upper": null, "integral": false, "originalValue": 0 }
    ],
    "objective": {
      "name": "Costo",
      "cellA1": "B5",
      "sense": "MIN",
      "coefs": [3, 5, 4],
      "constant": 0,
      "originalValue": 0
    },
    "rows": [
      { "name": "Demanda total", "lhsA1": "B6", "op": ">=", "coefs": [1, 1, 1], "rhs": 100, "constant": 0, "lhsOriginalValue": 0 },
      { "name": "Calidad", "lhsA1": "B7", "op": ">=", "coefs": [0.3, 0.5, 0.4], "rhs": 35, "constant": 0, "lhsOriginalValue": 0 }
    ]
  },
  "expected": {
    "status": "optimal",
    "objective": 350,
    "variableValues": [50, 50, 0],
    "tolerance": 1e-3
  }
}
```

(Note: the engineer should verify each expected value by independently solving with a known-good solver — e.g., online LP solver, Octave/Matlab — and recording the exact values. Stub values may be wrong; verify before committing.)

- [ ] **Step 4: Create `tests/unit/golden-lp.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { loadGolden } from '../golden/load-golden';
import { toLpFormat } from '../../src/client/solver/model-builder';
// We can't easily run HiGHS in pure node tests without async setup;
// instead, we verify LP-format string generation against snapshot.

describe('golden LP cases — LP file format', () => {
  ['01-dieta-lp.json', '02-produccion-lp.json', '03-mezcla-lp.json'].forEach((file) => {
    it(`generates a valid LP file for ${file}`, () => {
      const g = loadGolden(file);
      const lp = toLpFormat(g.linearForm);
      expect(lp).toMatch(/^(Minimize|Maximize)/);
      expect(lp).toMatch(/End$/m);
      expect(lp).toContain('Subject To');
    });
  });
});
```

- [ ] **Step 5: Run, verify pass**

```bash
pnpm test -- golden-lp
```
Expected: 3/3 pass.

- [ ] **Step 6: Commit**

```bash
git add tests/golden/*.json tests/unit/golden-lp.test.ts
git commit -m "test: golden cases (LP) — diet, production, blending"
```

---

### Task 9.3: MIP and edge cases

**Files:**
- Create: `tests/golden/04-asignacion-bin.json`
- Create: `tests/golden/05-mochila-int.json`
- Create: `tests/golden/06-infactible.json`
- Create: `tests/golden/07-no-acotado.json`

- [ ] **Step 1: Create `04-asignacion-bin.json` (3x3 assignment, all binaries)**

```json
{
  "name": "Asignación 3x3 (binary)",
  "linearForm": {
    "vars": [
      { "name": "y11", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "y12", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "y13", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "y21", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "y22", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "y23", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "y31", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "y32", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "y33", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 }
    ],
    "objective": {
      "name": "Costo asignación",
      "cellA1": "B12",
      "sense": "MIN",
      "coefs": [8, 6, 4, 5, 7, 9, 9, 8, 5],
      "constant": 0,
      "originalValue": 0
    },
    "rows": [
      { "name": "Persona 1", "lhsA1": "B13", "op": "=", "coefs": [1,1,1,0,0,0,0,0,0], "rhs": 1, "constant": 0, "lhsOriginalValue": 0 },
      { "name": "Persona 2", "lhsA1": "B14", "op": "=", "coefs": [0,0,0,1,1,1,0,0,0], "rhs": 1, "constant": 0, "lhsOriginalValue": 0 },
      { "name": "Persona 3", "lhsA1": "B15", "op": "=", "coefs": [0,0,0,0,0,0,1,1,1], "rhs": 1, "constant": 0, "lhsOriginalValue": 0 },
      { "name": "Tarea 1", "lhsA1": "B16", "op": "=", "coefs": [1,0,0,1,0,0,1,0,0], "rhs": 1, "constant": 0, "lhsOriginalValue": 0 },
      { "name": "Tarea 2", "lhsA1": "B17", "op": "=", "coefs": [0,1,0,0,1,0,0,1,0], "rhs": 1, "constant": 0, "lhsOriginalValue": 0 },
      { "name": "Tarea 3", "lhsA1": "B18", "op": "=", "coefs": [0,0,1,0,0,1,0,0,1], "rhs": 1, "constant": 0, "lhsOriginalValue": 0 }
    ]
  },
  "expected": {
    "status": "optimal",
    "objective": 16,
    "variableValues": [0,0,1,1,0,0,0,1,0],
    "tolerance": 1e-6
  }
}
```

- [ ] **Step 2: Create `05-mochila-int.json` (0-1 knapsack, 5 items)**

```json
{
  "name": "Mochila 0-1",
  "linearForm": {
    "vars": [
      { "name": "x1", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "x2", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "x3", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "x4", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 },
      { "name": "x5", "lower": 0, "upper": 1, "integral": true, "originalValue": 0 }
    ],
    "objective": {
      "name": "Valor",
      "cellA1": "B7",
      "sense": "MAX",
      "coefs": [10, 13, 18, 31, 7],
      "constant": 0,
      "originalValue": 0
    },
    "rows": [
      { "name": "Capacidad", "lhsA1": "B8", "op": "<=", "coefs": [11, 15, 20, 35, 10], "rhs": 47, "constant": 0, "lhsOriginalValue": 0 }
    ]
  },
  "expected": {
    "status": "optimal",
    "objective": 41,
    "variableValues": [1, 0, 0, 1, 0],
    "tolerance": 1e-6
  }
}
```

- [ ] **Step 3: Create `06-infactible.json`**

```json
{
  "name": "Restricciones contradictorias",
  "linearForm": {
    "vars": [
      { "name": "x", "lower": 0, "upper": null, "integral": false, "originalValue": 0 }
    ],
    "objective": { "name": "z", "cellA1": "B1", "sense": "MIN", "coefs": [1], "constant": 0, "originalValue": 0 },
    "rows": [
      { "name": "c1", "lhsA1": "B2", "op": ">=", "coefs": [1], "rhs": 10, "constant": 0, "lhsOriginalValue": 0 },
      { "name": "c2", "lhsA1": "B3", "op": "<=", "coefs": [1], "rhs": 5,  "constant": 0, "lhsOriginalValue": 0 }
    ]
  },
  "expected": {
    "status": "infeasible",
    "objective": 0,
    "variableValues": [0],
    "tolerance": 0
  }
}
```

- [ ] **Step 4: Create `07-no-acotado.json`**

```json
{
  "name": "Objetivo no acotado",
  "linearForm": {
    "vars": [
      { "name": "x", "lower": -1e30, "upper": 1e30, "integral": false, "originalValue": 0 }
    ],
    "objective": { "name": "z", "cellA1": "B1", "sense": "MAX", "coefs": [1], "constant": 0, "originalValue": 0 },
    "rows": []
  },
  "expected": {
    "status": "unbounded",
    "objective": 0,
    "variableValues": [0],
    "tolerance": 0
  }
}
```

- [ ] **Step 5: Add tests file `tests/unit/golden-mip.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { loadGolden } from '../golden/load-golden';
import { toLpFormat } from '../../src/client/solver/model-builder';

describe('golden MIP and edge cases — LP format generation', () => {
  ['04-asignacion-bin.json', '05-mochila-int.json', '06-infactible.json', '07-no-acotado.json'].forEach((f) => {
    it(`generates valid LP for ${f}`, () => {
      const g = loadGolden(f);
      const lp = toLpFormat(g.linearForm);
      expect(lp).toMatch(/End$/m);
    });
  });

  it('04 contains Binary section', () => {
    const g = loadGolden('04-asignacion-bin.json');
    const lp = toLpFormat(g.linearForm);
    expect(lp).toContain('Binary');
  });
});
```

- [ ] **Step 6: Run, verify pass**

```bash
pnpm test -- golden-mip
```
Expected: 5/5 pass.

- [ ] **Step 7: Commit**

```bash
git add tests/golden/*.json tests/unit/golden-mip.test.ts
git commit -m "test: golden MIP + edge cases (assign, knapsack, infeasible, unbounded)"
```

---

## Phase 10 — Final verification

### Task 10.1: Verification checklist

- [ ] **Step 1: Full check**

```bash
pnpm run typecheck && pnpm run lint && pnpm test && pnpm run build
```
Expected: all green.

- [ ] **Step 2: Deploy**

```bash
pnpm run push
```

- [ ] **Step 3: Manual smoke tests (3 problems)**

In a Google Sheet, build and solve each:

a. **LP — Production mix** (Task 9.2 case 02):
   - 2 vars, 2 constraints, max profit
   - Expected: z=21, x1=3, x2=1.5
   - Verify: Respuesta 1 and Sensibilidad 1 sheets are created with dashboard formatting

b. **MIP — Knapsack** (Task 9.3 case 05):
   - 5 binary vars, 1 capacity constraint
   - Expected: z=41, items 1 and 4 selected
   - Verify: only Respuesta 1 is created (Sensibilidad is disabled for MIP)

c. **Infeasible** (Task 9.3 case 06):
   - x ≥ 10 and x ≤ 5
   - Expected: red banner "El modelo no tiene solución factible"
   - Verify: no report sheets created, variables remain at original values

- [ ] **Step 4: If all 3 pass — commit the verification record**

Create `docs/superpowers/notes/2026-05-18-mvp-0.1-verification.md`:

```markdown
# MVP 0.1 manual verification

Date: 2026-05-18

- ✅ Production-mix LP: z=21, reports formatted correctly
- ✅ Knapsack MIP: z=41, only Respuesta sheet (Sensibilidad disabled)
- ✅ Infeasible: banner rojo, no reports

Ready to tag v0.1.0.
```

```bash
git add docs/superpowers/notes/2026-05-18-mvp-0.1-verification.md
git commit -m "docs: MVP 0.1 manual verification record"
```

---

### Task 10.2: Tag and push

- [ ] **Step 1: Tag**

```bash
git tag -a v0.1.0 -m "MVP 0.1: working LP/MIP solver + Answer/Sensitivity reports

Adds:
- HiGHS-WASM client-side solver
- Numerical perturbation coefficient extraction (Excel-style)
- Answer Report (LP & MIP) with dashboard formatting
- Sensitivity Report (LP only) with reduced costs and shadow prices
- Results modal with banner, summary, conserve/restore choice
- Tab-colored report sheets, zebra striping, binding chips, ∞ notation
- Error catalog with i18n for all solve flow errors
- 7 golden test cases (3 LP + 2 MIP + 2 edge cases)"
```

- [ ] **Step 2: Push branch and tag**

```bash
git push origin feat/mvp-0.1-solver
git push origin v0.1.0
```

- [ ] **Step 3: Merge to main via PR (or local merge if preferred)**

```bash
gh pr create --title "MVP 0.1 — solver + reports" --body "$(cat <<'EOF'
## Summary
- HiGHS-WASM client-side LP/MIP solver
- Answer and Sensitivity reports with dashboard look
- Results modal post-solve
- Error catalog for all solve states

Closes MVP 0.1 from the roadmap. Solver button is now enabled.

## Test plan
- [x] Unit tests passing (full suite)
- [x] 7 golden cases generate valid LP format
- [x] Manual smoke: production-mix LP, knapsack MIP, infeasible

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Out-of-scope for this plan (deferred)

The following spec items are deferred to later milestones:

- **Limits Report** → MVP 0.3.
- **i18n EN** (English locale + Marketplace listing strings) → MVP 0.4.
- **Cancel during solve** (requires Worker thread) → MVP 0.4.
- **TARGET sense** with auxiliary variables — listed in spec Section 2 but not implemented here. If user picks "Valor de:" in 0.1, the dialog rejects with a friendly message: "Soportado en MVP 0.2." (Add this check in form.ts:runSolveFlow before validateModel.)
- **Visual polish of the main dialog** (header bar, section dividers, card constraints, summary inline) — the spec Section 10 describes this, but full implementation is deferred to a follow-up plan to keep this one focused on the solver core. The results modal polish IS included.
- **Heuristic "possible causes" for infeasibility** → MVP 0.2.
- **"Continuar +60s" CTA in time-limit banner** → MVP 0.2.
- **Visual screenshot golden tests** → manual verification only for 0.1.
- **Sensitivity ranging (allowable increase/decrease)** — the basic highs-js wrapper used here does not expose `Highs_getRanging`. The Sensitivity Report shows `∞` for these columns as a placeholder. This is functional (reduced costs and shadow prices ARE real) but doesn't provide full Excel paridad for the ranging columns. Fixing this requires either (a) upgrading to a richer HiGHS binding that exposes the ranging API, or (b) computing ranges manually via secondary LP resolves. Both are deferred to a follow-up plan in MVP 0.2.

This plan delivers a working solver with results modal + formatted reports. Main-dialog refresh and remaining polish ship as a separate, smaller plan (`mvp-0.1-polish` or `mvp-0.2-prep`).

---

## Self-review checklist

Run mentally after writing each new file:

- ✅ Tests exist and are run BEFORE implementation (TDD)?
- ✅ Each `.ts` file has a single clear responsibility?
- ✅ `pnpm run lint` and `pnpm run typecheck` both pass after each task?
- ✅ Each commit message follows conventional commits (feat/fix/chore/test/docs)?
- ✅ No `TBD`, `TODO`, or "implement later" markers in code?
- ✅ All function signatures and types referenced across tasks are consistent?
