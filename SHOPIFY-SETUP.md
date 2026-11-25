# Shopify Headless US Setup Guide

Status: **Implemented in code (`apps/backend/src/modules/dtf_commerce/shopify-client.ts`, `apps/storefront/src/lib/data/shopify-commerce.ts`, `apps/backend/src/api/webhooks/shopify/route.ts`); feature-flagged OFF by default (`DTF_SHOPIFY_COMMERCE_ENABLED=false`) until real Shopify store credentials are configured.**

> **Honest Connection Notice:** Live Shopify store connectivity and live US card payment processing have **not** been claimed or executed in this repository because live credentials were not provided. Automated tests validate the GraphQL contracts, fail-closed guards, and raw-body HMAC webhook pipeline using deterministic test fixtures (`isSimulatedTestAdapter: true`).

## 1. Architecture Summary

- **Storefront UI:** Existing Nizamlar Next.js storefront (`apps/storefront`) is 100% preserved. No Shopify Liquid theme is used.
- **Standard Ready-to-Press / Bundle Items:** Server-mediated Storefront GraphQL API (`@inContext(country: US, language: EN)`, `POST /store/dtf/shopify/cart`) manages `cartCreate`, `cartLinesAdd`, `cartLinesUpdate`, `cartLinesRemove`, `cartDiscountCodesUpdate`, and `checkoutUrl`.
- **Custom-Sized DTF Transfers & 22" Gang Sheets:** Client cart attributes are **never** trusted for pricing. `POST /store/dtf/shopify/checkout` recalculates the authoritative USD integer-cent quote on the server, verifies the HMAC `quoteSignature` and saved `DtfDesignAsset` dimensions, and invokes Shopify Admin GraphQL `draftOrderCreate` (`originalUnitPriceWithCurrency` in `USD`) to return an authoritative `invoiceUrl`. If verification or draft order creation fails, the endpoint **fails closed**.
- **Webhooks (`POST /webhooks/shopify`):** Preserves raw request bytes (`preserveRawBody: true`), verifies `X-Shopify-Hmac-Sha256` with `crypto.timingSafeEqual`, persists durable idempotency records in `dtf_webhook_event`, and enforces the paid-order gate so only verified `orders/paid` webhooks create `DtfProductionJob` records.

## 2. Required Environment Variables

Configure in deployment secrets (never commit `.env` or `.env.local`; templates are in `apps/backend/.env.template` and `apps/storefront/.env.example`):

### Backend (`apps/backend`)
- `DTF_SHOPIFY_COMMERCE_ENABLED=false` (set to `true` only after staging verification)
- `DTF_SHOPIFY_TEST_ADAPTER=false` (**must** be `false` in staging/production)
- `SHOPIFY_STORE_DOMAIN=your-us-store.myshopify.com`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN=<server-only-storefront-token>`
- `SHOPIFY_ADMIN_ACCESS_TOKEN=<admin-api-token-with-write_draft_orders-read_orders-read_products>`
- `SHOPIFY_WEBHOOK_SECRET=<webhook-signing-secret>`
- `SHOPIFY_API_VERSION=2026-10`
- `DTF_QUOTE_SECRET=<strong-random-hmac-secret>`
- `DTF_ASSET_DOWNLOAD_SECRET=<strong-random-hmac-secret>`

### Storefront (`apps/storefront`)
- `NEXT_PUBLIC_DTF_SHOPIFY_ENABLED=false` (set to `true` alongside backend flag)
- `SHOPIFY_STORE_DOMAIN=your-us-store.myshopify.com`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN=<server-only-storefront-token>`
- `SHOPIFY_API_VERSION=2026-10`

## 3. Required Shopify Webhooks

Register JSON webhooks pointing to `https://<medusa-backend-host>/webhooks/shopify`:
1. `orders/create` (audited; unpaid orders are marked `ignored_unpaid` and never enter production)
2. `orders/paid` (creates verified `DtfProductionJob` in `payment_confirmed`)
3. `orders/cancelled` (updates `cancellation_state = "cancelled"`)
4. `refunds/create` (updates `refund_state`)
5. `fulfillments/create` & `fulfillments/update` (syncs US carrier tracking)
