import crypto from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"

export const DTF_GARMENT_DISCLAIMER =
  "DTF transfer only. Garment not included."

export type DtfProductType =
  | "ready_to_press"
  | "custom_dtf"
  | "gang_sheet"
  | "dtf_bundle"

export type DtfDimensionUnit = "in" | "cm"

export interface GangSheetLengthTier {
  length_in: number
  price_cents: number
  label?: string
}

export interface QuantityDiscountTier {
  min_qty: number
  discount_pct: number
}

export interface DtfPricingRuleConfig {
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
  gang_sheet_lengths: GangSheetLengthTier[]
  quantity_tiers: QuantityDiscountTier[]
}

export const DEFAULT_DTF_PRICING_RULE: DtfPricingRuleConfig = {
  code: "us_default_v1",
  currency_code: "USD",
  rate_per_sq_inch_cents: 6,
  min_transfer_unit_cents: 150,
  min_order_cents: 1500,
  gang_sheet_width_in: 22,
  max_print_width_in: 22,
  max_print_height_in: 120,
  min_dimension_in: 0.5,
  min_margin_in: 0.25,
  min_gap_in: 0.25,
  target_dpi: 300,
  min_acceptable_dpi: 150,
  printer_rip_verified: false,
  gang_sheet_lengths: [
    { length_in: 12, price_cents: 990, label: '22" x 12" (1 ft)' },
    { length_in: 24, price_cents: 1790, label: '22" x 24" (2 ft)' },
    { length_in: 36, price_cents: 2490, label: '22" x 36" (3 ft)' },
    { length_in: 48, price_cents: 3190, label: '22" x 48" (4 ft)' },
    { length_in: 60, price_cents: 3790, label: '22" x 60" (5 ft)' },
    { length_in: 120, price_cents: 6990, label: '22" x 120" (10 ft)' },
  ],
  quantity_tiers: [
    { min_qty: 5, discount_pct: 5 },
    { min_qty: 10, discount_pct: 10 },
    { min_qty: 25, discount_pct: 15 },
    { min_qty: 50, discount_pct: 20 },
    { min_qty: 100, discount_pct: 25 },
    { min_qty: 250, discount_pct: 30 },
  ],
}

export interface DtfQuoteInput {
  productType: DtfProductType
  unit: DtfDimensionUnit
  width: number
  height: number
  quantity: number
  filmLengthIn?: number
  bundleBasePriceCents?: number
  readyToPressBasePriceCents?: number
}

export interface DtfNormalizedDimensions {
  unit: DtfDimensionUnit
  widthIn: number
  heightIn: number
  widthCm: number
  heightCm: number
  areaSqIn: number
  areaSqCm: number
}

export interface DtfVerifiedQuote {
  ruleCode: string
  productType: DtfProductType
  currencyCode: "USD"
  garmentIncluded: false
  disclaimer: string
  dimensions: DtfNormalizedDimensions
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

const CM_PER_INCH = 2.54
const MAX_QUANTITY = 10_000

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000
}

export function formatUsdCents(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid integer cent amount"
    )
  }
  const dollars = Math.floor(cents / 100)
  const rem = String(cents % 100).padStart(2, "0")
  return `$${dollars}.${rem}`
}

export function normalizePrintDimensions(
  width: number,
  height: number,
  unit: DtfDimensionUnit,
  rule: DtfPricingRuleConfig = DEFAULT_DTF_PRICING_RULE
): DtfNormalizedDimensions {
  if (unit !== "in" && unit !== "cm") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Dimension unit must be 'in' or 'cm'"
    )
  }
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Print width and height must be finite numbers"
    )
  }

  const widthIn = unit === "in" ? width : width / CM_PER_INCH
  const heightIn = unit === "in" ? height : height / CM_PER_INCH

  if (widthIn < rule.min_dimension_in || heightIn < rule.min_dimension_in) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Print dimensions must be at least ${rule.min_dimension_in} inches`
    )
  }

  if (
    widthIn > rule.max_print_width_in + 1e-6 ||
    heightIn > rule.max_print_height_in + 1e-6
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Print dimensions exceed maximum printable bounds (${rule.max_print_width_in}" x ${rule.max_print_height_in}")`
    )
  }

  const normalizedWidthIn = round4(widthIn)
  const normalizedHeightIn = round4(heightIn)
  const widthCm = round4(normalizedWidthIn * CM_PER_INCH)
  const heightCm = round4(normalizedHeightIn * CM_PER_INCH)
  const areaSqIn = round4(normalizedWidthIn * normalizedHeightIn)
  const areaSqCm = round4(widthCm * heightCm)

  return {
    unit,
    widthIn: normalizedWidthIn,
    heightIn: normalizedHeightIn,
    widthCm,
    heightCm,
    areaSqIn,
    areaSqCm,
  }
}

