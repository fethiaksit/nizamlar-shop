# DTF Transfer Migration Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Never advance a phase with failing checks.

**Goal:** Convert the existing Nizamlar storefront to DTF transfers without changing its visual identity.

**Architecture:** Shopify owns US catalog, prices, inventory, carts, checkout and payment/order truth. Medusa retains private artwork, production and ERP integration. Existing Next.js, admin and Three.js components remain in place; commerce integration is feature flagged and disabled until configured.

**Tech Stack:** npm 11.19.1, Next.js 16.3.8, Medusa 2.22.2, PostgreSQL, Redis, Docker, Playwright.

**Spec:** User-supplied NIZAMLAR SHOP — DTF TRANSFER E-TİCARET DÖNÜŞÜMÜ, 24 November 2026.

## Global Constraints

- Work on `feat/dtf-transfer-shopify-integration`; no merge or deployment.
- Preserve the ten pre-existing modified files. Their patch is locally saved in ignored `artifacts/dtf-baseline/`.
- Preserve global CSS, palette, typography, layout, hero/rack/studio animation and responsive behavior.
- No new UI library, no Medusa data deletion, no secret disclosure.
- Check types, lint, unit/integration tests, production build and visual regression at each phase.
- No unverified pricing, payment, shipping or application claims; no fabricated checkout success.

## Review Focus

- A 500 response must fail visual capture before any baseline can be written.
- Missing baseline images must fail comparisons; updates require explicit capture mode.
- Animated Three.js and slider states must be controlled in tests, without changing production animation code.
- Missing admin authentication must be reported as missing coverage.
- Existing customer-data-mutating E2E tests must not run against an unspecified live environment.

## Phase 00: Baseline and preservation

**Files:** `apps/storefront/playwright.visual.config.ts`, `apps/storefront/e2e/visual/design-preservation.spec.ts`, `docs/dtf/phase-00-analysis.md`, `VISUAL-REGRESSION-REPORT.md`.

- [x] Detect npm, storefront, instructions and repository HEAD.
- [x] Create requested branch and save pre-existing patch without staging user edits.
- [x] Record architecture and protected component inventory.
- [x] Add isolated visual suite at 390, 768, 1024, 1440, 1920 px.
- [x] Capture 57 provisional references across all five widths, including authenticated admin.
- [ ] Establish repeatable animation comparisons and explicit scene/behavior readiness.
- [ ] Run existing checks; resolve baseline failures before advancing.
- [ ] Commit phase 00, push and open review PR with actual test results.

## Phase 01: DTF model and pricing

Add a Medusa custom module with generated, additive migrations for product types, licensed design publication, print/sheet limits, USD integer-cent rule versions, quantity tiers and application instructions. Use workflows and validated routes for admin changes. Unit-test rounding, overflow, invalid dimensions, minimums, tiers and authoritative server quotes. Never reuse the existing TRY garment fallback for DTF checkout.

## Phase 02: Custom DTF Studio

Reuse `custom-studio`, `garment-3d` and `tshirt3d-experience`. Keep color strictly preview-only and remove garment size as a purchase requirement. Validate raster/SVG content and effective DPI server-side. Save protected original, production asset and mockup separately. Add physical dimensions, units and server quote; preserve existing placement and rotation behavior. Compare protected screenshots before committing.

## Phase 03: Gang sheets

Add an editor within existing components/styles with a pure layout engine (in integer physical units), undo/redo, collision and bounds checks, auto placement, zoom/pan and saved state. Seed configurable 22-inch width and 12/24/36/48/60/120-inch lengths. Render large transparent production assets in a server worker with memory/pixel limits. Output format requires verified printer/RIP configuration.

## Phase 04: Shopify

Verify supported API version in official Shopify documentation at implementation time. Add server-only GraphQL clients, feature flag, US contextual catalog and cart actions. Use supported Shopify pricing mechanisms with checkout-time quote validation; reject unrepresentable dynamic prices. Add raw-body HMAC webhook verification, durable inbox/idempotency and retry processing. Only verified paid orders enter production. Test with mocks and a development store, without claiming real payment.

## Phase 05: Production

Add unique production references and guarded state transitions from Payment Confirmed through Delivered plus cancellation/refund. Reuse admin visual patterns for QC, private artwork downloads with expiring authorization, shipping tracking and sync status. Provide an ERP boundary. Test duplicated and out-of-order payment events and unauthorized artwork access.

## Phase 06: US readiness

Keep Turkish localization; default US content to English, USD and inches. Update menu text within the existing nav. Add How to Apply, FAQ and order tracking. Publish product-specific temperature/time/peel information only after production approval. Use Shopify shipping/payment configuration; keep live mode off until verified. Run all gates, document setup/production/deployment/rollback, commit, push and request review.
