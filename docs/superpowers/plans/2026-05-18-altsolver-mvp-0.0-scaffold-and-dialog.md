# AltSolver — MVP 0.0: Scaffolding + Smoke + Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployable Google Sheets add-on that the user can install in their own Google account, with the Excel-style modal dialog working end-to-end (form fields, range picker, constraint editor, options) and model persistence via Developer Metadata — but without the actual solver yet.

**Architecture:** Apps Script orquestador + HtmlService modal dialog. Server-side `.gs` files are thin I/O wrappers; all testable logic lives in TypeScript under `src/shared/` and `src/client/` (vitest in Node). esbuild bundles the client into a single `dialog.html`. clasp pushes to Apps Script. No solver in this plan — that's MVP-0.1.

**Tech Stack:** TypeScript 5, esbuild, vitest, clasp, ESLint, Prettier, Apps Script V8 runtime.

**End-state acceptance:** The user runs `npm run deploy`, then in any Google Sheet of theirs the menu **Extensions → AltSolver → Resolver…** opens a modal that lets them: pick objective cell, pick variable range, add/edit/remove linear and int/bin constraints, configure options, save the model. The model persists in the document. No solve button yet (or it shows "Próximamente en MVP-0.1").

---

## Pre-flight (manual user steps — do these once before Task 0.1)

These cannot be automated. Confirm with the user before starting Task 0.1.

- [ ] **PF.1: Enable Apps Script API on Google account**

  In a browser as `gioalvaro@gmail.com`, open https://script.google.com/home/usersettings and toggle **Google Apps Script API** to ON.

- [ ] **PF.2: Install clasp globally**

  Run: `npm install -g @google/clasp`
  Verify: `clasp --version` → prints `2.x.x` or higher.

- [ ] **PF.3: Login to clasp**

  Run: `clasp login`
  This opens the browser. Login with `gioalvaro@gmail.com`. Verify: `~/.clasprc.json` exists and contains a token.

---

## File Structure

Top-level (created by Task 0.1 unless noted):

```
alt-solver/
├── package.json
├── tsconfig.json
├── tsconfig.client.json
├── .eslintrc.cjs
├── .prettierrc.json
├── vitest.config.ts
├── esbuild.config.mjs
├── appsscript.json
├── .clasp.json                   (created by clasp create — gitignored)
├── .gitignore                    (already exists)
├── LICENSE                       (already exists)
├── src/
│   ├── server/                   # Apps Script .gs files
│   │   ├── Menu.gs
│   │   ├── Dialog.gs
│   │   └── ModelStore.gs
│   ├── client/                   # bundled into dialog.html
│   │   ├── google.d.ts           # ambient types for Apps Script host
│   │   ├── dialog.html.template  # esbuild reads + injects
│   │   ├── index.ts              # entry point
│   │   ├── app.ts                # controller
│   │   ├── ui/
│   │   │   ├── form.ts           # main form
│   │   │   ├── constraints-list.ts
│   │   │   ├── constraint-modal.ts
│   │   │   ├── range-picker.ts
│   │   │   └── options-modal.ts
│   │   ├── state/
│   │   │   └── model-draft.ts    # in-memory model + serialization
│   │   ├── rpc/
│   │   │   └── server-bridge.ts  # google.script.run wrappers
│   │   └── i18n/
│   │       ├── i18n.ts
│   │       └── es.json
│   └── shared/                   # used by both client and server
│       ├── model-schema.ts       # types + validation
│       ├── a1.ts                 # A1 parsing/validation pure functions
│       └── constants.ts
├── tests/
│   └── unit/
│       ├── model-schema.test.ts
│       ├── a1.test.ts
│       └── model-draft.test.ts
├── scripts/
│   └── build-dialog-html.mjs     # injects bundled JS into HTML template
├── dist/                         # esbuild output (gitignored)
└── docs/
    └── superpowers/
        ├── specs/2026-05-17-altsolver-design.md   (exists)
        └── plans/2026-05-18-altsolver-mvp-0.0-scaffold-and-dialog.md   (this file)
```

**Boundaries:**
- `src/server/`: only file that touches Apps Script Spreadsheet/HtmlService APIs. Thin wrappers.
- `src/client/`: only file that touches the DOM. No knowledge of Apps Script APIs except via `src/client/rpc/`.
- `src/shared/`: pure TypeScript, no DOM, no Apps Script. Fully testable in Node.

---

## Phase 0: Project scaffolding

### Task 0.1: Initialize package.json and TypeScript

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.client.json`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "alt-solver",
  "version": "0.0.1",
  "private": true,
  "description": "Google Sheets add-on that replicates Excel's Solver for LP/MIP problems",
  "type": "module",
  "scripts": {
    "build": "node esbuild.config.mjs && node scripts/build-dialog-html.mjs",
    "typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.client.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint 'src/**/*.{ts,gs}'",
    "format": "prettier --write 'src/**/*.{ts,gs,html,json}'",
    "push": "npm run build && clasp push -f",
    "deploy": "npm run build && clasp push -f && echo 'Open Apps Script editor and use Deploy > Test deployments > Install'"
  },
  "devDependencies": {
    "@google/clasp": "^2.4.2",
    "@types/google-apps-script": "^1.0.83",
    "@types/node": "^20.11.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "esbuild": "^0.20.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.0",
    "typescript": "^5.4.0",
    "vitest": "^1.4.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json` (for `src/shared/` and Node tests)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "rootDir": ".",
    "outDir": "dist/tsc",
    "noEmit": true
  },
  "include": ["src/shared/**/*.ts", "tests/**/*.ts", "scripts/**/*.mjs"]
}
```

- [ ] **Step 3: Create `tsconfig.client.json` (for `src/client/` with DOM)**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  },
  "include": ["src/client/**/*.ts", "src/shared/**/*.ts"]
}
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`
Expected: `node_modules/` created, no errors. `package-lock.json` generated.

- [ ] **Step 5: Verify typecheck runs (and fails clean — no sources yet)**

Run: `npm run typecheck`
Expected: error like `No inputs were found in config file` — this is fine, confirms tsc runs. We'll have sources by Task 0.5.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.client.json
git commit -m "chore: bootstrap package.json and TypeScript config"
```

---

### Task 0.2: Configure linting and formatting

**Files:**
- Create: `.eslintrc.cjs`
- Create: `.prettierrc.json`

- [ ] **Step 1: Create `.eslintrc.cjs`**

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  env: { node: true, browser: true, es2022: true },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['src/server/**/*.gs'],
      parser: 'espree',
      parserOptions: { ecmaVersion: 2022, sourceType: 'script' },
      env: { browser: false, node: false },
      globals: {
        SpreadsheetApp: 'readonly',
        HtmlService: 'readonly',
        Session: 'readonly',
        Logger: 'readonly',
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        'no-undef': 'error',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/'],
};
```

- [ ] **Step 2: Create `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 3: Verify lint runs (no errors on empty src)**

Run: `npm run lint`
Expected: exits successfully (no files yet).

- [ ] **Step 4: Commit**

```bash
git add .eslintrc.cjs .prettierrc.json
git commit -m "chore: add eslint and prettier config"
```

---

### Task 0.3: Configure vitest

**Files:**
- Create: `vitest.config.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    globals: false,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/shared/**/*.ts', 'src/client/**/*.ts'],
      exclude: ['src/client/**/*.html.template', 'src/server/**/*'],
    },
  },
});
```

- [ ] **Step 2: Verify vitest runs**

Run: `npm test`
Expected: `No test files found` — confirms vitest is configured.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: add vitest config"
```

---

### Task 0.4: Configure Apps Script manifest

**Files:**
- Create: `appsscript.json`

- [ ] **Step 1: Create `appsscript.json`**

```json
{
  "timeZone": "America/Argentina/Buenos_Aires",
  "runtimeVersion": "V8",
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets.currentonly",
    "https://www.googleapis.com/auth/script.container.ui",
    "https://www.googleapis.com/auth/script.locale"
  ],
  "addOns": {
    "common": {
      "name": "AltSolver",
      "logoUrl": "https://www.gstatic.com/images/icons/material/system/1x/calculate_googblue_24dp.png",
      "useLocaleFromApp": true
    },
    "sheets": {}
  }
}
```

Note: the `logoUrl` is a Google-hosted material icon placeholder for dev. Replace with our own hosted asset in MVP 1.0.

- [ ] **Step 2: Commit**

```bash
git add appsscript.json
git commit -m "chore: add Apps Script manifest"
```

---

### Task 0.5: First shared module — `constants.ts`

This is the smallest possible TS source so we can verify the typecheck loop works end-to-end before doing anything real.

**Files:**
- Create: `src/shared/constants.ts`

- [ ] **Step 1: Create `src/shared/constants.ts`**

