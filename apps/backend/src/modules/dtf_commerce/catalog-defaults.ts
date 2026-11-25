import {
  DEFAULT_DTF_PRICING_RULE,
  DTF_GARMENT_DISCLAIMER,
  type DtfPricingRuleConfig,
  type DtfProductType,
  type GangSheetLengthTier,
  type QuantityDiscountTier,
} from "./pricing"

export interface DefaultDtfProductSeed {
  handle: string
  product_type: DtfProductType
  title_en: string
  title_tr: string
  description_en: string
  description_tr: string
  garment_included: false
  home_iron_supported: boolean
  home_iron_verified: boolean
  heat_press_supported: boolean
  application_approved: boolean
  base_price_cents: number
  presets_json: Record<string, unknown>
  application_instructions_json: Record<string, unknown>
}

export const DEFAULT_DTF_PRODUCT_SPECS: DefaultDtfProductSeed[] = [
  {
    handle: "ready-to-press-dtf-transfers",
    product_type: "ready_to_press",
    title_en: "Ready to Press DTF Transfers",
    title_tr: "Baskıya Hazır DTF Transferler",
    description_en: `${DTF_GARMENT_DISCLAIMER} Pre-printed, press-ready Nizamlar Atelier DTF transfer film produced in Türkiye and shipped to the United States.`,
    description_tr:
      "Yalnızca kumaşa uygulanmamış DTF transfer filmi gönderilir; tişört/kıyafet dahil değildir.",
    garment_included: false,
    home_iron_supported: true,
    home_iron_verified: false,
    heat_press_supported: true,
    application_approved: false,
    base_price_cents: 490,
    presets_json: {
      unit_default: "in",
      sizes: [
        { code: "left_chest", label: 'Left Chest (3.5" x 3.5")', width_in: 3.5, height_in: 3.5, price_cents: 290 },
        { code: "youth_front", label: 'Youth Front (8" x 8")', width_in: 8, height_in: 8, price_cents: 490 },
        { code: "adult_front", label: 'Adult Standard (10" x 11")', width_in: 10, height_in: 11, price_cents: 690 },
        { code: "oversize_back", label: 'Full Back / Oversize (12" x 15")', width_in: 12, height_in: 15, price_cents: 1090 },
      ],
    },
    application_instructions_json: {
      status: "pending_production_verification",
      heat_press_recommended: true,
      home_iron_note:
        "Home iron compatibility requires per-fabric production verification before publishing numeric temperature, time, or wash-cycle guarantees.",
      verified_parameters: null,
    },
  },
  {
    handle: "custom-dtf-transfers",
    product_type: "custom_dtf",
    title_en: "Custom DTF Transfers (By Size)",
    title_tr: "Özel Ölçü DTF Transfer Baskı",
    description_en: `${DTF_GARMENT_DISCLAIMER} Upload your custom artwork, preview on 3D garments, choose exact print width and height in inches or centimeters, and receive press-ready transparent DTF film.`,
    description_tr:
      "Kendi logonuzu yükleyin, gerçek inç/cm baskı ölçüsünü seçin; yalnızca üretime hazır DTF transfer filmi gönderilir.",
    garment_included: false,
    home_iron_supported: true,
    home_iron_verified: false,
    heat_press_supported: true,
    application_approved: false,
    base_price_cents: 0,
    presets_json: {
      unit_default: "in",
      common_sizes: [
        { label: 'Left Chest (4" x 4")', width_in: 4, height_in: 4 },
        { label: 'Sleeve (3.5" x 12")', width_in: 3.5, height_in: 12 },
        { label: 'Standard Front (10" x 12")', width_in: 10, height_in: 12 },
        { label: 'Oversize Back (12" x 16")', width_in: 12, height_in: 16 },
      ],
    },
    application_instructions_json: {
      status: "pending_production_verification",
      heat_press_recommended: true,
      home_iron_note:
        "Commercial heat press is recommended for consistent adhesion. Home iron settings remain hidden until production lab approval.",
      verified_parameters: null,
    },
  },
  {
    handle: "dtf-gang-sheets",
    product_type: "gang_sheet",
    title_en: 'Custom DTF Gang Sheets (22" Roll)',
    title_tr: 'DTF Gang Sheet Rulo Baskı (22")',
    description_en: `${DTF_GARMENT_DISCLAIMER} Pack multiple logos, neck labels, sleeve hits, and full fronts onto a single 22-inch wide DTF transfer roll with automatic nesting and 300 DPI validation.`,
    description_tr:
      "Çoklu tasarımları tek DTF transfer rulosuna yerleştirin; yalnızca şeffaf DTF transfer filmi gönderilir.",
    garment_included: false,
    home_iron_supported: false,
    home_iron_verified: false,
    heat_press_supported: true,
    application_approved: false,
    base_price_cents: 990,
    presets_json: {
      unit_default: "in",
      roll_width_in: DEFAULT_DTF_PRICING_RULE.gang_sheet_width_in,
      printer_rip_verified: false,
      lengths: DEFAULT_DTF_PRICING_RULE.gang_sheet_lengths,
    },
    application_instructions_json: {
      status: "pending_production_verification",
      heat_press_recommended: true,
      home_iron_note:
        "Gang sheet transfers should be cut apart prior to pressing. Numeric temperature, pressure, and peel parameters require production sign-off.",
      verified_parameters: null,
    },
  },
  {
    handle: "dtf-transfer-bundles",
    product_type: "dtf_bundle",
    title_en: "DTF Transfer Multi-Print Bundles",
    title_tr: "Çoklu DTF Transfer Paketleri",
    description_en: `${DTF_GARMENT_DISCLAIMER} Curated multi-print DTF transfer packs for apparel launches, creator drops, and team kits with built-in volume savings.`,
    description_tr:
      "Marka lansmanları ve ekipler için avantajlı çoklu DTF transfer baskı paketleri; kıyafet dahil değildir.",
    garment_included: false,
    home_iron_supported: true,
    home_iron_verified: false,
    heat_press_supported: true,
    application_approved: false,
    base_price_cents: 2490,
    presets_json: {
      unit_default: "in",
      bundles: [
        { code: "starter_10", label: 'Brand Starter 10-Pack (10x Chest + 10x Neck Label)', width_in: 10, height_in: 12, price_cents: 2490 },
        { code: "drop_25", label: 'Creator Drop 25-Pack (25x Full Front + 25x Tag)', width_in: 11, height_in: 14, price_cents: 5490 },
        { code: "studio_50", label: 'Studio Bulk 50-Pack (50x Full Front + 50x Sleeve)', width_in: 12, height_in: 15, price_cents: 9890 },
      ],
    },
    application_instructions_json: {
      status: "pending_production_verification",
      heat_press_recommended: true,
      home_iron_note:
        "Each bundle contains unapplied DTF transfer films only. Production-approved application parameters must be enabled in Admin before live publication.",
      verified_parameters: null,
    },
  },
]

