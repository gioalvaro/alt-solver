/**
 * onOpen runs every time the spreadsheet is opened.
 * Adds the AltSolver menu to the Extensions area.
 */
function onOpen(e) {
  const ui = SpreadsheetApp.getUi();
  ui.createAddonMenu()
    .addItem('Resolver…', 'showSolverDialog')
    .addToUi();
}

/**
 * Required by add-on lifecycle when user installs.
 */
function onInstall(e) {
  onOpen(e);
}
