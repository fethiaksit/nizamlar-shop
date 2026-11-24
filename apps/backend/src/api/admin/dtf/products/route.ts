import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { DTF_COMMERCE_MODULE } from "../../../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../../../modules/dtf_commerce/service"
import type { UpsertDtfProductSpecBody } from "../../../dtf-validators"
import { seedDefaultDtfCatalogWorkflow } from "../../../../workflows/dtf/seed-default-dtf-catalog"
import { upsertDtfProductSpecWorkflow } from "../../../../workflows/dtf/upsert-dtf-product-spec"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  await seedDefaultDtfCatalogWorkflow(req.scope).run({ input: {} })
  const dtfService = req.scope.resolve<DtfCommerceModuleService>(
    DTF_COMMERCE_MODULE
  )
  const products = await dtfService.listDtfProductSpecs({}, { take: 100 })
  return res.status(200).json({ products })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpsertDtfProductSpecBody>,
  res: MedusaResponse
) {
  const { result } = await upsertDtfProductSpecWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  return res.status(200).json({ product: result })
}
