import { model } from "@medusajs/framework/utils"

const DtfWebhookEvent = model.define("dtf_webhook_event", {
  id: model.id().primaryKey(),
  webhook_id: model.text().unique(),
  topic: model.text(),
  shop_domain: model.text(),
  hmac_verified: model.boolean().default(false),
  processing_status: model
    .enum([
      "received",
      "processed",
      "ignored_duplicate",
      "ignored_unpaid",
      "failed",
    ])
    .default("received"),
  attempt_count: model.number().default(1),
  last_error: model.text().nullable(),
  payload_hash: model.text(),
  payload_json: model.json(),
})

export default DtfWebhookEvent
