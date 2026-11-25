import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { DTF_COMMERCE_MODULE } from "../../../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../../../modules/dtf_commerce/service"
import { PRODUCTION_STATES } from "../../../../modules/dtf_commerce/production-state"

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const ref = String(req.query.ref || "").trim()
  const email = String(req.query.email || "").trim().toLowerCase()

  if (!ref || !email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Both order/production reference ('ref') and customer 'email' are required"
    )
  }

  const dtfService = req.scope.resolve<DtfCommerceModuleService>(
    DTF_COMMERCE_MODULE
  )
  const candidates = await dtfService.listDtfProductionJobs({}, { take: 200 })

  const normalizedRef = ref.toLowerCase()
  const matched = candidates.find((job) => {
    const emailMatches = (job.customer_email || "").trim().toLowerCase() === email
    if (!emailMatches) return false
    return (
      job.production_ref.toLowerCase() === normalizedRef ||
      (job.external_order_name || "").toLowerCase() === normalizedRef ||
      job.external_order_id.toLowerCase() === normalizedRef
    )
  })

  if (!matched) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No matching DTF transfer order found for the provided reference and email"
    )
  }

  const rawEvents = ((matched.history_json as {
    events?: Array<{ at?: string; state?: string }>
  })?.events || []) as Array<{ at?: string; state?: string }>

  return res.status(200).json({
    tracking: {
      productionRef: matched.production_ref,
      orderName: matched.external_order_name || matched.external_order_id,
      state: matched.state,
      stages: PRODUCTION_STATES,
      cancellationState: matched.cancellation_state,
      refundState: matched.refund_state,
      productType: matched.product_type,
      widthIn: matched.width_in,
      heightIn: matched.height_in,
      quantity: matched.quantity,
      shippingCountry: matched.shipping_country,
      shippingState: matched.shipping_state,
      trackingCarrier: matched.tracking_carrier,
      trackingNumber: matched.tracking_number,
      trackingUrl: matched.tracking_url,
      timeline: rawEvents.map((ev) => ({
        at: ev.at || null,
        state: ev.state || matched.state,
      })),
    },
  })
}
