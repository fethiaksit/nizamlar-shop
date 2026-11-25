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
  verifyDtfQuoteSignature,
  type DtfDimensionUnit,
  type DtfProductType,
} from "../../modules/dtf_commerce/pricing"
import { shopifyCreateVerifiedDtfDraftOrder } from "../../modules/dtf_commerce/shopify-client"

export interface CreateShopifyDtfCheckoutWorkflowInput {
  productType: DtfProductType
  unit: DtfDimensionUnit
  width: number
  height: number
  quantity: number
  filmLengthIn?: number
  designAssetId?: string
  quoteSignature: string
  customerEmail?: string
}

const createShopifyDtfCheckoutStep = createStep(
  "create-shopify-dtf-checkout",
  async (input: CreateShopifyDtfCheckoutWorkflowInput, { container }) => {
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

    const sigMatchesBound = verifyDtfQuoteSignature(
      verifiedQuote,
      input.quoteSignature,
      input.designAssetId
    )
    const sigMatchesUnbound = verifyDtfQuoteSignature(
      verifiedQuote,
      input.quoteSignature
    )

    if (!sigMatchesBound && !sigMatchesUnbound) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Quote signature verification failed; refusing unverified Shopify checkout price"
      )
    }

    if (
      (input.productType === "custom_dtf" ||
        input.productType === "gang_sheet") &&
      !input.designAssetId
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Custom DTF transfers and gang sheets require a saved designAssetId before Shopify checkout"
      )
    }

    if (input.designAssetId) {
      const assets = await dtfService.listDtfDesignAssets(
        { id: input.designAssetId },
        { take: 1 }
      )
      const asset = assets[0]
      if (!asset) {
        throw new MedusaError(
          MedusaError.Types.NOT_FOUND,
          `DTF design asset '${input.designAssetId}' not found`
        )
      }
      if (
        Math.abs(Number(asset.width_in) - verifiedQuote.dimensions.widthIn) >
          0.05 ||
        Math.abs(Number(asset.height_in) - verifiedQuote.dimensions.heightIn) >
          0.05
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Checkout dimensions do not match saved DTF design asset; failing closed"
        )
      }
    }

    const checkout = await shopifyCreateVerifiedDtfDraftOrder({
      verifiedQuote,
      quoteSignature: input.quoteSignature,
      designAssetId: input.designAssetId,
      customerEmail: input.customerEmail,
    })

    return new StepResponse({
      checkout,
      quote: verifiedQuote,
    })
  }
)

export const createShopifyDtfCheckoutWorkflow = createWorkflow(
  "create-shopify-dtf-checkout",
  function (input: CreateShopifyDtfCheckoutWorkflowInput) {
    const result = createShopifyDtfCheckoutStep(input)
    return new WorkflowResponse(result)
  }
)