export function resolveQuantityDiscountPct(
  quantity: number,
  tiers: QuantityDiscountTier[]
): number {
  const sorted = [...tiers].sort((a, b) => b.min_qty - a.min_qty)
  for (const tier of sorted) {
    if (quantity >= tier.min_qty) {
      return Math.min(80, Math.max(0, tier.discount_pct))
    }
  }
  return 0
}

export function calculateDtfTransferQuote(
  input: DtfQuoteInput,
  rule: DtfPricingRuleConfig = DEFAULT_DTF_PRICING_RULE
): DtfVerifiedQuote {
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < 1 ||
    input.quantity > MAX_QUANTITY
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Quantity must be an integer between 1 and ${MAX_QUANTITY}`
    )
  }

  const effectiveWidth =
    input.productType === "gang_sheet" && input.unit === "in"
      ? input.width || rule.gang_sheet_width_in
      : input.width
  const effectiveHeight =
    input.productType === "gang_sheet" && input.filmLengthIn
      ? input.unit === "in"
        ? input.filmLengthIn
        : input.filmLengthIn * CM_PER_INCH
      : input.height

  const dimensions = normalizePrintDimensions(
    effectiveWidth,
    effectiveHeight,
    input.unit,
    rule
  )

  let baseUnitCents = 0

  if (input.productType === "gang_sheet") {
    if (Math.abs(dimensions.widthIn - rule.gang_sheet_width_in) > 0.05) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gang sheet roll width must match configured ${rule.gang_sheet_width_in}" width`
      )
    }
    const exactTier = rule.gang_sheet_lengths.find(
      (t) => Math.abs(t.length_in - dimensions.heightIn) < 0.01
    )
    if (exactTier) {
      baseUnitCents = exactTier.price_cents
    } else {
      const linearRatePerInchCents = Math.max(
        60,
        Math.round(rule.gang_sheet_width_in * rule.rate_per_sq_inch_cents * 0.65)
      )
      baseUnitCents = Math.max(
        rule.min_transfer_unit_cents,
        Math.round(dimensions.heightIn * linearRatePerInchCents)
      )
    }
  } else if (input.productType === "dtf_bundle") {
    if (
      !Number.isInteger(input.bundleBasePriceCents) ||
      (input.bundleBasePriceCents ?? 0) <= 0
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "DTF bundle requires a verified positive server bundle price"
      )
    }
    baseUnitCents = input.bundleBasePriceCents!
  } else if (
    input.productType === "ready_to_press" &&
    input.readyToPressBasePriceCents &&
    input.readyToPressBasePriceCents > 0
  ) {
    baseUnitCents = Math.max(
      rule.min_transfer_unit_cents,
      Math.round(input.readyToPressBasePriceCents)
    )
  } else {
    const areaCostCents = Math.round(
      dimensions.areaSqIn * rule.rate_per_sq_inch_cents
    )
    baseUnitCents = Math.max(rule.min_transfer_unit_cents, areaCostCents)
  }

  const discountPercent = resolveQuantityDiscountPct(
    input.quantity,
    rule.quantity_tiers
  )
  const discountedUnitCents = Math.max(
    1,
    Math.round((baseUnitCents * (100 - discountPercent)) / 100)
  )

  const subtotalCents = discountedUnitCents * input.quantity
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Quote total overflowed safe integer cent bounds"
    )
  }

  const minimumOrderCents = rule.min_order_cents
  const minimumOrderMet = subtotalCents >= minimumOrderCents
  const minimumOrderShortfallCents = Math.max(
    0,
    minimumOrderCents - subtotalCents
  )
  const effectiveOrderTotalCents = Math.max(subtotalCents, minimumOrderCents)

  return {
    ruleCode: rule.code,
    productType: input.productType,
    currencyCode: "USD",
    garmentIncluded: false,
    disclaimer: DTF_GARMENT_DISCLAIMER,
    dimensions,
    quantity: input.quantity,
    baseUnitCents,
    discountPercent,
    discountedUnitCents,
    subtotalCents,
    minimumOrderCents,
    minimumOrderMet,
    minimumOrderShortfallCents,
    effectiveOrderTotalCents,
    unitPriceFormatted: formatUsdCents(discountedUnitCents),
    subtotalFormatted: formatUsdCents(subtotalCents),
    printerRipVerified: rule.printer_rip_verified,
    isServerVerified: true,
  }
}

