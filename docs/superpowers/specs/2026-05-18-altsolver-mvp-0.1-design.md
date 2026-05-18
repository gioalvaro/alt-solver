# AltSolver MVP 0.1 — Diseño técnico (solver + reportes)

**Fecha:** 2026-05-18
**Autor:** Equipo AltSolver
**Estado:** Diseño aprobado, listo para plan de implementación
**Spec padre:** [2026-05-17-altsolver-design.md](./2026-05-17-altsolver-design.md)
**Versión previa:** MVP 0.0 (v0.0.1) — scaffolding + dialog UI + persistencia. El botón "Resolver" existe pero está deshabilitado.

## 1. Resumen ejecutivo

MVP 0.1 convierte AltSolver de "esqueleto de UI" a "producto funcional": habilita el botón Resolver, integra HiGHS-WASM client-side, extrae los coeficientes lineales de la hoja mediante perturbación numérica al estilo Excel, resuelve LP puro y MIP (con int/bin), y escribe dos reportes en hojas nuevas — Respuesta y Sensibilidad — con un nivel de pulido visual superior al del Solver de Excel.

End-state: el usuario abre el add-on, completa el modelo, hace click en Resolver y al instante recibe la solución en sus celdas + reportes con presentación tipo dashboard.

## 2. Alcance

### En alcance (MVP 0.1)
- **LP puro** con Simplex revised de HiGHS.
- **MIP** con int/bin via branch-and-bound de HiGHS.
- **Sentido TARGET ("Valor de:")** mediante reformulación interna con variables auxiliares (transparente al usuario).
- **Extracción de coeficientes** vía perturbación numérica batched (paridad con Excel Solver).
- **Reporte de Respuesta** (Answer) — para LP y MIP, con valores iniciales/finales, estado vinculante y holgura.
- **Reporte de Sensibilidad** — sólo LP puro (igual que Excel), con costos reducidos, precios sombra y rangos.
- **Pulido visual** del diálogo principal (header bar, secciones, cards, summary inline).
- **Diálogo de resultados** post-solve estilo dashboard.
- **Reportes con dashboard look**: tab colors, zebra rows, chips Binding/Not-Binding, ∞ en lugar de `1E+30`, subscripts en nombres de variables.
- **Mensajes de error accionables** en español para los 5 estados de HiGHS (Optimal, Infeasible, Unbounded, TimeLimit, IterLimit) más errores de extracción.
- **Rango de variables 1D** (columna o fila).
- **Suite golden** de 10 casos comparando paridad con Excel.

### Fuera de alcance (versiones futuras)
- Limits Report → MVP 0.3.
- Variables 2D (matriz) o rangos disjuntos → futuro indeterminado.
- i18n EN → MVP 0.4.
- Cancelación durante solve → MVP 0.4 (requiere Worker).
- Telemetría → MVP 1.0.
- Marketplace público + verificación OAuth → MVP 1.0.

## 3. Decisiones arquitectónicas

### 3.1 HiGHS-WASM client-side, lazy load
- Bibliotca: `highs-js` (HiGHS compilado a WASM).
- Carga lazy: el binario (~1.5 MB) se carga al primer click en "Resolver", no al abrir el diálogo.
- Se embebe en el bundle como recurso del HtmlService (no CDN externo) para evitar CSP issues y dependencia de red.

### 3.2 Extracción por perturbación numérica
- Paridad con Excel Solver: setea `vars = 0`, lee constantes; setea `var_i = 1`, lee diferencias.
- Implementada server-side en `RangeIO.gs` con batched `setValues`/`getValues`.
- Costo: ~`2n + 3` RPCs por solve. Para n=20 vars: ~6 segundos. Para n=50: ~15 segundos.
- Warning preventivo si n > 50.
- Sanity check de linealidad después de la extracción (evaluación adicional en `vars=[0.5]*n`).

