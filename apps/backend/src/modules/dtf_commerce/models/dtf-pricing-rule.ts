import { model } from "@medusajs/framework/utils"

const DtfPricingRule = model.define("dtf_pricing_rule", {
  id: model.id().primaryKey(),
  code: model.text().unique(),
  currency_code: model.text().default("USD"),
  is_active: model.boolean().default(true),
  rate_per_sq_inch_cents: model.number().default(6),
  min_transfer_unit_cents: model.number().default(150),
  min_order_cents: model.number().default(1500),
  gang_sheet_width_in: model.float().default(22),
  max_print_width_in: model.float().default(22),
  max_print_height_in: model.float().default(120),
  min_dimension_in: model.float().default(0.5),
  min_margin_in: model.float().default(0.25),
  min_gap_in: model.float().default(0.25),
  target_dpi: model.number().default(300),
  min_acceptable_dpi: model.number().default(150),
  printer_rip_verified: model.boolean().default(false),
  gang_sheet_lengths_json: model.json(),
  quantity_tiers_json: model.json(),
})

export default DtfPricingRule
