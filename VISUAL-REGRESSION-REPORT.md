# Visual Regression Report

Status: **Phase 00 in progress; preservation is not yet verified.**

## Scope

The dedicated read-only suite is `apps/storefront/e2e/visual/design-preservation.spec.ts`, configured by `apps/storefront/playwright.visual.config.ts`. It declares 20 cases at 390, 768, 1024, 1440 and 1920 px. It covers home viewport, navbar, hero, rack, home 3D experience, product cards, footer, mobile menu, product studio, cart and authenticated admin.

It uses a seeded browser random source and Playwright's clock. CSS animations are disabled only during test screenshots; production CSS/animation code is unchanged. Canvas areas are not masked. Dynamic captures must stabilize before a baseline can be accepted.

## Commands

Start the local backend and storefront in separate terminals using `npm run backend:dev` and `npm run storefront:dev` from the repository root. Do not run a build concurrently against the dev server's `.next` output.

From `apps/storefront`:

```sh
# Discover all 20 cases without executing them.
npm exec playwright -- test --config playwright.visual.config.ts --list

# First capture: writes missing baselines only, never replaces existing ones.
VISUAL_CAPTURE=1 npm exec playwright -- test --config playwright.visual.config.ts

# Compare: missing or changed references fail.
npm exec playwright -- test --config playwright.visual.config.ts
```

Google Chrome must be installed, or set `CHROME_PATH` to the intended Chromium executable. Supported environment inputs are `E2E_BASE_URL`, `E2E_COUNTRY`, `E2E_PRODUCT_HANDLE`, `E2E_ADMIN_URL` and `E2E_ADMIN_STORAGE_STATE`. Admin state is mandatory for a successful full run and must be a locally secured, ignored storage-state file; never commit it.

## Evidence and limitations

- 57 provisional baseline images live under `apps/storefront/e2e/visual/baselines/`. `manifest.json` records image hashes, starting commit and the hash of the local pre-existing source patch.
- HTML report, JSON results, diffs and traces live in ignored `artifacts/dtf-visual/`.
- A comparison before initial capture correctly failed on the missing mobile cart reference.
- Initial mobile capture exposed an unstable home 3D scene and a lazy-image wait issue in the harness. The wait was corrected; references were not replaced, tolerance was not raised and canvas content was not masked.
- Follow-up capture uses explicit clock pausing and resumes clocks for lazy scene initialization. Repeat comparison detected a 2,092-pixel difference in the mobile home 3D scene; the original reference remains unchanged. The first full repeat produced 13 passing and 7 failing cases; two admin failures used the earlier JWT-only state. After exchanging for a verified cookie session, both missing mobile/tablet admin captures passed. The final strict comparison is **15 passed, 5 failed, 0 skipped**. All five home cases fail; product studio, cart and authenticated admin pass at every width. A 1-pixel mobile viewport mismatch is also retained as a failure.
- Existing desktop hero/rack E2E fails waiting for a rack garment named `Premium Oversize`; no source change was made to conceal it.
- Authenticated admin fails without `E2E_ADMIN_STORAGE_STATE`; the login page is not counted as admin coverage. A local test cookie session has now been verified without storing credentials in Git.
- Captures include the user's ten pre-existing uncommitted changes. They cannot establish clean-main parity by themselves.
- There is no after-migration comparison: the commerce migration has not started while the initial gates fail.

## Review findings still open

Visible-image completeness is now required before capture, admin authentication is mandatory, and lazy canvases wait for network idle. However, canvas existence and network idle do not prove every GLTF/texture is correctly rendered. Explicit scene readiness and deterministic animation-behavior tests (autoplay timing, rack interaction, studio rotation) remain necessary before Phase 00 can pass. A frozen screenshot alone is not evidence that animation behavior is preserved.

## Acceptance

No claim of zero visual regression can be made until all applicable captures and a subsequent unchanged comparison pass, authenticated admin coverage exists, and visual inspection confirms the protected areas. Baselines must not be updated to conceal implementation regressions.
