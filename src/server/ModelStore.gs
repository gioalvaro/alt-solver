/**
 * Persists the AltSolver model on the active sheet via Developer Metadata.
 * Key: "altsolver.model.v1", visibility: DOCUMENT, scope: per sheet.
 */
var METADATA_KEY_ = 'altsolver.model.v1';

/**
 * Returns the stored model JSON string for the given sheet, or null if none.
 * @param {Sheet} sheet
 * @return {string|null}
 */
function modelStore_load(sheet) {
  var finder = sheet
    .createDeveloperMetadataFinder()
    .withKey(METADATA_KEY_)
    .withVisibility(SpreadsheetApp.DeveloperMetadataVisibility.DOCUMENT);
  var found = finder.find();
  if (found.length === 0) return null;
  return found[0].getValue();
}

/**
 * Upserts the model JSON string on the given sheet.
 * @param {Sheet} sheet
 * @param {string} jsonString
 */
function modelStore_save(sheet, jsonString) {
  modelStore_clear(sheet);
  sheet.addDeveloperMetadata(
    METADATA_KEY_,
    jsonString,
    SpreadsheetApp.DeveloperMetadataVisibility.DOCUMENT,
  );
}

/**
 * Removes the model metadata from the given sheet.
 * @param {Sheet} sheet
 */
function modelStore_clear(sheet) {
  var finder = sheet
    .createDeveloperMetadataFinder()
    .withKey(METADATA_KEY_)
    .withVisibility(SpreadsheetApp.DeveloperMetadataVisibility.DOCUMENT);
  var found = finder.find();
  for (var i = 0; i < found.length; i++) {
    found[i].remove();
  }
}

/**
 * Loads the model from the active sheet for the client.
 * Called via google.script.run.
 * @return {{ json: string|null, sheetName: string, sheetId: number, locale: string }}
 */
function getActiveSheetContext() {
  var sheet = SpreadsheetApp.getActiveSheet();
  return {
    json: modelStore_load(sheet),
    sheetName: sheet.getName(),
    sheetId: sheet.getSheetId(),
    locale: Session.getActiveUserLocale() || 'en',
  };
}

/**
 * Saves the model JSON to the active sheet.
 * Called via google.script.run.
 * @param {string} jsonString
 * @return {{ ok: boolean }}
 */
function saveModel(jsonString) {
  if (typeof jsonString !== 'string' || jsonString.length === 0) {
    throw new Error('saveModel: jsonString required');
  }
  if (jsonString.length > 950 * 1024) {
    throw new Error('Model too large (>950 KB). Reduce constraints or split the model.');
  }
  modelStore_save(SpreadsheetApp.getActiveSheet(), jsonString);
  return { ok: true };
}
