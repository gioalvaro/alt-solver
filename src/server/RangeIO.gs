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
