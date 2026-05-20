/**
 * Highlights cells of the active model on the sheet by setting their
 * background color. The previous highlight's snapshot must be supplied
 * so the prior cells can be restored before the new ones are painted.
 *
 * Items: [{ rangeA1: string, color: string|null }]
 *   - color === null clears (used for explicit clear()).
 *   - rangeA1 may be a single cell, a range, or a literal number (which
 *     is silently skipped; that lets the caller send constraint RHS
 *     entries blindly even when the RHS is a literal value).
 *
 * Returns the snapshot needed to reverse this paint:
 *   { entries: [{ rangeA1, backgrounds: string[][] }] }
 *
 * One RPC per focus change. The client debounces to ~200ms.
 */
function applyHighlights(prevSnapshot, items) {
  var ss = SpreadsheetApp.getActive();

  if (prevSnapshot && prevSnapshot.entries) {
    restoreHighlightSnapshot_(ss, prevSnapshot);
  }

  var entries = [];
  if (items && items.length) {
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (!it || !it.rangeA1) continue;
      if (isLiteralNumber_(it.rangeA1)) continue;
      var range;
      try {
        range = ss.getRange(it.rangeA1);
      } catch (e) {
        continue;
      }
      var backgrounds = range.getBackgrounds();
      entries.push({ rangeA1: it.rangeA1, backgrounds: backgrounds });
      if (it.color) {
        var nRows = backgrounds.length;
        var nCols = backgrounds[0] ? backgrounds[0].length : 0;
        var fill = new Array(nRows);
        for (var r = 0; r < nRows; r++) {
          var row = new Array(nCols);
          for (var c = 0; c < nCols; c++) row[c] = it.color;
          fill[r] = row;
        }
        range.setBackgrounds(fill);
      }
    }
    SpreadsheetApp.flush();
  }

  return { entries: entries };
}

/**
 * Restores a snapshot returned by applyHighlights and returns nothing.
 * Use when the sidebar closes or the user clicks Solve.
 */
function clearHighlights(snapshot) {
  if (!snapshot || !snapshot.entries) return;
  restoreHighlightSnapshot_(SpreadsheetApp.getActive(), snapshot);
  SpreadsheetApp.flush();
}

function restoreHighlightSnapshot_(ss, snapshot) {
  for (var i = 0; i < snapshot.entries.length; i++) {
    var e = snapshot.entries[i];
    try {
      ss.getRange(e.rangeA1).setBackgrounds(e.backgrounds);
    } catch (err) {
      // Range may have been deleted between snapshot and restore. Ignore.
    }
  }
}

function isLiteralNumber_(s) {
  if (s == null) return true;
  var t = String(s).trim();
  if (t === '') return true;
  return !isNaN(parseFloat(t)) && isFinite(t);
}
