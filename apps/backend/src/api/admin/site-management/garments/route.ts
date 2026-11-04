import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../lib/db"

/**
 * GET /admin/site-management/garments
 * Askılıktaki ürünleri ve ilişkilendirilebilecek Medusa ürünlerini döner
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const garments = await queryDb(
      "SELECT * FROM garment_display_config ORDER BY rank ASC, created_at ASC;"
    )

    // Medusa'daki gerçek ürünler
    const availableProducts = await queryDb(
      "SELECT id, title, handle, thumbnail FROM product WHERE deleted_at IS NULL ORDER BY title ASC;"
    )

    return res.status(200).json({ garments, availableProducts })
  } catch (error: any) {
    return res.status(500).json({ message: "Askılık ürünleri okunamadı.", error: error.message })
  }
}

/**
 * POST /admin/site-management/garments
 * Yeni askılık ürünü ekler veya sıralamayı günceller
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    if (body.action === "reorder" && Array.isArray(body.orders)) {
      for (const item of body.orders) {
        await queryDb(
          "UPDATE garment_display_config SET rank = $1, updated_at = NOW() WHERE id = $2;",
          [item.rank, item.id]
        )
      }
      const garments = await queryDb("SELECT * FROM garment_display_config ORDER BY rank ASC;")
      return res.status(200).json({ message: "Askılık sıralaması güncellendi.", garments })
    }

    const id = body.id || `rack-${Date.now()}`
    const {
      productId,
      productHandle,
      name = "Yeni Askılık Ürünü",
      garmentKind = "tee",
      colour = "#232528",
      showNizamlarLogo = true,
      logoScale = 0.22,
      logoPosX = 0.35,
      logoPosY = 0.58,
      logoStyle = "screenprint",
      model3dFile = "/models/nizamlar-tee.glb",
      isActive = true,
      isPublished = false,
    } = body

    const maxRankRes = await queryDb(
      "SELECT COALESCE(MAX(rank), -1) as max_rank FROM garment_display_config;"
    )
    const newRank = parseInt(maxRankRes[0].max_rank) + 1

    const insertQuery = `
      INSERT INTO garment_display_config (
        id, product_id, product_handle, name, garment_kind, colour,
        show_nizamlar_logo, logo_scale, logo_pos_x, logo_pos_y, logo_style,
        model_3d_file, rank, is_active, is_published, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, NOW(), NOW()
      )
      RETURNING *;
    `

    const values = [
      id,
      productId,
      productHandle,
      name,
      garmentKind,
      colour,
      showNizamlarLogo,
      logoScale,
      logoPosX,
      logoPosY,
      logoStyle,
      model3dFile,
      newRank,
      isActive,
      isPublished,
    ]

    const result = await queryDb(insertQuery, values)
    return res.status(201).json({ message: "Askılık ürünü başarıyla eklendi.", garment: result[0] })
  } catch (error: any) {
    return res.status(500).json({ message: "Askılık ürünü eklenemedi.", error: error.message })
  }
}