function getQuoteSecret(): string {
  return (
    process.env.DTF_QUOTE_SECRET ||
    process.env.JWT_SECRET ||
    "nizamlar-dev-quote-hmac-secret"
  )
}

export function signDtfQuote(
  quote: DtfVerifiedQuote,
  designAssetId?: string
): string {
  const canonical = JSON.stringify({
    designAssetId: designAssetId || null,
    ruleCode: quote.ruleCode,
    productType: quote.productType,
    currencyCode: quote.currencyCode,
    widthIn: quote.dimensions.widthIn,
    heightIn: quote.dimensions.heightIn,
    quantity: quote.quantity,
    discountedUnitCents: quote.discountedUnitCents,
    subtotalCents: quote.subtotalCents,
  })
  return crypto
    .createHmac("sha256", getQuoteSecret())
    .update(canonical)
    .digest("hex")
}

export function verifyDtfQuoteSignature(
  quote: DtfVerifiedQuote,
  signature: string,
  designAssetId?: string
): boolean {
  if (!signature || typeof signature !== "string") return false
  const expected = signDtfQuote(quote, designAssetId)
  const sigBuf = Buffer.from(signature, "utf8")
  const expBuf = Buffer.from(expected, "utf8")
  if (sigBuf.length !== expBuf.length) return false
  return crypto.timingSafeEqual(sigBuf, expBuf)
}

export interface DecodedRasterMetadata {
  mimeType: "image/png" | "image/webp" | "image/jpeg" | "image/svg+xml"
  pixelWidth: number
  pixelHeight: number
  hasTransparency: boolean
}

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

