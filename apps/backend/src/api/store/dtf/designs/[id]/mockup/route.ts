import fs from "node:fs"
import path from "node:path"
import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { DTF_COMMERCE_MODULE } from "../../../../../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../../../../../modules/dtf_commerce/service"

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const id = String(req.params.id || "").trim()
  if (!id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Design asset ID is required"
    )
  }

  const dtfService = req.scope.resolve<DtfCommerceModuleService>(
    DTF_COMMERCE_MODULE
  )
  const assets = await dtfService.listDtfDesignAssets({ id }, { take: 1 })
  const asset = assets[0]

  if (!asset || !asset.mockup_preview_path) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Mockup preview not found for DTF design asset"
    )
  }

  const mockupsRoot = path.resolve(process.cwd(), "private/uploads/dtf-mockups")
  const resolvedMockup = path.resolve(asset.mockup_preview_path)

  if (
    !resolvedMockup.startsWith(mockupsRoot + path.sep) ||
    !fs.existsSync(resolvedMockup)
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Mockup preview file is unavailable"
    )
  }

  const buffer = fs.readFileSync(resolvedMockup)
  res.setHeader("Content-Type", "image/png")
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Cache-Control", "private, max-age=300")
  return res.status(200).send(buffer)
}
