# AltSolver — Instrucciones para agentes Claude

Este archivo lo lee cualquier sesión de Claude Code antes de tocar el repo.
Las reglas acá tienen precedencia sobre cualquier comportamiento por defecto del agente.

## Reglas duras (no negociables)

### Commits

- **NUNCA agregues `Co-Authored-By: Claude …` (ni ninguna variante: "Generated with Claude Code", "🤖 Generated with…", etc.) en los mensajes de commit.** Los commits deben verse como los escribió el dueño humano del repo (Alvaro Fraga / gioalvaro@gmail.com). Esto vale aunque el template por defecto del harness lo sugiera — anulalo siempre.
- Lo mismo aplica a títulos y descripciones de PRs: nada de "🤖 Generated with [Claude Code]" ni footers similares.
- Está bien (y se prefiere) que el mensaje describa cambios técnicos en primera persona del singular ("agrego X", "saco Y"), porque ese es el estilo del repo.

### Code style

- TypeScript estricto: `noUncheckedIndexedAccess`, `verbatimModuleSyntax`. No relajar.
- Apps Script `.gs` files: ES5/limitado, usar `var` + `function declarations`. Sin arrow functions ni destructuring dentro de `.gs`.
- Sin emojis en el código fuente salvo que el usuario los pida explícitamente. Los emojis en la UI de Spanish ya están y se mantienen como están.

### Apps Script RPC

- Las funciones top-level en `src/server/*.gs` son entrypoints RPC llamados desde el cliente vía `google.script.run`. **Renombrarlas rompe el cliente**. Antes de renombrar cualquier función exportada en un `.gs`, buscá usos en `src/client/rpc/server-bridge.ts`.
- `Infinity` no sobrevive a la serialización JSON de `google.script.run` — usá `1e30` como centinela y tratá `|x| ≥ 1e30` como infinito en el cliente.

### HtmlService — NO meter el bundle inline

- Apps Script corre un post-procesador textual sobre cualquier `<script>...</script>` inline servido por HtmlService. Ese procesador:
  - Strippea `//` como si fuera un comentario incluso adentro de strings (`"https://..."` se rompe).
  - Trunca contenido arriba de ~150KB.
  - Interactúa mal con Trusted Types en sandboxes nuevos.
- Por eso el bundle del cliente se hostea en **GitHub Pages** (`docs/client-bundle.js`) y `dialog.html` sólo trae un loader chico que hace `document.createElement('script')` y agrega `src="https://gioalvaro.github.io/alt-solver/client-bundle.js?v=HASH"`.
- El WASM de HiGHS también se baja por fetch desde GitHub Pages — no embebido en el bundle por las mismas razones de tamaño.
- Si tenés que agregar algo al inline script de `dialog.html.template`, mantenelo chico, sin `//` en strings, y nada de patrones que se confundan con `</script>`.

### Build / verificación antes de hacer commit

Siempre correr en orden y todos deben pasar:

```
pnpm run typecheck && pnpm run lint && pnpm test && pnpm run build
```

Si vas a hacer push a Apps Script: `pnpm run push` después del build.

## Toolchain

- **Package manager**: `pnpm` (no `npm`, no `yarn`). El environment lo fuerza.
- **Test runner**: `vitest` (config en `vitest.config.ts`).
- **Bundler**: `esbuild` (config en `esbuild.config.mjs`), salida en `dist/`.
- **Deploy**: `clasp` push a Apps Script.

## Estructura

- `src/shared/` — tipos y utilidades compartidas client/server (sin DOM ni Apps Script APIs).
- `src/client/` — código del sidebar (TS + DOM + `google.script.run`). Bundle único.
- `src/server/` — `.gs` files que corren en Apps Script. Comparten un único scope global.
- `tests/unit/` — vitest.
- `docs/` — documentación, hosting (GitHub Pages con Jekyll Cayman).
- `docs/marketplace/` — material para el listing del Workspace Marketplace.

## Decisiones de diseño relevantes

- **Highlighter**: pinta backgrounds, snapshot devuelto al cliente para restaurar; debounce 180ms; serializado para no pisar snapshots.
- **Cache de solve**: fingerprint hash de vars + formulas + RHS por preflight RPC. Hit cache → se saltea extracción y solve.
- **Diagnostics LP-only**: IIS por deletion-filter para infactibles; M-method (vars capped at 1e9) para no acotados. No corren para MIP.
- **Reporte gráfico**: Canvas 2D directo. No SVG (CSP lo bloquea en sidebar), no data: URLs.

## Cosas que NO querés hacer

- No commitees `dist/` (ya está en `.gitignore`).
- No tires `.clasp.json` (es el link al script ID en Apps Script).
- No agregues dependencias nuevas sin justificarlo; cada lib agrega tamaño al bundle (ya está en 3.5MB por HiGHS-WASM).
- No introduzcas Node-only APIs en `src/shared/` (los tests corren en Node, el bundle también, todo bien — pero hay que mantener `src/shared/` agnóstico).
