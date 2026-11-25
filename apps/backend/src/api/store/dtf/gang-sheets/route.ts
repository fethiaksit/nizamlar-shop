import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import type { SaveDtfGangSheetBody } from "../../../dtf-validators"
import { saveDtfGangSheetWorkflow } from "../../../../workflows/dtf/save-dtf-gang-sheet"
import { seedDefaultDtfCatalogWorkflow } from "../../../../workflows/dtf/seed-default-dtf-catalog"

export async function POST(
  req: MedusaStoreRequest<SaveDtfGangSheetBody>,
  res: MedusaResponse
) {
  await seedDefaultDtfCatalogWorkflow(req.scope).run({ input: {} })

  const { result } = await saveDtfGangSheetWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json(result)
}