### 3.3 Single-call flow
- Un click en Resolver = una secuencia: validar → mostrar overlay → RPC extracción → solve cliente → mostrar diálogo de resultados → RPC escritura de reportes.
- Una sola serialización del modelo por solve (minimiza overhead Apps Script).

### 3.4 Diálogo modeless (heredado de MVP 0.0)
- `showModelessDialog`, no modal — necesario para que el range picker funcione (cliente puede interactuar con la hoja con el diálogo abierto).

### 3.5 Reportes ricos en formato
- `ReportWriter.gs` aplica formato visual completo: bandas color de marca, zebra striping, chips de estado, format numérico localizado, freeze, autoresize, tab color, notas explicativas en headers.
- Notable: reemplazamos `"1E+30"` (Excel) por `∞` para mejor legibilidad.

## 4. Arquitectura

Se mantiene el patrón del MVP 0.0 + tres módulos nuevos:

```
src/
├── server/                          # Apps Script
│   ├── Menu.gs          [existe]
│   ├── Dialog.gs        [existe]
│   ├── ModelStore.gs    [existe]
│   ├── RangeIO.gs       ← NUEVO
│   ├── ReportWriter.gs  ← NUEVO
│   └── Errors.gs        ← NUEVO
├── shared/
│   ├── a1.ts            [existe]
│   ├── constants.ts     [existe]
│   ├── model-schema.ts  [existe]
│   └── linear-form.ts   ← NUEVO (tipos de la forma lineal)
├── client/
│   ├── ...              [existe]
│   ├── solver/          ← NUEVO
│   │   ├── highs-loader.ts
│   │   ├── model-builder.ts
│   │   └── solve.ts
│   ├── reports/         ← NUEVO
│   │   ├── answer.ts
│   │   └── sensitivity.ts
│   ├── ui/
│   │   ├── results-modal.ts   ← NUEVO
│   │   ├── form.ts            [refresh visual]
│   │   ├── constraint-modal.ts [refresh visual]
│   │   └── options-modal.ts   [refresh visual]
│   └── errors/          ← NUEVO
│       └── error-messages.ts
└── vendor/
    └── highs.wasm       ← NUEVO (embebido base64 en el bundle)
```

### Boundaries
- `RangeIO.gs` y `ReportWriter.gs` son los únicos que tocan la API de Spreadsheet en server.
- `solver/` cliente recibe un objeto plano (forma lineal ya extraída) — no sabe nada de celdas.
- `reports/` cliente produce `string[][]` — la escritura y formato son de `ReportWriter.gs`.

## 5. Algoritmo de extracción de coeficientes

```
INPUT: ModelDocument resuelto (referencias A1)
OUTPUT: LinearForm { vars[], objCoefs[], rows[], b0_obj }

Pasos (todos batched, total 2n+3 RPCs):

1. variablesOriginal ← getValues(rangoVars)
2. evalCells ← [objCellA1, ...lhsA1 de cada constraint linear, ...rhs cuando es A1]
3. setValues(rangoVars, ceros)            ; 1 write
4. b0 ← getValues(evalCells)              ; 1 read
   b0_obj ← b0[indexOf(objCellA1)]
   b0_rows[j] ← b0[indexOf(rowsLhsA1[j])]
5. PARA i ∈ 1..n:
      setValues(rangoVars, e_i)           ; 1 write  (e_i: 1 en posición i, 0 resto)
      b_i ← getValues(evalCells)          ; 1 read
      a_obj[i] ← b_i[idxObj] - b0_obj
      a_rows[j][i] ← b_i[idxRow_j] - b0_rows[j]
6. setValues(rangoVars, variablesOriginal); 1 write  (restore)
```

### Validaciones durante extracción
- Si `getValues` devuelve `#REF!`, `#NAME?`, etc., abortar con error señalando la celda.
- Si alguna celda de variable contiene fórmula (`getFormulas()` no vacío), abortar antes del paso 3.
- Si int/bin se aplica a una celda fuera de `rangoVars`, error.

