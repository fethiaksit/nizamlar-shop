import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../lib/db"
import fs from "fs"
import path from "path"

/**
 * GET /admin/site-management/media
 * Merkezi Medya Kütüphanesindeki genel dosyaları listeler.
 * Müşterilerin özel baskı dosyaları (is_public = false) filtrelenir ve gizlenir.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const category = req.query.category as string
    const search = req.query.q as string

    let query = "SELECT * FROM site_media WHERE is_public = true"
    const params: any[] = []

    if (category && category !== "all") {
      params.push(category)
      query += ` AND category = $${params.length}`
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`)
      query += ` AND (title ILIKE $${params.length} OR file_name ILIKE $${params.length})`
    }

    query += " ORDER BY created_at DESC;"

    const media = await queryDb(query, params)
    return res.status(200).json({ media })
  } catch (error: any) {
    return res.status(500).json({ message: "Medya dosyaları okunamadı.", error: error.message })
  }
}

/**
 * POST /admin/site-management/media
 * Yeni görsel, logo, 3D model veya kumaş texture dosyası kaydeder/yükler
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    const {
      title,
      fileName,
      fileUrl,
      fileType = "image",
      mimeType = "image/png",
      fileSize = 0,
      category = "product",
      base64Data,
    } = body

    if (!title || (!fileUrl && !base64Data)) {
      return res.status(400).json({ message: "Başlık ve dosya verisi zorunludur." })
    }

    let resolvedFileUrl = fileUrl

    // Base64 dosya yüklemesi varsa yerel public klasörüne kaydet
    if (base64Data && fileName) {
      const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".svg", ".glb", ".gltf"]
      const ext = path.extname(fileName).toLowerCase()
      if (!allowedExtensions.includes(ext)) {
        return res.status(400).json({
          message: `Desteklenmeyen dosya uzantısı: ${ext}. İzin verilenler: ${allowedExtensions.join(", ")}`,
        })
      }

      // 50MB sınır kontrolü
      const buffer = Buffer.from(base64Data.replace(/^data:[^;]+;base64,/, ""), "base64")
      if (buffer.length > 50 * 1024 * 1024) {
        return res.status(400).json({ message: "Dosya boyutu 50 MB sınırını aşamaz." })
      }

      const uploadDir = path.resolve(process.cwd(), "uploads", "media")
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }

      const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`
      const targetPath = path.join(uploadDir, safeName)
      fs.writeFileSync(targetPath, buffer)

      resolvedFileUrl = `/uploads/media/${safeName}`
    }

    const id = `media-${Date.now()}`
    const insertQuery = `
      INSERT INTO site_media (
        id, title, file_name, file_url, file_type, mime_type, file_size, category, is_public, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW()
      )
      RETURNING *;
    `

    const values = [
      id,
      title,
      fileName || path.basename(resolvedFileUrl),
      resolvedFileUrl,
      fileType,
      mimeType,
      fileSize,
      category,
    ]

    const result = await queryDb(insertQuery, values)
    return res.status(201).json({
      message: "Medya dosyası başarıyla kütüphaneye eklendi.",
      media: result[0],
    })
  } catch (error: any) {
    return res.status(500).json({ message: "Medya yüklenemedi.", error: error.message })
  }
}
