/**
 * Homepage card for the AltSolver side panel.
 * Triggered when the user clicks the AltSolver icon in the right rail.
 */
function onHomepage(e) {
  return buildHomepageCard_();
}

function buildHomepageCard_() {
  var section = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText(
        'AltSolver replica el Solver de Excel: programación lineal y entera con paridad de reportes.',
      ),
    )
    .addWidget(
      CardService.newTextButton()
        .setText('Resolver…')
        .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
        .setOnClickAction(
          CardService.newAction().setFunctionName('showSolverDialogFromCard'),
        ),
    );

  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('AltSolver')
        .setImageUrl(
          'https://www.gstatic.com/images/icons/material/system/1x/calculate_googblue_24dp.png',
        ),
    )
    .addSection(section)
    .build();
}

/**
 * Bridge from the card "Resolver…" button to the modal dialog.
 * Card actions return a Notification when the dialog opens elsewhere.
 */
function showSolverDialogFromCard(e) {
  showSolverDialog();
  return CardService.newActionResponseBuilder()
    .setNotification(
      CardService.newNotification().setText('AltSolver — diálogo abierto'),
    )
    .build();
}

/**
 * Legacy onOpen — kept for container-bound use cases. For Workspace
 * Add-on installations the homepage card is the entry point.
 */
function onOpen(e) {
  try {
    SpreadsheetApp.getUi()
      .createAddonMenu()
      .addItem('Resolver…', 'showSolverDialog')
      .addToUi();
  } catch (err) {
    // No UI context (e.g. installed-only trigger fires without a container).
  }
}

/**
 * Required by add-on lifecycle when user installs.
 */
function onInstall(e) {
  onOpen(e);
}
