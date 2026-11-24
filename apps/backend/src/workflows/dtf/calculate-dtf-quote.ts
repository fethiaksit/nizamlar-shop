import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { DTF_COMMERCE_MODULE } from "../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../modules/dtf_commerce/service"
import { mapPricingRuleRecord } from "../../modules/dtf_commerce/catalog-defaults"
import {
  calculateDtfTransferQuote,
  signDtfQuote,
  type DtfDimensionUnit,
  type DtfProductType,
} from "../../modules/dtf_commerce/pricing"

export interface CalculateDtfQuoteWorkflowInput {
  productType: DtfProductType
  productHandle?: string
  unit: DtfDimensionUnit
  width: number
  height: number
  quantity: number
  filmLengthIn?: number
  bundleCode?: string
  presetCode?: string
}

const calculateDtfQuoteStep = createStep(
  "calculate-dtf-quote-step",
  async (input: CalculateDtfQuoteWorkflowInput, { container }) => {
    const dtfService = container.resolve<DtfCommerceModuleService>(
      DTF_COMMERCE_MODULE
    )

    const activeRules = await dtfService.listDtfPricingRules(
      { is_active: true },
      { take: 1 }
    )
    const rule = mapPricingRuleRecord(
      (activeRules[0] as unknown as Record<string, unknown>) || null
    )

    let bundleBasePriceCents: number | undefined
    let readyToPressBasePriceCents: number | undefined

    if (input.productHandle) {
      const specs = await dtfService.listDtfProductSpecs(
        { handle: input.productHandle, is_published: true },
        { take: 1 }
      )
      const spec = specs[0]
      if (!spec) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `DTF product spec '${input.productHandle}' not found`
        )
      }
      const presets = (spec.presets_json || {}) as {
        bundles?: Array<{ code: string; price_cents: number }>
        sizes?: Array<{ code: string; price_cents: number }>
      }
      if (spec.product_type === "dtf_bundle") {
        const matchedBundle = input.bundleCode
          ? presets.bundles?.find((b) => b.code === input.bundleCode)
          : presets.bundles?.[0]
        bundleBasePriceCents =
          matchedBundle?.price_cents || Number(spec.base_price_cents)
      } else if (spec.product_type === "ready_to_press" && input.presetCode) {
        const matchedPreset = presets.sizes?.find(
          (s) => s.code === input.presetCode
        )
        if (matchedPreset?.price_cents) {
          readyToPressBasePriceCents = matchedPreset.price_cents
        }
      }
    } else if (input.productType === "dtf_bundle") {
      const bundleSpecs = await dtfService.listDtfProductSpecs(
        { product_type: "dtf_bundle", is_published: true },
        { take: 1 }
      )
      if (bundleSpecs[0]) {
        bundleBasePriceCents = Number(bundleSpecs[0].base_price_cents)
      }
    }

    const quote = calculateDtfTransferQuote(
      {
        productType: input.productType,
        unit: input.unit,
        width: input.width,
        height: input.height,
        quantity: input.quantity,
        filmLengthIn: input.filmLengthIn,
        bundleBasePriceCents,
        readyToPressBasePriceCents,
      },
      rule
    )

    const quoteSignature = signDtfQuote(quote)

    return new StepResponse({
      quote,
      quoteSignature,
    })
  }
)

export const calculateDtfQuoteWorkflow = createWorkflow(
  "calculate-dtf-quote",
  function (input: CalculateDtfQuoteWorkflowInput) {
    const result = calculateDtfQuoteStep(input)
    return new WorkflowResponse(result)
  }
)