export function mapPricingRuleRecord(
  row?: Record<string, unknown> | null
): DtfPricingRuleConfig {
  if (!row) {
    return DEFAULT_DTF_PRICING_RULE
  }
  return {
    code: String(row.code || DEFAULT_DTF_PRICING_RULE.code),
    currency_code: "USD",
    rate_per_sq_inch_cents: Number(
      row.rate_per_sq_inch_cents ?? DEFAULT_DTF_PRICING_RULE.rate_per_sq_inch_cents
    ),
    min_transfer_unit_cents: Number(
      row.min_transfer_unit_cents ?? DEFAULT_DTF_PRICING_RULE.min_transfer_unit_cents
    ),
    min_order_cents: Number(
      row.min_order_cents ?? DEFAULT_DTF_PRICING_RULE.min_order_cents
    ),
    gang_sheet_width_in: Number(
      row.gang_sheet_width_in ?? DEFAULT_DTF_PRICING_RULE.gang_sheet_width_in
    ),
    max_print_width_in: Number(
      row.max_print_width_in ?? DEFAULT_DTF_PRICING_RULE.max_print_width_in
    ),
    max_print_height_in: Number(
      row.max_print_height_in ?? DEFAULT_DTF_PRICING_RULE.max_print_height_in
    ),
    min_dimension_in: Number(
      row.min_dimension_in ?? DEFAULT_DTF_PRICING_RULE.min_dimension_in
    ),
    min_margin_in: Number(
      row.min_margin_in ?? DEFAULT_DTF_PRICING_RULE.min_margin_in
    ),
    min_gap_in: Number(row.min_gap_in ?? DEFAULT_DTF_PRICING_RULE.min_gap_in),
    target_dpi: Number(row.target_dpi ?? DEFAULT_DTF_PRICING_RULE.target_dpi),
    min_acceptable_dpi: Number(
      row.min_acceptable_dpi ?? DEFAULT_DTF_PRICING_RULE.min_acceptable_dpi
    ),
    printer_rip_verified: Boolean(row.printer_rip_verified),
    gang_sheet_lengths: Array.isArray(row.gang_sheet_lengths_json)
      ? (row.gang_sheet_lengths_json as GangSheetLengthTier[])
      : DEFAULT_DTF_PRICING_RULE.gang_sheet_lengths,
    quantity_tiers: Array.isArray(row.quantity_tiers_json)
      ? (row.quantity_tiers_json as QuantityDiscountTier[])
      : DEFAULT_DTF_PRICING_RULE.quantity_tiers,
  }
}
