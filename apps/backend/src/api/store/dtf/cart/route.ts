import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import type { DtfAddToCartBody } from "../../../dtf-validators"
import { addDtfTransferToCartWorkflow } from "../../../../workflows/dtf/add-dtf-transfer-to-cart"
import { seedDefaultDtfCatalogWorkflow } from "../../../../workflows/dtf/seed-default-dtf-catalog"

export async function POST(
  req: MedusaStoreRequest<DtfAddToCartBody>,
  res: MedusaResponse
) {
  await seedDefaultDtfCatalogWorkflow(req.scope).run({ input: {} })
  const { result } = await addDtfTransferToCartWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(200).json({
    success: true,
    cartId: result.cartId,
    quote: result.verifiedQuote,
    metadata: result.metadata,
  })
}
