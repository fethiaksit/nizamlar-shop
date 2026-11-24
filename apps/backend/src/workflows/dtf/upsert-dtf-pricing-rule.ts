import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { DTF_COMMERCE_MODULE } from "../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../modules/dtf_commerce/service"
import {
  mapPricingRuleRecord,
} from "../../modules/dtf_commerce/catalog-defaults"
import type {
  GangSheetLengthTier,
  QuantityDiscountTier,
} from "../../modules/dtf_commerce/pricing"

export interface UpsertDtfPricingRuleInput {
  code: string
  rate_per_sq_inch_cents: number
  min_transfer_unit_cents: number
  min_order_cents: number
  gang_sheet_width_in: number
  max_print_width_in: number
  max_print_height_in: number
  min_dimension_in?: number
  min_margin_in?: number
  min_gap_in?: number
  target_dpi?: number
  min_acceptable_dpi?: number
  printer_rip_verified?: boolean
  gang_sheet_lengths: GangSheetLengthTier[]
  quantity_tiers: QuantityDiscountTier[]
}

const upsertDtfPricingRuleStep = createStep(
  "upsert-dtf-pricing-rule-step",
  async (input: UpsertDtfPricingRuleInput, { container }) => {
    if (
      input.rate_per_sq_inch_cents <= 0 ||
      input.min_transfer_unit_cents <= 0 ||
      input.min_order_cents < 0 ||
      input.gang_sheet_width_in <= 0 ||
      input.max_print_width_in <= 0 ||
      input.max_print_height_in <= 0
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Pricing rule rates and physical sheet limits must be positive"
      )
    }

    const dtfService = container.resolve<DtfCommerceModuleService>(
      DTF_COMMERCE_MODULE
    )

    const existingActive = await dtfService.listDtfPricingRules(
      { is_active: true },
      { take: 25 }
    )
    for (const row of existingActive) {
      if (row.code !== input.code) {
        await dtfService.updateDtfPricingRules({
          id: row.id,
          is_active: false,
        })
      }
    }

    const byCode = await dtfService.listDtfPricingRules(
      { code: input.code },
      { take: 1 }
    )

    const payload = {
      code: input.code,
      currency_code: "USD",
      is_active: true,
      rate_per_sq_inch_cents: input.rate_per_sq_inch_cents,
      min_transfer_unit_cents: input.min_transfer_unit_cents,
      min_order_cents: input.min_order_cents,
      gang_sheet_width_in: input.gang_sheet_width_in,
      max_print_width_in: input.max_print_width_in,
      max_print_height_in: input.max_print_height_in,
      min_dimension_in: input.min_dimension_in ?? 0.5,
      min_margin_in: input.min_margin_in ?? 0.25,
      min_gap_in: input.min_gap_in ?? 0.25,
      target_dpi: input.target_dpi ?? 300,
      min_acceptable_dpi: input.min_acceptable_dpi ?? 150,
      printer_rip_verified: Boolean(input.printer_rip_verified),
      gang_sheet_lengths_json: input.gang_sheet_lengths as unknown as Record<
        string,
        unknown
      >,
      quantity_tiers_json: input.quantity_tiers as unknown as Record<
        string,
        unknown
      >,
    }

    const saved =
      byCode.length > 0
        ? await dtfService.updateDtfPricingRules({
            id: byCode[0].id,
            ...payload,
          })
        : await dtfService.createDtfPricingRules(payload)

    return new StepResponse(
      mapPricingRuleRecord(saved as unknown as Record<string, unknown>)
    )
  }
)

export const upsertDtfPricingRuleWorkflow = createWorkflow(
  "upsert-dtf-pricing-rule",
  function (input: UpsertDtfPricingRuleInput) {
    const rule = upsertDtfPricingRuleStep(input)
    return new WorkflowResponse(rule)
  }
)
