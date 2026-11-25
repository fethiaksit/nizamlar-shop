import fs from "node:fs"
import path from "node:path"
import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { DTF_COMMERCE_MODULE } from "../../../../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../../../../modules/dtf_commerce/service"
import { verifySignedAssetDownloadToken } from "../../../../../modules/dtf_commerce/production-state"

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const jobId = String(req.params.jobId || "").trim()
  const rawKind = String(req.query.kind || "production").trim()
  const token = String(req.query.token || "").trim()

  if (
    rawKind !== "production" &&
    rawKind !== "original" &&
    rawKind !== "mockup"
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Asset kind must be 'production', 'original', or 'mockup'"
    )
  }

  const validToken = verifySignedAssetDownloadToken({
    jobId,
    assetKind: rawKind,
    token,
  })
  if (!validToken) {
    return res.status(403).json({
      message: "Expired or invalid signed production asset download token",
    })
  }

  const dtfService = req.scope.resolve<DtfCommerceModuleService>(
    DTF_COMMERCE_MODULE
  )
  const jobs = await dtfService.listDtfProductionJobs({ id: jobId }, { take: 1 })
  const job = jobs[0]
  if (!job || !job.payment_verified || !job.design_asset_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Verified production asset not found"
    )
  }

  const assets = await dtfService.listDtfDesignAssets(
    { id: job.design_asset_id },
    { take: 1 }
  )
  const asset = assets[0]
  if (!asset) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Design asset not found")
  }

  const candidatePath =
    rawKind === "production"
      ? asset.production_asset_path
      : rawKind === "original"
        ? asset.original_asset_path
        : asset.mockup_preview_path

  if (!candidatePath) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `No ${rawKind} file exists for this job`
    )
  }

  const allowedBase = path.resolve(process.cwd(), "private/uploads")
  const resolved = path.resolve(candidatePath)
  if (!resolved.startsWith(allowedBase + path.sep) || !fs.existsSync(resolved)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Production asset file missing from private vault"
    )
  }

  const ext = path.extname(resolved).toLowerCase()
  const contentType =
    ext === ".webp"
      ? "image/webp"
      : ext === ".jpg" || ext === ".jpeg"
        ? "image/jpeg"
        : ext === ".svg"
          ? "image/svg+xml"
          : ext === ".json"
            ? "application/json"
            : "image/png"

  const downloadFilename = `${job.production_ref}_${rawKind}${ext || ".png"}`
  const fileBuffer = fs.readFileSync(resolved)

  res.setHeader("Content-Type", contentType)
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${downloadFilename}"`
  )
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Cache-Control", "no-store")
  return res.status(200).send(fileBuffer)
}
