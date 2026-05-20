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
