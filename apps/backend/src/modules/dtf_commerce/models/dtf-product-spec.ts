import { model } from "@medusajs/framework/utils"

const DtfProductSpec = model.define("dtf_product_spec", {
  id: model.id().primaryKey(),
  handle: model.text().unique(),
  medusa_product_id: model.text().nullable(),
  shopify_product_gid: model.text().nullable(),
  shopify_default_variant_gid: model.text().nullable(),
  product_type: model.enum([
    "ready_to_press",
    "custom_dtf",
    "gang_sheet",
    "dtf_bundle",
  ]),
  title_en: model.text(),
  title_tr: model.text().nullable(),
  description_en: model.text(),
  description_tr: model.text().nullable(),
  garment_included: model.boolean().default(false),
  home_iron_supported: model.boolean().default(false),
  home_iron_verified: model.boolean().default(false),
  heat_press_supported: model.boolean().default(true),
  application_approved: model.boolean().default(false),
  application_instructions_json: model.json(),
  presets_json: model.json(),
  base_price_cents: model.number().default(0),
  is_published: model.boolean().default(true),
})

export default DtfProductSpec
