import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { DTF_COMMERCE_MODULE } from "../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../modules/dtf_commerce/service"
import { mapPricingRuleRecord } from "../../modules/dtf_commerce/catalog-defaults"
import {
  calculateDtfTransferQuote,
  DTF_GARMENT_DISCLAIMER,
  verifyDtfQuoteSignature,
  type DtfDimensionUnit,
  type DtfProductType,
} from "../../modules/dtf_commerce/pricing"

export interface PrepareDtfCartItemInput {
  cartId: string
  variantId: string
  productType: DtfProductType
  unit: DtfDimensionUnit
  width: number
  height: number
  quantity: number
  filmLengthIn?: number
  designAssetId?: string
  previewColorName?: string
  previewColorHex?: string
  quoteSignature?: string
}

const verifyDtfCartQuoteStep = createStep(
  "verify-dtf-cart-quote-step",
  async (input: PrepareDtfCartItemInput, { container }) => {
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
    if (input.productType === "dtf_bundle") {
      const bundleSpecs = await dtfService.listDtfProductSpecs(
        { product_type: "dtf_bundle", is_published: true },
        { take: 1 }
      )
      bundleBasePriceCents = Number(bundleSpecs[0]?.base_price_cents || 2490)
    }

    const verifiedQuote = calculateDtfTransferQuote(
      {
        productType: input.productType,
        unit: input.unit,
        width: input.width,
        height: input.height,
        quantity: input.quantity,
        filmLengthIn: input.filmLengthIn,
        bundleBasePriceCents,
      },
      rule
    )

    if (
      input.quoteSignature &&
      !verifyDtfQuoteSignature(
        verifiedQuote,
        input.quoteSignature,
        input.designAssetId
      ) &&
      !verifyDtfQuoteSignature(verifiedQuote, input.quoteSignature)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Quote signature does not match server-calculated DTF transfer quote"
      )
    }

    let mockupUrl: string | null = null
    if (input.designAssetId) {
      const assets = await dtfService.listDtfDesignAssets(
        { id: input.designAssetId },
        { take: 1 }
      )
      if (!assets[0]) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `DTF design asset '${input.designAssetId}' not found`
        )
      }
      if (
        Math.abs(
          Number(assets[0].width_in) - verifiedQuote.dimensions.widthIn
        ) > 0.05 ||
        Math.abs(
          Number(assets[0].height_in) - verifiedQuote.dimensions.heightIn
        ) > 0.05
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cart print dimensions do not match saved DTF design asset dimensions"
        )
      }
      if (assets[0].mockup_preview_path) {
        mockupUrl = `/store/dtf/designs/${assets[0].id}/mockup`
      }
      await dtfService.updateDtfDesignAssets({
        id: assets[0].id,
        status: "in_cart",
      })
    }

    // Medusa v2 stores prices in major units (e.g. 7.20 USD)
    const unitPriceMajorUsd = Number(
      (verifiedQuote.discountedUnitCents / 100).toFixed(2)
    )

    return new StepResponse({
      cartId: input.cartId,
      variantId: input.variantId,
      quantity: verifiedQuote.quantity,
      unitPriceMajorUsd,
      verifiedQuote,
      metadata: {
        dtf_transfer: true,
        garment_included: false,
        disclaimer: DTF_GARMENT_DISCLAIMER,
        dtf_product_type: verifiedQuote.productType,
        unit_system: verifiedQuote.dimensions.unit,
        width_in: verifiedQuote.dimensions.widthIn,
        height_in: verifiedQuote.dimensions.heightIn,
        width_cm: verifiedQuote.dimensions.widthCm,
        height_cm: verifiedQuote.dimensions.heightCm,
        design_asset_id: input.designAssetId || null,
        mockup_url: mockupUrl,
        preview_color_name: input.previewColorName || null,
        preview_color_hex: input.previewColorHex || null,
        verified_unit_cents_usd: verifiedQuote.discountedUnitCents,
        verified_subtotal_cents_usd: verifiedQuote.subtotalCents,
      },
    })
  }
)

export const addDtfTransferToCartWorkflow = createWorkflow(
  "add-dtf-transfer-to-cart",
  function (input: PrepareDtfCartItemInput) {
    const verified = verifyDtfCartQuoteStep(input)
    const cartPayload = transform({ verified }, ({ verified }) => ({
      cart_id: verified.cartId,
      items: [
        {
          variant_id: verified.variantId,
          quantity: verified.quantity,
          unit_price: verified.unitPriceMajorUsd,
          metadata: verified.metadata,
        },
      ],
    }))
    addToCartWorkflow.runAsStep({ input: cartPayload })
    return new WorkflowResponse(verified)
  }
)
