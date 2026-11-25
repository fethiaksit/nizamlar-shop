import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import type { MintAssetDownloadTokenBody } from "../../../../../dtf-validators"
import { DTF_COMMERCE_MODULE } from "../../../../../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../../../../../modules/dtf_commerce/service"
import {
  assertPaidOrderBeforeProduction,
  createSignedAssetDownloadToken,
} from "../../../../../../modules/dtf_commerce/production-state"

export async function POST(
  req: AuthenticatedMedusaRequest<MintAssetDownloadTokenBody>,
  res: MedusaResponse
) {
  const jobId = String(req.params.id || "").trim()
  const ttlSeconds = req.validatedBody?.ttlSeconds || 900

  const dtfService = req.scope.resolve<DtfCommerceModuleService>(
    DTF_COMMERCE_MODULE
  )
  const jobs = await dtfService.listDtfProductionJobs({ id: jobId }, { take: 1 })
  const job = jobs[0]
  if (!job) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `DTF production job '${jobId}' not found`
    )
  }

  assertPaidOrderBeforeProduction(Boolean(job.payment_verified))

  if (!job.design_asset_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "This ready-to-press production job has no custom uploaded design asset"
    )
  }

  const expiresAtEpochSec = Math.floor(Date.now() / 1000) + ttlSeconds

  const productionToken = createSignedAssetDownloadToken({
    jobId: job.id,
    assetKind: "production",
    expiresAtEpochSec,
  })
  const originalToken = createSignedAssetDownloadToken({
    jobId: job.id,
    assetKind: "original",
    expiresAtEpochSec,
  })
  const mockupToken = createSignedAssetDownloadToken({
    jobId: job.id,
    assetKind: "mockup",
    expiresAtEpochSec,
  })

  return res.status(200).json({
    jobId: job.id,
    expiresAtEpochSec,
    downloads: {
      productionPrintPngUrl: `/store/dtf/production-assets/${job.id}?kind=production&token=${encodeURIComponent(productionToken)}`,
      originalSourceUrl: `/store/dtf/production-assets/${job.id}?kind=original&token=${encodeURIComponent(originalToken)}`,
      mockupPreviewUrl: `/store/dtf/production-assets/${job.id}?kind=mockup&token=${encodeURIComponent(mockupToken)}`,
    },
  })
}
