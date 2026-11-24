import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { DTF_COMMERCE_MODULE } from "../../../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../../../modules/dtf_commerce/service"
import type { UpsertDtfPricingRuleBody } from "../../../dtf-validators"
import { seedDefaultDtfCatalogWorkflow } from "../../../../workflows/dtf/seed-default-dtf-catalog"
import { upsertDtfPricingRuleWorkflow } from "../../../../workflows/dtf/upsert-dtf-pricing-rule"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  await seedDefaultDtfCatalogWorkflow(req.scope).run({ input: {} })
  const dtfService = req.scope.resolve<DtfCommerceModuleService>(
    DTF_COMMERCE_MODULE
  )
  const rules = await dtfService.listDtfPricingRules({}, { take: 50 })
  return res.status(200).json({ pricingRules: rules })
}

export async function POST(
  req: AuthenticatedMedusaRequest<UpsertDtfPricingRuleBody>,
  res: MedusaResponse
) {
  const { result } = await upsertDtfPricingRuleWorkflow(req.scope).run({
    input: req.validatedBody,
  })
  return res.status(200).json({ pricingRule: result })
}
