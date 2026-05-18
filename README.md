# AltSolver

Google Sheets add-on that replicates Microsoft Excel's Solver: linear and mixed-integer linear programming with Simplex + branch-and-bound, plus Answer, Sensitivity and Limits reports.

**Status:** MVP 0.0 — UI complete, persistence working, solver not yet implemented (coming in MVP 0.1).

## Quick start (development)

```bash
pnpm install
pnpm run build
pnpm exec clasp login
pnpm exec clasp create --type standalone --title "AltSolver (dev)" --rootDir ./dist
pnpm run push
pnpm exec clasp open   # then: Deploy > Test deployments > Install
```

In any Google Sheet of your account: **Extensions → AltSolver → Resolver…**

## Scripts

| Script | What it does |
|---|---|
| `pnpm run build` | Bundles client into `dist/dialog.html`, copies `.gs` + manifest |
| `pnpm run push` | `build` + `clasp push` (uploads to your Apps Script project) |
| `pnpm test` | Runs vitest unit tests in Node |
| `pnpm run typecheck` | Type-checks both Node and DOM sources |
| `pnpm run lint` | ESLint over TS and GS files |

## Architecture

See [docs/superpowers/specs/2026-05-17-altsolver-design.md](docs/superpowers/specs/2026-05-17-altsolver-design.md) for the full design and [docs/superpowers/plans/2026-05-18-altsolver-mvp-0.0-scaffold-and-dialog.md](docs/superpowers/plans/2026-05-18-altsolver-mvp-0.0-scaffold-and-dialog.md) for this milestone's implementation plan.
