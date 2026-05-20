/**
 * Built-in model templates that AltSolver can drop into a fresh sheet
 * with one click. Each template:
 *   - Writes a clean spreadsheet layout (labels, coefficients, SUMPRODUCT
 *     formulas, RHS values) onto a new sheet.
 *   - Returns a ModelDocument with the correct A1 references pointing to
 *     that sheet, ready to be persisted via Developer Metadata.
 *
 * Goal is purely educational/onboarding: a user can try the solver
 * without writing a single formula or learning the dialog.
 */

var TEMPLATES_ = {
  produccion: {
    label: 'Producción (Taha 3.1)',
    summary: 'LP · 2 variables · maximizar utilidad con 2 recursos limitados',
    create: function (sheet) {
      var sheetName = quoteSheetName_(sheet.getName());

      // ── Header block
      sheet.getRange('A1').setValue('Modelo de producción (Taha 3.1)').setFontSize(14).setFontWeight('bold');
      sheet.getRange('A2').setValue('Maximizar utilidad de 2 productos con 2 recursos').setFontColor('#5f6368');

      // ── Variables row
      sheet.getRange('A4:C4').setValues([['', 'x_1', 'x_2']])
        .setFontWeight('bold').setBackground('#F1F3F4');
      sheet.getRange('A5').setValue('Variables').setFontWeight('500');
      sheet.getRange('B5:C5').setValues([[0, 0]]);

      // ── Objective
      sheet.getRange('A7').setValue('Función objetivo (MAX)').setFontWeight('bold');
      sheet.getRange('A8:C8').setValues([['Utilidad', 5, 4]]);
      sheet.getRange('A9').setValue('z =');
      sheet.getRange('B9').setFormula('=SUMPRODUCT(B8:C8, $B$5:$C$5)');

      // ── Constraints
      sheet.getRange('A11').setValue('Restricciones').setFontWeight('bold');
      sheet.getRange('A12:F12').setValues([['', 'Coef. x_1', 'Coef. x_2', 'Uso', '', 'Disponible']])
        .setFontWeight('bold').setBackground('#F1F3F4');
      sheet.getRange('A13').setValue('Materia prima');
      sheet.getRange('B13:C13').setValues([[6, 4]]);
      sheet.getRange('D13').setFormula('=SUMPRODUCT(B13:C13, $B$5:$C$5)');
      sheet.getRange('E13').setValue('≤');
      sheet.getRange('F13').setValue(24);
      sheet.getRange('A14').setValue('Tiempo');
      sheet.getRange('B14:C14').setValues([[1, 2]]);
      sheet.getRange('D14').setFormula('=SUMPRODUCT(B14:C14, $B$5:$C$5)');
      sheet.getRange('E14').setValue('≤');
      sheet.getRange('F14').setValue(6);

      formatExampleSheet_(sheet);

      return baseModel_(sheet, {
        objective: { cellA1: sheetName + '!B9', sense: 'MAX', targetValue: null },
        variables: { rangeA1: sheetName + '!B5:C5', names: [], assumeNonNegative: true },
        constraints: [
          { lhsA1: sheetName + '!D13', op: '<=', rhsA1OrValue: sheetName + '!F13', type: 'linear' },
          { lhsA1: sheetName + '!D14', op: '<=', rhsA1OrValue: sheetName + '!F14', type: 'linear' },
        ],
      });
    },
  },

  dieta: {
    label: 'Dieta',
    summary: 'LP · 4 alimentos · minimizar costo cumpliendo nutrientes mínimos',
    create: function (sheet) {
      var sheetName = quoteSheetName_(sheet.getName());

      sheet.getRange('A1').setValue('Dieta de mínimo costo').setFontSize(14).setFontWeight('bold');
      sheet.getRange('A2').setValue('Elegir cantidades de 4 alimentos que cumplan requerimientos nutricionales al menor costo').setFontColor('#5f6368');

      sheet.getRange('A4:E4').setValues([['', 'Carne', 'Papa', 'Leche', 'Manzana']])
        .setFontWeight('bold').setBackground('#F1F3F4');
      sheet.getRange('A5').setValue('Variables').setFontWeight('500');
      sheet.getRange('B5:E5').setValues([[0, 0, 0, 0]]);

      sheet.getRange('A7').setValue('Función objetivo (MIN)').setFontWeight('bold');
      sheet.getRange('A8:E8').setValues([['Costo por porción ($)', 1.50, 0.30, 0.40, 0.20]]);
      sheet.getRange('A9').setValue('Costo total =');
      sheet.getRange('B9').setFormula('=SUMPRODUCT(B8:E8, $B$5:$E$5)');

      sheet.getRange('A11').setValue('Restricciones nutricionales').setFontWeight('bold');
      sheet.getRange('A12:G12').setValues([['', 'Carne', 'Papa', 'Leche', 'Manzana', 'Aporte', '']])
        .setFontWeight('bold').setBackground('#F1F3F4');
      sheet.getRange('A13').setValue('Calorías');
      sheet.getRange('B13:E13').setValues([[300, 100, 150, 80]]);
      sheet.getRange('F13').setFormula('=SUMPRODUCT(B13:E13, $B$5:$E$5)');
      sheet.getRange('G13').setValue('≥');
      sheet.getRange('H13').setValue(2000);

      sheet.getRange('A14').setValue('Proteínas (g)');
      sheet.getRange('B14:E14').setValues([[25, 2, 8, 1]]);
      sheet.getRange('F14').setFormula('=SUMPRODUCT(B14:E14, $B$5:$E$5)');
      sheet.getRange('G14').setValue('≥');
      sheet.getRange('H14').setValue(55);

      sheet.getRange('A15').setValue('Vitamina C (mg)');
      sheet.getRange('B15:E15').setValues([[0, 15, 2, 10]]);
      sheet.getRange('F15').setFormula('=SUMPRODUCT(B15:E15, $B$5:$E$5)');
      sheet.getRange('G15').setValue('≥');
      sheet.getRange('H15').setValue(70);

      formatExampleSheet_(sheet);

      return baseModel_(sheet, {
        objective: { cellA1: sheetName + '!B9', sense: 'MIN', targetValue: null },
        variables: { rangeA1: sheetName + '!B5:E5', names: [], assumeNonNegative: true },
        constraints: [
          { lhsA1: sheetName + '!F13', op: '>=', rhsA1OrValue: sheetName + '!H13', type: 'linear' },
          { lhsA1: sheetName + '!F14', op: '>=', rhsA1OrValue: sheetName + '!H14', type: 'linear' },
          { lhsA1: sheetName + '!F15', op: '>=', rhsA1OrValue: sheetName + '!H15', type: 'linear' },
        ],
      });
    },
  },

  mezcla: {
    label: 'Mezcla',
    summary: 'LP · 3 componentes · minimizar costo con demanda y calidad mínima',
    create: function (sheet) {
      var sheetName = quoteSheetName_(sheet.getName());

      sheet.getRange('A1').setValue('Problema de mezcla').setFontSize(14).setFontWeight('bold');
      sheet.getRange('A2').setValue('3 componentes que deben sumar la demanda y mantener calidad mínima al menor costo').setFontColor('#5f6368');

      sheet.getRange('A4:D4').setValues([['', 'Comp_A', 'Comp_B', 'Comp_C']])
        .setFontWeight('bold').setBackground('#F1F3F4');
      sheet.getRange('A5').setValue('Variables').setFontWeight('500');
      sheet.getRange('B5:D5').setValues([[0, 0, 0]]);

      sheet.getRange('A7').setValue('Función objetivo (MIN)').setFontWeight('bold');
      sheet.getRange('A8:D8').setValues([['Costo por unidad', 3, 5, 4]]);
      sheet.getRange('A9').setValue('Costo total =');
      sheet.getRange('B9').setFormula('=SUMPRODUCT(B8:D8, $B$5:$D$5)');

      sheet.getRange('A11').setValue('Restricciones').setFontWeight('bold');
      sheet.getRange('A12:F12').setValues([['', 'Comp_A', 'Comp_B', 'Comp_C', 'Total', '']])
        .setFontWeight('bold').setBackground('#F1F3F4');
      sheet.getRange('A13').setValue('Demanda total');
      sheet.getRange('B13:D13').setValues([[1, 1, 1]]);
      sheet.getRange('E13').setFormula('=SUMPRODUCT(B13:D13, $B$5:$D$5)');
      sheet.getRange('F13').setValue('≥');
      sheet.getRange('G13').setValue(100);

      sheet.getRange('A14').setValue('Calidad mínima (%)');
      sheet.getRange('B14:D14').setValues([[0.30, 0.50, 0.40]]);
      sheet.getRange('E14').setFormula('=SUMPRODUCT(B14:D14, $B$5:$D$5)');
      sheet.getRange('F14').setValue('≥');
      sheet.getRange('G14').setValue(35);

      formatExampleSheet_(sheet);

      return baseModel_(sheet, {
        objective: { cellA1: sheetName + '!B9', sense: 'MIN', targetValue: null },
        variables: { rangeA1: sheetName + '!B5:D5', names: [], assumeNonNegative: true },
        constraints: [
          { lhsA1: sheetName + '!E13', op: '>=', rhsA1OrValue: sheetName + '!G13', type: 'linear' },
          { lhsA1: sheetName + '!E14', op: '>=', rhsA1OrValue: sheetName + '!G14', type: 'linear' },
        ],
      });
    },
  },

  mochila: {
    label: 'Mochila 0-1',
    summary: 'MIP · 5 ítems binarios · maximizar valor sin pasar la capacidad',
    create: function (sheet) {
      var sheetName = quoteSheetName_(sheet.getName());

      sheet.getRange('A1').setValue('Mochila binaria 0-1').setFontSize(14).setFontWeight('bold');
      sheet.getRange('A2').setValue('Elegir un subconjunto de 5 ítems (cada uno se lleva o no) que maximice el valor sin exceder el peso permitido').setFontColor('#5f6368');

      sheet.getRange('A4:F4').setValues([['', 'Ítem 1', 'Ítem 2', 'Ítem 3', 'Ítem 4', 'Ítem 5']])
        .setFontWeight('bold').setBackground('#F1F3F4');
      sheet.getRange('A5').setValue('Llevar (0/1)').setFontWeight('500');
      sheet.getRange('B5:F5').setValues([[0, 0, 0, 0, 0]]);

      sheet.getRange('A7').setValue('Función objetivo (MAX)').setFontWeight('bold');
      sheet.getRange('A8:F8').setValues([['Valor', 10, 13, 18, 31, 7]]);
      sheet.getRange('A9').setValue('Valor total =');
      sheet.getRange('B9').setFormula('=SUMPRODUCT(B8:F8, $B$5:$F$5)');

      sheet.getRange('A11').setValue('Restricción').setFontWeight('bold');
      sheet.getRange('A12:G12').setValues([['', 'Ítem 1', 'Ítem 2', 'Ítem 3', 'Ítem 4', 'Ítem 5', 'Peso']])
        .setFontWeight('bold').setBackground('#F1F3F4');
      sheet.getRange('A13').setValue('Peso (kg)');
      sheet.getRange('B13:F13').setValues([[11, 15, 20, 35, 10]]);
      sheet.getRange('G13').setFormula('=SUMPRODUCT(B13:F13, $B$5:$F$5)');
      sheet.getRange('H13').setValue('≤');
      sheet.getRange('I13').setValue(47);

      formatExampleSheet_(sheet);

      return baseModel_(sheet, {
        objective: { cellA1: sheetName + '!B9', sense: 'MAX', targetValue: null },
        variables: { rangeA1: sheetName + '!B5:F5', names: [], assumeNonNegative: true },
        constraints: [
          { lhsA1: sheetName + '!G13', op: '<=', rhsA1OrValue: sheetName + '!I13', type: 'linear' },
          { lhsA1: sheetName + '!B5:F5', op: 'bin' },
        ],
      });
    },
  },
};

