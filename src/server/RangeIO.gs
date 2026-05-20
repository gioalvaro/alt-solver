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
  var originals = varRange.getValues();

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
  function ei(oneAt) {
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
  var coefsByEval = new Array(evalA1s.length);
  for (var e = 0; e < evalA1s.length; e++) coefsByEval[e] = new Array(n);

  for (var i = 0; i < n; i++) {
    varRange.setValues(reshape(ei(i)));
    SpreadsheetApp.flush();
    var bi = readEvals();
    for (var e2 = 0; e2 < evalA1s.length; e2++) {
      coefsByEval[e2][i] = bi[e2] - b0[e2];
    }
  }

  // 5. Linearity sanity at vars = 0.5
  var warnings = [];
  varRange.setValues(reshape(fillFlat(0.5)));
  SpreadsheetApp.flush();
  var bMid = readEvals();
  for (var e3 = 0; e3 < evalA1s.length; e3++) {
    var sumCoefs = 0;
    for (var i2 = 0; i2 < n; i2++) sumCoefs += coefsByEval[e3][i2];
    var predicted = b0[e3] + 0.5 * sumCoefs;
    if (Math.abs(bMid[e3] - predicted) > 1e-6) {
      warnings.push('La celda ' + evalA1s[e3] + ' no parece lineal en las variables. Los resultados podrían ser incorrectos.');
    }
  }

  // 6. Resolve RHS values (literal vs cell ref)
  function resolveRhs(raw) {
    var parsed = parseFloat(raw);
    if (!isNaN(parsed) && isFinite(raw)) return parsed;
    return ss.getRange(raw).getValue();
  }

  // 7. Infer variable names: prefer a non-numeric sibling label.
  // Numeric siblings are almost always coefficient values, not names, so we
  // reject them in favor of the x_i fallback.
  var varNames = [];
  for (var i3 = 0; i3 < n; i3++) {
    var ri = isColumn ? i3 : 0;
    var ci = isColumn ? 0 : i3;
    var thisCell = varRange.getCell(ri + 1, ci + 1);
    var inferred = null;
    try {
      var sibling = isColumn ? thisCell.offset(0, -1).getValue() : thisCell.offset(-1, 0).getValue();
      if (sibling !== '' && sibling != null && typeof sibling !== 'number') {
        inferred = String(sibling).trim();
        if (inferred === '') inferred = null;
      }
    } catch (er) { /* edge of sheet */ }
    varNames.push(inferred || ('x' + (i3 + 1)));
  }

  // 8. Determine integrality from constraints
  var integralByIdx = new Array(n);
  var binByIdx = new Array(n);
  for (var i4 = 0; i4 < n; i4++) { integralByIdx[i4] = false; binByIdx[i4] = false; }
  for (var k2 = 0; k2 < modelDoc.constraints.length; k2++) {
    var con2 = modelDoc.constraints[k2];
    if (con2.op !== 'int' && con2.op !== 'bin') continue;
    var conRange = ss.getRange(con2.lhsA1);
    var conRows = conRange.getNumRows();
    var conCols = conRange.getNumColumns();
    for (var rr2 = 0; rr2 < conRows; rr2++) {
      for (var cc2 = 0; cc2 < conCols; cc2++) {
        var conCellA1 = conRange.getCell(rr2 + 1, cc2 + 1).getA1Notation();
        for (var i5 = 0; i5 < n; i5++) {
          var ri2 = isColumn ? i5 : 0;
          var ci2 = isColumn ? 0 : i5;
          if (varRange.getCell(ri2 + 1, ci2 + 1).getA1Notation() === conCellA1) {
            integralByIdx[i5] = true;
            if (con2.op === 'bin') binByIdx[i5] = true;
          }
        }
      }
    }
  }

  function inferConstraintName(lhsA1) {
    // Prefer a non-numeric sibling label; reject numeric values which are
    // almost always coefficients on the same row, not constraint names.
    try {
      var lhs = ss.getRange(lhsA1);
      var leftVal = lhs.offset(0, -1).getValue();
      if (leftVal !== '' && leftVal != null && typeof leftVal !== 'number') {
        var s = String(leftVal).trim();
        if (s !== '') return s;
      }
    } catch (er) { /* edge */ }
    return lhsA1;
  }

  // Apps Script's google.script.run JSON-serializes Infinity/NaN as null.
  // Use 1e30 as a finite sentinel; the client treats |x| >= 1e30 as infinity.
  var INF = 1e30;
  var origFlat = flat(originals);
  var vars = [];
  for (var i6 = 0; i6 < n; i6++) {
    var lb = modelDoc.options.assumeNonNegative ? 0 : -INF;
    var ub = INF;
    if (binByIdx[i6]) { lb = 0; ub = 1; }
    var rI = isColumn ? i6 : 0;
    var cI = isColumn ? 0 : i6;
    var cellA1Notation = varRange.getCell(rI + 1, cI + 1).getA1Notation();
    vars.push({
      name: varNames[i6],
      cellA1: cellA1Notation,
      lower: lb,
      upper: ub,
      integral: integralByIdx[i6],
      originalValue: typeof origFlat[i6] === 'number' ? origFlat[i6] : 0,
    });
  }

  var objCoefs = coefsByEval[0];
  var rows = [];
  for (var r2 = 0; r2 < rowMeta.length; r2++) {
    var meta = rowMeta[r2];
    rows.push({
      name: inferConstraintName(modelDoc.constraints[meta.idx].lhsA1),
      lhsA1: modelDoc.constraints[meta.idx].lhsA1,
      op: meta.op,
      coefs: coefsByEval[r2 + 1],
      rhs: resolveRhs(meta.rhsA1OrValue),
      constant: b0[r2 + 1],
      lhsOriginalValue: 0,
    });
  }

  // 9. Restore originals + read original LHS values
  varRange.setValues(originals);
  SpreadsheetApp.flush();
  var origEvals = readEvals();
  var origObjValue = origEvals[0];
  for (var r3 = 0; r3 < rows.length; r3++) {
    rows[r3].lhsOriginalValue = origEvals[r3 + 1];
  }

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

/**
 * Returns a stable string fingerprint of every cell that affects the LP
 * extraction: variable values+formulas, objective value+formula, each
 * constraint's LHS value+formula, RHS value (if it is a cell ref), plus
 * the model document JSON itself.
 *
 * If two consecutive runSolveFlow calls return the same fingerprint, we
 * can skip extraction and solve and reuse the prior LinearForm and
 * SolveResult. Coefficient changes, formula edits, RHS changes,
 * structural model changes — anything that would alter the resulting LP
 * — produce a different fingerprint.
 */
function computeModelFingerprint(modelDoc) {
  var ss = SpreadsheetApp.getActive();
  var parts = ['model=' + JSON.stringify(modelDoc)];

  function safeJson(fn) {
    try { return JSON.stringify(fn()); }
    catch (e) { return 'err:' + (e && e.message ? e.message : String(e)); }
  }

  parts.push('vars=' + safeJson(function () { return ss.getRange(modelDoc.variables.rangeA1).getValues(); }));
  parts.push('varsF=' + safeJson(function () { return ss.getRange(modelDoc.variables.rangeA1).getFormulas(); }));

  parts.push('obj=' + safeJson(function () { return ss.getRange(modelDoc.objective.cellA1).getValue(); }));
  parts.push('objF=' + safeJson(function () { return ss.getRange(modelDoc.objective.cellA1).getFormula(); }));

  for (var i = 0; i < modelDoc.constraints.length; i++) {
    var c = modelDoc.constraints[i];
    parts.push('c' + i + '=' + c.op + ':' + c.lhsA1);
    parts.push('c' + i + 'V=' + safeJson(function () {
      var capturedCon = c;
      return ss.getRange(capturedCon.lhsA1).getValues();
    }));
    parts.push('c' + i + 'F=' + safeJson(function () {
      var capturedCon = c;
      return ss.getRange(capturedCon.lhsA1).getFormulas();
    }));
    if (c.op !== 'int' && c.op !== 'bin') {
      var rhsRaw = c.rhsA1OrValue;
      var isLiteral = !isNaN(parseFloat(rhsRaw)) && isFinite(rhsRaw);
      if (isLiteral) {
        parts.push('c' + i + 'R=lit:' + rhsRaw);
      } else {
        parts.push('c' + i + 'R=' + safeJson(function () {
          return ss.getRange(rhsRaw).getValue();
        }));
      }
    }
  }

  return hashString_(parts.join('|'));
}

/**
 * Combines validateModel + computeModelFingerprint into a single RPC to
 * save one client↔server round-trip per Resolver click.
 */
function preflight(modelDoc) {
  var v = validateModel(modelDoc);
  var fp = null;
  try {
    fp = computeModelFingerprint(modelDoc);
  } catch (e) { /* fingerprint failure is non-fatal */ }
  return { validation: v, fingerprint: fp };
}

/**
 * FNV-1a-ish 32-bit hash, returned as hex. Cheap and collision-resistant
 * enough for our cache-key use case.
 */
function hashString_(s) {
  var h = 0x811c9dc5;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}
