import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import type { DtfQuoteRequestBody } from "../../../dtf-validators"
import { calculateDtfQuoteWorkflow } from "../../../../workflows/dtf/calculate-dtf-quote"
import { seedDefaultDtfCatalogWorkflow } from "../../../../workflows/dtf/seed-default-dtf-catalog"

export async function POST(
  req: MedusaStoreRequest<DtfQuoteRequestBody>,
  res: MedusaResponse
) {
  await seedDefaultDtfCatalogWorkflow(req.scope).run({ input: {} })

  const { result } = await calculateDtfQuoteWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(200).json({
    quote: result.quote,
    quoteSignature: result.quoteSignature,
  })
}
