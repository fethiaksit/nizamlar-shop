# DTF Production & RIP Operations Guide

Status: **Implemented & integration-tested (`apps/backend/src/modules/dtf_commerce/`, `/app/dtf-production`, `/app/dtf-config`).**

## 1. Paid-Order Gate & 8-Stage Production Lifecycle

Only orders with `payment_verified === true` (ingested from HMAC-verified `orders/paid` webhooks) can enter or advance in the DTF queue (`assertPaidOrderBeforeProduction`).

Active workflow states (`apps/backend/src/modules/dtf_commerce/production-state.ts`):
1. `payment_confirmed`
2. `design_review`
3. `ready_for_printing`
4. `printing`
5. `quality_control`
6. `packed`
7. `shipped` *(requires `tracking_number` before transition is allowed)*
8. `delivered`

`cancellation_state` (`none | cancel_requested | cancelled`) and `refund_state` (`none | partial_refund | refunded`) are tracked independently; cancelled jobs are blocked from advancing through fulfillment.

## 2. Strict Separation of Production Assets vs Garment Mockups

- **Original Customer File:** `private/uploads/dtf-originals/`
- **Print-Ready Transparent PNG (`300 DPI` target, RGBA `colorType=6`):** `private/uploads/dtf-production/` — contains **only** the transfer graphic(s) on a `rgba(0,0,0,0)` transparent canvas. Opaque RGB garment mockups are rejected with HTTP `400` by `createDtfDesignAssetWorkflow`.
- **Garment Contrast Mockup:** `private/uploads/dtf-mockups/` — preview-only (`"DTF transfer only. Garment not included."`).
- **Authorized Download:** Operators in `/app/dtf-production` click **Download Transparent Print PNG** or **Download Source File**, which calls `POST /admin/dtf/production-jobs/:id/download-token` to mint a 15-minute HMAC-signed download URL (`GET /store/dtf/production-assets/:jobId`). Expired or tampered tokens return HTTP `403`.

## 3. Roll Width, RIP & Application Parameter Safety Gates

- **Roll Width (`/app/dtf-config`):** Defaults to `22"` (`12"`, `24"`, `36"`, `48"`, `60"`, `120"` lengths) with `printer_rip_verified = false`. Confirm physical printer/RIP media width and toggle `printer_rip_verified = true` in `/app/dtf-config` before live gang-sheet fulfillment.
- **Heat Press & Home Iron Guardrail (`/admin/dtf/products` & `/how-to-apply`):** The backend (`upsertDtfProductSpecWorkflow`) and storefront (`/how-to-apply`) forbid publishing numeric temperature, dwell time, pressure, or wash-cycle guarantees while `application_approved === false`. Complete physical lot testing before setting `application_approved = true` or `home_iron_verified = true`.
- **Nizamlar ERP Boundary (`dtf-erp-adapter.ts`):** Defaults safely to `NIZAMLAR_ERP_DRY_RUN=true` (`dry_run_synced`) until live ERP endpoint credentials are enabled.
