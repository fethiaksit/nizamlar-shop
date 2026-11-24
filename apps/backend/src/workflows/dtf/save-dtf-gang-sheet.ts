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
  validateGangSheetLayout,
  type GangSheetItemPlacement,
} from "../../modules/dtf_commerce/gang-sheet-layout"
import {
  calculateDtfTransferQuote,
  inspectArtworkBuffer,
  signDtfQuote,
} from "../../modules/dtf_commerce/pricing"

export interface SaveDtfGangSheetWorkflowInput {
  productHandle?: string
  sheetWidthIn?: number
  sheetLengthIn: number
  quantity: number
  items: GangSheetItemPlacement[]
  productionPrintPngBase64: string
  previewGarmentColor?: string
  allowLowDpi?: boolean
}

interface GangSheetCompensation {
  assetId?: string
  writtenPaths: string[]
}

const saveDtfGangSheetStep = createStep(
  "save-dtf-gang-sheet",
  async (input: SaveDtfGangSheetWorkflowInput, { container }) => {
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

    const sheetWidthIn = input.sheetWidthIn || rule.gang_sheet_width_in
    if (Math.abs(sheetWidthIn - rule.gang_sheet_width_in) > 0.05) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gang sheet roll width must match configured ${rule.gang_sheet_width_in}" width`
      )
    }

    const validationReport = validateGangSheetLayout(input.items, {
      sheetWidthIn,
      sheetLengthIn: input.sheetLengthIn,
      minMarginIn: rule.min_margin_in,
      minGapIn: rule.min_gap_in,
      minAcceptableDpi: rule.min_acceptable_dpi,
      targetDpi: rule.target_dpi,
    })

    if (validationReport.outOfBoundsIds.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gang sheet contains ${validationReport.outOfBoundsIds.length} item(s) outside roll bounds (${sheetWidthIn}" x ${input.sheetLengthIn}")`
      )
    }

    if (validationReport.marginViolationIds.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gang sheet contains ${validationReport.marginViolationIds.length} item(s) violating ${rule.min_margin_in}" safe edge margin`
      )
    }

    if (validationReport.overlapIds.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gang sheet contains overlapping items (${validationReport.overlapPairs.length} collision(s))`
      )
    }

    if (validationReport.lowDpiIds.length > 0 && !input.allowLowDpi) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Gang sheet contains ${validationReport.lowDpiIds.length} item(s) below ${rule.min_acceptable_dpi} DPI minimum`
      )
    }

    const stripped = input.productionPrintPngBase64
      .replace(/^data:[^;]+;base64,/, "")
      .trim()
    const productionBuffer = Buffer.from(stripped, "base64")
    const productionMeta = inspectArtworkBuffer(productionBuffer, "image/png")

    if (!productionMeta.hasTransparency) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Gang sheet production file must be an RGBA PNG with transparent background"
      )
    }

    const quote = calculateDtfTransferQuote(
      {
        productType: "gang_sheet",
        unit: "in",
        width: sheetWidthIn,
        height: input.sheetLengthIn,
        filmLengthIn: input.sheetLengthIn,
        quantity: input.quantity,
      },
      rule
    )

    const minEffectiveDpi = Math.min(
      ...validationReport.items.map((i) => i.effectiveDpi)
    )

    const fileToken = `gang_${crypto.randomBytes(12).toString("hex")}`
    const productionDir = path.resolve(
      process.cwd(),
      "private/uploads/dtf-production"
    )
    const layoutsDir = path.resolve(
      process.cwd(),
      "private/uploads/dtf-originals"
    )
    fs.mkdirSync(productionDir, { recursive: true })
    fs.mkdirSync(layoutsDir, { recursive: true })

    const layoutManifestPath = path.join(
      layoutsDir,
      `${fileToken}_gang_sheet_manifest.json`
    )
    const productionPath = path.join(
      productionDir,
      `${fileToken}_gang_sheet_300dpi_transparent.png`
    )

    const writtenPaths: string[] = []
    try {
      fs.writeFileSync(
        layoutManifestPath,
        JSON.stringify(
          {
            sheetWidthIn,
            sheetLengthIn: input.sheetLengthIn,
            items: input.items,
            validationReport,
          },
          null,
          2
        )
      )
      writtenPaths.push(layoutManifestPath)

      fs.writeFileSync(productionPath, productionBuffer)
      writtenPaths.push(productionPath)

      const initialSig = signDtfQuote(quote)
      const created = await dtfService.createDtfDesignAssets({
        product_handle: input.productHandle || "dtf-gang-sheet",
        product_type: "gang_sheet",
        unit_system: "in",
        width_in: quote.dimensions.widthIn,
        height_in: quote.dimensions.heightIn,
        width_cm: quote.dimensions.widthCm,
        height_cm: quote.dimensions.heightCm,
        quantity: quote.quantity,
        pixel_width: productionMeta.pixelWidth,
        pixel_height: productionMeta.pixelHeight,
        effective_dpi: minEffectiveDpi,
        has_transparency: true,
        file_mime_type: "image/png",
        original_file_name: `gang-sheet-${sheetWidthIn}x${input.sheetLengthIn}in.png`,
        preview_garment_color: input.previewGarmentColor || null,
        original_asset_path: layoutManifestPath,
        production_asset_path: productionPath,
        mockup_preview_path: null,
        placement_json: null,
        layout_state_json: {
          sheetWidthIn,
          sheetLengthIn: input.sheetLengthIn,
          itemCount: input.items.length,
          utilizationPercent: validationReport.utilizationPercent,
          printerRipVerified: rule.printer_rip_verified,
          items: input.items,
        },
        verified_quote_json: quote as unknown as Record<string, unknown>,
        quote_signature: initialSig,
        status: "quoted",
      })

      const boundSignature = signDtfQuote(quote, created.id)
      const updated = await dtfService.updateDtfDesignAssets({
        id: created.id,
        quote_signature: boundSignature,
      })

      return new StepResponse(
        {
          designAsset: {
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
            item_count: input.items.length,
            printer_rip_verified: rule.printer_rip_verified,
            status: updated.status,
          },
          quote,
          quoteSignature: boundSignature,
          validationReport,
        },
        {
          assetId: updated.id,
          writtenPaths,
        } satisfies GangSheetCompensation
      )
    } catch (err) {
      for (const p of writtenPaths) {
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p)
        } catch {
          // Ignore cleanup failure
        }
      }
      throw err
    }
  },
  async (compensation: GangSheetCompensation | undefined, { container }) => {
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

export const saveDtfGangSheetWorkflow = createWorkflow(
  "save-dtf-gang-sheet",
  function (input: SaveDtfGangSheetWorkflowInput) {
    const result = saveDtfGangSheetStep(input)
    return new WorkflowResponse(result)
  }
)
