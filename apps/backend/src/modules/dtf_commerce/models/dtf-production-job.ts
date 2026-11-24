import { model } from "@medusajs/framework/utils"

const DtfProductionJob = model.define("dtf_production_job", {
  id: model.id().primaryKey(),
  production_ref: model.text().unique(),
  source_channel: model.enum(["shopify_us", "medusa"]).default("shopify_us"),
  external_order_id: model.text(),
  external_order_name: model.text().nullable(),
  customer_email: model.text().nullable(),
  payment_verified: model.boolean().default(false),
  state: model
    .enum([
      "payment_confirmed",
      "design_review",
      "ready_for_printing",
      "printing",
      "quality_control",
      "packed",
      "shipped",
      "delivered",
    ])
    .default("payment_confirmed"),
  cancellation_state: model
    .enum(["none", "cancel_requested", "cancelled"])
    .default("none"),
  refund_state: model
    .enum(["none", "partial_refund", "refunded"])
    .default("none"),
  design_asset_id: model.text().nullable(),
  product_type: model.text(),
  width_in: model.float(),
  height_in: model.float(),
  quantity: model.number(),
  currency_code: model.text().default("USD"),
  total_cents: model.number(),
  qc_notes: model.text().nullable(),
  tracking_number: model.text().nullable(),
  tracking_carrier: model.text().nullable(),
  tracking_url: model.text().nullable(),
  shipping_country: model.text().default("US"),
  shipping_state: model.text().nullable(),
  shipping_zip: model.text().nullable(),
  erp_sync_status: model.text().default("pending"),
  line_items_json: model.json(),
  history_json: model.json(),
})

export default DtfProductionJob
