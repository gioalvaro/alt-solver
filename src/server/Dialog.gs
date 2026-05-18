/**
 * Opens the main AltSolver dialog as a *modeless* dialog so the user can
 * still interact with the spreadsheet (select ranges) while it is open.
 * This mirrors Excel Solver's behavior.
 */
function showSolverDialog() {
  const html = HtmlService.createHtmlOutputFromFile('dialog')
    .setWidth(520)
    .setHeight(620)
    .setTitle('AltSolver — Parámetros');
  SpreadsheetApp.getUi().showModelessDialog(html, 'AltSolver — Parámetros');
}
