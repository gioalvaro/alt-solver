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
