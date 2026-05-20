# AltSolver

Google Sheets add-on que replica el complemento Solver de Microsoft Excel: resuelve programación lineal (LP) y entera mixta (MIP) usando Simplex + branch-and-bound, y produce los reportes clásicos de Respuesta, Sensibilidad y Solución gráfica.

> **Status:** v0.1.0 — funcional, en uso educativo. Distribución por Marketplace Unlisted.

## ¿Qué hace?

- **Resuelve LP y MIP** vía [HiGHS](https://highs.dev/) compilado a WebAssembly (corre dentro del navegador del usuario, sin backend).
- **Extracción de coeficientes** por perturbación numérica al estilo Excel — el usuario arma su modelo con SUMPRODUCT y AltSolver detecta automáticamente la matriz A, los lados derechos y los coeficientes del objetivo.
- **Informe de Respuesta** — celdas con valores iniciales y finales, status vinculante/no vinculante, holguras.
- **Informe de Sensibilidad** (solo LP) — costos reducidos, precios sombra, **rangos admisibles de aumento/decremento** calculados por bisección sobre la base óptima.
- **Solución gráfica** para problemas de 2 variables — región factible, vértices etiquetados, curvas de nivel del objetivo y óptimo destacado.
- **Diálogo lateral** estilo Excel (sidebar pegado a la derecha, persistente) con selección de rangos por clic, gestión de restricciones (`≤`, `=`, `≥`, `int`, `bin`), y opciones del solver (tiempo máximo, gap MIP, etc.).
- **Ejemplos pre-cargados**: producción (Taha 3.1), dieta, mezcla, mochila 0-1 — un clic carga un modelo listo para resolver.
- **Modelo persistido** en Developer Metadata por hoja (viaja en copias del archivo).

## Quick start (desarrollo)

```bash
pnpm install
pnpm run build
pnpm exec clasp login
pnpm exec clasp create --type standalone --title "AltSolver (dev)" --rootDir ./dist
pnpm run push
pnpm exec clasp open  # luego: Deploy > Test deployments > Install
```

En cualquier Google Sheet de tu cuenta: **Extensions → AltSolver** (icono de calculadora azul a la derecha).

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm run build` | Bundlea el cliente en un único `dist/dialog.html` (incluye HiGHS WASM embebido), copia los `.gs` y el manifest |
| `pnpm run push` | `build` + `clasp push` (sube a tu proyecto Apps Script) |
| `pnpm test` | Corre los tests unitarios con vitest en Node |
| `pnpm run typecheck` | Type-check de TypeScript (Node + DOM) |
| `pnpm run lint` | ESLint sobre TS y GS |

## Arquitectura

- **Server-side (`src/server/*.gs`)**: orquestador en Apps Script. Toca la API de Sheets solo aquí (Menu, Dialog, ModelStore vía Developer Metadata, RangeIO para extracción, ReportWriter para hojas de reporte, Templates para ejemplos).
- **Client-side (`src/client/`)**: TypeScript que se bundlea con esbuild. Carga HiGHS-WASM lazy, arma el LP, llama al solver, normaliza el resultado y genera las matrices de reporte.
- **Shared (`src/shared/`)**: tipos puros (LinearForm, SolveResult, ModelDocument) usados por ambos lados.

Documentación de diseño completa en [docs/superpowers/specs/](docs/superpowers/specs/). Plan de implementación detallado en [docs/superpowers/plans/](docs/superpowers/plans/).

## Versión del solver

- **HiGHS** 1.8 (vía `highs` npm package). Compilado a WebAssembly de ~700 KB embebido en el bundle.
- Sin backend externo: cero infraestructura, cero costo, cero datos saliendo de Google.

## Scopes OAuth

- `spreadsheets.currentonly` — leer/escribir solo la hoja activa.
- `script.container.ui` — para mostrar el sidebar y los modales.
- `script.locale` — para detectar idioma del documento.

Todos no-sensitive según la política de Google, así que la verificación OAuth es trivial.

## Roadmap (post-v0.1.0)

- **0.2** — Batched perturbation (extraer todos los coeficientes en una sola RPC, 10× más rápido), diagnóstico inteligente de infactible/no acotado, "Continuar +60s" cuando el time limit se agota.
- **0.3** — Informe de Límites (Limits Report), opciones avanzadas completas (tolerancias finas).
- **0.4** — i18n inglés, cancelación durante el solve.
- **1.0** — Marketplace público + telemetría opt-in.

## Licencia

Ver [LICENSE](LICENSE).
