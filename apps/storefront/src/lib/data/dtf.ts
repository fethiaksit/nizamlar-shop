import { sdk } from "@lib/config"

export const DTF_GARMENT_DISCLAIMER =
  "DTF transfer only. Garment not included."

export type DtfProductType =
  | "ready_to_press"
  | "custom_dtf"
  | "gang_sheet"
  | "dtf_bundle"

export type DtfDimensionUnit = "in" | "cm"

export interface DtfGangSheetLengthTier {
  length_in: number
  price_cents: number
  label?: string
}

export interface DtfQuantityTier {
  min_qty: number
  discount_pct: number
}

export interface DtfPricingRule {
  code: string
  currency_code: "USD"
  rate_per_sq_inch_cents: number
  min_transfer_unit_cents: number
  min_order_cents: number
  gang_sheet_width_in: number
  max_print_width_in: number
  max_print_height_in: number
  min_dimension_in: number
  min_margin_in: number
  min_gap_in: number
  target_dpi: number
  min_acceptable_dpi: number
  printer_rip_verified: boolean
  gang_sheet_lengths: DtfGangSheetLengthTier[]
  quantity_tiers: DtfQuantityTier[]
}

export interface DtfProductSpec {
  id: string
  handle: string
  product_type: DtfProductType
  title_en: string
  title_tr?: string | null
  description_en: string
  description_tr?: string | null
  garment_included: false
  home_iron_supported: boolean
  home_iron_verified: boolean
  heat_press_supported: boolean
  application_approved: boolean
  base_price_cents: number
  presets_json: Record<string, unknown>
  application_instructions_json: Record<string, unknown>
}

export interface DtfVerifiedQuote {
  ruleCode: string
  productType: DtfProductType
  currencyCode: "USD"
  garmentIncluded: false
  disclaimer: string
  dimensions: {
    unit: DtfDimensionUnit
    widthIn: number
    heightIn: number
    widthCm: number
    heightCm: number
    areaSqIn: number
    areaSqCm: number
  }
  quantity: number
  baseUnitCents: number
  discountPercent: number
  discountedUnitCents: number
  subtotalCents: number
  minimumOrderCents: number
  minimumOrderMet: boolean
  minimumOrderShortfallCents: number
  effectiveOrderTotalCents: number
  unitPriceFormatted: string
  subtotalFormatted: string
  printerRipVerified: boolean
  isServerVerified: true
}

export interface DtfCatalogResponse {
  disclaimer: string
  garmentIncluded: false
  currencyCode: "USD"
  shopifyEnabled: boolean
  pricingRule: DtfPricingRule
  products: DtfProductSpec[]
}

export async function fetchDtfCatalog(): Promise<DtfCatalogResponse | null> {
  try {
    return await sdk.client.fetch<DtfCatalogResponse>("/store/dtf/catalog", {
      method: "GET",
    })
  } catch {
    return null
  }
}

export async function requestServerDtfQuote(input: {
  productType: DtfProductType
  productHandle?: string
  unit: DtfDimensionUnit
  width: number
  height: number
  quantity: number
  filmLengthIn?: number
  bundleCode?: string
  presetCode?: string
}): Promise<{ quote: DtfVerifiedQuote; quoteSignature: string }> {
  return sdk.client.fetch<{ quote: DtfVerifiedQuote; quoteSignature: string }>(
    "/store/dtf/quote",
    {
      method: "POST",
      body: input,
    }
  )
}

export function resolveProductDtfType(
  product?: {
    handle?: string | null
    metadata?: Record<string, unknown> | null
  } | null,
  countryCode?: string
): DtfProductType | null {
  const explicit = product?.metadata?.dtf_product_type
  if (
    explicit === "ready_to_press" ||
    explicit === "custom_dtf" ||
    explicit === "gang_sheet" ||
    explicit === "dtf_bundle"
  ) {
    return explicit
  }
  const handle = (product?.handle || "").toLowerCase()
  if (handle.includes("gang-sheet")) return "gang_sheet"
  if (handle.includes("dtf-bundle") || handle.includes("transfer-bundle")) {
    return "dtf_bundle"
  }
  if (handle.includes("ready-to-press")) return "ready_to_press"
  if (handle.includes("custom-dtf")) return "custom_dtf"
  if ((countryCode || "").toLowerCase() === "us") {
    return "ready_to_press"
  }
  return null
}
