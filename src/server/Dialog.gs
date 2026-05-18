/**
 * Opens the main AltSolver dialog.
 * Loaded from dialog.html (bundled by esbuild).
 */
function showSolverDialog() {
  const html = HtmlService.createHtmlOutputFromFile('dialog')
    .setWidth(520)
    .setHeight(620)
    .setTitle('AltSolver — Parámetros');
  SpreadsheetApp.getUi().showModalDialog(html, 'AltSolver — Parámetros');
}
