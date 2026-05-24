# AltSolver — Listing para Google Workspace Marketplace

Material para completar el formulario del Marketplace SDK en Google Cloud Console.

## Datos del listing

| Campo | Valor |
|---|---|
| **App name** | AltSolver |
| **Tagline** (≤ 30 chars) | Solver para Google Sheets™ |
| **Short description** (≤ 90 chars) | Programación lineal y entera mixta para Google Sheets™, con paridad de reportes. |
| **Category** | Productivity → Business Tools (alternativa: Education) |
| **Pricing model** | Free |
| **Languages supported** | Español (v0.1), Inglés (v0.4) |
| **Visibility** | Unlisted (cambiar a Public en v1.0) |

## Detailed description (markdown, 4000 chars máx)

```
AltSolver es un complemento open-source que replica las capacidades del Solver de Microsoft Excel® directamente en Google Sheets™.

¿QUÉ RESUELVE?

  • Programación lineal (LP) con el método Simplex revisado.
  • Programación entera mixta (MIP) con branch-and-bound: soporta variables enteras (int) y binarias (bin).
  • Modelos didácticos a empresariales chicos (hasta ~50 variables y ~50 restricciones).

¿QUÉ REPORTES PRODUCE?

  • Informe de Respuesta: valores iniciales y finales, status vinculante/no vinculante, holguras.
  • Informe de Sensibilidad (LP): costos reducidos, precios sombra y rangos admisibles reales calculados por bisección sobre la base óptima.
  • Solución gráfica (problemas de 2 variables): región factible sombreada, vértices etiquetados con coordenadas, curvas de nivel del objetivo y óptimo destacado.

CÓMO SE USA

  1. Abrí AltSolver desde el menú Extensiones de Google Sheets™.
  2. Cargá uno de los 7 ejemplos pre-armados (Producción, Dieta, Mezcla, Mochila, Transporte, Asignación, Selección de proyectos) con un clic, o armá tu propio modelo con SUMPRODUCT.
  3. Definí la celda objetivo, el rango de variables y agregá restricciones.
  4. Clic en ▶ Resolver. En segundos vas a tener los reportes y la solución en celdas.

POR QUÉ ALTSOLVER

  • Sin backend propio: todo corre dentro del navegador.
  • Sin telemetría ni tracking.
  • Diagnóstico inteligente: si el modelo es infactible identifica las restricciones en conflicto; si no es acotado identifica las variables que crecen sin límite.
  • Motor de optimización HiGHS (Universidad de Edimburgo) compilado a WebAssembly.
  • Diseñado para uso educativo: paridad pedagógica con el Solver de Excel®, ideal para cursos de Investigación Operativa.

¿PARA QUIÉN ESTÁ HECHO?

  • Estudiantes y docentes de Investigación Operativa que usan Google Sheets™ en lugar de Excel.
  • Profesionales que necesitan resolver LPs/MIPs sin instalar software extra.
  • Cualquiera que extrañe el Solver de Excel® en el ecosistema de Google Workspace™.

CÓDIGO ABIERTO

AltSolver es 100% open-source bajo licencia MIT. Repositorio: https://github.com/gioalvaro/alt-solver

────────
Google Sheets™ y Google Workspace™ son marcas comerciales de Google LLC. Microsoft Excel® es una marca registrada de Microsoft Corporation. AltSolver es un proyecto independiente y no está respaldado, patrocinado ni afiliado a Google LLC ni a Microsoft Corporation.
```

## Screenshots requeridos

Tomar capturas (1280×800 PNG) de los siguientes momentos:

1. **Sidebar con modelo Taha cargado**: la columna del modelo a la derecha, hoja con las celdas del ejemplo a la izquierda. Resaltar el botón Resolver.
2. **Modal de resultados** justo después del solve: banner verde "AltSolver encontró una solución", valor objetivo 21,00, tabla de resumen.
3. **Informe de Respuesta** (pestaña `Respuesta 1`) abierto, con el formato dashboard, los chips ● Vinculante en verde, las tablas de variables y restricciones.
4. **Informe de Sensibilidad** (pestaña `Sensibilidad 1`) mostrando costos reducidos, precios sombra y los rangos admisibles.
5. **Solución gráfica** (pestaña `Solución gráfica 1`) con el plot: región factible, líneas de restricciones, vértices etiquetados, estrella del óptimo.

Tamaño obligatorio: **1280×800 px**. Formato PNG. Idealmente con un poco de chrome del navegador visible para dar contexto pero no demasiado.

## Logo

Tres tamaños PNG sobre fondo transparente:

| Tamaño | Dónde se usa |
|---|---|
| 32 × 32 | Favicon en listings y resultados de búsqueda |
| 64 × 64 | Listing card |
| 128 × 128 | Hero en el detalle del Marketplace |

Sugerencia de diseño: ícono "calculadora" estilo Material Symbols (`calculate` o `function`) en color azul Google `#1a73e8` con un toque distintivo (por ejemplo una pequeña x₁ + x₂ superpuesta o un símbolo Σ). Si querés algo más original, te puedo proponer 2-3 variantes en SVG para que elijas.

## Logo provisional (Google Material)

URL del placeholder que ya estamos usando en el manifest:
`https://www.gstatic.com/images/icons/material/system/1x/calculate_googblue_24dp.png`

Reemplazarlo por el logo definitivo cuando esté listo.

## Banner (opcional pero recomendado)

1280 × 800 PNG: el logo grande + el nombre AltSolver + el tagline. Diseñá si querés algo de identidad visual; si no, Marketplace usa el primer screenshot.

## Video demo (opcional, ≤ 30 segundos)

Si tenés tiempo, grabá:
1. Abrir AltSolver en una Sheet vacía.
2. Click en "Insertar ejemplo" → elegir Producción.
3. Click en Resolver.
4. Modal de resultados aparece, clic en Aceptar.
5. Tres pestañas nuevas: Respuesta, Sensibilidad, Solución gráfica.

Sube a YouTube como Unlisted, pegás la URL en el Marketplace.

## Submit checklist

Antes de mandar al review:

- [ ] Privacy Policy URL pública (GitHub Pages u otro host).
- [ ] Terms of Service URL pública.
- [ ] Logo 32, 64, 128 px PNG subidos.
- [ ] Al menos 1 screenshot 1280×800.
- [ ] OAuth Consent Screen completado en GCP.
- [ ] Workspace Marketplace SDK habilitado y configurado con el script ID.
- [ ] App configuration apunta al deployment correcto de Apps Script.
- [ ] Visibility = Unlisted.
- [ ] Submit for review.