### Sanity check de linealidad
Después del paso 5 (antes del restore):
- Setear `vars = [0.5]*n`, leer evaluaciones, comparar con `b0 + 0.5 * sum(a_*)`.
- Diferencia > `1e-6` → warning (no bloquea): "El modelo no parece lineal en la celda X."

### Tipo `LinearForm` (compartido)

```ts
interface LinearForm {
  vars: Array<{
    name: string;          // inferido o "x1", "x2", ...
    lower: number;         // 0 si assumeNonNegative, else -∞
    upper: number;         // +∞ por defecto; 1 si bin
    integral: boolean;     // true si int o bin
    originalValue: number; // del snapshot
  }>;
  objective: {
    name: string;
    cellA1: string;
    sense: 'MAX' | 'MIN' | 'TARGET';
    coefs: number[];       // longitud n
    constant: number;      // b0_obj
    originalValue: number;
  };
  rows: Array<{
    name: string;
    lhsA1: string;
    op: '<=' | '=' | '>=';
    coefs: number[];       // longitud n
    rhs: number;           // resuelto (si era A1, ya leído)
    constant: number;      // término constante de LHS evaluada en 0
    lhsOriginalValue: number;
  }>;
}
```

## 6. Construcción del input HiGHS

`model-builder.ts` traduce `LinearForm` a la estructura que espera `highs-js`:

```ts
interface HighsInput {
  sense: 1 | -1;   // 1 = MIN, -1 = MAX (HiGHS minimiza; multiplicamos coefs por -1 si MAX)
  offset: number;  // constante del objetivo (informativa)
  columns: Array<{
    lower: number;
    upper: number;
    cost: number;
    type: 'continuous' | 'integer';
  }>;
  rows: Array<{
    lower: number;  // -inf si "<=" o "="
    upper: number;  // +inf si ">=" o "="
    coefs: Array<{ idx: number; val: number }>; // sparse
    name: string;
  }>;
}
```

Reglas de transformación:
- `"<="` → `row.lower = -inf, row.upper = rhs`
- `">="` → `row.lower = rhs, row.upper = +inf`
- `"="` → `row.lower = row.upper = rhs`
- `bin` → `column.lower = 0, column.upper = 1, column.type = integer`
- `int` → `column.type = integer`, bounds heredan del modelo
- `sense = MAX` → negamos `column.cost` y guardamos flag; al leer el resultado, negamos `objective_value` de vuelta.
- `sense = TARGET valor V` → minimizamos `|sum(c_i*x_i) - V|`; en MVP 0.1 esto se modela introduciendo dos variables auxiliares (positiva y negativa) — SIN exponerlas al usuario. Esquema: `min d_pos + d_neg` s.t. `obj_expr - d_pos + d_neg = V, d_pos, d_neg ≥ 0`.

## 7. Flujo de solve

```
1. Cliente valida modelo (objetivo, vars, A1s) → mensajes inline si falla.
2. Cliente muestra overlay "Resolviendo…" con spinner Material + backdrop blur.
3. RPC: extractLinearForm(modelDoc) → LinearForm + sanity check.
4. Si linealidad sospechosa → warning amarillo en el overlay con CTA "Continuar"/"Cancelar".
5. Si OK → highs.solve(input, options) en cliente.
6. Mapear resultado HiGHS → SolveResult normalizado:
   { status, objective, variables[], constraints[], ranging?, iterations, time, isMip }
7. Según status:
   - optimal → preparar reportes, abrir results-modal.
   - infeasible/unbounded/error → restaurar valores originales, abrir results-modal en modo error.
   - time_limit/iter_limit con feasible → results-modal con badge "no óptimo".
   - time_limit/iter_limit sin feasible → results-modal en modo error con CTA "Aumentar tiempo".
8. En results-modal el usuario:
   - elige Conservar / Restaurar valores
   - elige qué reportes generar (checkboxes)
   - confirma con Aceptar
9. RPC: writeResults({ variableValues, objectiveValue, reports[], saveModel })
   ReportWriter.gs:
   - setea valores en celdas (o las restaura)
   - crea hojas "Respuesta N", "Sensibilidad N" autoincrementales
   - pega matrices con setValues batched
   - aplica formato visual (Sección 9)
   - persiste meta.solvedAt en el ModelDocument
10. Cliente cierra results-modal y luego invoca `google.script.host.close()` para cerrar el diálogo principal. El usuario vuelve a la hoja con los valores actualizados y la última hoja de reporte activa en la pestaña inferior.
```

