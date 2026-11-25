import { model } from "@medusajs/framework/utils"

const DtfDesignAsset = model.define("dtf_design_asset", {
  id: model.id().primaryKey(),
  product_handle: model.text().nullable(),
  product_type: model.enum([
    "ready_to_press",
    "custom_dtf",
    "gang_sheet",
    "dtf_bundle",
  ]),
  unit_system: model.enum(["in", "cm"]).default("in"),
  width_in: model.float(),
  height_in: model.float(),
  width_cm: model.float(),
  height_cm: model.float(),
  quantity: model.number().default(1),
  pixel_width: model.number(),
  pixel_height: model.number(),
  effective_dpi: model.number(),
  has_transparency: model.boolean().default(false),
  file_mime_type: model.text(),
  original_file_name: model.text(),
  preview_garment_color: model.text().nullable(),
  original_asset_path: model.text(),
  production_asset_path: model.text(),
  mockup_preview_path: model.text().nullable(),
  placement_json: model.json().nullable(),
  layout_state_json: model.json().nullable(),
  verified_quote_json: model.json(),
  quote_signature: model.text(),
  status: model
    .enum(["draft", "quoted", "in_cart", "ordered", "archived"])
    .default("quoted"),
})

export default DtfDesignAsset