export function inspectArtworkBuffer(
  buffer: Buffer,
  declaredMime: string
): DecodedRasterMetadata {
  const mime = declaredMime.toLowerCase().trim()
  if (buffer.length < 24 || buffer.length > 25 * 1024 * 1024) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Artwork file must be between 24 bytes and 25 MB"
    )
  }

  // PNG inspection (IHDR width/height + colorType alpha / tRNS chunk)
  if (mime === "image/png") {
    if (!buffer.subarray(0, 8).equals(PNG_SIG)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid PNG file signature"
      )
    }
    const pixelWidth = buffer.readUInt32BE(16)
    const pixelHeight = buffer.readUInt32BE(20)
    const colorType = buffer[25]
    let hasTransparency = colorType === 4 || colorType === 6
    if (!hasTransparency) {
      let offset = 8
      while (offset + 8 <= buffer.length) {
        const len = buffer.readUInt32BE(offset)
        const chunkType = buffer.toString("ascii", offset + 4, offset + 8)
        if (chunkType === "tRNS") {
          hasTransparency = true
          break
        }
        if (chunkType === "IDAT" || chunkType === "IEND") break
        offset += 12 + len
      }
    }
    if (
      pixelWidth < 1 ||
      pixelHeight < 1 ||
      pixelWidth > 20_000 ||
      pixelHeight > 40_000
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "PNG pixel dimensions exceed allowed safety bounds"
      )
    }
    return {
      mimeType: "image/png",
      pixelWidth,
      pixelHeight,
      hasTransparency,
    }
  }

  // WEBP inspection (VP8 / VP8L / VP8X)
  if (mime === "image/webp") {
    if (
      buffer.toString("ascii", 0, 4) !== "RIFF" ||
      buffer.toString("ascii", 8, 12) !== "WEBP"
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid WebP file signature"
      )
    }
    const chunk = buffer.toString("ascii", 12, 16)
    let pixelWidth = 0
    let pixelHeight = 0
    let hasTransparency = false
    if (chunk === "VP8X" && buffer.length >= 30) {
      const flags = buffer[20]
      hasTransparency = (flags & 0x10) !== 0
      pixelWidth = 1 + buffer.readUIntLE(24, 3)
      pixelHeight = 1 + buffer.readUIntLE(27, 3)
    } else if (chunk === "VP8L" && buffer.length >= 25) {
      const b0 = buffer[21]
      const b1 = buffer[22]
      const b2 = buffer[23]
      const b3 = buffer[24]
      pixelWidth = 1 + (((b1 & 0x3f) << 8) | b0)
      pixelHeight = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6))
      hasTransparency = (b3 & 0x10) !== 0
    } else if (chunk === "VP8 " && buffer.length >= 30) {
      pixelWidth = buffer.readUInt16LE(26) & 0x3fff
      pixelHeight = buffer.readUInt16LE(28) & 0x3fff
      hasTransparency = false
    }
    if (pixelWidth < 1 || pixelHeight < 1) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Unable to decode WebP dimensions"
      )
    }
    return {
      mimeType: "image/webp",
      pixelWidth,
      pixelHeight,
      hasTransparency,
    }
  }

  // JPEG inspection (SOF0/SOF2 markers)
  if (mime === "image/jpeg" || mime === "image/jpg") {
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid JPEG file signature"
      )
    }
    let pos = 2
    while (pos + 9 < buffer.length) {
      if (buffer[pos] !== 0xff) {
        pos++
        continue
      }
      const marker = buffer[pos + 1]
      if (
        marker === 0xc0 ||
        marker === 0xc1 ||
        marker === 0xc2 ||
        marker === 0xc3
      ) {
        const pixelHeight = buffer.readUInt16BE(pos + 5)
        const pixelWidth = buffer.readUInt16BE(pos + 7)
        return {
          mimeType: "image/jpeg",
          pixelWidth,
          pixelHeight,
          hasTransparency: false,
        }
      }
      const segLen = buffer.readUInt16BE(pos + 2)
      if (segLen < 2) break
      pos += 2 + segLen
    }
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Unable to locate JPEG frame header"
    )
  }

  // Safe SVG inspection (reject scripts, foreignObject, external hrefs, event handlers)
  if (mime === "image/svg+xml") {
    const text = buffer.toString("utf8")
    if (!/<svg[\s>]/i.test(text)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid SVG markup"
      )
    }
    if (
      /<script/i.test(text) ||
      /<foreignObject/i.test(text) ||
      /\son[a-z]+\s*=/i.test(text) ||
      /javascript:/i.test(text) ||
      /xlink:href\s*=\s*["']https?:/i.test(text)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Unsafe SVG content rejected"
      )
    }
    const vbMatch = text.match(
      /viewBox\s*=\s*["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)\s*["']/i
    )
    const pixelWidth = vbMatch ? Math.max(1, Math.round(Number(vbMatch[1]))) : 3000
    const pixelHeight = vbMatch
      ? Math.max(1, Math.round(Number(vbMatch[2])))
      : 3000
    return {
      mimeType: "image/svg+xml",
      pixelWidth,
      pixelHeight,
      hasTransparency: true,
    }
  }

  throw new MedusaError(
    MedusaError.Types.INVALID_DATA,
    `Unsupported artwork MIME type: ${declaredMime}`
  )
}

export function calculateEffectiveDpi(
  pixelWidth: number,
  pixelHeight: number,
  widthIn: number,
  heightIn: number,
  mimeType?: string
): {
  effectiveDpi: number
  meetsTarget300Dpi: boolean
  meetsMinimum150Dpi: boolean
} {
  if (mimeType === "image/svg+xml") {
    return {
      effectiveDpi: 300,
      meetsTarget300Dpi: true,
      meetsMinimum150Dpi: true,
    }
  }
  const dpiX = pixelWidth / Math.max(0.1, widthIn)
  const dpiY = pixelHeight / Math.max(0.1, heightIn)
  const effectiveDpi = Math.round(Math.min(dpiX, dpiY))
  return {
    effectiveDpi,
    meetsTarget300Dpi: effectiveDpi >= 300,
    meetsMinimum150Dpi: effectiveDpi >= 150,
  }
}
