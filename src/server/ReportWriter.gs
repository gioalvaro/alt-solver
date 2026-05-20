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
  return ss.insertSheet(basePrefix + ' ' + n);
}

/**
 * Writes the result of a solve: sets variable values (or restores), creates
 * report sheets, and pastes formatted matrices.
 *
 * @param {{
 *   modelDoc: object,
 *   solveResult: { variableValuesFlat: number[], objectiveValue: number, isMip: boolean },
 *   answerMatrix: any[][] | null,
 *   sensitivityMatrix: any[][] | null,
 *   snapshot: object,
 *   keepSolution: boolean,
 *   writeReports: { answer: boolean, sensitivity: boolean }
 * }} req
 * @return {{ ok: boolean, sheetNames: string[] }}
 */
function writeResults(req) {
  var ss = SpreadsheetApp.getActive();

  // 1. Variable values
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
  } else if (req.snapshot && req.snapshot.variablesOriginal) {
    ss.getRange(req.modelDoc.variables.rangeA1).setValues(req.snapshot.variablesOriginal);
  }

  var sheetNames = [];

  // 2. Answer report
  if (req.writeReports.answer && req.answerMatrix) {
    var answerSheet = createReportSheet_('Respuesta');
    pasteAndFormat_(answerSheet, req.answerMatrix, '#1a73e8');
    sheetNames.push(answerSheet.getName());
  }

  // 3. Sensitivity report
  if (req.writeReports.sensitivity && req.sensitivityMatrix) {
    var sensSheet = createReportSheet_('Sensibilidad');
    pasteAndFormat_(sensSheet, req.sensitivityMatrix, '#9334E8');
    sheetNames.push(sensSheet.getName());
  }

  // 4. Graphical solution (only for 2-var LP).
  // Client renders SVG → PNG via Canvas (Apps Script can't convert SVG;
  // Sheets' insertImage rejects blobs > 2 MB or > 1M pixels, so we render
  // at 1000×750 = 750K pixels — under both limits).
  if (req.writeReports && req.writeReports.graphical) {
    var graphSheet = createReportSheet_('Solución gráfica');
    graphSheet.setTabColor('#137333');
    if (req.graphicalPngBase64) {
      try {
        var bytes = Utilities.base64Decode(req.graphicalPngBase64);
        var pngBlob = Utilities.newBlob(bytes, 'image/png', 'plot.png');
        graphSheet.insertImage(pngBlob, 2, 2);
      } catch (e) {
        graphSheet.getRange(1, 1)
          .setValue('No se pudo insertar la imagen: ' + e.message)
          .setFontColor('#C5221F').setFontWeight('bold');
      }
    } else {
      // PNG conversion failed client-side — surface why the chart is missing.
      var msg = req.graphicalError || 'No se generó la solución gráfica (motivo desconocido).';
      graphSheet.getRange(1, 1)
        .setValue('⚠ Solución gráfica no disponible')
        .setFontSize(14).setFontWeight('bold').setFontColor('#C5221F');
      graphSheet.getRange(2, 1)
        .setValue(msg)
        .setFontColor('#5f6368');
      graphSheet.getRange(4, 1)
        .setValue('Esto puede pasar si el navegador no pudo convertir el SVG a PNG, o si el modelo no tiene exactamente 2 variables continuas con región factible no vacía.')
        .setFontColor('#5f6368').setFontSize(11);
    }
    sheetNames.push(graphSheet.getName());
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

/**
 * Pastes a string|number matrix into a fresh sheet and applies dashboard-style
 * formatting in BATCHED calls (setBackgrounds, setFontColors, etc.).
 *
 * Apps Script's per-call overhead for cell formatting is the dominant
 * cost on large reports (hundreds of getRange + setFontColor + setBackground
 * per cell can take 5-10 seconds). Building per-cell format matrices once
 * and pushing them in a handful of plural-setter calls reduces that to
 * sub-second.
 */
function pasteAndFormat_(sheet, matrix, tabColor) {
  if (!matrix || matrix.length === 0) return;
  sheet.setTabColor(tabColor);

  var maxCols = 1;
  for (var i = 0; i < matrix.length; i++) {
    if (matrix[i].length > maxCols) maxCols = matrix[i].length;
  }

  var paddedMatrix = matrix.map(function (row) {
    var padded = row.slice();
    while (padded.length < maxCols) padded.push('');
    return padded;
  });

  var nRows = paddedMatrix.length;
  var nCols = maxCols;

  // Single bulk write of all cell values.
  sheet.getRange(1, 1, nRows, nCols).setValues(paddedMatrix);

  // Build per-cell format matrices. Defaults are kept as null so the bulk
  // setters don't override Sheets defaults for cells we don't touch.
  var bg = [];
  var fc = [];
  var fw = [];
  var fs = [];
  var nf = [];
  var rowHeights = []; // [{row, height}]

  for (var rr = 0; rr < nRows; rr++) {
    bg.push(new Array(nCols).fill(null));
    fc.push(new Array(nCols).fill(null));
    fw.push(new Array(nCols).fill(null));
    fs.push(new Array(nCols).fill(null));
    nf.push(new Array(nCols).fill(null));
  }

  // Title (row 1)
  for (var c0 = 0; c0 < nCols; c0++) {
    fs[0][c0] = 18;
    fw[0][c0] = 'bold';
    fc[0][c0] = '#202124';
  }
  // Subtitle (row 2)
  for (var c0b = 0; c0b < nCols; c0b++) {
    fs[1][c0b] = 11;
    fc[1][c0b] = '#5f6368';
  }

  var r = 3;
  while (r <= nRows) {
    var rowVals = paddedMatrix[r - 1];
    var firstCellVal = rowVals[0];

    if (firstCellVal === '' || firstCellVal == null) {
      r++;
      continue;
    }

    // "Resumen del solver" band (3 rows tall)
    if (String(firstCellVal).indexOf('Resumen') === 0) {
      var bandEnd = Math.min(r + 2, nRows);
      for (var bandR = r; bandR <= bandEnd; bandR++) {
        for (var bandC = 0; bandC < nCols; bandC++) {
          bg[bandR - 1][bandC] = '#E8F0FE';
        }
      }
      for (var titleC = 0; titleC < nCols; titleC++) {
        fw[r - 1][titleC] = 'bold';
        fs[r - 1][titleC] = 13;
      }
      r = bandEnd + 1;
      continue;
    }

    var nonEmpty = 0;
    for (var checkC = 1; checkC < nCols; checkC++) {
      if (rowVals[checkC] !== '' && rowVals[checkC] != null) nonEmpty++;
    }

    // Section title row (only col A populated)
    if (nonEmpty === 0 && firstCellVal !== '' && firstCellVal != null) {
      for (var sectC = 0; sectC < nCols; sectC++) {
        fs[r - 1][sectC] = 14;
        fw[r - 1][sectC] = 'bold';
        fc[r - 1][sectC] = '#202124';
      }
      r++;
      continue;
    }

    // Header row (starts with 'Celda')
    if (firstCellVal === 'Celda') {
      for (var hC = 0; hC < nCols; hC++) {
        bg[r - 1][hC] = '#F1F3F4';
        fw[r - 1][hC] = 'bold';
        fc[r - 1][hC] = '#202124';
      }
      rowHeights.push({ row: r, height: 28 });
      r++;
      continue;
    }

    // Data row: zebra striping and per-cell numeric formatting / chip colors.
    var isOdd = (r % 2) === 1;
    var rowBg = isOdd ? '#FFFFFF' : '#FAFAFA';
    for (var dC = 0; dC < nCols; dC++) {
      bg[r - 1][dC] = rowBg;
      var v = rowVals[dC];
      if (typeof v === 'number') {
        nf[r - 1][dC] = '#,##0.00';
        if (v === 0) fc[r - 1][dC] = '#9aa0a6';
      } else if (typeof v === 'string') {
        if (v.indexOf('● Vinculante') === 0) {
          fc[r - 1][dC] = '#137333';
          fw[r - 1][dC] = 'bold';
        } else if (v.indexOf('○ No vinculante') === 0) {
          fc[r - 1][dC] = '#9aa0a6';
        }
      }
    }
    r++;
  }

  // Replace nulls with sensible defaults so setters don't choke.
  // setBackgrounds: null is interpreted as "no background" in some versions;
  // we use white as a safe default.
  function fillNulls(arr, def) {
    for (var rr = 0; rr < arr.length; rr++) {
      for (var cc = 0; cc < arr[rr].length; cc++) {
        if (arr[rr][cc] == null) arr[rr][cc] = def;
      }
    }
  }
  fillNulls(bg, null);  // null bg works in modern Sheets API; leave it.
  fillNulls(fc, '#202124');
  fillNulls(fw, 'normal');
  fillNulls(fs, 11);
  fillNulls(nf, null);  // null number format == default

  // Apply formats in batched calls (one per format property).
  var fullRange = sheet.getRange(1, 1, nRows, nCols);
  fullRange.setBackgrounds(bg);
  fullRange.setFontColors(fc);
  fullRange.setFontWeights(fw);
  fullRange.setFontSizes(fs);
  fullRange.setNumberFormats(nf);

  // Merge title/subtitle after format application (merging clears values).
  sheet.getRange(1, 1, 1, nCols).merge();
  sheet.getRange(2, 1, 1, nCols).merge();

  // Row heights — one call per header row (rare; usually 3-5 total).
  for (var rh = 0; rh < rowHeights.length; rh++) {
    sheet.setRowHeight(rowHeights[rh].row, rowHeights[rh].height);
  }

  // Auto-resize columns (still per-column but no other way in Apps Script API).
  for (var col = 1; col <= nCols; col++) sheet.autoResizeColumn(col);

  // Freeze and border in one call each.
  sheet.setFrozenRows(2);
  sheet.getRange(3, 1, nRows - 2, nCols)
    .setBorder(null, null, null, null, null, true, '#DADCE0', SpreadsheetApp.BorderStyle.SOLID);
}
