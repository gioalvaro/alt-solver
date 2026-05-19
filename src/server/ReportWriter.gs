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
  // Uses a native Google Sheets scatter chart over a structured data block.
  if (req.writeReports && req.writeReports.graphical && req.graphicalData) {
    var graphSheet = createReportSheet_('Solución gráfica');
    graphSheet.setTabColor('#137333');
    writeGraphicalChart_(graphSheet, req.graphicalData);
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

/**
 * Builds the "Solución gráfica" sheet: writes the plot data block and inserts
 * a native Google Sheets scatter chart referencing it.
 *
 * Series layout (one column pair per series, side-by-side blocks):
 *   A:B   constraint c1 (line)
 *   C:D   constraint c2 (line)
 *   ...
 *   N:N+1 vertices (points)
 *   M:M+1 optimum (single point with star marker)
 *   ...   objective level lines (dashed)
 *
 * @param {Sheet} sheet
 * @param {object} g - GraphicalData from the client
 */
function writeGraphicalChart_(sheet, g) {
  sheet.getRange(1, 1)
    .setValue('AltSolver · Solución gráfica')
    .setFontSize(18).setFontWeight('bold');
  sheet.getRange(2, 1)
    .setValue('Eje x: ' + g.xName + '   ·   Eje y: ' + g.yName + '   ·   Óptimo: z = ' + Number(g.optimum.z.toPrecision(6)))
    .setFontSize(11).setFontColor('#5f6368');

  // Data block starts at row 4.
  var BLOCK_ROW = 4;
  var col = 1;
  var series = []; // { name, range, type, color }

  var COLORS = ['#1a73e8', '#137333', '#9334E8', '#B06000', '#C5221F', '#00838F'];

  // Constraint lines
  for (var i = 0; i < g.constraintLines.length; i++) {
    var cl = g.constraintLines[i];
    sheet.getRange(BLOCK_ROW, col, 1, 2).setValues([['x', cl.name]]).setFontWeight('bold');
    sheet.getRange(BLOCK_ROW + 1, col, 2, 2).setValues([
      [cl.p1.x, cl.p1.y],
      [cl.p2.x, cl.p2.y],
    ]);
    series.push({
      range: sheet.getRange(BLOCK_ROW, col, 3, 2),
      kind: 'line',
      color: COLORS[i % COLORS.length],
    });
    col += 3; // 2 data cols + 1 gap
  }

  // Vertices
  if (g.vertices.length > 0) {
    sheet.getRange(BLOCK_ROW, col, 1, 2).setValues([['x', 'Vértices']]).setFontWeight('bold');
    var vData = g.vertices.map(function (v) { return [v.x, v.y]; });
    sheet.getRange(BLOCK_ROW + 1, col, vData.length, 2).setValues(vData);
    series.push({
      range: sheet.getRange(BLOCK_ROW, col, 1 + vData.length, 2),
      kind: 'point',
      color: '#5f6368',
    });
    col += 3;
  }

  // Optimum
  sheet.getRange(BLOCK_ROW, col, 1, 2).setValues([['x', 'Óptimo']]).setFontWeight('bold');
  sheet.getRange(BLOCK_ROW + 1, col, 1, 2).setValues([[g.optimum.x, g.optimum.y]]);
  series.push({
    range: sheet.getRange(BLOCK_ROW, col, 2, 2),
    kind: 'star',
    color: '#1a73e8',
  });
  col += 3;

  // Objective level lines
  for (var k = 0; k < g.objectiveLines.length; k++) {
    var ol = g.objectiveLines[k];
    var label = 'z = ' + Number(ol.z.toPrecision(4));
    sheet.getRange(BLOCK_ROW, col, 1, 2).setValues([['x', label]]).setFontWeight('bold');
    sheet.getRange(BLOCK_ROW + 1, col, 2, 2).setValues([
      [ol.p1.x, ol.p1.y],
      [ol.p2.x, ol.p2.y],
    ]);
    var isOpt = (k === g.objectiveLines.length - 1);
    series.push({
      range: sheet.getRange(BLOCK_ROW, col, 3, 2),
      kind: 'dashed',
      color: isOpt ? '#202124' : '#9aa0a6',
    });
    col += 3;
  }

  // Build the chart — referencing each series block as a separate range.
  var builder = sheet.newChart()
    .asScatterChart()
    .setPosition(2, col + 1, 0, 0)
    .setOption('title', 'AltSolver · Solución gráfica')
    .setOption('titleTextStyle', { fontSize: 16, bold: true, color: '#202124' })
    .setOption('hAxis', { title: g.xName, titleTextStyle: { italic: false }, gridlines: { color: '#f1f3f4' } })
    .setOption('vAxis', { title: g.yName, titleTextStyle: { italic: false }, gridlines: { color: '#f1f3f4' } })
    .setOption('chartArea', { left: 60, top: 50, width: '78%', height: '72%' })
    .setOption('legend', { position: 'right' })
    .setOption('width', 900)
    .setOption('height', 600);

  var seriesOptions = {};
  for (var s = 0; s < series.length; s++) {
    builder = builder.addRange(series[s].range);
    var opts;
    if (series[s].kind === 'line') {
      opts = { lineWidth: 2.5, pointSize: 0, color: series[s].color };
    } else if (series[s].kind === 'point') {
      opts = { lineWidth: 0, pointSize: 7, color: series[s].color, pointShape: 'circle' };
    } else if (series[s].kind === 'star') {
      opts = { lineWidth: 0, pointSize: 16, color: series[s].color, pointShape: 'star' };
    } else { // dashed
      opts = {
        lineWidth: 1.5, pointSize: 0, color: series[s].color,
        lineDashStyle: [4, 4],
      };
    }
    seriesOptions[s] = opts;
  }
  builder = builder.setOption('series', seriesOptions);

  sheet.insertChart(builder.build());

  // Cosmetics on the data block (small + grey)
  for (var c = 1; c < col; c++) {
    sheet.setColumnWidth(c, 70);
    sheet.getRange(BLOCK_ROW, c, 1, 1).setBackground('#F1F3F4');
  }
  sheet.getRange(BLOCK_ROW, 1, sheet.getLastRow() - BLOCK_ROW + 1, col - 1)
    .setFontSize(10).setFontColor('#5f6368');
}
