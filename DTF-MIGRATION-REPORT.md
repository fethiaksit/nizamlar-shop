# DTF Migration Report

Date: 25 November 2026. Status: **Phases 00.1 and 01–06 Implemented & Verified in Code (Phase 00 original-baseline replacement awaits explicit user approval; Live Shopify commerce disabled pending production credentials).**

## Delivered across Phases 00.1 – 06

- **Phase 00.1 Stabilization (`a5435ca`):**
  - External-drive AppleDouble (`0x00051607`) quarantine script (`scripts/quarantine-appledouble.cjs`) + pre-hooks & `tsconfig` excludes.
  - Deterministic WebGL 3D test harness (`apps/storefront/e2e/helpers/webgl-determinism.ts`) achieving `15/15` byte-identical 3D calibration renders and `20/20` (`57/57` PNG) zero-pixel-diff visual regression against `candidate-baselines/` while keeping all 57 original `baselines/` untouched (`57/57` SHA-256 verified).
  - Real CDP hardware touch & animation behavior suite (`10/10`) and hydrated Hero/Rack E2E (`3/3`).
- **Phase 01 DTF Product Model & USD Pricing (`f079f43`):**
  - Additive Medusa v2 `dtf_commerce` module & migration (`Migration20261124215424.ts`).
  - Four DTF transfer types (`ready_to_press`, `custom_dtf`, `gang_sheet`, `dtf_bundle`), integer-cent USD pricing engine (`in`/`cm`), quantity discount tiers, minimum order floor, HMAC quote signing, artwork header/DPI/alpha inspection, and `"DTF transfer only. Garment not included."` across product and cart UIs.
- **Phase 02 Custom DTF Studio (`1e4b288`):**
  - Extended 3D/2D Studio (`custom-studio` & `tshirt3d-experience`) for `/us` and `?dtf=1` without changing a single pixel of `/tr` baselines.
  - Strict separation between transparent RGBA print-ready production PNG (`createTransparentDtfPrintPng`) and garment mockup (`createProductionPreview`), enforced on the server (`POST /store/dtf/designs`).
- **Phase 03 Gang Sheet Builder (`5337cac`):**
  - Dedicated Nizamlar-branded `/[countryCode]/gang-sheet-builder` workspace + integer-mil shelf auto-nesting engine (`gang-sheet-layout.ts`), multi-image upload, duplication, scaling, rotation, snap alignment guides, overlap/bounds/margin checks, undo/redo, and 300-DPI-targeted transparent PNG export.
- **Phase 04 Shopify Headless Integration (`8eea4e9`):**
  - Server-only Storefront & Admin GraphQL clients (`shopify-client.ts`, `shopify-commerce.ts`), feature-flagged off (`DTF_SHOPIFY_COMMERCE_ENABLED=false`) until live credentials are supplied.
  - Fail-closed server-verified custom DTF checkout via Shopify Admin `draftOrderCreate` (`invoiceUrl`), never trusting client cart attributes for pricing.
  - Constant-time raw-body `X-Shopify-Hmac-Sha256` webhook verification (`POST /webhooks/shopify`), durable `dtf_webhook_event` idempotency, out-of-order cancel/refund handling, and strict paid-order gate.
- **Phase 05 DTF Production Management (`0a17751`):**
  - 8-stage workflow (`payment_confirmed -> design_review -> ready_for_printing -> printing -> quality_control -> packed -> shipped -> delivered`) + separate `cancellation_state` and `refund_state`, expiring HMAC private asset downloads, modular Nizamlar ERP boundary (`dryRun=true` default), and Admin UI (`/app/dtf-production`, `/app/dtf-config`).
- **Phase 06 US Market Readiness (`67d84a6`):**
  - `/us` English DTF navigation/footer/USD routing (`/tr` preserved 100%), 50 US states + DC + PR & `12345`/`12345-6789` ZIP validation, Turkey-to-US customs/duties disclosure, safety-gated `/how-to-apply` (withholding unapproved numeric heat/iron values), `/faq` (`FAQPage` JSON-LD), and PII-safe `/order-tracking`.

## Verification Matrix

| Check | Observed result |
| --- | --- |
| Backend TypeScript (`tsc --noEmit`) | PASS (0 errors) |
| Storefront TypeScript (`tsc --noEmit`) | PASS (0 errors) |
| Backend Lint (`medusa lint`) | PASS (0 errors) |
| Storefront Lint (`eslint .`) | PASS (0 errors) |
| Backend Unit Tests | PASS: 7 suites, 23/23 tests |
| Backend Module Integration Tests | PASS (isolated PostgreSQL `127.0.0.1:55434`) |
| Backend HTTP Integration Tests | PASS: 10/10 contracts |
| Backend Production Build (`medusa build`) | PASS (server + Admin bundle) |
| Storefront Isolated Production Build (`next build --webpack`) | PASS |
| 3D Calibration (`playwright.calibration.config.ts`) | PASS: 5/5 widths (15/15 byte-identical renders) |
| Candidate Visual Suite (`VISUAL_BASELINE_SET=candidate`) | PASS: 20/20 (57/57 PNGs, `maxDiffPixels: 0`) |
| Original 57 Baselines SHA-256 Integrity | PASS: 57/57 untouched |
| Behavior & Real Mobile Touch (`playwright.behavior.config.ts`) | PASS: 10/10 |
| Hero & 3D Rack E2E (`design-experience.spec.ts`) | PASS: 3/3 |
| US DTF Storefront/Studio/Gang Sheet E2E (`dtf-us-experience.spec.ts`) | PASS: 6/6 (desktop + mobile) |

## Remaining Operator Gates Before Live Production

1. User approval to promote `apps/storefront/e2e/visual/candidate-baselines/` over `baselines/` (completing formal Phase 00 sign-off).
2. Provision real Shopify US credentials & webhook secret, test a development-store order end-to-end, verify physical RIP roll width (`printer_rip_verified=true`) and approved press parameters (`application_approved=true`), then enable `DTF_SHOPIFY_COMMERCE_ENABLED=true`.
