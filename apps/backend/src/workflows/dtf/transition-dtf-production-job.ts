import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { DTF_COMMERCE_MODULE } from "../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../modules/dtf_commerce/service"
import { syncDtfProductionJobToErp } from "../../modules/dtf_commerce/dtf-erp-adapter"
import {
  assertPaidOrderBeforeProduction,
  assertValidProductionTransition,
  type CancellationState,
  type ProductionState,
  type RefundState,
} from "../../modules/dtf_commerce/production-state"

export interface TransitionDtfProductionJobWorkflowInput {
  jobId: string
  nextState?: ProductionState
  cancellationState?: CancellationState
  refundState?: RefundState
  qcNotes?: string | null
  trackingNumber?: string | null
  trackingCarrier?: string | null
  trackingUrl?: string | null
  triggerErpSync?: boolean
  actorEmail?: string
}

const transitionDtfProductionJobStep = createStep(
  "transition-dtf-production-job",
  async (input: TransitionDtfProductionJobWorkflowInput, { container }) => {
    const dtfService = container.resolve<DtfCommerceModuleService>(
      DTF_COMMERCE_MODULE
    )

    const jobs = await dtfService.listDtfProductionJobs(
      { id: input.jobId },
      { take: 1 }
    )
    const job = jobs[0]
    if (!job) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `DTF production job '${input.jobId}' not found`
      )
    }

    assertPaidOrderBeforeProduction(Boolean(job.payment_verified))

    const currentState = job.state as ProductionState
    const effectiveCancelState = (input.cancellationState ??
      job.cancellation_state) as CancellationState
    const targetState = input.nextState ?? currentState

    if (input.nextState && input.nextState !== currentState) {
      assertValidProductionTransition(
        currentState,
        input.nextState,
        effectiveCancelState
      )
    }

    const effectiveTrackingNumber =
      input.trackingNumber !== undefined
        ? input.trackingNumber
        : job.tracking_number
    if (targetState === "shipped" && !effectiveTrackingNumber) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Tracking number is required before marking a DTF production job as shipped"
      )
    }

    let erpSyncStatus = job.erp_sync_status
    let erpNote: string | null = null
    if (input.triggerErpSync) {
      const erpRes = await syncDtfProductionJobToErp({
        productionRef: job.production_ref,
        externalOrderId: job.external_order_id,
        externalOrderName: job.external_order_name,
        customerEmail: job.customer_email,
        productType: job.product_type,
        widthIn: Number(job.width_in),
        heightIn: Number(job.height_in),
        quantity: Number(job.quantity),
        currencyCode: job.currency_code,
        totalCents: Number(job.total_cents),
        shippingCountry: job.shipping_country,
        shippingState: job.shipping_state,
        shippingZip: job.shipping_zip,
        qcNotes: input.qcNotes !== undefined ? input.qcNotes : job.qc_notes,
      })
      erpSyncStatus = erpRes.status
      erpNote = erpRes.message
    }

    const existingEvents = ((job.history_json as { events?: unknown[] })
      ?.events || []) as unknown[]
    const nextEvents = [
      ...existingEvents,
      {
        at: new Date().toISOString(),
        fromState: currentState,
        state: targetState,
        cancellationState: effectiveCancelState,
        refundState: input.refundState ?? job.refund_state,
        actor: input.actorEmail || "admin_operator",
        note:
          erpNote ||
          (input.qcNotes
            ? `QC Note: ${input.qcNotes}`
            : `Updated production state to ${targetState}`),
      },
    ]

    const updated = await dtfService.updateDtfProductionJobs({
      id: job.id,
      state: targetState,
      cancellation_state: effectiveCancelState,
      refund_state: (input.refundState ?? job.refund_state) as RefundState,
      qc_notes: input.qcNotes !== undefined ? input.qcNotes : job.qc_notes,
      tracking_number: effectiveTrackingNumber,
      tracking_carrier:
        input.trackingCarrier !== undefined
          ? input.trackingCarrier
          : job.tracking_carrier,
      tracking_url:
        input.trackingUrl !== undefined ? input.trackingUrl : job.tracking_url,
      erp_sync_status: erpSyncStatus,
      history_json: { events: nextEvents },
    })

    return new StepResponse({
      job: updated,
    })
  }
)

export const transitionDtfProductionJobWorkflow = createWorkflow(
  "transition-dtf-production-job",
  function (input: TransitionDtfProductionJobWorkflowInput) {
    const result = transitionDtfProductionJobStep(input)
    return new WorkflowResponse(result)
  }
)
