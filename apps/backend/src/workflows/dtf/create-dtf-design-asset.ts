import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { DTF_COMMERCE_MODULE } from "../../modules/dtf_commerce"
import type DtfCommerceModuleService from "../../modules/dtf_commerce/service"
import { mapPricingRuleRecord } from "../../modules/dtf_commerce/catalog-defaults"
import {
  calculateDtfTransferQuote,
  calculateEffectiveDpi,
  inspectArtworkBuffer,
  normalizePrintDimensions,
  signDtfQuote,
  type DtfDimensionUnit,
  type DtfProductType,
} from "../../modules/dtf_commerce/pricing"

export interface CreateDtfDesignAssetWorkflowInput {
  productHandle?: string
  productType: DtfProductType
  unit: DtfDimensionUnit
  width: number
  height: number
  quantity: number
  filmLengthIn?: number
  originalFileName: string
  originalFileMimeType: string
  originalFileBase64: string
  productionPrintPngBase64: string
  mockupPreviewPngBase64?: string
  previewGarmentColor?: string
  placement?: Record<string, unknown>
  layoutState?: Record<string, unknown>
  allowLowDpi?: boolean
}

interface CompensationPayload {
  assetId?: string
  writtenPaths: string[]
}

function decodeBase64Payload(raw: string): Buffer {
  const stripped = raw.replace(/^data:[^;]+;base64,/, "").trim()
  if (!stripped) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Base64 artwork payload cannot be empty"
    )
  }
  return Buffer.from(stripped, "base64")
}

function safeFileExtension(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return ".png"
    case "image/webp":
      return ".webp"
    case "image/jpeg":
      return ".jpg"
    case "image/svg+xml":
      return ".svg"
    default:
      return ".bin"
  }
}

function sanitizeOriginalFileName(name: string): string {
  const cleaned = path
    .basename(name)
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .slice(0, 140)
  return cleaned || "dtf-artwork"
}

