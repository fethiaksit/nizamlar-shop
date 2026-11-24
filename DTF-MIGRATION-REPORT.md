# DTF Migration Report

Date: 24 November 2026. Status: **Incomplete — Phase 00 gates are not green.**

## Delivered so far

- Requested branch `feat/dtf-transfer-shopify-integration`, based on `35168b05ce3633eac756f9dc7330382487e30677`, matching remote main at analysis time.
- Architecture analysis and protected component inventory in `docs/dtf/phase-00-analysis.md`.
- Six-phase implementation plan plus Phase 00 in `docs/superpowers/plans/2026-11-24-dtf-migration.md`.
- A separate read-only Playwright visual suite with five requested widths, explicit baseline capture, mandatory admin authentication and missing-baseline failures.
- 57 provisional screenshots, including custom-studio canvas views and authenticated admin at every requested width, with a provenance/hash manifest.
- Local backup of all ten pre-existing modified files in ignored `artifacts/dtf-baseline/pre-existing-changes.patch`. Those files are not included in this phase's commit.

## Verification

| Check | Observed result |
| --- | --- |
| Backend unit tests | PASS: 1 suite, 2 tests |
| Storefront TypeScript | PASS, including the new visual suite |
| Backend independent TypeScript | FAIL: 351 initial errors, primarily mixed React type resolution |
| Full root lint | FAIL: storefront 4 errors/41 warnings; backend 0 errors/3 warnings |
| HTTP integration | FAIL: no matching test files |
| Module integration | FAIL: no matching test files |
| Root production build | PASS: both applications built; backend Turbo output warning |
| Additional isolated storefront build | PASS |
| Existing desktop hero/rack E2E | FAIL: timeout locating Premium Oversize rack garment |
| New visual suite, final comparison | FAIL: 15 passed, 5 failed, 0 skipped; home cases fail at all five widths |
| Authenticated admin reference capture | PASS at all five widths after verified cookie session setup |

A diagnostic backend type-resolution probe eliminated the React JSX errors but still reported Buffer/typed-array type incompatibilities. This probe only created an ignored diagnostic config; it did not change backend configuration or suppress errors.

Focused ESLint for the new test/config files passes. Required project-wide failures remain visible and no rules were disabled.

Final comparison: **15 passed, 5 failed, 0 skipped**. All five product-studio, cart and authenticated admin cases pass. Home cases fail on image differences (including a 1-pixel mobile viewport difference and repeatability differences in the home 3D scene). References are unchanged and the phase is not accepted. No failed case was skipped or hidden. Local JSON/HTML reports and diffs are in `artifacts/dtf-visual/`.

## Files added

- `apps/storefront/playwright.visual.config.ts` and `apps/storefront/e2e/visual/design-preservation.spec.ts`.
- `apps/storefront/e2e/visual/baselines/`: 57 provisional PNGs and `manifest.json`.
- `docs/dtf/phase-00-analysis.md` and `docs/superpowers/plans/2026-11-24-dtf-migration.md`.
- `DTF-MIGRATION-REPORT.md`, `VISUAL-REGRESSION-REPORT.md`, `SHOPIFY-SETUP.md`, `DTF-PRODUCTION-GUIDE.md`, `DEPLOYMENT-GUIDE.md`.

No previously tracked production file is included in this change.

## Scope not yet delivered

Phases 01–06 have not been implemented. There are no new DTF products, USD pricing engine, gang-sheet editor, Shopify clients/checkout/webhooks, production pipeline or US shipping setup. Existing Medusa catalog and commerce behavior remain in place. No live payment, shipping, printer/RIP output or application settings have been verified.

This follows the explicit instruction not to advance with failing tests. Missing credentials are not being presented as the cause of the existing code/test failures.

## Design preservation

No production UI, global CSS, Tailwind, design tokens, fonts, logos, animation source or existing admin source was edited by this work. Existing user edits remain untouched. Refer to the analysis for exact protected paths.

## Rollback

This work adds documentation and an independent test configuration/suite. Revert its commit(s) to remove it; no database or commerce rollback is required. Do not reset or clean the working tree: the ten pre-existing user edits must be preserved. The ignored pre-existing patch is an additional local recovery aid and is not pushed to GitHub.

## Next gate

Resolve baseline lint/type/test failures, make animation captures reproducible, add explicit scene/animation behavior validation and complete authenticated admin comparisons. Complete Phase 00 before implementing Phase 01. Do not enable live Shopify commerce, merge main or deploy based on this partial work.
