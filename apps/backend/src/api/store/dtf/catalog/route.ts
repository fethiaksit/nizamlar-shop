import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { DTF_GARMENT_DISCLAIMER } from "../../../../modules/dtf_commerce/pricing"
import { seedDefaultDtfCatalogWorkflow } from "../../../../workflows/dtf/seed-default-dtf-catalog"

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const { result } = await seedDefaultDtfCatalogWorkflow(req.scope).run({
    input: {},
  })

  return res.status(200).json({
    disclaimer: DTF_GARMENT_DISCLAIMER,
    garmentIncluded: false,
    currencyCode: "USD",
    shopifyEnabled: process.env.DTF_SHOPIFY_COMMERCE_ENABLED === "true",
    pricingRule: result.pricingRule,
    products: result.products,
  })
}
