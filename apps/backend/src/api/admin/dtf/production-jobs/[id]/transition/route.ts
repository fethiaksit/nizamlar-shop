import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { TransitionDtfProductionJobBody } from "../../../../../dtf-validators"
import { transitionDtfProductionJobWorkflow } from "../../../../../../workflows/dtf/transition-dtf-production-job"

export async function POST(
  req: AuthenticatedMedusaRequest<TransitionDtfProductionJobBody>,
  res: MedusaResponse
) {
  const jobId = String(req.params.id || "").trim()
  const body = req.validatedBody

  const { result } = await transitionDtfProductionJobWorkflow(req.scope).run({
    input: {
      jobId,
      nextState: body.nextState,
      cancellationState: body.cancellationState,
      refundState: body.refundState,
      qcNotes: body.qcNotes,
      trackingNumber: body.trackingNumber,
      trackingCarrier: body.trackingCarrier,
      trackingUrl: body.trackingUrl,
      triggerErpSync: body.triggerErpSync,
      actorEmail: req.auth_context?.actor_id || "admin_operator",
    },
  })

  return res.status(200).json(result)
}
