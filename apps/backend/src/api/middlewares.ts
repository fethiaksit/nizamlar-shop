import {
  authenticate,
  configureStoreSearch,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import {
  CreateDtfDesignAssetSchema,
  DtfAddToCartSchema,
  DtfQuoteRequestSchema,
  MintAssetDownloadTokenSchema,
  SaveDtfGangSheetSchema,
  ShopifyCartActionSchema,
  ShopifyVerifiedDtfCheckoutSchema,
  TransitionDtfProductionJobSchema,
  UpsertDtfPricingRuleSchema,
  UpsertDtfProductSpecSchema,
} from "./dtf-validators"

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  routes: [
    {
      methods: ["POST"],
      matcher: "/store/custom-designs",
      bodyParser: { sizeLimit: "40mb" },
    },
    {
      method: ["POST"],
      matcher: "/store/search",
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    {
      methods: ["POST"],
      matcher: "/store/dtf/quote",
      middlewares: [validateAndTransformBody(DtfQuoteRequestSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/store/dtf/cart",
      middlewares: [validateAndTransformBody(DtfAddToCartSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/store/dtf/designs",
      bodyParser: { sizeLimit: "45mb" },
      middlewares: [validateAndTransformBody(CreateDtfDesignAssetSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/store/dtf/gang-sheets",
      bodyParser: { sizeLimit: "45mb" },
      middlewares: [validateAndTransformBody(SaveDtfGangSheetSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/store/dtf/shopify/cart",
      middlewares: [validateAndTransformBody(ShopifyCartActionSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/store/dtf/shopify/checkout",
      middlewares: [validateAndTransformBody(ShopifyVerifiedDtfCheckoutSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/webhooks/shopify",
      bodyParser: { preserveRawBody: true },
    },
    {
      methods: ["GET", "POST"],
      matcher: "/admin/dtf/pricing-rules",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      methods: ["POST"],
      matcher: "/admin/dtf/pricing-rules",
      middlewares: [validateAndTransformBody(UpsertDtfPricingRuleSchema)],
    },
    {
      methods: ["GET", "POST"],
      matcher: "/admin/dtf/products",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      methods: ["POST"],
      matcher: "/admin/dtf/products",
      middlewares: [validateAndTransformBody(UpsertDtfProductSpecSchema)],
    },
    {
      methods: ["GET", "POST"],
      matcher: "/admin/dtf/production-jobs*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      methods: ["POST"],
      matcher: "/admin/dtf/production-jobs/:id/transition",
      middlewares: [validateAndTransformBody(TransitionDtfProductionJobSchema)],
    },
    {
      methods: ["POST"],
      matcher: "/admin/dtf/production-jobs/:id/download-token",
      middlewares: [validateAndTransformBody(MintAssetDownloadTokenSchema)],
    },
  ],
})
