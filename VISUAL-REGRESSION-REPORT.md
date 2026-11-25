# Visual Regression Report

Status: **Technical determinism & post-Phase-06 zero-diff preservation verified against `candidate-baselines/` (20/20 passed, `maxDiffPixels: 0`); Phase 00 formal sign-off awaits explicit user approval to replace `baselines/` with `candidate-baselines/`.**

## Scope & Determinism Architecture

- Suite: `apps/storefront/e2e/visual/design-preservation.spec.ts` (`apps/storefront/playwright.visual.config.ts`) across `390, 768, 1024, 1440, 1920` px widths (20 tests, 57 screenshots including `home-3d-studio.png`, `animated-rack.png`, `custom-studio.png`, `custom-studio-canvas.png`, `cart.png`, `mobile-navigation.png`, and authenticated `admin.png`).
- Test-only harness (`apps/storefront/e2e/helpers/webgl-determinism.ts`): aligns Playwright's virtual clock to `16ms` frame boundaries, resets R3F's internal `THREE.Clock` and Drei `<Center>` bounding-box offset at `t=0`, and clears residual pointer coordinates without modifying any production component, CSS token, or animation speed. Zero `<canvas>` masking; `maxDiffPixels: 0`.

## Baseline Sets & Integrity

1. **Untouched Original Baselines (`apps/storefront/e2e/visual/baselines/` — default):**
   - All 57 original PNGs remain byte-for-byte untouched (`57/57` SHA-256 verified against `manifest.json` and `artifacts/dtf-stabilization/archived-original-baselines/` via `node ./scripts/compare-visual-baselines.cjs`).
   - 46 of 57 original PNGs already match the deterministic captures within threshold; the remaining 11 (`home-3d-studio.png` at 5 widths plus pre-clock-fix `390`/`768` home captures) differ solely due to unpaused animation timestamps during the initial provisional capture.
2. **Deterministic Candidate Baselines (`apps/storefront/e2e/visual/candidate-baselines/`):**
   - Verified across 3 consecutive pre-migration runs (`20/20` × 3 = `60/60`) AND re-verified **after** completing Phases 01–06 (`20/20` passed, `0` diff pixels).

## Commands

```sh
# Compare against deterministic candidate baselines (requires local dev servers on :8000 and :9000):
cd apps/storefront
E2E_ADMIN_STORAGE_STATE=../../artifacts/dtf-baseline/admin-storage.json \
  VISUAL_BASELINE_SET=candidate \
  npx playwright test --config=playwright.visual.config.ts

# Verify SHA-256 integrity of all 57 original baselines and generate comparison JSON:
cd ../..
node ./scripts/compare-visual-baselines.cjs
```
