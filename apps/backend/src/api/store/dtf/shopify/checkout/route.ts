import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import type { ShopifyVerifiedDtfCheckoutBody } from "../../../../dtf-validators"
import { createShopifyDtfCheckoutWorkflow } from "../../../../../workflows/dtf/create-shopify-dtf-checkout"
import { seedDefaultDtfCatalogWorkflow } from "../../../../../workflows/dtf/seed-default-dtf-catalog"

export async function POST(
  req: MedusaStoreRequest<ShopifyVerifiedDtfCheckoutBody>,
  res: MedusaResponse
) {
  await seedDefaultDtfCatalogWorkflow(req.scope).run({ input: {} })

  const { result } = await createShopifyDtfCheckoutWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(200).json(result)
}
