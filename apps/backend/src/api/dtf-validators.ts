import { z } from "@medusajs/framework/zod"

export const DtfProductTypeEnum = z.enum([
  "ready_to_press",
  "custom_dtf",
  "gang_sheet",
  "dtf_bundle",
])

export const DtfQuoteRequestSchema = z.object({
  productType: DtfProductTypeEnum,
  productHandle: z.string().min(1).max(160).optional(),
  unit: z.enum(["in", "cm"]).default("in"),
  width: z.number().positive(),
  height: z.number().positive(),
  quantity: z.number().int().min(1).max(10000).default(1),
  filmLengthIn: z.number().positive().optional(),
  bundleCode: z.string().max(80).optional(),
  presetCode: z.string().max(80).optional(),
})

export const UpsertDtfPricingRuleSchema = z.object({
  code: z.string().min(2).max(80),
  rate_per_sq_inch_cents: z.number().int().positive(),
  min_transfer_unit_cents: z.number().int().positive(),
  min_order_cents: z.number().int().min(0),
  gang_sheet_width_in: z.number().positive().max(60),
  max_print_width_in: z.number().positive().max(60),
  max_print_height_in: z.number().positive().max(600),
  min_dimension_in: z.number().positive().max(10).optional(),
  min_margin_in: z.number().min(0).max(5).optional(),
  min_gap_in: z.number().min(0).max(5).optional(),
  target_dpi: z.number().int().min(72).max(1200).optional(),
  min_acceptable_dpi: z.number().int().min(72).max(1200).optional(),
  printer_rip_verified: z.boolean().optional(),
  gang_sheet_lengths: z
    .array(
      z.object({
        length_in: z.number().positive(),
        price_cents: z.number().int().positive(),
        label: z.string().max(120).optional(),
      })
    )
    .min(1),
  quantity_tiers: z.array(
    z.object({
      min_qty: z.number().int().min(1),
      discount_pct: z.number().min(0).max(80),
    })
  ),
})

export const UpsertDtfProductSpecSchema = z.object({
  handle: z.string().min(2).max(160),
  product_type: DtfProductTypeEnum,
  title_en: z.string().min(2).max(240),
  title_tr: z.string().max(240).nullable().optional(),
  description_en: z.string().min(4).max(4000),
  description_tr: z.string().max(4000).nullable().optional(),
  medusa_product_id: z.string().max(160).nullable().optional(),
  shopify_product_gid: z.string().max(240).nullable().optional(),
  shopify_default_variant_gid: z.string().max(240).nullable().optional(),
  home_iron_supported: z.boolean().optional(),
  home_iron_verified: z.boolean().optional(),
  heat_press_supported: z.boolean().optional(),
  application_approved: z.boolean().optional(),
  base_price_cents: z.number().int().min(0).optional(),
  is_published: z.boolean().optional(),
  presets_json: z.record(z.string(), z.unknown()).optional(),
  application_instructions_json: z.record(z.string(), z.unknown()).optional(),
})

export const DtfAddToCartSchema = z.object({
  cartId: z.string().min(3).max(160),
  variantId: z.string().min(3).max(160),
  productType: DtfProductTypeEnum,
  unit: z.enum(["in", "cm"]).default("in"),
  width: z.number().positive(),
  height: z.number().positive(),
  quantity: z.number().int().min(1).max(10000).default(1),
  filmLengthIn: z.number().positive().optional(),
  designAssetId: z.string().max(160).optional(),
  previewColorName: z.string().max(80).optional(),
  previewColorHex: z.string().max(24).optional(),
  quoteSignature: z.string().max(256).optional(),
})

export const CreateDtfDesignAssetSchema = z.object({
  productHandle: z.string().min(1).max(160).optional(),
  productType: DtfProductTypeEnum.default("custom_dtf"),
  unit: z.enum(["in", "cm"]).default("in"),
  width: z.number().positive(),
  height: z.number().positive(),
  quantity: z.number().int().min(1).max(10000).default(1),
  filmLengthIn: z.number().positive().optional(),
  originalFileName: z.string().min(1).max(240),
  originalFileMimeType: z.string().min(3).max(80),
  originalFileBase64: z.string().min(32),
  productionPrintPngBase64: z.string().min(32),
  mockupPreviewPngBase64: z.string().min(32).optional(),
  previewGarmentColor: z.string().max(80).optional(),
  placement: z.record(z.string(), z.unknown()).optional(),
  layoutState: z.record(z.string(), z.unknown()).optional(),
  allowLowDpi: z.boolean().default(false),
})

export const GangSheetItemPlacementSchema = z.object({
  id: z.string().min(1).max(120),
  artworkId: z.string().min(1).max(120),
  fileName: z.string().min(1).max(240),
  mimeType: z.string().min(3).max(80),
  pixelWidth: z.number().int().min(1).max(40000),
  pixelHeight: z.number().int().min(1).max(40000),
  xIn: z.number().min(-100).max(200),
  yIn: z.number().min(-100).max(600),
  widthIn: z.number().positive().max(60),
  heightIn: z.number().positive().max(600),
  rotationDeg: z.number().min(-360).max(360).default(0),
})

export const SaveDtfGangSheetSchema = z.object({
  productHandle: z.string().min(1).max(160).optional(),
  sheetWidthIn: z.number().positive().max(60).optional(),
  sheetLengthIn: z.number().positive().max(600),
  quantity: z.number().int().min(1).max(10000).default(1),
  items: z.array(GangSheetItemPlacementSchema).min(1).max(500),
  productionPrintPngBase64: z.string().min(32),
  previewGarmentColor: z.string().max(80).optional(),
  allowLowDpi: z.boolean().default(false),
})

export type DtfQuoteRequestBody = z.infer<typeof DtfQuoteRequestSchema>
export type DtfAddToCartBody = z.infer<typeof DtfAddToCartSchema>
export type CreateDtfDesignAssetBody = z.infer<typeof CreateDtfDesignAssetSchema>
export type SaveDtfGangSheetBody = z.infer<typeof SaveDtfGangSheetSchema>
export type UpsertDtfPricingRuleBody = z.infer<typeof UpsertDtfPricingRuleSchema>
export type UpsertDtfProductSpecBody = z.infer<typeof UpsertDtfProductSpecSchema>
