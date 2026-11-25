import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { DTF_COMMERCE_MODULE } from "../../../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../../../modules/dtf_commerce/service"
import { PRODUCTION_STATES } from "../../../../modules/dtf_commerce/production-state"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const dtfService = req.scope.resolve<DtfCommerceModuleService>(
    DTF_COMMERCE_MODULE
  )

  const stateFilter = String(req.query.state || "").trim()
  const searchQuery = String(req.query.q || "").trim().toLowerCase()

  const filters: Record<string, unknown> = {}
  if (stateFilter && (PRODUCTION_STATES as readonly string[]).includes(stateFilter)) {
    filters.state = stateFilter
  }

  const allJobs = await dtfService.listDtfProductionJobs(filters, {
    take: 200,
  })

  const filtered = searchQuery
    ? allJobs.filter(
        (j) =>
          j.production_ref.toLowerCase().includes(searchQuery) ||
          (j.external_order_name || "").toLowerCase().includes(searchQuery) ||
          (j.customer_email || "").toLowerCase().includes(searchQuery)
      )
    : allJobs

  const stateCounts: Record<string, number> = {}
  for (const s of PRODUCTION_STATES) {
    stateCounts[s] = 0
  }
  for (const j of allJobs) {
    stateCounts[j.state] = (stateCounts[j.state] || 0) + 1
  }

  return res.status(200).json({
    jobs: filtered,
    stateCounts,
    total: filtered.length,
  })
}