```ts
export const METADATA_KEY = 'altsolver.model.v1';
export const SCHEMA_VERSION = 1;
export const DEFAULT_OPTIONS = {
  assumeNonNegative: true,
  timeLimitSec: 100,
  iterLimit: null as number | null,
  mipGap: 1e-4,
  integerTolerance: 1e-6,
} as const;
export const INFINITY_STR = '1E+30';
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: passes silently (exit 0).

- [ ] **Step 3: Commit**

```bash
git add src/shared/constants.ts
git commit -m "feat: add shared constants module"
```

---

### Task 0.6: Ambient TS declarations for the `google` host bridge

Apps Script injects a `google.script.run` and `google.script.host` global into the iframe. We declare it once here so all client modules can use it without duplicating the `declare global` block (TS would error on conflicting variable type declarations).

**Files:**
- Create: `src/client/google.d.ts`

- [ ] **Step 1: Create `src/client/google.d.ts`**

```ts
/**
 * Ambient declarations for the Apps Script host bridge injected into the
 * HtmlService iframe at runtime.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface GoogleScriptRunner { [fnName: string]: any }
  interface GoogleScriptHostEditor { focus(): void }
  interface GoogleScriptHost { editor: GoogleScriptHostEditor }
  interface GoogleScriptApi {
    run: GoogleScriptRunner & {
      withSuccessHandler(cb: (r: unknown) => void): GoogleScriptApi['run'];
      withFailureHandler(cb: (e: Error) => void): GoogleScriptApi['run'];
    };
    host?: GoogleScriptHost;
  }
  const google: { script: GoogleScriptApi };
}
export {};
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/client/google.d.ts
git commit -m "chore: ambient types for Apps Script host bridge"
```

---

## Phase 1: esbuild + dialog.html bundling

The Apps Script HtmlService requires a single `.html` file. esbuild bundles `src/client/index.ts` into a single JS string, which we inject into a static `dialog.html.template`. Final `dist/dialog.html` is what `clasp push` uploads.

### Task 1.1: esbuild config and HTML template

**Files:**
- Create: `esbuild.config.mjs`
- Create: `scripts/build-dialog-html.mjs`
- Create: `src/client/dialog.html.template`
- Create: `src/client/index.ts`

- [ ] **Step 1: Create `src/client/dialog.html.template`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <base target="_top" />
  <title>AltSolver</title>
  <style>
    body { font-family: 'Google Sans', Roboto, Arial, sans-serif; margin: 0; padding: 16px; color: #202124; font-size: 14px; }
    #app { min-height: 580px; }
    .smoke { display: flex; align-items: center; justify-content: center; height: 100%; min-height: 580px; flex-direction: column; gap: 8px; }
    .smoke h1 { font-size: 24px; font-weight: 400; margin: 0; }
    .smoke p { color: #5f6368; margin: 0; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    /* __CLIENT_BUNDLE__ */
  </script>
</body>
</html>
```

- [ ] **Step 2: Create `src/client/index.ts` (minimum bootstrap)**

```ts
import { mountApp } from './app';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('app');
  if (!root) {
    throw new Error('AltSolver: #app element not found');
  }
  mountApp(root);
});
```

- [ ] **Step 3: Create `src/client/app.ts` (smoke stub — will be replaced in Phase 3)**

```ts
export function mountApp(root: HTMLElement): void {
  root.innerHTML = `
    <div class="smoke">
      <h1>AltSolver</h1>
      <p>Listo. UI en construcción.</p>
    </div>
  `;
}
```

- [ ] **Step 4: Create `esbuild.config.mjs`**

```js
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

await build({
  entryPoints: ['src/client/index.ts'],
  bundle: true,
  format: 'iife',
  target: ['chrome100', 'firefox100', 'safari15'],
  platform: 'browser',
  minify: false,
  sourcemap: false,
  outfile: 'dist/client-bundle.js',
  legalComments: 'none',
  logLevel: 'info',
});
```

- [ ] **Step 5: Create `scripts/build-dialog-html.mjs`**

```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('dist', { recursive: true });

const template = readFileSync('src/client/dialog.html.template', 'utf-8');
const bundle = readFileSync('dist/client-bundle.js', 'utf-8');

const html = template.replace('/* __CLIENT_BUNDLE__ */', bundle);

writeFileSync('dist/dialog.html', html);
console.log(`Built dist/dialog.html (${html.length} bytes)`);
```

- [ ] **Step 6: Run build and verify output**

Run: `npm run build`
Expected:
- `dist/client-bundle.js` exists, contains the IIFE.
- `dist/dialog.html` exists, contains both the HTML structure AND the bundled JS inline.

Verify: `grep -c 'mountApp' dist/dialog.html` → at least 2 (the function call site + the function definition from the bundle).

- [ ] **Step 7: Commit**

```bash
git add esbuild.config.mjs scripts/build-dialog-html.mjs src/client/dialog.html.template src/client/index.ts src/client/app.ts
git commit -m "feat: bundle client into single dialog.html via esbuild"
```

---

## Phase 2: Apps Script smoke (menu + open dialog)

### Task 2.1: Menu and Dialog .gs files

**Files:**
- Create: `src/server/Menu.gs`
- Create: `src/server/Dialog.gs`

- [ ] **Step 1: Create `src/server/Menu.gs`**

```js
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
```

- [ ] **Step 2: Create `src/server/Dialog.gs`**

```js
/**
 * Opens the main AltSolver dialog.
 * Loaded from dialog.html (bundled by esbuild).
 */
function showSolverDialog() {
  const html = HtmlService.createHtmlOutputFromFile('dialog')
    .setWidth(520)
    .setHeight(620)
    .setTitle('AltSolver — Parámetros');
  SpreadsheetApp.getUi().showModalDialog(html, 'AltSolver — Parámetros');
}
```

- [ ] **Step 3: Update build script to copy `.gs` and rename `.html`**

Modify `scripts/build-dialog-html.mjs`:

```js
import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('dist', { recursive: true });

// Bundle HTML
const template = readFileSync('src/client/dialog.html.template', 'utf-8');
const bundle = readFileSync('dist/client-bundle.js', 'utf-8');
const html = template.replace('/* __CLIENT_BUNDLE__ */', bundle);
writeFileSync('dist/dialog.html', html);
console.log(`Built dist/dialog.html (${html.length} bytes)`);

// Copy .gs files
const serverFiles = readdirSync('src/server').filter((f) => f.endsWith('.gs'));
for (const f of serverFiles) {
  cpSync(join('src/server', f), join('dist', f));
}
console.log(`Copied ${serverFiles.length} .gs files to dist/`);

// Copy manifest
cpSync('appsscript.json', 'dist/appsscript.json');
console.log(`Copied appsscript.json to dist/`);
```

- [ ] **Step 4: Run build and inspect dist/**

Run: `npm run build`

Verify with `ls dist/`:
```
appsscript.json
client-bundle.js
dialog.html
Dialog.gs
Menu.gs
```

- [ ] **Step 5: Commit**

```bash
git add src/server/Menu.gs src/server/Dialog.gs scripts/build-dialog-html.mjs
git commit -m "feat: add server-side menu and dialog handlers"
```

---

### Task 2.2: Wire clasp to point at dist/

**Files:**
- Create: `.clasp.json` (manually via `clasp create`)

- [ ] **Step 1: Run `clasp create`**

```bash
clasp create --type standalone --title "AltSolver (dev)" --rootDir ./dist
```

Expected:
- Prompts for which kind of script (choose `standalone`).
- Creates `.clasp.json` in repo root with `scriptId` and `rootDir: "dist"`.
- Creates an empty Apps Script project in your Google account.

- [ ] **Step 2: Verify `.clasp.json`**

```bash
cat .clasp.json
```

Expected output (scriptId will differ):
```json
{"scriptId":"1a2b3c...","rootDir":"./dist"}
```

- [ ] **Step 3: Confirm `.clasp.json` is gitignored**

```bash
git check-ignore .clasp.json
```

Expected: prints `.clasp.json` (means it's ignored — good, the scriptId is per-developer).

- [ ] **Step 4: First push to Apps Script**

```bash
npm run push
```

Expected:
```
Pushing files...
└─ dist/appsscript.json
└─ dist/Dialog.gs
└─ dist/Menu.gs
└─ dist/dialog.html
```

- [ ] **Step 5: Install test deployment (manual via browser)**

Run: `clasp open`
In the Apps Script editor that opens:
1. Click **Deploy → Test deployments**.
2. Click **Install**.
3. Authorize the requested scopes.

- [ ] **Step 6: Smoke-test in a real Google Sheet**

1. Open any Google Sheet in your account.
2. **Extensions → AltSolver → Resolver…**
3. Verify the modal opens and shows "AltSolver — Listo. UI en construcción."

If this works: the entire pipeline (TS → esbuild → bundled HTML → Apps Script → installed add-on → modal opens in real Sheets) is alive. This is the first user-visible milestone.

- [ ] **Step 7: No commit needed for this task** (no source changes, only deployment).

---

## Phase 3: Shared types and validation

### Task 3.1: A1 notation validation — pure functions

**Files:**
- Create: `src/shared/a1.ts`
- Create: `tests/unit/a1.test.ts`

- [ ] **Step 1: Write failing tests for A1 parsing**

Create `tests/unit/a1.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { isValidA1, parseA1, isRangeA1, isCellA1, qualifyWithSheet } from '../../src/shared/a1';

