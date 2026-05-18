# AltSolver — Diseño técnico

**Fecha:** 2026-05-17
**Autor:** Equipo AltSolver
**Estado:** Diseño aprobado, listo para plan de implementación

## 1. Resumen ejecutivo

AltSolver es un add-on de Google Workspace para Google Sheets que replica el complemento Solver de Microsoft Excel:

- Resuelve problemas de **programación lineal continua** y **programación entera/binaria mixta (MIP)** mediante el método Simplex y branch-and-bound.
- El usuario modela sobre la hoja igual que en Excel (`SUMPRODUCT`, referencias a celdas, restricciones lineales) y define el problema en un diálogo idéntico en estructura al "Parámetros del Solver" de Excel.
- Genera tres reportes en hojas nuevas con paridad visual y semántica con los reportes de Excel: **Respuesta**, **Sensibilidad** y **Límites**.
- El motor de cálculo es [HiGHS](https://highs.dev/) compilado a WebAssembly, ejecutado del lado del cliente (en el sandbox de `HtmlService`).
- Se distribuye en el **Google Workspace Marketplace** como add-on público, con UI en español e inglés.

## 2. Alcance

### En alcance
- LP continuo (Simplex revised).
- MIP con restricciones `int` y `bin` (branch-and-bound).
- Reportes Respuesta, Sensibilidad (sólo LP puro, igual que Excel) y Límites.
- UI bilingüe (es/en) con auto-detección por locale del documento.
- Opciones avanzadas: no-negatividad global, gap MIP, tolerancia entera, tiempo máximo, iteraciones máximas.
- Persistencia del modelo en el documento (viaja con copias del archivo).
- Distribución pública en Marketplace.

### Fuera de alcance (futuras versiones)
- Programación no lineal (GRG) y evolutiva.
- Soporte multi-hoja con referencias cruzadas dentro del mismo modelo (v1 asume una sola hoja activa).
- Múltiples modelos guardados por libro (v1 guarda uno por hoja).
- Telemetría detallada y planes pagos.

## 3. Decisiones arquitectónicas

### 3.1 Motor: HiGHS-WASM, client-side
- **Por qué HiGHS:** es el solver open-source de mejor rendimiento hoy, mantenido activamente por la U. de Edimburgo, soporta LP, MIP, expone duales, costos reducidos y *ranging* (rangos de sensibilidad) vía API nativa.
- **Por qué client-side:** evita el límite de 6 min de Apps Script, no requiere infraestructura propia, no requiere OAuth scopes sensibles, mantiene los datos del usuario dentro de Google.
- **Alternativas evaluadas y descartadas:**
  - `glpk.js`: más lento, MIP menos competitivo, desarrollo más lento.
  - Backend propio (Cloud Run + HiGHS/CBC): añade hosting, costos, latencia y fricción de revisión OAuth.
  - Simplex puro en Apps Script: CPU lenta, límite de 6 min, alto costo de mantenimiento numérico (anti-ciclaje, degeneración, sensibilidad).

### 3.2 Apps Script como orquestador
Apps Script se limita a:
- Menús, triggers `onOpen` y diálogo modal.
- Lectura/escritura de rangos.
- Persistencia del modelo vía Developer Metadata.
- Escritura de reportes y formato.

Toda la matemática vive en JavaScript en el sandbox del navegador.

### 3.3 Persistencia: Developer Metadata
Modelo guardado como JSON serializado bajo la clave `altsolver.model.v1`, scope `DOCUMENT`. A diferencia de `PropertiesService`, viaja en `File → Make a copy` (paridad con `solver_*` named ranges de Excel) sin contaminar el panel de nombres del usuario.

### 3.4 Distribución
Marketplace público con OAuth scope acotado a `spreadsheets.currentonly` para reducir el tiempo de verificación de Google (de ~6 semanas a ~1).

## 4. Arquitectura general

```
┌──────────────── Google Sheets (navegador del usuario) ─────────────────┐
│                                                                        │
│  ┌──────────────────────────┐         ┌─────────────────────────────┐  │
│  │  Apps Script backend     │  RPC    │  HtmlService dialog         │  │
│  │  (V8, server-side .gs)   │ <─────> │  (iframe sandbox)           │  │
│  │                          │         │                             │  │
│  │  - Menú add-on           │         │  - UI estilo Solver         │  │
│  │  - Lectura/escritura     │         │  - Carga highs.wasm         │  │
│  │    de rangos             │         │  - Build del modelo LP/MIP  │  │
│  │  - Developer Metadata    │         │  - Ejecuta HiGHS            │  │
│  │  - Escritura de reportes │         │  - Arma matrices de reporte │  │
│  └──────────────────────────┘         └─────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

Comunicación: `google.script.run` (asincrónica, JSON-serializable). Una sola llamada por solve para minimizar round-trips (~300-800 ms cada uno).

El binario WASM (~1.5 MB) se incrusta como recurso del propio HTML; no se sirve desde CDN externo (evita CSP issues y rotura por dependencia externa).

## 5. Estructura del repositorio

```
altsolver/
├── appsscript.json
├── src/
│   ├── server/                    # Apps Script (.gs)
│   │   ├── Menu.gs                # onOpen() + menú "AltSolver"
│   │   ├── Dialog.gs              # abre el diálogo (HtmlService)
│   │   ├── ModelStore.gs          # CRUD Developer Metadata
│   │   ├── RangeIO.gs             # lectura de rangos
│   │   ├── ReportWriter.gs        # crea hojas de reporte y formato
│   │   ├── Locale.gs              # detección de idioma
│   │   └── Errors.gs              # mapeo de errores → i18n
│   ├── client/                    # HTML/JS embebido
│   │   ├── dialog.html
│   │   ├── app.js                 # controller de la UI
│   │   ├── solver/
│   │   │   ├── highs-loader.js    # carga lazy de highs.wasm
│   │   │   ├── model-builder.js   # rangos crudos → estructura HiGHS
│   │   │   ├── solve.js           # invocación + normalización
│   │   │   └── limits.js          # re-solves para Limits Report
│   │   ├── reports/
│   │   │   ├── answer.js
│   │   │   ├── sensitivity.js
│   │   │   └── limits-report.js
│   │   ├── i18n/
│   │   │   ├── es.json
│   │   │   └── en.json
│   │   └── ui/                    # componentes
│   ├── shared/
│   │   ├── model-schema.js
│   │   └── constants.js
│   └── vendor/
│       └── highs.wasm
└── tests/
    ├── unit/
    ├── golden/
    └── e2e/
```

### Boundaries duras
- `RangeIO` y `ReportWriter` son los **únicos** módulos que tocan la API de Spreadsheet.
- `solver/` no conoce celdas; recibe estructura LP/MIP pura, totalmente testeable en Node.
- `reports/` produce `string[][]` listo para `setValues`; nunca llama a APIs de Sheets.

## 6. Flujo de datos

### Caso A: primera resolución

1. Usuario abre el diálogo via menú.
2. `Dialog.gs` retorna `HtmlOutput`; `app.js` arranca, pide contexto (`getActiveSheetContext`) y dispara la carga lazy de `highs.wasm`.
3. Usuario completa el diálogo (celda objetivo, sentido, rango de variables, lista de restricciones, opciones).
4. Click "Resolver":
   - `google.script.run.resolveRanges(modelDraft)` → `RangeIO.gs` lee valores actuales y devuelve `ModelResolved`.
   - `model-builder.js` arma estructura HiGHS.
   - `solve.js` ejecuta `highs.solve(lpString, options)`.
   - `reports/*.js` arman matrices de reporte.
   - Si el usuario pidió Limits, `limits.js` corre 2n re-solves.
   - `google.script.run.writeResults(reports, modelResolved, summary)` → `ReportWriter.gs` crea hojas, pega valores, persiste modelo.
5. Diálogo "Resultados" muestra status y links a hojas creadas.

### Caso B: re-resolver modelo guardado
`onOpen` detecta metadata y habilita "Resolver de nuevo", que ejecuta el flujo desde el paso 4 sin abrir el diálogo.

### Invariantes
- El servidor nunca ve la matriz A; sólo referencias y valores planos.
- El cliente nunca toca la hoja directamente.
- Un solo round-trip por solve.

## 7. Schema del modelo persistido

```js
// Developer Metadata key: "altsolver.model.v1"
{
  version: 1,
  sheetId: 1234567890,
  objective: {
    cellA1: "Optimal!B12",
    sense: "MAX" | "MIN" | "TARGET",
    targetValue: null | number
  },
  variables: {
    rangeA1: "Optimal!B3:B7",
    names: ["x1","x2","x3","x4","x5"],
    assumeNonNegative: true
  },
  constraints: [
    { lhsA1: "Optimal!D12", op: "<=", rhsA1OrValue: "Optimal!F12", type: "linear" },
    { lhsA1: "Optimal!B3:B7", op: "int" },
    { lhsA1: "Optimal!B7",   op: "bin" }
  ],
  options: {
    assumeNonNegative: true,
    timeLimitSec: 100,
    iterLimit: null,
    mipGap: 1e-4,
    integerTolerance: 1e-6
  },
  meta: { createdAt, updatedAt, solvedAt, locale }
}
```

Migraciones: la clave incluye `v1`. Futuros schemas: `migrate_v1_to_v2(doc)` en `ModelStore.load`.

## 8. UI/UX del diálogo

Diálogo modal `HtmlService.createModalDialog`, ~520×620 px. Layout que replica fielmente el "Parámetros del Solver" de Excel modernizado:

- **Celda objetivo** + botón selector `⌖` que minimiza el diálogo, deja al usuario elegir rango en la hoja y vuelve.
- **Sentido:** radio Max / Min / Valor de:.
- **Rango de variables** + selector.
- **Lista de restricciones** editable con sub-diálogo "Agregar/Cambiar restricción" (LHS, operador `≤ = ≥ int bin`, RHS deshabilitado si op es `int`/`bin`).
- **Checkbox** "Convertir variables sin restricciones en no negativas" (default on).
- **Dropdown** método (sólo "Simplex LP (HiGHS)" en v1).
- **Sub-diálogo Opciones:** tolerancia entera, gap MIP, tiempo máx, iteraciones máx, mostrar resultados intermedios.

### UX clave
1. Selector de rango que minimiza el diálogo (paridad con Excel).
2. Validación en vivo de referencias A1 (regex local + ping al server).
3. i18n completo en labels, errores y reportes.
4. Atajos: `Enter` = Resolver, `Esc` = Cerrar.
5. Iconos como SVG inline o Material Symbols (no emojis en producción).

### Diálogo de resultados
Estilo Excel: status, valor objetivo, radio "Conservar / Restaurar valores", checkboxes para los tres reportes, botón "Aceptar".

## 9. Generación de reportes

### 9.1 Answer Report (Respuesta)
Layout idéntico a Excel. Secciones: header de motor y opciones, Objective Cell, Variable Cells, Constraints (con `Binding`/`Not Binding` y `Slack`).

Mapeo desde HiGHS:
- `Final Value` ← `result.columns[i].primal` y `result.objective_value`.
- `Original Value` ← snapshot tomado por `RangeIO` antes de resolver.
- `Binding` ← `|slack| < feasibilityTol`.
- `Slack` calculado según operador.
- Tipo de variable: `"Contin" | "Integer" | "Binary"`.
- Nombres inferidos por `RangeIO` (celda izquierda para variables, celda arriba para restricciones; fallback a A1).

### 9.2 Sensitivity Report (Sensibilidad)
**Sólo se genera para LP puro.** Si hay `int`/`bin`, no se escribe la hoja y el diálogo informa: *"El informe de sensibilidad no se genera para problemas con variables enteras."*

Mapeo:
- `Reduced Cost` ← `result.columns[i].dual`.
- `Shadow Price` ← `result.rows[j].dual`.
- `Allowable Increase / Decrease` ← `Highs_getRanging()` (`[cost_dn, cost_up]`, `[rhs_dn, rhs_up]`).
- Cuando `up = +∞` se escribe literalmente `"1E+30"` (notación Excel).
- Convención de signo de duales validada contra Excel por suite golden.

### 9.3 Limits Report (Límites)
Computado por re-solves: para cada variable `xi`, se fijan las otras a su valor óptimo y se resuelve `min xi` y `max xi`. HiGHS con hot-start del basis óptimo hace cada par en ms. Total: 2n LPs pequeños.

### 9.4 Formato visual
Headers bold con fondo `#E8E8E8`, bordes finos, `0.000` para valores numéricos, `0.000E+00` para infinitos, `autoResizeColumns`.

### 9.5 Validación de paridad
`tests/golden/` contiene 8-10 modelos LP/MIP clásicos (transporte, dieta, asignación, mezcla, producción, corte de stock, degenerado, multi-óptimo, infactible, no acotado) con sus reportes de Excel exportados a JSON. Tolerancia `1e-4` para números, exact match para strings.

## 10. Manejo de errores

### Estados del solver
| HiGHS status | UI (es) | Acción |
|---|---|---|
| `kOptimal` | Óptimo | Escribe valores + reportes. |
| `kInfeasible` | Infactible | Banner accionable; no escribe valores. |
| `kUnbounded` | No acotado | Marca variables con costo reducido infinito. |
| `kTimeLimit` | Tiempo agotado | Escribe mejor solución factible con gap. |
| `kIterationLimit` | Iteraciones agotadas | Igual al anterior. |
| Otros | Error interno | Botón "Copiar diagnóstico" (LP en MPS al portapapeles). |

### Validación pre-solve (cliente)
- Referencia A1 inválida (marca `⚠`, deshabilita "Resolver").
- Objetivo vacío o no numérico.
- Rango de variables vacío.
- LHS sospechoso de no linealidad (warning, no bloqueo).
- `int`/`bin` sobre celda fuera del rango de variables (bloqueo).
- Modelo >100k no-ceros (warning con estimación).

### Runtime
- WASM no carga → instrucciones de navegador.
- `google.script.run` falla → 1 reintento automático, después mensaje.
- Hoja referenciada borrada al re-resolver → bloqueo con "Editá el modelo".
- Conflicto de nombre de reporte → autoincremento de sufijo.

### Cancelación
Botón Cancelar durante solve. Implementado vía `Highs_setCallback` o `Worker.terminate()` y recreación del módulo.

### Telemetría (opcional, opt-in explícito)
Sólo dimensiones agregadas (tamaño de modelo, tiempo, status, idioma). Sin contenidos ni nombres. Vía GA4 Measurement Protocol o Cloud Functions. Política de privacidad en el listing del Marketplace.

## 11. Tests y CI/CD

### Suites
- **Unit (vitest, < 5 s):** model-builder, answer/sensitivity/limits, model-store, range-io.
- **Golden:** 10 modelos LP/MIP comparados celda-a-celda con Excel.
- **E2E (clasp run):** happy path, reload modelo guardado, toggle i18n.

### Stack de desarrollo
- `clasp` para push/pull del Apps Script.
- `esbuild` para bundlear `client/` en un solo `dialog.html`.
- `TypeScript` en `client/` y `shared/` (transpilado a JS para `.gs`).
- `vitest`, `eslint`, `prettier`, `husky` + `lint-staged`.

### Pipeline GitHub Actions
1. **PR / push:** lint, typecheck, unit, golden.
2. **Merge a `main`:** build + push a Apps Script staging + healthcheck E2E.
3. **Tag `v*`:** push a Apps Script prod + `clasp deploy` con descripción de versión.

Secrets: `CLASPRC_JSON` en GitHub Actions.

### Manifest `appsscript.json`
```json
{
  "timeZone": "America/Argentina/Buenos_Aires",
  "runtimeVersion": "V8",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.locale"
  ],
  "addOns": {
    "common": {
      "name": "AltSolver",
      "logoUrl": "https://altsolver.app/icon-128.png",
      "useLocaleFromApp": true
    },
    "sheets": {
      "homepageTrigger": { "runFunction": "onHomepage" },
      "onFileScopeGrantedTrigger": { "runFunction": "onFileScopeGranted" }
    }
  }
}
```

## 12. Publicación en Marketplace

### Pre-requisitos
1. Proyecto GCP con APIs habilitadas (Apps Script, Marketplace SDK).
2. OAuth consent screen con app name, logos 32/64/128, homepage, privacy policy, ToS.
3. Política de privacidad y términos de servicio públicos (GitHub Pages).
4. Listing bilingüe (es/en), 5+ screenshots, 1 video de ≤30 s.
5. Brand verification del logo.
6. Categoría: Productivity → Business Tools.

### Plan inicial
2-4 semanas como **unlisted** con beta cerrada antes de pasar a público.

## 13. Roadmap

| Versión | Alcance |
|---|---|
| **0.1 MVP** | LP puro, Answer + Sensitivity, persistencia básica, ES único, unlisted. |
| **0.2** | MIP (int/bin) con B&B de HiGHS. |
| **0.3** | Limits Report, opciones avanzadas completas (gap, tolerancias, tiempo). |
| **0.4** | i18n EN, cancelación, refinamientos de persistencia (migraciones, banner de referencias rotas). |
| **1.0** | OAuth verification, publicación pública en Marketplace, telemetría opt-in. |
| **1.x** | Multi-sheet refs, múltiples escenarios por libro, export MPS/LP. |

## 14. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| HiGHS-WASM no expone `getRanging` en alguna versión | Pinear versión de `highs-js`. Suite golden detecta regresiones. |
| Paridad numérica con Excel diverge en casos degenerados | Tests golden con casos degenerados explícitos; documentar diferencias conocidas. |
| Modelo grande excede memoria del iframe | Heurística pre-solve (>100k no-ceros warning); medir y documentar límite real. |
| Verificación OAuth de Google se demora | Limitar a `spreadsheets.currentonly` (no sensitive); empezar verification temprano en fase 1.0. |
| API de Developer Metadata cambia | Boundary aislado en `ModelStore.gs`; fallback a Properties si falla. |

## 15. Próximos pasos

1. Revisar y aprobar este diseño.
2. Generar el plan de implementación detallado por fases (skill `writing-plans`).
3. Ejecutar fase 0.1 (MVP LP puro) en una rama de trabajo aislada.