const createDtfDesignAssetStep = createStep(
  "create-dtf-design-asset",
  async (input: CreateDtfDesignAssetWorkflowInput, { container }) => {
    const dtfService = container.resolve<DtfCommerceModuleService>(
      DTF_COMMERCE_MODULE
    )

    const activeRules = await dtfService.listDtfPricingRules(
      { is_active: true },
      { take: 1 }
    )
    const rule = mapPricingRuleRecord(
      (activeRules[0] as unknown as Record<string, unknown>) || null
    )

    const effectiveWidth =
      input.productType === "gang_sheet" && input.unit === "in"
        ? input.width || rule.gang_sheet_width_in
        : input.width
    const effectiveHeight =
      input.productType === "gang_sheet" && input.filmLengthIn
        ? input.unit === "in"
          ? input.filmLengthIn
          : input.filmLengthIn * 2.54
        : input.height

    const dimensions = normalizePrintDimensions(
      effectiveWidth,
      effectiveHeight,
      input.unit,
      rule
    )

    const originalBuffer = decodeBase64Payload(input.originalFileBase64)
    const originalMeta = inspectArtworkBuffer(
      originalBuffer,
      input.originalFileMimeType
    )

    const productionBuffer = decodeBase64Payload(input.productionPrintPngBase64)
    const productionMeta = inspectArtworkBuffer(productionBuffer, "image/png")

    if (!productionMeta.hasTransparency) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Production DTF print file must be an RGBA PNG with transparent background (garment mockups cannot be used as production print assets)"
      )
    }

    let mockupBuffer: Buffer | null = null
    if (input.mockupPreviewPngBase64) {
      mockupBuffer = decodeBase64Payload(input.mockupPreviewPngBase64)
      const mockupMeta = inspectArtworkBuffer(mockupBuffer, "image/png")
      if (!mockupMeta.pixelWidth || !mockupMeta.pixelHeight) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Invalid mockup preview PNG"
        )
      }
      if (mockupBuffer.equals(productionBuffer)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Mockup preview and transparent production print file must be distinct assets"
        )
      }
    }

    const dpiCheck = calculateEffectiveDpi(
      originalMeta.pixelWidth,
      originalMeta.pixelHeight,
      dimensions.widthIn,
      dimensions.heightIn,
      originalMeta.mimeType
    )

    if (dpiCheck.effectiveDpi < rule.min_acceptable_dpi && !input.allowLowDpi) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Artwork resolution (${dpiCheck.effectiveDpi} DPI at ${dimensions.widthIn}" x ${dimensions.heightIn}") is below minimum acceptable ${rule.min_acceptable_dpi} DPI`
      )
    }

    let bundleBasePriceCents: number | undefined
    if (input.productType === "dtf_bundle") {
      const bundleSpecs = await dtfService.listDtfProductSpecs(
        { product_type: "dtf_bundle", is_published: true },
        { take: 1 }
      )
      bundleBasePriceCents = Number(bundleSpecs[0]?.base_price_cents || 2490)
    }

    const quote = calculateDtfTransferQuote(
      {
        productType: input.productType,
        unit: input.unit,
        width: effectiveWidth,
        height: effectiveHeight,
        quantity: input.quantity,
        filmLengthIn: input.filmLengthIn,
        bundleBasePriceCents,
      },
      rule
    )

    const fileToken = `dtf_${crypto.randomBytes(12).toString("hex")}`
    const originalsDir = path.resolve(
      process.cwd(),
      "private/uploads/dtf-originals"
    )
    const productionDir = path.resolve(
      process.cwd(),
      "private/uploads/dtf-production"
    )
    const mockupsDir = path.resolve(
      process.cwd(),
      "private/uploads/dtf-mockups"
    )

    fs.mkdirSync(originalsDir, { recursive: true })
    fs.mkdirSync(productionDir, { recursive: true })
    fs.mkdirSync(mockupsDir, { recursive: true })

    const originalPath = path.join(
      originalsDir,
      `${fileToken}_source${safeFileExtension(originalMeta.mimeType)}`
    )
    const productionPath = path.join(
      productionDir,
      `${fileToken}_print_ready_transparent.png`
    )
    const mockupPath = mockupBuffer
      ? path.join(mockupsDir, `${fileToken}_garment_mockup.png`)
      : null

    const writtenPaths: string[] = []
    try {
      fs.writeFileSync(originalPath, originalBuffer)
      writtenPaths.push(originalPath)

      fs.writeFileSync(productionPath, productionBuffer)
      writtenPaths.push(productionPath)

      if (mockupBuffer && mockupPath) {
        fs.writeFileSync(mockupPath, mockupBuffer)
        writtenPaths.push(mockupPath)
      }

      const initialSig = signDtfQuote(quote)
      const created = await dtfService.createDtfDesignAssets({
        product_handle: input.productHandle || null,
        product_type: input.productType,
        unit_system: dimensions.unit,
        width_in: dimensions.widthIn,
        height_in: dimensions.heightIn,
        width_cm: dimensions.widthCm,
        height_cm: dimensions.heightCm,
        quantity: quote.quantity,
        pixel_width: originalMeta.pixelWidth,
        pixel_height: originalMeta.pixelHeight,
        effective_dpi: dpiCheck.effectiveDpi,
        has_transparency: productionMeta.hasTransparency,
        file_mime_type: originalMeta.mimeType,
        original_file_name: sanitizeOriginalFileName(input.originalFileName),
        preview_garment_color: input.previewGarmentColor || null,
        original_asset_path: originalPath,
        production_asset_path: productionPath,
        mockup_preview_path: mockupPath,
        placement_json: input.placement || null,
        layout_state_json: input.layoutState || null,
        verified_quote_json: quote as unknown as Record<string, unknown>,
        quote_signature: initialSig,
        status: "quoted",
      })

      const boundSignature = signDtfQuote(quote, created.id)
      const updated = await dtfService.updateDtfDesignAssets({
        id: created.id,
        quote_signature: boundSignature,
      })

      const publicDesignAsset = {
        id: updated.id,
        product_handle: updated.product_handle,
        product_type: updated.product_type,
        unit_system: updated.unit_system,
        width_in: updated.width_in,
        height_in: updated.height_in,
        width_cm: updated.width_cm,
        height_cm: updated.height_cm,
        quantity: updated.quantity,
        pixel_width: updated.pixel_width,
        pixel_height: updated.pixel_height,
        effective_dpi: updated.effective_dpi,
        has_transparency: updated.has_transparency,
        file_mime_type: updated.file_mime_type,
        original_file_name: updated.original_file_name,
        preview_garment_color: updated.preview_garment_color,
        has_separate_production_file: true,
        has_mockup_preview: Boolean(mockupPath),
        status: updated.status,
      }

      return new StepResponse(
        {
          designAsset: publicDesignAsset,
          quote,
          quoteSignature: boundSignature,
          mockupUrl: mockupPath
            ? `/store/dtf/designs/${updated.id}/mockup`
            : null,
          resolutionReport: {
            sourcePixelWidth: originalMeta.pixelWidth,
            sourcePixelHeight: originalMeta.pixelHeight,
            productionPixelWidth: productionMeta.pixelWidth,
            productionPixelHeight: productionMeta.pixelHeight,
            effectiveDpi: dpiCheck.effectiveDpi,
            targetDpi: rule.target_dpi,
            minAcceptableDpi: rule.min_acceptable_dpi,
            meetsTarget300Dpi: dpiCheck.meetsTarget300Dpi,
            meetsMinimum150Dpi: dpiCheck.meetsMinimum150Dpi,
            sourceHasTransparency: originalMeta.hasTransparency,
            productionHasTransparency: productionMeta.hasTransparency,
          },
        },
        {
          assetId: updated.id,
          writtenPaths,
        } satisfies CompensationPayload
      )
    } catch (err) {
      for (const p of writtenPaths) {
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p)
        } catch {
          // Best-effort cleanup on step error
        }
      }
      throw err
    }
  },
  async (compensation: CompensationPayload | undefined, { container }) => {
    if (!compensation) return
    for (const p of compensation.writtenPaths) {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p)
      } catch {
        // Ignore cleanup failure
      }
    }
    if (compensation.assetId) {
      const dtfService = container.resolve<DtfCommerceModuleService>(
        DTF_COMMERCE_MODULE
      )
      await dtfService.deleteDtfDesignAssets(compensation.assetId)
    }
  }
)

export const createDtfDesignAssetWorkflow = createWorkflow(
  "create-dtf-design-asset",
  function (input: CreateDtfDesignAssetWorkflowInput) {
    const result = createDtfDesignAssetStep(input)
    return new WorkflowResponse(result)
  }
)
