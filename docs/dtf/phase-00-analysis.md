# Phase 00 — analysis and design protection

Analysis date: 24 November 2026 (Europe/Istanbul).

## Repository state

- Repository: https://github.com/fethiaksit/nizamlar-shop
- Local and remote starting HEAD: `35168b05ce3633eac756f9dc7330382487e30677`.
- Working branch: `feat/dtf-transfer-shopify-integration`.
- Authoritative package manager: `npm@11.19.1`; root lockfile: `package-lock.json`.
- Both apps are present. Runtime is Node 26.10.0, above the repository's Node >=22.23.4 floor.
- Ten pre-existing modified files included studio, garment model, navigation, cart dropdown, globals and generated Next types. They are preserved, not staged as migration work. A local binary patch and starting SHA are saved in ignored `artifacts/dtf-baseline/`.
- Baselines describe the user's current working tree, not a clean copy of main. Reproducing them elsewhere requires preserving those pre-existing edits.

## Current architecture

Next.js App Router serves localized `src/app/[countryCode]` pages. The current home page composes CinematicHero, NizamlarClothesRackSection, Tshirt3dExperience and Medusa product cards. Product actions open the custom-studio dialog; `?studio=1` opens it directly for supported products. React Three Fiber, Drei, Three.js, Framer Motion and GSAP are already installed.

Storefront `src/lib/data` uses the Medusa SDK for catalog, categories, cart, checkout, payment, customers and orders. Existing locale/cookie support must be retained. There is currently no Shopify client or Shopify commerce source selection.

Backend is Medusa 2.22.2. Its custom admin includes site-hub/settings/hero/rack/navigation/media, product management, print models/placements/designs/pricing and ERP status. Existing design and pricing routes persist through direct PostgreSQL clients, while custom cart addition invokes `addToCartWorkflow`. New DTF features must use custom modules and workflows instead of extending these raw SQL patterns.

The current price model combines a garment base price with a technique/size/surface surcharge, TRY tax and quantity tiers. Both browser and backend contain fallback price constants. These are unsuitable for USD transfer-only pricing and must not become Shopify checkout truth.

Custom designs carry original files, previews, dimensions and garment variant/size/color references. Current uploads check MIME signatures and size limits; the new model also needs decoded pixel/DPI limits, ownership, safe SVG handling and private production asset access. Garment previews and print-ready transparent assets must have separate references.

The `order.placed` subscriber delegates to an ERP client. The DTF pipeline must use verified Shopify payment state and durable webhook processing before creating production work.

PostgreSQL and Redis Docker services are healthy; backend health responds HTTP 200 after startup. No database migrations, seeding or catalog/order writes were performed in this analysis.

## Protected component inventory

| Area | Existing source | Preservation rule |
| --- | --- | --- |
| Slider | `src/modules/cinematic-hero/index.tsx` | Keep layout, autoplay interval, transition and garment visuals |
| Animated rack | `src/modules/clothes-rack/` | Keep cloth simulation, arrangement, drag and lazy load |
| Home 3D experience | `src/modules/tshirt3d-experience/` | Keep intro, camera, lights, color and artwork controls |
| Custom studio | `src/modules/custom-studio/` | Keep dialog, canvas, placement, front/back, zoom and rotation |
| Shared garment | `src/modules/garment-3d/` | Keep model/geometry/material/animation and camera behavior |
| Navbar/menu | `src/modules/layout/templates/nav/`, `components/side-menu/` | Keep dimensions, styles and responsive layout |
| Cards | `src/modules/products/components/product-preview/` | Keep layout, hover, image and pricing treatment |
| Cart | `src/modules/cart/`, `layout/components/cart-dropdown/` | Keep icon, drawer/dropdown and item presentation |
| Footer | `src/modules/layout/templates/footer/` | Keep layout and visual identity |
| Global design | `src/styles/globals.css`, Tailwind config, fonts and brand assets | Do not change palette, tokens, fonts or global styles |
| Admin | `apps/backend/src/admin/routes/` and widgets | Reuse existing components and styling |

Paths beginning with `src/` above refer to `apps/storefront`.

## Existing verification limits

- Existing Playwright design tests take screenshots but do not compare against stored references.
- Existing sync E2E tests update catalog prices/titles using embedded test credentials. They are not safe to execute against an unspecified environment and are excluded from the new read-only visual suite.
- HTTP and module integration scripts currently find no matching test files and exit 1. This is missing coverage, not passing tests.
- Raw backend `tsc --noEmit` initially reports 351 JSX/type errors. Installed shared UI types resolve React 19 while backend React types are 18; a scoped type-resolution probe is recorded separately.
- Initial lint: storefront 4 errors/41 warnings, backend 0 errors/3 warnings. Three errors are `any` casts in cache revalidation; one mutates a hook-returned texture in the pre-existing garment edits.
- Full root production build succeeds, but that does not imply the independent backend typecheck passes. Turbo warns that backend build outputs do not match its configured outputs.

## Phase gate

Phase 00 is complete only when healthy baseline images have been captured, rerun comparisons are reproducible, authenticated admin coverage exists and all required checks pass. Later phases must not be marked started or complete while this gate fails.
