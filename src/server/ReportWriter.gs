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
 * formatting: title row, subtitle, summary band, section titles, table headers,
 * zebra striping, binding chips, number formats, tab color, freeze.
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
  sheet.getRange(1, 1, nRows, nCols).setValues(paddedMatrix);

  // Title
  sheet.getRange(1, 1, 1, nCols)
    .merge()
    .setFontSize(18)
    .setFontWeight('bold')
    .setFontColor('#202124');

  // Subtitle
  sheet.getRange(2, 1, 1, nCols)
    .merge()
    .setFontSize(11)
    .setFontColor('#5f6368');

  for (var r = 3; r <= nRows; r++) {
    var rowVals = paddedMatrix[r - 1];
    var firstCellVal = rowVals[0];

    if (firstCellVal === '' || firstCellVal == null) continue;

    // "Resumen del solver" band
    if (String(firstCellVal).indexOf('Resumen') === 0) {
      var bandEnd = Math.min(r + 2, nRows);
      sheet.getRange(r, 1, bandEnd - r + 1, nCols).setBackground('#E8F0FE');
      sheet.getRange(r, 1, 1, nCols).setFontWeight('bold').setFontSize(13);
      r += 2;
      continue;
    }

    var nonEmpty = 0;
    for (var c = 1; c < nCols; c++) {
      if (rowVals[c] !== '' && rowVals[c] != null) nonEmpty++;
    }

    // Section title (only col A populated)
    if (nonEmpty === 0 && firstCellVal !== '' && firstCellVal != null) {
      sheet.getRange(r, 1, 1, nCols)
        .setFontSize(14)
        .setFontWeight('bold')
        .setFontColor('#202124');
      continue;
    }

    // Header row
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
    sheet.getRange(r, 1, 1, nCols).setBackground(isOdd ? '#FFFFFF' : '#FAFAFA');

    for (var c2 = 0; c2 < nCols; c2++) {
      var v = rowVals[c2];
      if (typeof v === 'number') {
        sheet.getRange(r, c2 + 1).setNumberFormat('#,##0.00');
        if (v === 0) sheet.getRange(r, c2 + 1).setFontColor('#9aa0a6');
      }
      if (typeof v === 'string' && v.indexOf('● Vinculante') === 0) {
        sheet.getRange(r, c2 + 1).setFontColor('#137333').setFontWeight('bold');
      }
      if (typeof v === 'string' && v.indexOf('○ No vinculante') === 0) {
        sheet.getRange(r, c2 + 1).setFontColor('#9aa0a6');
      }
    }
  }

  for (var col = 1; col <= nCols; col++) sheet.autoResizeColumn(col);
  sheet.setFrozenRows(2);
  sheet.getRange(3, 1, nRows - 2, nCols)
    .setBorder(null, null, null, null, null, true, '#DADCE0', SpreadsheetApp.BorderStyle.SOLID);
}
