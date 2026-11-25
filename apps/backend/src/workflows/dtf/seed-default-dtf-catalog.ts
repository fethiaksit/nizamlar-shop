import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { DTF_COMMERCE_MODULE } from "../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../modules/dtf_commerce/service"
import {
  DEFAULT_DTF_PRODUCT_SPECS,
  mapPricingRuleRecord,
} from "../../modules/dtf_commerce/catalog-defaults"
import { DEFAULT_DTF_PRICING_RULE } from "../../modules/dtf_commerce/pricing"

const ensureDefaultDtfCatalogStep = createStep(
  "ensure-default-dtf-catalog-step",
  async (_input: Record<string, never>, { container }) => {
    const dtfService = container.resolve<DtfCommerceModuleService>(
      DTF_COMMERCE_MODULE
    )

    let activeRules = await dtfService.listDtfPricingRules(
      { is_active: true },
      { take: 1 }
    )

    if (activeRules.length === 0) {
      const createdRule = await dtfService.createDtfPricingRules({
        code: DEFAULT_DTF_PRICING_RULE.code,
        currency_code: "USD",
        is_active: true,
        rate_per_sq_inch_cents: DEFAULT_DTF_PRICING_RULE.rate_per_sq_inch_cents,
        min_transfer_unit_cents:
          DEFAULT_DTF_PRICING_RULE.min_transfer_unit_cents,
        min_order_cents: DEFAULT_DTF_PRICING_RULE.min_order_cents,
        gang_sheet_width_in: DEFAULT_DTF_PRICING_RULE.gang_sheet_width_in,
        max_print_width_in: DEFAULT_DTF_PRICING_RULE.max_print_width_in,
        max_print_height_in: DEFAULT_DTF_PRICING_RULE.max_print_height_in,
        min_dimension_in: DEFAULT_DTF_PRICING_RULE.min_dimension_in,
        min_margin_in: DEFAULT_DTF_PRICING_RULE.min_margin_in,
        min_gap_in: DEFAULT_DTF_PRICING_RULE.min_gap_in,
        target_dpi: DEFAULT_DTF_PRICING_RULE.target_dpi,
        min_acceptable_dpi: DEFAULT_DTF_PRICING_RULE.min_acceptable_dpi,
        printer_rip_verified: DEFAULT_DTF_PRICING_RULE.printer_rip_verified,
        gang_sheet_lengths_json:
          DEFAULT_DTF_PRICING_RULE.gang_sheet_lengths as unknown as Record<
            string,
            unknown
          >,
        quantity_tiers_json:
          DEFAULT_DTF_PRICING_RULE.quantity_tiers as unknown as Record<
            string,
            unknown
          >,
      })
      activeRules = [createdRule]
    }

    const existingSpecs = await dtfService.listDtfProductSpecs({}, { take: 50 })
    const existingHandles = new Set(existingSpecs.map((s) => s.handle))

    for (const seed of DEFAULT_DTF_PRODUCT_SPECS) {
      if (!existingHandles.has(seed.handle)) {
        await dtfService.createDtfProductSpecs({
          handle: seed.handle,
          product_type: seed.product_type,
          title_en: seed.title_en,
          title_tr: seed.title_tr,
          description_en: seed.description_en,
          description_tr: seed.description_tr,
          garment_included: false,
          home_iron_supported: seed.home_iron_supported,
          home_iron_verified: seed.home_iron_verified,
          heat_press_supported: seed.heat_press_supported,
          application_approved: seed.application_approved,
          base_price_cents: seed.base_price_cents,
          presets_json: seed.presets_json,
          application_instructions_json: seed.application_instructions_json,
          is_published: true,
        })
      }
    }

    const allPublished = await dtfService.listDtfProductSpecs(
      { is_published: true },
      { take: 50 }
    )
    const rule = mapPricingRuleRecord(
      activeRules[0] as unknown as Record<string, unknown>
    )

    return new StepResponse({
      pricingRule: rule,
      products: allPublished,
    })
  }
)

export const seedDefaultDtfCatalogWorkflow = createWorkflow(
  "seed-default-dtf-catalog",
  function (input: Record<string, never>) {
    const result = ensureDefaultDtfCatalogStep(input)
    return new WorkflowResponse(result)
  }
)
