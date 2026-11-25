# Deployment & Release Guide

Status: **Code & automated verification complete on `feat/dtf-transfer-shopify-integration` (PR #1). Do NOT merge to `main` or enable live US payments until operator pre-launch gates below are completed.**

## 1. Local & CI Verification Commands

Detected package manager: **`npm@11.19.1`** (`package-lock.json`). External exFAT AppleDouble sidecars are quarantined automatically via `npm run quarantine:appledouble`.

```sh
# 1. Quarantine macOS AppleDouble sidecars
npm run quarantine:appledouble

# 2. Typecheck & Lint
cd apps/backend && npx tsc --noEmit && npm run lint
cd ../storefront && npx tsc --noEmit && npm run lint

# 3. Backend Unit, Module & HTTP Integration Suites (uses isolated PostgreSQL on 127.0.0.1:55434)
cd ../backend
npm run test:unit
npm run test:integration:modules
npm run test:integration:http

# 4. Production Builds (use isolated NEXT_BUILD_DIR if `next dev` is running on :8000)
cd ../backend && npm run build
cd ../storefront && NEXT_BUILD_DIR=../../artifacts/dtf-stabilization/next-prod-build npm run build

# 5. Database Migration (additive only — preserves all existing catalog/order records)
cd ../backend && npx medusa db:migrate
```

## 2. Pre-Launch Operator Checklist

1. **Database Backup & Additive Migration:** Take a PostgreSQL snapshot before running `npx medusa db:migrate` (`Migration20261124215424` adds `dtf_pricing_rule`, `dtf_product_spec`, `dtf_design_asset`, `dtf_production_job`, `dtf_webhook_event` without altering existing tables).
2. **Visual Baseline Approval:** Review `apps/storefront/e2e/visual/candidate-baselines/` and approve promoting them to `baselines/` if desired.
3. **Secrets & Shopify Staging Validation:** Populate production secrets from `.env.template` / `.env.example` (`DTF_SHOPIFY_TEST_ADAPTER=false`), register `/webhooks/shopify` in Shopify Admin, and run a full test order in a Shopify development/staging store.
4. **RIP & Press Parameter Approval:** Verify physical roll width in `/app/dtf-config` (`printer_rip_verified=true`) and approve tested press/iron instructions in `/admin/dtf/products` (`application_approved=true`).
5. **Feature Flag Cutover:** Enable `DTF_SHOPIFY_COMMERCE_ENABLED=true` and `NEXT_PUBLIC_DTF_SHOPIFY_ENABLED=true` (and set `NEXT_PUBLIC_DEFAULT_REGION=us` on the US storefront deployment).

## 3. Rollback Plan

- **Instant Feature-Flag Rollback:** Set `DTF_SHOPIFY_COMMERCE_ENABLED=false` and `NEXT_PUBLIC_DTF_SHOPIFY_ENABLED=false` (and `NEXT_PUBLIC_DEFAULT_REGION=tr` if applicable) to disable Shopify checkout immediately without database rollback.
- **Database Rollback:** All `dtf_*` tables are strictly additive (`Migration20261124215424.ts` includes full `down()` SQL); existing Medusa tables (`product`, `order`, `custom_design`, site management) remain untouched.
