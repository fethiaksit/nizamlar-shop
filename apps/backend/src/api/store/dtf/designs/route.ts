import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import type { CreateDtfDesignAssetBody } from "../../../dtf-validators"
import { DTF_COMMERCE_MODULE } from "../../../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../../../modules/dtf_commerce/service"
import { createDtfDesignAssetWorkflow } from "../../../../workflows/dtf/create-dtf-design-asset"
import { seedDefaultDtfCatalogWorkflow } from "../../../../workflows/dtf/seed-default-dtf-catalog"

export async function POST(
  req: MedusaStoreRequest<CreateDtfDesignAssetBody>,
  res: MedusaResponse
) {
  await seedDefaultDtfCatalogWorkflow(req.scope).run({ input: {} })

  const { result } = await createDtfDesignAssetWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  return res.status(201).json(result)
}

export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  const id = String(req.query.id || "").trim()
  if (!id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Query parameter 'id' is required"
    )
  }

  const dtfService = req.scope.resolve<DtfCommerceModuleService>(
    DTF_COMMERCE_MODULE
  )
  const assets = await dtfService.listDtfDesignAssets({ id }, { take: 1 })
  const asset = assets[0]

  if (!asset) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `DTF design asset '${id}' not found`
    )
  }

  return res.status(200).json({
    designAsset: {
      id: asset.id,
      product_handle: asset.product_handle,
      product_type: asset.product_type,
      unit_system: asset.unit_system,
      width_in: asset.width_in,
      height_in: asset.height_in,
      width_cm: asset.width_cm,
      height_cm: asset.height_cm,
      quantity: asset.quantity,
      pixel_width: asset.pixel_width,
      pixel_height: asset.pixel_height,
      effective_dpi: asset.effective_dpi,
      has_transparency: asset.has_transparency,
      file_mime_type: asset.file_mime_type,
      original_file_name: asset.original_file_name,
      preview_garment_color: asset.preview_garment_color,
      has_separate_production_file: Boolean(asset.production_asset_path),
      has_mockup_preview: Boolean(asset.mockup_preview_path),
      status: asset.status,
    },
    quote: asset.verified_quote_json,
    quoteSignature: asset.quote_signature,
    mockupUrl: asset.mockup_preview_path
      ? `/store/dtf/designs/${asset.id}/mockup`
      : null,
  })
}