describe('a1', () => {
  describe('isValidA1', () => {
    it('accepts cell refs', () => {
      expect(isValidA1('A1')).toBe(true);
      expect(isValidA1('$A$1')).toBe(true);
      expect(isValidA1('Sheet1!A1')).toBe(true);
      expect(isValidA1("'My Sheet'!$A$1")).toBe(true);
    });

    it('accepts range refs', () => {
      expect(isValidA1('B3:B7')).toBe(true);
      expect(isValidA1('$B$3:$B$7')).toBe(true);
      expect(isValidA1('Sheet1!B3:B7')).toBe(true);
    });

    it('rejects garbage', () => {
      expect(isValidA1('')).toBe(false);
      expect(isValidA1('1A')).toBe(false);
      expect(isValidA1('A')).toBe(false);
      expect(isValidA1('A1:')).toBe(false);
      expect(isValidA1(':B2')).toBe(false);
      expect(isValidA1('Sheet1!')).toBe(false);
    });
  });

  describe('parseA1', () => {
    it('parses bare cell', () => {
      expect(parseA1('B12')).toEqual({ sheet: null, start: 'B12', end: null });
    });
    it('parses qualified range', () => {
      expect(parseA1('Optimal!B3:B7')).toEqual({
        sheet: 'Optimal',
        start: 'B3',
        end: 'B7',
      });
    });
    it('strips $ in start/end', () => {
      expect(parseA1('$A$1:$B$2')).toEqual({ sheet: null, start: 'A1', end: 'B2' });
    });
    it('parses quoted sheet name with spaces', () => {
      expect(parseA1("'My Sheet'!A1")).toEqual({ sheet: 'My Sheet', start: 'A1', end: null });
    });
    it('returns null on invalid', () => {
      expect(parseA1('garbage')).toBeNull();
    });
  });

  describe('isCellA1 / isRangeA1', () => {
    it('distinguishes cell vs range', () => {
      expect(isCellA1('A1')).toBe(true);
      expect(isCellA1('A1:B2')).toBe(false);
      expect(isRangeA1('A1:B2')).toBe(true);
      expect(isRangeA1('A1')).toBe(false);
    });
  });

  describe('qualifyWithSheet', () => {
    it('prepends sheet if missing', () => {
      expect(qualifyWithSheet('B12', 'Optimal')).toBe('Optimal!B12');
    });
    it('leaves qualified refs untouched', () => {
      expect(qualifyWithSheet('Optimal!B12', 'Other')).toBe('Optimal!B12');
    });
    it('quotes sheet names with spaces', () => {
      expect(qualifyWithSheet('B12', 'My Sheet')).toBe("'My Sheet'!B12");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- a1`
Expected: FAIL with `Cannot find module '../../src/shared/a1'`.

- [ ] **Step 3: Implement `src/shared/a1.ts`**

```ts
/**
 * A1 notation utilities. Pure functions, no Spreadsheet API dependency.
 * Validates and parses references like "Sheet1!$A$1:$B$2" or "B12".
 */

export interface ParsedA1 {
  sheet: string | null;
  start: string;       // canonical, without $: e.g. "B12"
  end: string | null;  // canonical, without $: e.g. "B17" or null for single cell
}

// Single cell: optional $, 1-3 letters, optional $, 1-7 digits
const CELL = /\$?[A-Z]{1,3}\$?[0-9]{1,7}/;

// Unquoted sheet name: letters/digits/underscore, no spaces, no special chars
const SHEET_UNQUOTED = /[A-Za-z_][A-Za-z0-9_]*/;
// Quoted sheet name: anything except ' (we don't support escaped quotes for now)
const SHEET_QUOTED = /'[^']+'/;

const SHEET = new RegExp(`(?:${SHEET_QUOTED.source}|${SHEET_UNQUOTED.source})`);

const FULL = new RegExp(
  `^(?:(${SHEET.source})!)?(${CELL.source})(?::(${CELL.source}))?$`,
);

export function isValidA1(ref: string): boolean {
  return FULL.test(ref);
}

export function parseA1(ref: string): ParsedA1 | null {
  const m = FULL.exec(ref);
  if (!m) return null;
  const rawSheet = m[1] ?? null;
  const sheet = rawSheet
    ? rawSheet.startsWith("'")
      ? rawSheet.slice(1, -1)
      : rawSheet
    : null;
  const start = (m[2] ?? '').replace(/\$/g, '');
  const end = m[3] ? m[3].replace(/\$/g, '') : null;
  return { sheet, start, end };
}

export function isCellA1(ref: string): boolean {
  const p = parseA1(ref);
  return p !== null && p.end === null;
}

export function isRangeA1(ref: string): boolean {
  const p = parseA1(ref);
  return p !== null && p.end !== null;
}

export function qualifyWithSheet(ref: string, sheetName: string): string {
  const p = parseA1(ref);
  if (!p) throw new Error(`Invalid A1: ${ref}`);
  if (p.sheet) return ref;
  const needsQuotes = !/^[A-Za-z_][A-Za-z0-9_]*$/.test(sheetName);
  const prefix = needsQuotes ? `'${sheetName}'` : sheetName;
  return `${prefix}!${p.start}${p.end ? `:${p.end}` : ''}`;
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test -- a1`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/a1.ts tests/unit/a1.test.ts
git commit -m "feat: A1 notation validation and parsing utilities"
```

---

### Task 3.2: Model schema types and validation

**Files:**
- Create: `src/shared/model-schema.ts`
- Create: `tests/unit/model-schema.test.ts`

- [ ] **Step 1: Write failing tests for model schema**

Create `tests/unit/model-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  validateModelDocument,
  blankModelDocument,
  type ModelDocument,
} from '../../src/shared/model-schema';

describe('model-schema', () => {
  describe('blankModelDocument', () => {
    it('creates a valid empty model with version 1', () => {
      const doc = blankModelDocument(123, 'Hoja1');
      expect(doc.version).toBe(1);
      expect(doc.sheetId).toBe(123);
      expect(doc.objective.cellA1).toBe('');
      expect(doc.objective.sense).toBe('MIN');
      expect(doc.variables.rangeA1).toBe('');
      expect(doc.constraints).toEqual([]);
      expect(doc.options.assumeNonNegative).toBe(true);
    });
  });

  describe('validateModelDocument', () => {
    function valid(): ModelDocument {
      return {
        version: 1,
        sheetId: 1,
        objective: { cellA1: 'A1', sense: 'MAX', targetValue: null },
        variables: { rangeA1: 'B1:B5', names: [], assumeNonNegative: true },
        constraints: [],
        options: {
          assumeNonNegative: true,
          timeLimitSec: 100,
          iterLimit: null,
          mipGap: 1e-4,
          integerTolerance: 1e-6,
        },
        meta: { createdAt: '2026-05-18T00:00:00Z', updatedAt: '2026-05-18T00:00:00Z', solvedAt: null, locale: 'es' },
      };
    }

    it('accepts a complete valid document', () => {
      const r = validateModelDocument(valid());
      expect(r.ok).toBe(true);
    });

    it('rejects wrong version', () => {
      const d = valid();
      (d as any).version = 99;
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.errors[0]).toMatch(/version/);
    });

    it('rejects invalid sense', () => {
      const d = valid();
      (d.objective as any).sense = 'FOO';
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
    });

    it('rejects invalid A1 in objective', () => {
      const d = valid();
      d.objective.cellA1 = 'not-a-cell';
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
    });

    it('requires targetValue when sense=TARGET', () => {
      const d = valid();
      d.objective.sense = 'TARGET';
      d.objective.targetValue = null;
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
    });

    it('accepts constraint with linear op and RHS', () => {
      const d = valid();
      d.constraints.push({ lhsA1: 'D1', op: '<=', rhsA1OrValue: '10', type: 'linear' });
      const r = validateModelDocument(d);
      expect(r.ok).toBe(true);
    });

    it('rejects linear constraint missing RHS', () => {
      const d = valid();
      (d.constraints as any).push({ lhsA1: 'D1', op: '<=', type: 'linear' });
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
    });

    it('accepts int/bin constraint without RHS', () => {
      const d = valid();
      d.constraints.push({ lhsA1: 'B1:B5', op: 'int' });
      d.constraints.push({ lhsA1: 'B1', op: 'bin' });
      const r = validateModelDocument(d);
      expect(r.ok).toBe(true);
    });

    it('rejects non-positive timeLimitSec', () => {
      const d = valid();
      d.options.timeLimitSec = 0;
      const r = validateModelDocument(d);
      expect(r.ok).toBe(false);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- model-schema`
Expected: FAIL with cannot find module.

- [ ] **Step 3: Implement `src/shared/model-schema.ts`**

```ts
import { isValidA1 } from './a1';
import { DEFAULT_OPTIONS, SCHEMA_VERSION } from './constants';

export type Sense = 'MAX' | 'MIN' | 'TARGET';
export type LinearOp = '<=' | '=' | '>=';
export type ConstraintOp = LinearOp | 'int' | 'bin';

export interface LinearConstraint {
  lhsA1: string;
  op: LinearOp;
  rhsA1OrValue: string; // either A1 ref or numeric literal as string
  type: 'linear';
}

export interface IntegralityConstraint {
  lhsA1: string;
  op: 'int' | 'bin';
}

export type Constraint = LinearConstraint | IntegralityConstraint;

export interface Objective {
  cellA1: string;
  sense: Sense;
  targetValue: number | null; // required when sense=TARGET
}

export interface Variables {
  rangeA1: string;
  names: string[];          // optional, inferred at solve time if empty
  assumeNonNegative: boolean;
}

export interface SolverOptions {
  assumeNonNegative: boolean;
  timeLimitSec: number;
  iterLimit: number | null;
  mipGap: number;
  integerTolerance: number;
}

export interface ModelMeta {
  createdAt: string;
  updatedAt: string;
  solvedAt: string | null;
  locale: 'es' | 'en';
}

export interface ModelDocument {
  version: 1;
  sheetId: number;
  objective: Objective;
  variables: Variables;
  constraints: Constraint[];
  options: SolverOptions;
  meta: ModelMeta;
}

export type ValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function blankModelDocument(sheetId: number, _sheetName: string): ModelDocument {
  const now = new Date().toISOString();
  return {
    version: SCHEMA_VERSION,
    sheetId,
    objective: { cellA1: '', sense: 'MIN', targetValue: null },
    variables: { rangeA1: '', names: [], assumeNonNegative: true },
    constraints: [],
    options: { ...DEFAULT_OPTIONS },
    meta: { createdAt: now, updatedAt: now, solvedAt: null, locale: 'es' },
  };
}

export function validateModelDocument(doc: unknown): ValidationResult {
  const errors: string[] = [];
  if (!doc || typeof doc !== 'object') return { ok: false, errors: ['root must be an object'] };
  const d = doc as Record<string, unknown>;

  if (d.version !== SCHEMA_VERSION) errors.push(`version must be ${SCHEMA_VERSION}`);
  if (typeof d.sheetId !== 'number') errors.push('sheetId must be a number');

  // objective
  const obj = d.objective as Record<string, unknown> | undefined;
  if (!obj) {
    errors.push('objective missing');
  } else {
    if (typeof obj.cellA1 !== 'string' || (obj.cellA1 !== '' && !isValidA1(obj.cellA1))) {
      errors.push('objective.cellA1 must be empty or valid A1');
    }
    if (obj.sense !== 'MAX' && obj.sense !== 'MIN' && obj.sense !== 'TARGET') {
      errors.push('objective.sense must be MAX|MIN|TARGET');
    }
    if (obj.sense === 'TARGET' && typeof obj.targetValue !== 'number') {
      errors.push('objective.targetValue required when sense=TARGET');
    }
  }

  // variables
  const vars = d.variables as Record<string, unknown> | undefined;
  if (!vars) {
    errors.push('variables missing');
  } else {
    if (typeof vars.rangeA1 !== 'string' || (vars.rangeA1 !== '' && !isValidA1(vars.rangeA1))) {
      errors.push('variables.rangeA1 must be empty or valid A1');
    }
    if (!Array.isArray(vars.names)) errors.push('variables.names must be array');
    if (typeof vars.assumeNonNegative !== 'boolean') errors.push('variables.assumeNonNegative must be boolean');
  }

  // constraints
  const cons = d.constraints;
  if (!Array.isArray(cons)) {
    errors.push('constraints must be array');
  } else {
    cons.forEach((c, i) => {
      const cc = c as Record<string, unknown>;
      if (typeof cc.lhsA1 !== 'string' || !isValidA1(cc.lhsA1)) {
        errors.push(`constraints[${i}].lhsA1 invalid`);
      }
      if (cc.op === '<=' || cc.op === '=' || cc.op === '>=') {
        if (cc.type !== 'linear') errors.push(`constraints[${i}].type must be 'linear' for op ${cc.op}`);
        if (typeof cc.rhsA1OrValue !== 'string' || cc.rhsA1OrValue === '') {
          errors.push(`constraints[${i}].rhsA1OrValue required`);
        }
      } else if (cc.op === 'int' || cc.op === 'bin') {
        // no rhs needed
      } else {
        errors.push(`constraints[${i}].op invalid`);
      }
    });
  }

  // options
  const opt = d.options as Record<string, unknown> | undefined;
  if (!opt) {
    errors.push('options missing');
  } else {
    if (typeof opt.assumeNonNegative !== 'boolean') errors.push('options.assumeNonNegative must be boolean');
    if (typeof opt.timeLimitSec !== 'number' || opt.timeLimitSec <= 0) {
      errors.push('options.timeLimitSec must be > 0');
    }
    if (opt.iterLimit !== null && (typeof opt.iterLimit !== 'number' || opt.iterLimit <= 0)) {
      errors.push('options.iterLimit must be null or > 0');
    }
    if (typeof opt.mipGap !== 'number' || opt.mipGap < 0) errors.push('options.mipGap must be ≥ 0');
    if (typeof opt.integerTolerance !== 'number' || opt.integerTolerance <= 0) {
      errors.push('options.integerTolerance must be > 0');
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test -- model-schema`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/model-schema.ts tests/unit/model-schema.test.ts
git commit -m "feat: ModelDocument schema with validation"
```

---

## Phase 4: Model persistence (Developer Metadata)

### Task 4.1: ModelStore — pure JSON layer

The Apps Script Developer Metadata API can't be easily mocked. The pattern is: pure JSON serialization in `src/shared/`, thin `.gs` wrapper that calls the API.

**Files:**
- Create: `src/shared/model-store-json.ts`
- Create: `tests/unit/model-store-json.test.ts`

- [ ] **Step 1: Write failing tests**

Create `tests/unit/model-store-json.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { serializeModel, deserializeModel } from '../../src/shared/model-store-json';
import { blankModelDocument } from '../../src/shared/model-schema';

describe('model-store-json', () => {
  it('round-trips a blank model', () => {
    const doc = blankModelDocument(123, 'Sheet1');
    const s = serializeModel(doc);
    const back = deserializeModel(s);
    expect(back.ok).toBe(true);
    if (back.ok) expect(back.doc).toEqual(doc);
  });

  it('rejects malformed JSON', () => {
    const r = deserializeModel('not-json');
    expect(r.ok).toBe(false);
  });

  it('rejects schema violations', () => {
    const r = deserializeModel('{"version": 99, "sheetId": 1}');
    expect(r.ok).toBe(false);
  });

  it('serializes to compact JSON (no trailing whitespace)', () => {
    const doc = blankModelDocument(1, 'X');
    const s = serializeModel(doc);
    expect(s).toBe(JSON.stringify(doc));
  });
});
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npm test -- model-store-json`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `src/shared/model-store-json.ts`**

```ts
import { validateModelDocument, type ModelDocument } from './model-schema';

export function serializeModel(doc: ModelDocument): string {
  return JSON.stringify(doc);
}

export type DeserializeResult =
  | { ok: true; doc: ModelDocument }
  | { ok: false; reason: 'json' | 'schema'; errors: string[] };

export function deserializeModel(raw: string): DeserializeResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return { ok: false, reason: 'json', errors: [(e as Error).message] };
  }
  const v = validateModelDocument(parsed);
  if (!v.ok) return { ok: false, reason: 'schema', errors: v.errors };
  return { ok: true, doc: parsed as ModelDocument };
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test -- model-store-json`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/shared/model-store-json.ts tests/unit/model-store-json.test.ts
git commit -m "feat: model serialization with schema validation"
```

---

### Task 4.2: ModelStore.gs — Apps Script Developer Metadata wrapper

**Files:**
- Create: `src/server/ModelStore.gs`

This wrapper is not unit-tested (it touches Apps Script APIs). It's verified manually via test deployment.

- [ ] **Step 1: Create `src/server/ModelStore.gs`**

```js
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
```

- [ ] **Step 2: Build and push**

Run: `npm run push`
Expected: build succeeds; clasp uploads `ModelStore.gs`.

- [ ] **Step 3: Manual smoke in browser console of dialog**

1. Open the test deployment in a Google Sheet.
2. Open Chrome DevTools on the dialog iframe (right-click inside the dialog → Inspect).
3. In the console run:
   ```js
   google.script.run.withSuccessHandler(console.log).getActiveSheetContext();
   ```
4. Expect a logged object `{ json: null, sheetName: "...", sheetId: ..., locale: "..." }`.

- [ ] **Step 4: Commit**

```bash
git add src/server/ModelStore.gs
git commit -m "feat: ModelStore via Developer Metadata"
```

---

### Task 4.3: Client model-draft state + RPC bridge

**Files:**
- Create: `src/client/state/model-draft.ts`
- Create: `src/client/rpc/server-bridge.ts`
- Create: `tests/unit/model-draft.test.ts`

- [ ] **Step 1: Write failing tests for `model-draft`**

Create `tests/unit/model-draft.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ModelDraft } from '../../src/client/state/model-draft';
import { blankModelDocument } from '../../src/shared/model-schema';

describe('ModelDraft', () => {
  it('starts from a blank model', () => {
    const d = ModelDraft.fromBlank(7, 'Sheet1');
    expect(d.toDocument().sheetId).toBe(7);
  });

  it('hydrates from JSON', () => {
    const blank = blankModelDocument(1, 'X');
    const d = ModelDraft.fromJson(JSON.stringify(blank));
    expect(d).not.toBeNull();
    expect(d!.toDocument().sheetId).toBe(1);
  });

  it('returns null on invalid JSON', () => {
    expect(ModelDraft.fromJson('garbage')).toBeNull();
    expect(ModelDraft.fromJson('{"version":99}')).toBeNull();
  });

  it('mutates objective and updates updatedAt', async () => {
    const d = ModelDraft.fromBlank(1, 'X');
    const before = d.toDocument().meta.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    d.setObjective({ cellA1: 'B12', sense: 'MAX', targetValue: null });
    const after = d.toDocument().meta.updatedAt;
    expect(after).not.toBe(before);
    expect(d.toDocument().objective.cellA1).toBe('B12');
  });

  it('adds and removes constraints', () => {
    const d = ModelDraft.fromBlank(1, 'X');
    d.addConstraint({ lhsA1: 'D12', op: '<=', rhsA1OrValue: 'F12', type: 'linear' });
    d.addConstraint({ lhsA1: 'B3:B7', op: 'int' });
    expect(d.toDocument().constraints).toHaveLength(2);
    d.removeConstraint(0);
    expect(d.toDocument().constraints).toHaveLength(1);
    expect(d.toDocument().constraints[0].op).toBe('int');
  });

  it('serializes back to valid JSON', () => {
    const d = ModelDraft.fromBlank(1, 'X');
    d.setObjective({ cellA1: 'B12', sense: 'MAX', targetValue: null });
    d.setVariables({ rangeA1: 'B3:B7', names: [], assumeNonNegative: true });
    const json = d.toJson();
    const reparsed = ModelDraft.fromJson(json);
    expect(reparsed).not.toBeNull();
    expect(reparsed!.toDocument().objective.cellA1).toBe('B12');
  });
});
```

- [ ] **Step 2: Run tests, verify fail**

Run: `npm test -- model-draft`
Expected: module not found.

- [ ] **Step 3: Implement `src/client/state/model-draft.ts`**

```ts
import {
  blankModelDocument,
  validateModelDocument,
  type Constraint,
  type ModelDocument,
  type Objective,
  type SolverOptions,
  type Variables,
} from '../../shared/model-schema';

export class ModelDraft {
  private doc: ModelDocument;

  private constructor(doc: ModelDocument) {
    this.doc = doc;
  }

  static fromBlank(sheetId: number, sheetName: string): ModelDraft {
    return new ModelDraft(blankModelDocument(sheetId, sheetName));
  }

  static fromJson(raw: string): ModelDraft | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    const v = validateModelDocument(parsed);
    if (!v.ok) return null;
    return new ModelDraft(parsed as ModelDocument);
  }

  toDocument(): ModelDocument {
    return this.doc;
  }

  toJson(): string {
    return JSON.stringify(this.doc);
  }

  private touch(): void {
    this.doc.meta.updatedAt = new Date().toISOString();
  }

  setObjective(o: Objective): void {
    this.doc.objective = { ...o };
    this.touch();
  }

  setVariables(v: Variables): void {
    this.doc.variables = { ...v };
    this.touch();
  }

  setOptions(o: Partial<SolverOptions>): void {
    this.doc.options = { ...this.doc.options, ...o };
    this.touch();
  }

  addConstraint(c: Constraint): void {
    this.doc.constraints.push(c);
    this.touch();
  }

  updateConstraint(index: number, c: Constraint): void {
    if (index < 0 || index >= this.doc.constraints.length) {
      throw new Error(`updateConstraint: index ${index} out of bounds`);
    }
    this.doc.constraints[index] = c;
    this.touch();
  }

  removeConstraint(index: number): void {
    if (index < 0 || index >= this.doc.constraints.length) {
      throw new Error(`removeConstraint: index ${index} out of bounds`);
    }
    this.doc.constraints.splice(index, 1);
    this.touch();
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test -- model-draft`
Expected: all tests pass.

- [ ] **Step 5: Create `src/client/rpc/server-bridge.ts`**

```ts
/**
 * Thin wrappers over google.script.run.
 * Centralizes RPC so the rest of the client doesn't deal with callbacks.
 * The `google` global is declared in src/client/google.d.ts.
 */

interface ServerContext {
  json: string | null;
  sheetName: string;
  sheetId: number;
  locale: string;
}

function call<T>(fnName: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((r: unknown) => resolve(r as T))
      .withFailureHandler((err: Error) => reject(err))
      [fnName](...args);
  });
}

export function getActiveSheetContext(): Promise<ServerContext> {
  return call<ServerContext>('getActiveSheetContext');
}

export function saveModel(jsonString: string): Promise<{ ok: boolean }> {
  return call<{ ok: boolean }>('saveModel', jsonString);
}
```

- [ ] **Step 6: Build to verify it compiles in client context**

Run: `npm run build`
Expected: `dist/dialog.html` rebuilt without errors.

- [ ] **Step 7: Commit**

```bash
git add src/client/state/model-draft.ts src/client/rpc/server-bridge.ts tests/unit/model-draft.test.ts
git commit -m "feat: client ModelDraft state + server RPC bridge"
```

---

## Phase 5: Dialog UI (form + constraints + options)

### Task 5.1: i18n setup with Spanish strings

**Files:**
- Create: `src/client/i18n/i18n.ts`
- Create: `src/client/i18n/es.json`

- [ ] **Step 1: Create `src/client/i18n/es.json`**

```json
{
  "dialog.title": "AltSolver — Parámetros",
  "label.objective": "Celda objetivo",
  "label.sense": "Optimizar",
  "sense.max": "Máx",
  "sense.min": "Mín",
  "sense.target": "Valor de",
  "label.variables": "Celdas de variables",
  "label.constraints": "Sujeto a las restricciones",
  "btn.add": "Agregar",
  "btn.edit": "Cambiar",
  "btn.remove": "Eliminar",
  "btn.resetAll": "Restablecer todo",
  "label.assumeNonNegative": "Convertir variables sin restricciones en no negativas",
  "label.method": "Método de resolución",
  "method.simplexLp": "Simplex LP (HiGHS)",
  "btn.options": "Opciones…",
  "btn.cancel": "Cerrar",
  "btn.solve": "Resolver",
  "btn.solve.disabled": "Próximamente (MVP-0.1)",
  "btn.save": "Guardar modelo",
  "btn.load": "Cargar/Guardar",
  "constraint.modal.title": "Restricción",
  "constraint.lhs": "Referencia de la celda",
  "constraint.op": "Restricción",
  "constraint.rhs": "Valor",
  "constraint.intHint": "Las celdas referenciadas deben ser variables enteras.",
  "constraint.binHint": "Las celdas referenciadas deben ser variables binarias (0/1).",
  "options.modal.title": "Opciones del Solver",
  "options.timeLimit": "Tiempo máximo (s)",
  "options.iterLimit": "Iteraciones máximas (vacío = sin límite)",
  "options.mipGap": "Gap MIP relativo",
  "options.integerTolerance": "Tolerancia entera",
  "msg.saved": "Modelo guardado",
  "msg.invalidA1": "Referencia inválida",
  "msg.targetValueRequired": "Indicá el valor objetivo"
}
```

- [ ] **Step 2: Create `src/client/i18n/i18n.ts`**

```ts
import es from './es.json';

type Bundle = Record<string, string>;
const bundles: Record<string, Bundle> = { es: es as Bundle };

let active: Bundle = bundles.es;

export function setLocale(locale: string): void {
  const lang = (locale || 'es').slice(0, 2);
  active = bundles[lang] ?? bundles.es;
}

export function t(key: string): string {
  return active[key] ?? key;
}
```

- [ ] **Step 3: Update `tsconfig.client.json` to allow JSON imports**

The base `tsconfig.json` already has `resolveJsonModule: true`. Verify by running `npm run typecheck` → passes.

- [ ] **Step 4: Commit**

```bash
git add src/client/i18n/i18n.ts src/client/i18n/es.json
git commit -m "feat: i18n setup with Spanish bundle"
```

---

### Task 5.2: Range picker — minimize dialog and read active range

**Files:**
- Modify: `src/server/ModelStore.gs` (add `getActiveRangeA1` function)
- Modify: `src/client/rpc/server-bridge.ts` (add `getActiveRangeA1`)
- Create: `src/client/ui/range-picker.ts`

- [ ] **Step 1: Add `getActiveRangeA1` to `src/server/ModelStore.gs`**

Append at the end of the file:

```js
/**
 * Returns the currently active range as a qualified A1 string.
 * Used by the dialog's range picker to capture user selection.
 * @return {string}
 */
function getActiveRangeA1() {
  var range = SpreadsheetApp.getActiveRange();
  if (!range) return '';
  var sheetName = range.getSheet().getName();
  var needsQuotes = !/^[A-Za-z_][A-Za-z0-9_]*$/.test(sheetName);
  var prefix = needsQuotes ? "'" + sheetName + "'" : sheetName;
  return prefix + '!' + range.getA1Notation();
}
```

- [ ] **Step 2: Add `getActiveRangeA1` to `src/client/rpc/server-bridge.ts`**

Append:

```ts
export function getActiveRangeA1(): Promise<string> {
  return call<string>('getActiveRangeA1');
}
```

- [ ] **Step 3: Create `src/client/ui/range-picker.ts`**

```ts
import { getActiveRangeA1 } from '../rpc/server-bridge';

/**
 * Range picker: while active, minimizes the dialog so the user can select
 * a range on the sheet, then reads it back.
 *
 * Apps Script provides google.script.host.editor.focus() to return focus to the
 * editor. The dialog stays open but the sheet becomes interactive.
 * The `google` global is declared in src/client/google.d.ts.
 */
export interface RangePicker {
  start(): Promise<void>;
  capture(): Promise<string>;
}

export function makeRangePicker(input: HTMLInputElement): RangePicker {
  return {
    async start(): Promise<void> {
      // Pass focus back to the sheet so user can click cells.
      try {
        google.script.host?.editor.focus();
      } catch {
        /* host bridge unavailable in unit tests */
      }
    },
    async capture(): Promise<string> {
      const a1 = await getActiveRangeA1();
      input.value = a1;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return a1;
    },
  };
}
```

- [ ] **Step 4: Build to verify**

Run: `npm run build`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/server/ModelStore.gs src/client/rpc/server-bridge.ts src/client/ui/range-picker.ts
git commit -m "feat: range picker captures active spreadsheet selection"
```

---

### Task 5.3: Constraint modal (sub-dialog)

**Files:**
- Create: `src/client/ui/constraint-modal.ts`

- [ ] **Step 1: Create `src/client/ui/constraint-modal.ts`**

```ts
import { t } from '../i18n/i18n';
import { isValidA1 } from '../../shared/a1';
import type { Constraint, ConstraintOp } from '../../shared/model-schema';
import { makeRangePicker } from './range-picker';

interface OpenOpts {
  initial?: Constraint;
  onAccept: (c: Constraint) => void;
  onCancel?: () => void;
}

const OPS: ConstraintOp[] = ['<=', '=', '>=', 'int', 'bin'];

export function openConstraintModal(parent: HTMLElement, opts: OpenOpts): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-label="${t('constraint.modal.title')}">
      <h2>${t('constraint.modal.title')}</h2>
      <div class="row">
        <label for="lhs">${t('constraint.lhs')}</label>
        <div class="input-row">
          <input id="lhs" type="text" autocomplete="off" />
          <button type="button" data-action="pick-lhs">⌖</button>
        </div>
        <div class="hint" id="lhsError"></div>
      </div>
      <div class="row">
        <label for="op">${t('constraint.op')}</label>
        <select id="op">
          ${OPS.map((o) => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>
      <div class="row" id="rhsRow">
        <label for="rhs">${t('constraint.rhs')}</label>
        <div class="input-row">
          <input id="rhs" type="text" autocomplete="off" />
          <button type="button" data-action="pick-rhs">⌖</button>
        </div>
        <div class="hint" id="rhsError"></div>
      </div>
      <div class="row" id="opHint" style="display:none;"></div>
      <div class="actions">
        <button type="button" data-action="cancel">${t('btn.cancel')}</button>
        <button type="button" data-action="accept" class="primary">OK</button>
      </div>
    </div>
  `;
  parent.appendChild(overlay);

  const lhs = overlay.querySelector<HTMLInputElement>('#lhs')!;
  const op = overlay.querySelector<HTMLSelectElement>('#op')!;
  const rhs = overlay.querySelector<HTMLInputElement>('#rhs')!;
  const rhsRow = overlay.querySelector<HTMLDivElement>('#rhsRow')!;
  const opHint = overlay.querySelector<HTMLDivElement>('#opHint')!;
  const lhsError = overlay.querySelector<HTMLDivElement>('#lhsError')!;
  const rhsError = overlay.querySelector<HTMLDivElement>('#rhsError')!;

  if (opts.initial) {
    lhs.value = opts.initial.lhsA1;
    op.value = opts.initial.op;
    if (opts.initial.op !== 'int' && opts.initial.op !== 'bin') {
      rhs.value = (opts.initial as { rhsA1OrValue: string }).rhsA1OrValue;
    }
  }

  function applyOpVisibility(): void {
    const o = op.value as ConstraintOp;
    if (o === 'int') {
      rhsRow.style.display = 'none';
      opHint.style.display = '';
      opHint.textContent = t('constraint.intHint');
    } else if (o === 'bin') {
      rhsRow.style.display = 'none';
      opHint.style.display = '';
      opHint.textContent = t('constraint.binHint');
    } else {
      rhsRow.style.display = '';
      opHint.style.display = 'none';
    }
  }
  applyOpVisibility();
  op.addEventListener('change', applyOpVisibility);

  const lhsPicker = makeRangePicker(lhs);
  const rhsPicker = makeRangePicker(rhs);

  overlay.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    if (action === 'pick-lhs') {
      await lhsPicker.start();
      await lhsPicker.capture();
    } else if (action === 'pick-rhs') {
      await rhsPicker.start();
      await rhsPicker.capture();
    } else if (action === 'cancel') {
      overlay.remove();
      opts.onCancel?.();
    } else if (action === 'accept') {
      if (!validate()) return;
      opts.onAccept(build());
      overlay.remove();
    }
  });

  function validate(): boolean {
    let valid = true;
    if (!isValidA1(lhs.value)) {
      lhsError.textContent = t('msg.invalidA1');
      valid = false;
    } else {
      lhsError.textContent = '';
    }
    const o = op.value as ConstraintOp;
    if (o !== 'int' && o !== 'bin') {
      const isA1 = isValidA1(rhs.value);
      const isNumber = rhs.value.trim() !== '' && !Number.isNaN(Number(rhs.value));
      if (!isA1 && !isNumber) {
        rhsError.textContent = t('msg.invalidA1');
        valid = false;
      } else {
        rhsError.textContent = '';
      }
    }
    return valid;
  }

  function build(): Constraint {
    const o = op.value as ConstraintOp;
    if (o === 'int' || o === 'bin') {
      return { lhsA1: lhs.value, op: o };
    }
    return { lhsA1: lhs.value, op: o, rhsA1OrValue: rhs.value, type: 'linear' };
  }
}
```

- [ ] **Step 2: Build and verify compiles**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/client/ui/constraint-modal.ts
git commit -m "feat: constraint modal sub-dialog"
```

---

### Task 5.4: Constraints list component

**Files:**
- Create: `src/client/ui/constraints-list.ts`

- [ ] **Step 1: Create `src/client/ui/constraints-list.ts`**

```ts
import type { Constraint } from '../../shared/model-schema';
import { t } from '../i18n/i18n';
import { openConstraintModal } from './constraint-modal';

interface Opts {
  parent: HTMLElement;
  getList: () => Constraint[];
  onAdd: (c: Constraint) => void;
  onUpdate: (i: number, c: Constraint) => void;
  onRemove: (i: number) => void;
}

export function mountConstraintsList(host: HTMLElement, opts: Opts): { render: () => void } {
  host.innerHTML = `
    <div class="constraints">
      <div class="list" role="list"></div>
      <div class="list-actions">
        <button type="button" data-action="add">+ ${t('btn.add')}</button>
        <button type="button" data-action="edit">${t('btn.edit')}</button>
        <button type="button" data-action="remove">${t('btn.remove')}</button>
      </div>
    </div>
  `;

  const list = host.querySelector<HTMLDivElement>('.list')!;
  let selectedIndex: number | null = null;

  function render(): void {
    const items = opts.getList();
    list.innerHTML = items
      .map((c, i) => {
        const rhs = 'rhsA1OrValue' in c ? `   ${c.op}   ${c.rhsA1OrValue}` : `   ${c.op}`;
        return `
          <div class="constraint-row" data-index="${i}" role="listitem"
               aria-selected="${i === selectedIndex}">
            <span>${escapeHtml(c.lhsA1)}${escapeHtml(rhs)}</span>
          </div>
        `;
      })
      .join('');
    list.querySelectorAll<HTMLDivElement>('.constraint-row').forEach((row) => {
      row.addEventListener('click', () => {
        selectedIndex = Number(row.dataset.index);
        render();
      });
    });
  }

  host.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    if (action === 'add') {
      openConstraintModal(opts.parent, {
        onAccept: (c) => {
          opts.onAdd(c);
          render();
        },
      });
    } else if (action === 'edit') {
      if (selectedIndex === null) return;
      const idx = selectedIndex;
      openConstraintModal(opts.parent, {
        initial: opts.getList()[idx],
        onAccept: (c) => {
          opts.onUpdate(idx, c);
          render();
        },
      });
    } else if (action === 'remove') {
      if (selectedIndex === null) return;
      opts.onRemove(selectedIndex);
      selectedIndex = null;
      render();
    }
  });

  render();
  return { render };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/client/ui/constraints-list.ts
git commit -m "feat: constraints list with add/edit/remove"
```

---

### Task 5.5: Options modal

**Files:**
- Create: `src/client/ui/options-modal.ts`

- [ ] **Step 1: Create `src/client/ui/options-modal.ts`**

```ts
import type { SolverOptions } from '../../shared/model-schema';
import { t } from '../i18n/i18n';

interface OpenOpts {
  initial: SolverOptions;
  onAccept: (o: SolverOptions) => void;
  onCancel?: () => void;
}

export function openOptionsModal(parent: HTMLElement, opts: OpenOpts): void {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" role="dialog" aria-label="${t('options.modal.title')}">
      <h2>${t('options.modal.title')}</h2>
      <div class="row">
        <label for="timeLimit">${t('options.timeLimit')}</label>
        <input id="timeLimit" type="number" min="1" step="1" value="${opts.initial.timeLimitSec}" />
      </div>
      <div class="row">
        <label for="iterLimit">${t('options.iterLimit')}</label>
        <input id="iterLimit" type="number" min="1" step="1" value="${opts.initial.iterLimit ?? ''}" />
      </div>
      <div class="row">
        <label for="mipGap">${t('options.mipGap')}</label>
        <input id="mipGap" type="number" min="0" step="0.0001" value="${opts.initial.mipGap}" />
      </div>
      <div class="row">
        <label for="intTol">${t('options.integerTolerance')}</label>
        <input id="intTol" type="number" min="0.0000001" step="0.0000001" value="${opts.initial.integerTolerance}" />
      </div>
      <div class="actions">
        <button type="button" data-action="cancel">${t('btn.cancel')}</button>
        <button type="button" data-action="accept" class="primary">OK</button>
      </div>
    </div>
  `;
  parent.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.dataset.action === 'cancel') {
      overlay.remove();
      opts.onCancel?.();
    } else if (target.dataset.action === 'accept') {
      const time = Number((overlay.querySelector<HTMLInputElement>('#timeLimit')!).value);
      const iterStr = (overlay.querySelector<HTMLInputElement>('#iterLimit')!).value;
      const iter = iterStr === '' ? null : Number(iterStr);
      const gap = Number((overlay.querySelector<HTMLInputElement>('#mipGap')!).value);
      const intTol = Number((overlay.querySelector<HTMLInputElement>('#intTol')!).value);
      opts.onAccept({
        assumeNonNegative: opts.initial.assumeNonNegative,
        timeLimitSec: time,
        iterLimit: iter,
        mipGap: gap,
        integerTolerance: intTol,
      });
      overlay.remove();
    }
  });
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/client/ui/options-modal.ts
git commit -m "feat: options modal sub-dialog"
```

---

### Task 5.6: Main form layout

**Files:**
- Create: `src/client/ui/form.ts`

- [ ] **Step 1: Create `src/client/ui/form.ts`**

```ts
import { isValidA1 } from '../../shared/a1';
import type { ModelDraft } from '../state/model-draft';
import { t } from '../i18n/i18n';
import { mountConstraintsList } from './constraints-list';
import { openOptionsModal } from './options-modal';
import { makeRangePicker } from './range-picker';

interface Opts {
  draft: ModelDraft;
  onSave: () => Promise<void>;
}

export function mountForm(host: HTMLElement, opts: Opts): void {
  const doc = opts.draft.toDocument();
  host.innerHTML = `
    <form id="solverForm" autocomplete="off">
      <div class="field">
        <label for="objCell">${t('label.objective')}</label>
        <div class="input-row">
          <input id="objCell" type="text" value="${esc(doc.objective.cellA1)}" />
          <button type="button" data-action="pick-obj">⌖</button>
        </div>
        <div class="hint" id="objError"></div>
      </div>

      <fieldset class="field">
        <legend>${t('label.sense')}</legend>
        <label><input type="radio" name="sense" value="MAX" ${doc.objective.sense === 'MAX' ? 'checked' : ''} /> ${t('sense.max')}</label>
        <label><input type="radio" name="sense" value="MIN" ${doc.objective.sense === 'MIN' ? 'checked' : ''} /> ${t('sense.min')}</label>
        <label>
          <input type="radio" name="sense" value="TARGET" ${doc.objective.sense === 'TARGET' ? 'checked' : ''} />
          ${t('sense.target')}:
          <input id="targetValue" type="number" step="any" value="${doc.objective.targetValue ?? ''}" />
        </label>
      </fieldset>

      <div class="field">
        <label for="varsRange">${t('label.variables')}</label>
        <div class="input-row">
          <input id="varsRange" type="text" value="${esc(doc.variables.rangeA1)}" />
          <button type="button" data-action="pick-vars">⌖</button>
        </div>
        <div class="hint" id="varsError"></div>
      </div>

      <div class="field">
        <label>${t('label.constraints')}</label>
        <div id="constraintsHost"></div>
      </div>

      <div class="field">
        <label><input id="assumeNN" type="checkbox" ${doc.options.assumeNonNegative ? 'checked' : ''} />
          ${t('label.assumeNonNegative')}</label>
      </div>

      <div class="field">
        <label for="method">${t('label.method')}</label>
        <select id="method"><option value="simplexLp" selected>${t('method.simplexLp')}</option></select>
        <button type="button" data-action="options">⚙ ${t('btn.options')}</button>
      </div>

      <div class="actions">
        <button type="button" data-action="save">${t('btn.save')}</button>
        <button type="button" data-action="solve" disabled title="${t('btn.solve.disabled')}">${t('btn.solve')}</button>
      </div>
      <div id="savedMessage" class="msg" style="display:none;">${t('msg.saved')}</div>
    </form>
  `;

  const objCell = host.querySelector<HTMLInputElement>('#objCell')!;
  const varsRange = host.querySelector<HTMLInputElement>('#varsRange')!;
  const objError = host.querySelector<HTMLDivElement>('#objError')!;
  const varsError = host.querySelector<HTMLDivElement>('#varsError')!;
  const assumeNN = host.querySelector<HTMLInputElement>('#assumeNN')!;
  const targetValue = host.querySelector<HTMLInputElement>('#targetValue')!;
  const constraintsHost = host.querySelector<HTMLDivElement>('#constraintsHost')!;
  const savedMessage = host.querySelector<HTMLDivElement>('#savedMessage')!;

  const objPicker = makeRangePicker(objCell);
  const varsPicker = makeRangePicker(varsRange);

  const constraintsCtl = mountConstraintsList(constraintsHost, {
    parent: host,
    getList: () => opts.draft.toDocument().constraints,
    onAdd: (c) => opts.draft.addConstraint(c),
    onUpdate: (i, c) => opts.draft.updateConstraint(i, c),
    onRemove: (i) => opts.draft.removeConstraint(i),
  });

  function syncObjective(): void {
    const cell = objCell.value;
    const senseInput = host.querySelector<HTMLInputElement>('input[name="sense"]:checked');
    const sense = (senseInput?.value ?? 'MIN') as 'MAX' | 'MIN' | 'TARGET';
    const tv = sense === 'TARGET' ? Number(targetValue.value) : null;
    objError.textContent = cell !== '' && !isValidA1(cell) ? t('msg.invalidA1') : '';
    opts.draft.setObjective({ cellA1: cell, sense, targetValue: tv });
  }

  function syncVariables(): void {
    const r = varsRange.value;
    varsError.textContent = r !== '' && !isValidA1(r) ? t('msg.invalidA1') : '';
    opts.draft.setVariables({
      rangeA1: r,
      names: [],
      assumeNonNegative: assumeNN.checked,
    });
  }

  objCell.addEventListener('change', syncObjective);
  varsRange.addEventListener('change', syncVariables);
  assumeNN.addEventListener('change', syncVariables);
  targetValue.addEventListener('change', syncObjective);
  host.querySelectorAll<HTMLInputElement>('input[name="sense"]').forEach((r) => {
    r.addEventListener('change', syncObjective);
  });

  host.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const action = target.dataset.action;
    if (action === 'pick-obj') {
      await objPicker.start();
      await objPicker.capture();
      syncObjective();
    } else if (action === 'pick-vars') {
      await varsPicker.start();
      await varsPicker.capture();
      syncVariables();
    } else if (action === 'options') {
      openOptionsModal(host, {
        initial: opts.draft.toDocument().options,
        onAccept: (newOpts) => opts.draft.setOptions(newOpts),
      });
    } else if (action === 'save') {
      await opts.onSave();
      savedMessage.style.display = '';
      setTimeout(() => {
        savedMessage.style.display = 'none';
      }, 2000);
    }
  });
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add src/client/ui/form.ts
git commit -m "feat: main form layout with Excel-style fields"
```

---

### Task 5.7: Wire app.ts to mount form with loaded model + add styles

**Files:**
- Modify: `src/client/app.ts` (replace smoke stub)
- Modify: `src/client/dialog.html.template` (add styles)

- [ ] **Step 1: Replace `src/client/app.ts` with the real entry**

```ts
import { ModelDraft } from './state/model-draft';
import { setLocale, t } from './i18n/i18n';
import { getActiveSheetContext, saveModel } from './rpc/server-bridge';
import { mountForm } from './ui/form';

export async function mountApp(root: HTMLElement): Promise<void> {
  root.innerHTML = `<div class="loading">${t('dialog.title')}…</div>`;
  let ctx;
  try {
    ctx = await getActiveSheetContext();
  } catch (e) {
    root.innerHTML = `<div class="error">Error: ${(e as Error).message}</div>`;
    return;
  }
  setLocale(ctx.locale);
  const draft = ctx.json
    ? ModelDraft.fromJson(ctx.json) ?? ModelDraft.fromBlank(ctx.sheetId, ctx.sheetName)
    : ModelDraft.fromBlank(ctx.sheetId, ctx.sheetName);

  mountForm(root, {
    draft,
    onSave: async () => {
      await saveModel(draft.toJson());
    },
  });
}
```

- [ ] **Step 2: Update `src/client/dialog.html.template` with styles for the form**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <base target="_top" />
  <title>AltSolver</title>
  <style>
    body { font-family: 'Google Sans', Roboto, Arial, sans-serif; margin: 0; padding: 16px; color: #202124; font-size: 14px; }
    .loading, .error { padding: 24px; text-align: center; color: #5f6368; }
    .field { margin-bottom: 16px; }
    .field > label, fieldset > legend { display: block; font-weight: 500; margin-bottom: 4px; }
    .input-row { display: flex; gap: 4px; }
    .input-row input { flex: 1; }
    input[type="text"], input[type="number"], select {
      padding: 6px 8px; border: 1px solid #dadce0; border-radius: 4px; font-size: 14px; width: 100%; box-sizing: border-box;
    }
    button {
      padding: 6px 12px; border: 1px solid #dadce0; background: white; border-radius: 4px; cursor: pointer; font-size: 14px;
    }
    button:hover { background: #f1f3f4; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    button.primary { background: #1a73e8; color: white; border-color: #1a73e8; }
    button.primary:hover { background: #1664c9; }
    .hint { font-size: 12px; color: #d93025; min-height: 14px; margin-top: 2px; }
    fieldset { border: 1px solid #dadce0; border-radius: 4px; padding: 8px 12px; }
    fieldset label { display: inline-block; margin-right: 12px; font-weight: normal; }
    .constraints .list {
      border: 1px solid #dadce0; border-radius: 4px; min-height: 80px; max-height: 140px; overflow-y: auto; padding: 4px;
    }
    .constraint-row { padding: 4px 6px; cursor: pointer; border-radius: 2px; }
    .constraint-row[aria-selected="true"] { background: #e8f0fe; }
    .list-actions { display: flex; gap: 6px; margin-top: 6px; }
    .actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
    .msg { color: #137333; margin-top: 8px; font-size: 13px; }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 999;
    }
    .modal { background: white; padding: 20px; border-radius: 8px; min-width: 320px; max-width: 480px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .modal h2 { margin-top: 0; font-size: 18px; font-weight: 500; }
    .modal .row { margin-bottom: 12px; }
  </style>
</head>
<body>
  <div id="app"></div>
  <script>
    /* __CLIENT_BUNDLE__ */
  </script>
</body>
</html>
```

- [ ] **Step 3: Build and push**

Run: `npm run push`
Expected: build succeeds and clasp uploads.

- [ ] **Step 4: Smoke-test the full dialog**

1. Reload your Google Sheet.
2. **Extensions → AltSolver → Resolver…**
3. Verify:
   - Form fields render correctly.
   - `⌖` button on objective cell minimizes focus to sheet; selecting a cell and clicking `⌖` again fills the input.
   - Adding a constraint via `+ Agregar` opens the sub-modal.
   - Toggling `int`/`bin` hides the RHS field.
   - `⚙ Opciones…` opens the options modal.
   - Clicking `Guardar modelo` shows "Modelo guardado".
   - Closing and re-opening the dialog restores the saved model.

- [ ] **Step 5: Commit**

```bash
git add src/client/app.ts src/client/dialog.html.template
git commit -m "feat: wire app entry to load model and mount form"
```

---

## Phase 6: README and final smoke

### Task 6.1: README for the repo

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create `README.md`**

```markdown
# AltSolver

Google Sheets add-on that replicates Microsoft Excel's Solver: linear and mixed-integer linear programming with Simplex + branch-and-bound, plus Answer, Sensitivity and Limits reports.

**Status:** MVP 0.0 — UI complete, persistence working, solver not yet implemented (coming in MVP 0.1).

## Quick start (development)

```bash
npm install
npm run build
clasp login
clasp create --type standalone --title "AltSolver (dev)" --rootDir ./dist
npm run push
clasp open   # then: Deploy > Test deployments > Install
```

In any Google Sheet of your account: **Extensions → AltSolver → Resolver…**

## Scripts

| Script | What it does |
|---|---|
| `npm run build` | Bundles client into `dist/dialog.html`, copies `.gs` + manifest |
| `npm run push` | `build` + `clasp push` (uploads to your Apps Script project) |
| `npm test` | Runs vitest unit tests in Node |
| `npm run typecheck` | Type-checks both Node and DOM sources |
| `npm run lint` | ESLint over TS and GS files |

## Architecture

See [docs/superpowers/specs/2026-05-17-altsolver-design.md](docs/superpowers/specs/2026-05-17-altsolver-design.md) for the full design.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with quick start"
```

---

### Task 6.2: Tag release v0.0.1

- [ ] **Step 1: Final verification**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all green.

- [ ] **Step 2: Tag and push**

```bash
git tag -a v0.0.1 -m "MVP 0.0: scaffold + smoke + dialog UI + persistence"
git push origin main
git push origin v0.0.1
```

- [ ] **Step 3: Verify on GitHub**

Open https://github.com/gioalvaro/alt-solver/tags in browser. Should see `v0.0.1`.

---

## Out of scope (deferred to MVP 0.1)

These deliberately do **not** appear in this plan:

- The actual solver — HiGHS-WASM integration, model translation to LP/MIP, calling `highs.solve()`.
- Answer Report generation and writing.
- Sensitivity Report generation.
- Limits Report.
- RangeIO server-side reading of variable / objective / constraint values.
- ReportWriter server-side creation of report sheets.
- Errors.gs error mapping.
- Cancel button wiring.
- English translations.
- Golden test fixtures.
- CI/CD GitHub Actions pipeline.

The "Resolver" button is rendered but disabled with tooltip "Próximamente (MVP-0.1)" — this is the explicit visible bridge between this plan and the next.

---

## Verification checklist (run at the end of execution)

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm test` passes (model-schema, a1, model-store-json, model-draft).
- [ ] `npm run build` produces `dist/dialog.html` and copies `.gs` files.
- [ ] `clasp push` uploads cleanly.
- [ ] Test deployment installed; menu visible in a Google Sheet.
- [ ] Dialog opens; all form fields work.
- [ ] Range picker captures selection.
- [ ] Constraint sub-modal works (add/edit/remove, int/bin hides RHS).
- [ ] Options sub-modal works.
- [ ] Save model → close → reopen → form is repopulated from Developer Metadata.
- [ ] `v0.0.1` tag pushed.
