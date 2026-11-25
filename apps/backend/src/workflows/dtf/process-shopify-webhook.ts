import crypto from "node:crypto"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { DTF_COMMERCE_MODULE } from "../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../modules/dtf_commerce/service"

export interface ProcessShopifyWebhookWorkflowInput {
  webhookId: string
  topic: string
  shopDomain: string
  rawPayloadHash: string
  payload: Record<string, unknown>
}

interface LineProperty {
  name?: string
  key?: string
  value?: string
}

function readLineProperty(
  props: unknown,
  targetKey: string
): string | undefined {
  if (!Array.isArray(props)) return undefined
  for (const raw of props as LineProperty[]) {
    const k = String(raw.name || raw.key || "").trim()
    if (k === targetKey && raw.value !== undefined) {
      return String(raw.value)
    }
  }
  return undefined
}

export interface ProcessShopifyWebhookOutput {
  duplicate: boolean
  webhookEventId: string
  processingStatus: "processed" | "ignored_duplicate" | "ignored_unpaid"
  productionJobIds: string[]
}

const processShopifyWebhookStep = createStep(
  "process-shopify-webhook",
  async (
    input: ProcessShopifyWebhookWorkflowInput,
    { container }
  ): Promise<StepResponse<ProcessShopifyWebhookOutput>> => {
    const dtfService = container.resolve<DtfCommerceModuleService>(
      DTF_COMMERCE_MODULE
    )

    const existingEvents = await dtfService.listDtfWebhookEvents(
      { webhook_id: input.webhookId },
      { take: 1 }
    )
    const existingEvent = existingEvents[0]

    if (
      existingEvent &&
      (existingEvent.processing_status === "processed" ||
        existingEvent.processing_status === "ignored_unpaid")
    ) {
      return new StepResponse({
        duplicate: true,
        webhookEventId: existingEvent.id,
        processingStatus: "ignored_duplicate" as const,
        productionJobIds: [] as string[],
      })
    }

    const eventRecord = existingEvent
      ? await dtfService.updateDtfWebhookEvents({
          id: existingEvent.id,
          attempt_count: Number(existingEvent.attempt_count || 1) + 1,
          processing_status: "received",
          last_error: null,
        })
      : await dtfService.createDtfWebhookEvents({
          webhook_id: input.webhookId,
          topic: input.topic,
          shop_domain: input.shopDomain,
          hmac_verified: true,
          processing_status: "received",
          attempt_count: 1,
          last_error: null,
          payload_hash: input.rawPayloadHash,
          payload_json: input.payload,
        })

    try {
      const topic = input.topic.toLowerCase().trim()
      const payload = input.payload
      const externalOrderId = String(
        payload.order_id || payload.id || ""
      ).trim()
      const productionJobIds: string[] = []

      // 1. Strict Paid-Order Gate
      if (topic === "orders/create" || topic === "orders/paid") {
        const financialStatus = String(
          payload.financial_status || ""
        ).toLowerCase()
        const isPaid =
          topic === "orders/paid"
            ? financialStatus === "" || financialStatus === "paid"
            : financialStatus === "paid"

        if (!isPaid) {
          await dtfService.updateDtfWebhookEvents({
            id: eventRecord.id,
            processing_status: "ignored_unpaid",
          })
          return new StepResponse({
            duplicate: false,
            webhookEventId: eventRecord.id,
            processingStatus: "ignored_unpaid" as const,
            productionJobIds: [] as string[],
          })
        }

        // Idempotent guard if order was already ingested by an earlier webhook ID
        const existingJobs = await dtfService.listDtfProductionJobs(
          { external_order_id: externalOrderId },
          { take: 10 }
        )
        if (existingJobs.length > 0) {
          await dtfService.updateDtfWebhookEvents({
            id: eventRecord.id,
            processing_status: "processed",
          })
          return new StepResponse({
            duplicate: false,
            webhookEventId: eventRecord.id,
            processingStatus: "processed" as const,
            productionJobIds: existingJobs.map((j) => j.id),
          })
        }

        // Check out-of-order prior cancel/refund webhooks for the same externalOrderId
        const priorRelatedEvents = await dtfService.listDtfWebhookEvents(
          { shop_domain: input.shopDomain },
          { take: 50 }
        )
        let priorCancelled = Boolean(payload.cancelled_at)
        let priorRefundState: "none" | "partial_refund" | "refunded" = "none"
        for (const ev of priorRelatedEvents) {
          const evPayload = (ev.payload_json || {}) as Record<string, unknown>
          const evOrderId = String(
            evPayload.order_id || evPayload.id || ""
          ).trim()
          if (evOrderId !== externalOrderId) continue
          if (ev.topic === "orders/cancelled") {
            priorCancelled = true
          } else if (ev.topic === "refunds/create") {
            priorRefundState = "refunded"
          }
        }

        const lineItems = Array.isArray(payload.line_items)
          ? (payload.line_items as Array<Record<string, unknown>>)
          : []

        const shippingAddr = (payload.shipping_address || {}) as Record<
          string,
          unknown
        >
        const orderTotalDollars = Number(
          payload.total_price || payload.current_total_price || 0
        )
        const totalCents = Math.max(0, Math.round(orderTotalDollars * 100))

        const primaryLine = lineItems[0] || {}
        const props = primaryLine.properties
        const designAssetId =
          readLineProperty(props, "dtf_design_asset_id") || null
        const productType =
          readLineProperty(props, "dtf_product_type") || "ready_to_press"
        let widthIn = Number(readLineProperty(props, "width_in") || 10)
        let heightIn = Number(readLineProperty(props, "height_in") || 11)
        const totalQty =
          lineItems.reduce(
            (sum, li) => sum + Math.max(1, Number(li.quantity || 1)),
            0
          ) || 1

        if (designAssetId && designAssetId !== "ready_to_press") {
          const assets = await dtfService.listDtfDesignAssets(
            { id: designAssetId },
            { take: 1 }
          )
          if (assets[0]) {
            widthIn = Number(assets[0].width_in || widthIn)
            heightIn = Number(assets[0].height_in || heightIn)
            await dtfService.updateDtfDesignAssets({
              id: assets[0].id,
              status: "ordered",
            })
          }
        }

        const productionRef = `DTF-${crypto
          .randomBytes(4)
          .toString("hex")
          .toUpperCase()}`
        const nowIso = new Date().toISOString()

        const createdJob = await dtfService.createDtfProductionJobs({
          production_ref: productionRef,
          source_channel: "shopify_us",
          external_order_id: externalOrderId,
          external_order_name: payload.name ? String(payload.name) : null,
          customer_email: payload.email ? String(payload.email) : null,
          payment_verified: true,
          state: "payment_confirmed",
          cancellation_state: priorCancelled ? "cancelled" : "none",
          refund_state: priorRefundState,
          design_asset_id:
            designAssetId && designAssetId !== "ready_to_press"
              ? designAssetId
              : null,
          product_type: productType,
          width_in: widthIn,
          height_in: heightIn,
          quantity: totalQty,
          currency_code: String(payload.currency || "USD").toUpperCase(),
          total_cents: totalCents,
          qc_notes: null,
          tracking_number: null,
          tracking_carrier: null,
          tracking_url: null,
          shipping_country: String(shippingAddr.country_code || "US"),
          shipping_state: shippingAddr.province_code
            ? String(shippingAddr.province_code)
            : null,
          shipping_zip: shippingAddr.zip ? String(shippingAddr.zip) : null,
          erp_sync_status: "pending",
          line_items_json: { items: lineItems },
          history_json: {
            events: [
              {
                at: nowIso,
                state: "payment_confirmed",
                actor: "shopify_webhook",
                note: `Verified ${topic} webhook (${input.webhookId})`,
              },
            ],
          },
        })

        productionJobIds.push(createdJob.id)
      } else if (topic === "orders/cancelled") {
        const jobs = await dtfService.listDtfProductionJobs(
          { external_order_id: externalOrderId },
          { take: 20 }
        )
        for (const job of jobs) {
          const hist = ((job.history_json as { events?: unknown[] })?.events ||
            []) as unknown[]
          await dtfService.updateDtfProductionJobs({
            id: job.id,
            cancellation_state: "cancelled",
            history_json: {
              events: [
                ...hist,
                {
                  at: new Date().toISOString(),
                  state: job.state,
                  actor: "shopify_webhook",
                  note: "Order cancelled on Shopify",
                },
              ],
            },
          })
          productionJobIds.push(job.id)
        }
      } else if (topic === "refunds/create") {
        const jobs = await dtfService.listDtfProductionJobs(
          { external_order_id: externalOrderId },
          { take: 20 }
        )
        const isPartial = Boolean(payload.restock === false && payload.transactions)
        const nextRefundState = isPartial ? "partial_refund" : "refunded"
        for (const job of jobs) {
          const hist = ((job.history_json as { events?: unknown[] })?.events ||
            []) as unknown[]
          await dtfService.updateDtfProductionJobs({
            id: job.id,
            refund_state: nextRefundState,
            history_json: {
              events: [
                ...hist,
                {
                  at: new Date().toISOString(),
                  state: job.state,
                  actor: "shopify_webhook",
                  note: `Shopify refund recorded (${nextRefundState})`,
                },
              ],
            },
          })
          productionJobIds.push(job.id)
        }
      } else if (
        topic === "fulfillments/create" ||
        topic === "fulfillments/update"
      ) {
        const jobs = await dtfService.listDtfProductionJobs(
          { external_order_id: externalOrderId },
          { take: 20 }
        )
        for (const job of jobs) {
          if (!job.payment_verified) continue
          const hist = ((job.history_json as { events?: unknown[] })?.events ||
            []) as unknown[]
          await dtfService.updateDtfProductionJobs({
            id: job.id,
            state: job.state === "delivered" ? "delivered" : "shipped",
            tracking_number: payload.tracking_number
              ? String(payload.tracking_number)
              : job.tracking_number,
            tracking_carrier: payload.tracking_company
              ? String(payload.tracking_company)
              : job.tracking_carrier,
            tracking_url: payload.tracking_url
              ? String(payload.tracking_url)
              : job.tracking_url,
            history_json: {
              events: [
                ...hist,
                {
                  at: new Date().toISOString(),
                  state: "shipped",
                  actor: "shopify_webhook",
                  note: `Fulfillment synced (${topic})`,
                },
              ],
            },
          })
          productionJobIds.push(job.id)
        }
      }

      await dtfService.updateDtfWebhookEvents({
        id: eventRecord.id,
        processing_status: "processed",
      })

      return new StepResponse({
        duplicate: false,
        webhookEventId: eventRecord.id,
        processingStatus: "processed" as const,
        productionJobIds,
      })
    } catch (err) {
      await dtfService.updateDtfWebhookEvents({
        id: eventRecord.id,
        processing_status: "failed",
        last_error: err instanceof Error ? err.message : "Webhook processing error",
      })
      throw err
    }
  }
)

export const processShopifyWebhookWorkflow = createWorkflow(
  "process-shopify-webhook",
  function (input: ProcessShopifyWebhookWorkflowInput) {
    const result = processShopifyWebhookStep(input)
    return new WorkflowResponse(result)
  }
)