### Cancelación
- Durante extracción: flag `canceled` que `RangeIO` chequea entre RPCs (`if (cancelToken.flag) throw 'canceled'`).
- Durante solve: HiGHS-WASM corre en el thread principal, sin cancel posible. Para problemas didácticos (~30 vars) el solve termina en <2s. Aceptable.

## 8. Diálogo de resultados (results-modal)

Sub-modal sobre el diálogo principal, ~480x520 px, con polish visual.

Layout (ver mock detallado en `docs/superpowers/specs/2026-05-17-altsolver-design.md#sección-8`):

- **Banner de status** con pill coloreado + ícono Material:
  - verde `#137333` ✓ óptimo
  - amarillo `#b06000` ⚠ tiempo/iter
  - rojo `#d93025` ✕ infactible/unbounded/error
- **Valor objetivo** destacado con tipografía 36px medium, separador de miles localizado (`Intl.NumberFormat('es-AR')`), delta vs valor original.
- **Resumen tabular** (Estado, Motor, Tiempo, Iteraciones, Variables, Restricciones).
- **Radios** Conservar/Restaurar (default Conservar, igual que Excel).
- **Checkboxes** de reportes:
  - Respuesta — siempre habilitado.
  - Sensibilidad — habilitado sólo si `isMip === false`. Si MIP, deshabilitado con mensaje "No disponible para problemas enteros (igual que Excel)."
- **Botones** Cerrar (secundario) y Aceptar (primario azul `#1a73e8`).

Estados especiales del banner:
- Time limit + feasible → "Solución encontrada pero no óptima. Gap: X%." + CTA "Continuar resolviendo +60s" que reanuda con time_limit extendido.
- Infactible → "El modelo no tiene solución factible." + lista heurística de posibles causas (pares ≤/≥ con LHS similar).
- No acotado → "La función objetivo es no acotada." + sugerencia ("falta cota superior en alguna variable").

Transiciones: fade-in 200ms ease-out al abrir. Tras Aceptar, cierra resultados + dialog principal y la primera hoja de reporte queda activa.

## 9. Reportes con dashboard look

### 9.1 Reporte de Respuesta (Answer)

Estructura:
1. Título 18pt bold "AltSolver · Informe de Respuesta"
2. Subtítulo 11pt gris con nombre de hoja, timestamp ISO, valor objetivo
3. Banda "Resumen del solver" (fondo `#E8F0FE`, 1 fila × 4 columnas): Motor, Solución, Tiempo, Iteraciones
4. Sección "Función objetivo" (1 fila): Celda, Nombre, Valor inicial, Valor final
5. Sección "Variables de decisión" (n filas): Celda, Nombre, Valor inicial, Valor final, Tipo
6. Sección "Restricciones" (m filas): Celda, Nombre, Valor, Fórmula, Estado, Holgura

Formato:
- Headers tabla: bg `#F1F3F4`, font weight 500, row height 28
- Zebra striping en filas de datos: `white` y `#FAFAFA`
- Números: `#,##0.00` con locale; valores 0 grisados (`#9aa0a6`)
- Chip "Vinculante" con bullet ● color `#137333` bold; "No vinculante" con ○ gris `#9aa0a6` regular
- Bordes: solo horizontales internos color `#DADCE0`, sin verticales
- Subscripts en nombres: `x1` → `x` + `₁` (RichText)
- Auto-resize columnas; freeze rows hasta la fila de headers de la primera tabla
- Tab color de la hoja: azul `#1a73e8`

### 9.2 Reporte de Sensibilidad (solo LP)