function quoteSheetName_(name) {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) return name;
  return "'" + name.replace(/'/g, "\\'") + "'";
}

function formatExampleSheet_(sheet) {
  sheet.autoResizeColumns(1, 10);
  sheet.setColumnWidth(1, 180); // wider label column
}

function baseModel_(sheet, overrides) {
  var now = new Date().toISOString();
  return {
    version: 1,
    sheetId: sheet.getSheetId(),
    objective: overrides.objective,
    variables: overrides.variables,
    constraints: overrides.constraints,
    options: {
      assumeNonNegative: true,
      timeLimitSec: 100,
      iterLimit: null,
      mipGap: 1e-4,
      integerTolerance: 1e-6,
    },
    meta: { createdAt: now, updatedAt: now, solvedAt: null, locale: 'es' },
  };
}

/**
 * Returns the list of available templates for the sidebar dropdown.
 * @return {{ id: string, label: string, summary: string }[]}
 */
function listTemplates() {
  var out = [];
  for (var id in TEMPLATES_) {
    if (Object.prototype.hasOwnProperty.call(TEMPLATES_, id)) {
      out.push({ id: id, label: TEMPLATES_[id].label, summary: TEMPLATES_[id].summary });
    }
  }
  return out;
}

/**
 * Inserts a template as a new sheet, persists its model, and makes the new
 * sheet active so the sidebar picks it up on its next refresh.
 *
 * @param {string} id - one of the keys of TEMPLATES_
 * @return {{ ok: true, sheetName: string, modelJson: string }}
 */
function insertTemplate(id) {
  var template = TEMPLATES_[id];
  if (!template) throw new Error('Template no encontrado: ' + id);
  var ss = SpreadsheetApp.getActive();
  var baseName = 'Ejemplo · ' + template.label;
  var name = baseName;
  var n = 2;
  while (ss.getSheetByName(name) !== null) {
    name = baseName + ' (' + n + ')';
    n++;
  }
  var sheet = ss.insertSheet(name);
  var modelDoc = template.create(sheet);
  ss.setActiveSheet(sheet);
  var jsonString = JSON.stringify(modelDoc);
  modelStore_save(sheet, jsonString);
  return { ok: true, sheetName: name, modelJson: jsonString };
}
