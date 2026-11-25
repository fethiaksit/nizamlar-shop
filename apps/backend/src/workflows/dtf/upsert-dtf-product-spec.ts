import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { DTF_COMMERCE_MODULE } from "../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../modules/dtf_commerce/service"
import type { DtfProductType } from "../../modules/dtf_commerce/pricing"

export interface UpsertDtfProductSpecInput {
  handle: string
  product_type: DtfProductType
  title_en: string
  title_tr?: string | null
  description_en: string
  description_tr?: string | null
  medusa_product_id?: string | null
  shopify_product_gid?: string | null
  shopify_default_variant_gid?: string | null
  home_iron_supported?: boolean
  home_iron_verified?: boolean
  heat_press_supported?: boolean
  application_approved?: boolean
  base_price_cents?: number
  is_published?: boolean
  presets_json?: Record<string, unknown>
  application_instructions_json?: Record<string, unknown>
}

const upsertDtfProductSpecStep = createStep(
  "upsert-dtf-product-spec-step",
  async (input: UpsertDtfProductSpecInput, { container }) => {
    if (!input.handle.trim() || !input.title_en.trim()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Product spec handle and English title are required"
      )
    }

    // Safety guard: unverified home-iron instructions cannot publish approved numeric guarantees
    const instructions = input.application_instructions_json || {}
    if (
      !input.application_approved &&
      instructions.verified_parameters !== undefined &&
      instructions.verified_parameters !== null
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot publish numeric application parameters while application_approved is false"
      )
    }

    const dtfService = container.resolve<DtfCommerceModuleService>(
      DTF_COMMERCE_MODULE
    )

    const existing = await dtfService.listDtfProductSpecs(
      { handle: input.handle },
      { take: 1 }
    )

    const data = {
      handle: input.handle.trim(),
      product_type: input.product_type,
      title_en: input.title_en.trim(),
      title_tr: input.title_tr ?? null,
      description_en: input.description_en,
      description_tr: input.description_tr ?? null,
      medusa_product_id: input.medusa_product_id ?? null,
      shopify_product_gid: input.shopify_product_gid ?? null,
      shopify_default_variant_gid: input.shopify_default_variant_gid ?? null,
      garment_included: false,
      home_iron_supported: Boolean(input.home_iron_supported),
      home_iron_verified: Boolean(input.home_iron_verified),
      heat_press_supported: input.heat_press_supported !== false,
      application_approved: Boolean(input.application_approved),
      base_price_cents: input.base_price_cents ?? 0,
      is_published: input.is_published !== false,
      presets_json: input.presets_json ?? {},
      application_instructions_json: instructions,
    }

    const saved =
      existing.length > 0
        ? await dtfService.updateDtfProductSpecs({
            id: existing[0].id,
            ...data,
          })
        : await dtfService.createDtfProductSpecs(data)

    return new StepResponse(saved)
  }
)

export const upsertDtfProductSpecWorkflow = createWorkflow(
  "upsert-dtf-product-spec",
  function (input: UpsertDtfProductSpecInput) {
    const spec = upsertDtfProductSpecStep(input)
    return new WorkflowResponse(spec)
  }
)