No se genera si `isMip === true`. Estructura:
1. Título + subtítulo (igual que Respuesta)
2. Tabla "Variables de decisión": Celda, Nombre, Valor final, Costo reducido, Coef. objetivo, Incremento admisible, Decremento admisible
3. Tabla "Restricciones": Celda, Nombre, Valor final, Precio sombra, Lado derecho, Incremento admisible, Decremento admisible

Específicos:
- `∞` Unicode reemplaza al `1E+30` de Excel
- Costo reducido y precio sombra: valor ≠ 0 en color marca `#1a73e8`; valor 0 en `#9aa0a6`
- Tooltips docentes en headers vía `setNote()` (ej: "Precio sombra: cambio en el objetivo por unidad de aumento del lado derecho")
- Tab color: púrpura `#9334E8`

### 9.3 Naming

- `Respuesta 1`, `Respuesta 2`, …
- `Sensibilidad 1`, `Sensibilidad 2`, …
- Numeración sincronizada entre Respuesta y Sensibilidad por solve.

## 10. Polish visual del diálogo principal

Refresh visual sin cambios funcionales. Detalles:

- **Header bar** (48px, bg `#f8f9fa`): título "AltSolver" 16pt bold + subtítulo "Parámetros del modelo" 12pt gris + ícono `ⓘ` a la derecha.
- **Micro-labels de sección** uppercase, 11pt tracked, color `#5f6368` ("FUNCIÓN OBJETIVO", "VARIABLES DE DECISIÓN", etc.) + divider sutil entre secciones.
- **Spacing scale 4px** (4/8/12/16/24/32) reemplaza el "todo es 16px".
- **Inputs**: borde 1.5px radio 8px; focus con borde `#1a73e8` + sombra `0 0 0 3px rgba(26,115,232,0.15)`; trailing icon `✓` verde cuando A1 válido.
- **Botón ⌖ circular** (36x36px), mantiene estado "picking" pulsante (ya implementado).
- **Cards de restricciones**: filas con bordes redondeados 6px, sombra `0 1 2 rgba(0,0,0,0.05)`. Hover muestra acciones. Doble-click abre modal de edición.
- **Sección Opciones compacta**: summary inline con valores actuales + botón "Más…" para abrir sub-modal.
- **Botones de acción**: izquierda "💾 Guardar" secundario gris, derecha "▶ Resolver" primario azul 1.5x altura.
- **Toast "Modelo guardado"**: deslizante desde abajo, auto-dismiss 2.5s (en vez de texto verde fijo).
- **Resolviendo overlay**: backdrop blur + spinner Material grande centrado + texto + botón Cancelar.
- **Animaciones**: 200ms ease-out (modal scale 0.95→1.0, cards slide-in, toast slide-up, ✓ scale-bounce).

## 11. Manejo de errores

Centralizado en `error-messages.ts` (i18n key → string es). Mensajes accionables con CTAs cuando aplica:

| Origen | Caso | Mensaje | CTA |
|---|---|---|---|
| Validación | Objetivo vacío | "Definí la celda objetivo antes de resolver." | Focus al input |
| Validación | Variables vacías | "Definí al menos una celda de variable." | Focus |
| Validación | A1 inválido | Inline ⚠ Referencia inválida | Auto |
| Validación | LHS no numérico | "La celda D12 no devuelve un número (`#REF!`). Revisá la fórmula." | "Ir a D12" |
| Validación | Var cell con fórmula | "Las celdas de variables no pueden contener fórmulas. Encontradas: B3, B5." | Listar |
| Extracción | Linealidad sospechosa | Warning amarillo: "Modelo no parece lineal en la celda D14." | "Continuar" / "Cancelar" |
| Extracción | int/bin fuera de rangoVars | "La restricción int sobre B9 apunta a una celda fuera del rango de variables." | Auto |
| HiGHS | kInfeasible | Banner rojo + heurística de causas | "Editar modelo" |
| HiGHS | kUnbounded | Banner rojo + sugerencia de cota | "Editar modelo" |
| HiGHS | kTimeLimit feasible | Banner amarillo + gap actual | "Continuar +60s" |
| HiGHS | kTimeLimit sin feasible | Banner rojo | "Aumentar tiempo" |
| HiGHS | kSolveError | "Error interno del solver." | "Copiar diagnóstico (MPS)" |
| RPC | google.script.run falla | Toast rojo + retry automático 1× | Auto |
| Runtime | WASM no carga | Modal con instrucciones de navegador | Link troubleshooting |
| Runtime | Quota Apps Script | "Google limitó las operaciones. Esperá unos minutos." | Auto |

