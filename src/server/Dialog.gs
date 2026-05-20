/**
 * Opens the main AltSolver panel as a *sidebar* so it stays anchored to
 * the right of the spreadsheet without covering cells. Sub-modals
 * (results, constraint editor, options) still appear as overlays.
 */
function showSolverDialog() {
  const html = HtmlService.createHtmlOutputFromFile('dialog')
    .setTitle('AltSolver');
  SpreadsheetApp.getUi().showSidebar(html);
}
