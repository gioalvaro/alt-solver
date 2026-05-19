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

  var BLOCK_ROW = 4;

  // Collect series in a uniform structure: [{ name, kind, color, points: [[x,y], ...] }].
  var COLORS = ['#1a73e8', '#137333', '#9334E8', '#B06000', '#C5221F', '#00838F'];
  var series = [];

  for (var i = 0; i < g.constraintLines.length; i++) {
    var cl = g.constraintLines[i];
    series.push({
      name: cl.name || ('c' + (i + 1)),
      kind: 'line',
      color: COLORS[i % COLORS.length],
      points: [[cl.p1.x, cl.p1.y], [cl.p2.x, cl.p2.y]],
    });
  }
  if (g.vertices.length > 0) {
    series.push({
      name: 'Vértices',
      kind: 'point',
      color: '#5f6368',
      points: g.vertices.map(function (v) { return [v.x, v.y]; }),
    });
  }
  series.push({
    name: 'Óptimo',
    kind: 'star',
    color: '#1a73e8',
    points: [[g.optimum.x, g.optimum.y]],
  });
  for (var k = 0; k < g.objectiveLines.length; k++) {
    var ol = g.objectiveLines[k];
    var isOpt = (k === g.objectiveLines.length - 1);
    series.push({
      name: 'z = ' + Number(ol.z.toPrecision(4)),
      kind: 'dashed',
      color: isOpt ? '#202124' : '#9aa0a6',
      points: [[ol.p1.x, ol.p1.y], [ol.p2.x, ol.p2.y]],
    });
  }

  // Build ONE contiguous rectangle: 2 columns per series (x, y), side-by-side.
  // All series share the same row count: maxLen.
  var maxLen = 0;
  for (var s = 0; s < series.length; s++) {
    if (series[s].points.length > maxLen) maxLen = series[s].points.length;
  }
  var nCols = series.length * 2;

  // Header row
  var header = [];
  for (var s2 = 0; s2 < series.length; s2++) {
    header.push('x_' + (s2 + 1));
    header.push(series[s2].name);
  }
  sheet.getRange(BLOCK_ROW, 1, 1, nCols)
    .setValues([header])
    .setFontWeight('bold')
    .setBackground('#F1F3F4');

  // Data rows
  var data = [];
  for (var r = 0; r < maxLen; r++) {
    var row = [];
    for (var s3 = 0; s3 < series.length; s3++) {
      var p = series[s3].points[r];
      if (p) {
        row.push(p[0]);
        row.push(p[1]);
      } else {
        row.push('');
        row.push('');
      }
    }
    data.push(row);
  }
  if (data.length > 0) {
    sheet.getRange(BLOCK_ROW + 1, 1, data.length, nCols).setValues(data);
  }

  // Per-series options (keyed by series index in the chart).
  var seriesOptions = {};
  for (var s4 = 0; s4 < series.length; s4++) {
    var kind = series[s4].kind;
    var color = series[s4].color;
    if (kind === 'line') {
      seriesOptions[s4] = { lineWidth: 2.5, pointSize: 0, color: color };
    } else if (kind === 'point') {
      seriesOptions[s4] = { lineWidth: 0, pointSize: 8, color: color, pointShape: 'circle' };
    } else if (kind === 'star') {
      seriesOptions[s4] = { lineWidth: 0, pointSize: 18, color: color, pointShape: 'star' };
    } else { // dashed
      seriesOptions[s4] = { lineWidth: 1.5, pointSize: 0, color: color, lineDashStyle: [4, 4] };
    }
  }

  // Build the chart with a SINGLE rectangular range covering all series.
  var dataRange = sheet.getRange(BLOCK_ROW, 1, maxLen + 1, nCols);
  var chart = sheet.newChart()
    .asScatterChart()
    .addRange(dataRange)
    .setPosition(2, nCols + 2, 0, 0)
    .setOption('title', 'AltSolver · Solución gráfica')
    .setOption('hAxis.title', g.xName)
    .setOption('vAxis.title', g.yName)
    .setOption('legend', { position: 'right' })
    .setOption('width', 920)
    .setOption('height', 600)
    .setOption('series', seriesOptions)
    .build();
  sheet.insertChart(chart);

  // Cosmetics: small grey font + narrow cols on the data block
  for (var c = 1; c <= nCols; c++) sheet.setColumnWidth(c, 70);
  sheet.getRange(BLOCK_ROW + 1, 1, maxLen, nCols).setFontSize(10).setFontColor('#5f6368');
  sheet.getRange(BLOCK_ROW + 1, 1, maxLen, nCols).setNumberFormat('0.###');
}
