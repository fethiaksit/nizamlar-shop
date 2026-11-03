import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { customPrintPricingEngine } from "../../../lib/pricing-engine"
import fs from "fs"
import path from "path"
import crypto from "crypto"
import { Client } from "pg"

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB
const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
])

function sanitizeSvg(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
    .replace(/javascript:[^"']*/gi, "")
}

function getPgClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"
  return new Client({ connectionString })
}

/**
 * POST /store/custom-designs
 * Güvenli tasarım yükleme, parametre doğrulaması ve sunucu taraflı resmi fiyatlandırma
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    const {
      productId,
      variantId,
      originalFileBase64,
      originalFileName,
      fileMimeType,
      previewImageBase64,
      colorId,
      colorName,
      colorHex,
      size,
      view,
      positionId,
      positionName,
      transform,
      physicalDimensions,
      quantity = 1,
      cartId,
      pricingInput,
    } = body

    if (!productId || !originalFileBase64 || !fileMimeType) {
      return res.status(400).json({
        message: "Eksik parametreler: productId, originalFileBase64 ve fileMimeType zorunludur.",
      })
    }

    // 1. MIME ve format doğrulaması
    const normalizedMime = fileMimeType.toLowerCase().trim()
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      return res.status(400).json({
        message: `Desteklenmeyen dosya türü: ${normalizedMime}. Yalnızca PNG, JPG, WEBP ve SVG kabul edilir.`,
      })
    }

    // 2. Base64 ayrıştırma ve boyut kontrolü
    const base64Data = originalFileBase64.replace(/^data:[^;]+;base64,/, "")
    const fileBuffer = Buffer.from(base64Data, "base64")

    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        message: `Dosya boyutu çok büyük. Maksimum 25 MB kabul edilir.`,
      })
    }

    // SVG Güvenlik Taraması
    let finalBuffer = fileBuffer
    if (normalizedMime === "image/svg+xml") {
      const svgText = fileBuffer.toString("utf-8")
      const sanitized = sanitizeSvg(svgText)
      finalBuffer = Buffer.from(sanitized, "utf-8")
    }

    // Fiziksel boyut doğrulaması
    const isValidDimensions = customPrintPricingEngine.validatePrintDimensions(
      physicalDimensions,
      2500 // Maks 2500 cm2 (ör. 50x50 cm)
    )
    if (!isValidDimensions) {
      return res.status(400).json({
        message: "Geçersiz baskı boyutları. Baskı alanı izin verilen maksimum sınırların dışındadır.",
      })
    }

    // 3. Kalıcı dosya depolaması
    const designId = `des_${crypto.randomBytes(12).toString("hex")}`
    const uploadsBase = path.resolve(process.cwd(), "uploads/custom-designs")
    const previewsBase = path.resolve(process.cwd(), "uploads/previews")

    if (!fs.existsSync(uploadsBase)) fs.mkdirSync(uploadsBase, { recursive: true })
    if (!fs.existsSync(previewsBase)) fs.mkdirSync(previewsBase, { recursive: true })

    const ext = originalFileName
      ? path.extname(originalFileName)
      : normalizedMime === "image/svg+xml"
      ? ".svg"
      : ".png"
    const safeStorageFileName = `${designId}_original${ext}`
    const fullFilePath = path.join(uploadsBase, safeStorageFileName)
    fs.writeFileSync(fullFilePath, finalBuffer)

    let safePreviewPath: string | null = null
    if (previewImageBase64) {
      const previewData = previewImageBase64.replace(/^data:[^;]+;base64,/, "")
      const previewBuffer = Buffer.from(previewData, "base64")
      const previewFileName = `${designId}_preview.png`
      safePreviewPath = path.join(previewsBase, previewFileName)
      fs.writeFileSync(safePreviewPath, previewBuffer)
    }

    // 4. Sunucu Tarafı Gerçek Fiyat Hesaplaması
    const safeQty = Math.max(1, Number(quantity) || 1)
    const basePrice = Number(pricingInput?.basePrice || 450)
    const technique = (pricingInput?.technique || "dtf") as any
    const sizeCode = (pricingInput?.sizeCode || "a4") as any

    const pricingEstimate = await customPrintPricingEngine.calculatePriceAsync({
      basePrice,
      currencyCode: pricingInput?.currencyCode || "TRY",
      technique,
      sizeCode,
      surfaceCount: view === "both" ? 2 : 1,
      quantity: safeQty,
      dimensions: physicalDimensions,
    })

    // 5. PostgreSQL custom_design Tablosuna Kayıt
    const pg = getPgClient()
    await pg.connect()

    const insertQuery = `
      INSERT INTO custom_design (
        id, product_id, variant_id, original_file_path, original_file_name,
        file_type, file_size, preview_file_path, color_id, color_name, color_hex,
        size, view, position_id, position_name, transform, physical_dimensions,
        quantity, pricing_estimate, status, cart_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *;
    `
    const values = [
      designId,
      productId,
      variantId || null,
      fullFilePath,
      originalFileName || "design_upload",
      normalizedMime,
      finalBuffer.length,
      safePreviewPath,
      colorId || "siyah",
      colorName || "Siyah",
      colorHex || "#202020",
      size || "M",
      view || "front",
      positionId || "buyuk_on",
      positionName || "Büyük Ön Baskı",
      JSON.stringify(transform || {}),
      JSON.stringify(physicalDimensions || {}),
      safeQty,
      JSON.stringify(pricingEstimate),
      "active",
      cartId || null,
    ]

    const dbRes = await pg.query(insertQuery, values)
    await pg.end()

    return res.status(201).json({
      design: dbRes.rows[0],
      pricingEstimate,
      previewUrl: `/store/custom-designs/${designId}/preview`,
    })
  } catch (error: any) {
    console.error("[CustomDesign POST Error]:", error)
    return res.status(500).json({
      message: "Tasarım kaydı sırasında sunucu hatası meydana geldi.",
      error: error.message,
    })
  }
}

/**
 * GET /store/custom-designs
 * Güvenli tasarım sorgulama (ID ile)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const designId = req.query.id as string
    const cartId = req.query.cart_id as string

    if (!designId && !cartId) {
      return res.status(400).json({ message: "design_id veya cart_id belirtilmelidir." })
    }

    const pg = getPgClient()
    await pg.connect()

    let query = "SELECT id, product_id, variant_id, color_name, color_hex, size, view, position_name, physical_dimensions, quantity, pricing_estimate, status, cart_id, created_at FROM custom_design WHERE 1=1"
    const params: any[] = []

    if (designId) {
      params.push(designId)
      query += ` AND id = $${params.length}`
    }
    if (cartId) {
      params.push(cartId)
      query += ` AND cart_id = $${params.length}`
    }

    const dbRes = await pg.query(query, params)
    await pg.end()

    return res.status(200).json({
      designs: dbRes.rows,
    })
  } catch (error: any) {
    return res.status(500).json({ message: "Tasarım sorgulama hatası", error: error.message })
  }
}