## 12. Tests

### Unit (vitest)
```
tests/unit/
├── linear-form.test.ts      # algoritmo de extracción (mocked eval)
├── model-builder.test.ts    # LinearForm → HighsInput
├── solve-status.test.ts     # status HiGHS → SolveResult
├── reports/
│   ├── answer.test.ts       # output → matriz Answer
│   └── sensitivity.test.ts  # output → matriz Sensitivity
└── error-messages.test.ts   # i18n keys → strings
```

### Golden (paridad con Excel)
```
tests/golden/
├── 01-transporte-3x3.json
├── 02-dieta-cereales.json
├── 03-produccion-mezcla.json
├── 04-asignacion-bin.json
├── 05-corte-stock-int.json
├── 06-degenerado-lp.json
├── 07-multi-optimo.json
├── 08-infactible.json
├── 09-no-acotado.json
└── 10-time-limit.json
```

Cada caso: modelo + resultado esperado (Excel) celda por celda, tolerancia `1e-4` floats, exact match strings.

### E2E (clasp run)
```
tests/e2e/
├── solve-happy-path.gs
├── reload-saved-model.gs
├── infeasible-flow.gs
└── time-limit-flow.gs
```

### Verificación visual manual
Screenshots de referencia en `tests/golden/screenshots/` para los reportes pulidos. Gate manual antes de tag.

### Coverage objetivo
- Unit: ≥ 90% statements (lógica pura).
- Golden: 100% de los 10 casos.
- E2E: happy path + infactible + time_limit.

## 13. Criterios de aceptación para `v0.1.0`

1. Resuelve LP puro y MIP con paridad numérica a Excel (suite golden completa).
2. Genera Answer Report para LP y MIP; Sensitivity Report sólo para LP.
3. Modal principal con polish visual (Sección 10).
4. Results-modal con dashboard look (Sección 8).
5. Reportes con tab colors, zebra striping, chips Binding, ∞ literal, subscripts.
6. Maneja los 5 estados de HiGHS con mensajes accionables.
7. `pnpm test && pnpm run typecheck && pnpm run lint` verde.
8. Deploy en cuenta del usuario verificado en 3 problemas reales (dieta LP, asignación MIP, modelo infactible).

## 14. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| HiGHS-WASM se actualiza y rompe la API de ranging | Pin de versión en package.json + golden tests detectan regresiones |
| Perturbación numérica falla con celdas que tienen fórmulas iterativas o con feedback | Sanity check de linealidad explícito; warning pero no bloqueo |
| Bundle WASM (~1.5 MB) impacta tiempo de carga del diálogo | Carga lazy (solo al click en Resolver, no al abrir) |
| Apps Script quota errors con n grande | Warning preventivo si n > 50; documentar workaround (esperar 5 min) |
| Modelo `TARGET` (Valor de) requiere variables auxiliares no visibles para el usuario | Manejado internamente; documentar limitación: usuario ve `x_*` originales, no las auxiliares |
| Tab colors no se ven distinguibles en algunos temas de Sheets | Colores con contraste suficiente; documentación visual en README |

## 15. Próximos pasos

1. Revisar y aprobar este diseño.
2. Generar el plan de implementación detallado (skill `writing-plans`).
3. Ejecutar plan con subagent-driven development sobre branch `feat/mvp-0.1-solver`.
