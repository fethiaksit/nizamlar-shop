import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../lib/db"

/**
 * GET /admin/site-management/hero-slides
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const slides = await queryDb("SELECT * FROM hero_slides ORDER BY rank ASC, created_at ASC;")
    return res.status(200).json({ slides })
  } catch (error: any) {
    return res.status(500).json({ message: "Slaytlar okunamadı.", error: error.message })
  }
}

/**
 * POST /admin/site-management/hero-slides
 * Slayt ekler veya sıralamayı toplu günceller
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    // Toplu sıralama güncellemesi
    if (body.action === "reorder" && Array.isArray(body.orders)) {
      for (const item of body.orders) {
        await queryDb("UPDATE hero_slides SET rank = $1, updated_at = NOW() WHERE id = $2;", [
          item.rank,
          item.id,
        ])
      }
      const slides = await queryDb("SELECT * FROM hero_slides ORDER BY rank ASC;")
      return res.status(200).json({ message: "Slayt sıralaması güncellendi.", slides })
    }

    // Yeni slayt ekleme
    const id = body.id || `slide-${Date.now()}`
    const {
      theme = "light",
      eyebrow = "YENİ KOLEKSİYON",
      titleLine1 = "KENDİ TARZINI",
      titleLine2 = "YANSIT.",
      subtitle = "Premium tekstil ürünleri ve özel baskı seçenekleri.",
      ctaLabel = "İncele",
      ctaHref = "/store",
      secondaryLabel = "Tasarla",
      secondaryHref = "#tshirt3d-experience",
      imageUrl = "/hero/slide-1-tee.webp",
      imageAlt = "Nizamlar Baskı Ürünü",
      badges = ["240 GSM Pamuk", "Yüksek Kalite"],
      garmentTag = "PREMIUM KOLEKSİYON",
      shirtColor = "#232528",
      shirtRotation = 0,
      model3dPath = "/models/nizamlar-tee.glb",
      isActive = true,
      isPublished = false,
      autoplayDurationMs = 4400,
    } = body

    const maxRankRes = await queryDb("SELECT COALESCE(MAX(rank), -1) as max_rank FROM hero_slides;")
    const newRank = parseInt(maxRankRes[0].max_rank) + 1

    const insertQuery = `
      INSERT INTO hero_slides (
        id, rank, theme, eyebrow, title_line1, title_line2, subtitle,
        cta_label, cta_href, secondary_label, secondary_href,
        image_url, image_alt, badges, garment_tag, shirt_color,
        shirt_rotation, model_3d_path, is_active, is_published,
        autoplay_duration_ms, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20,
        $21, NOW(), NOW()
      )
      RETURNING *;
    `

    const values = [
      id,
      newRank,
      theme,
      eyebrow,
      titleLine1,
      titleLine2,
      subtitle,
      ctaLabel,
      ctaHref,
      secondaryLabel,
      secondaryHref,
      imageUrl,
      imageAlt,
      JSON.stringify(badges),
      garmentTag,
      shirtColor,
      shirtRotation,
      model3dPath,
      isActive,
      isPublished,
      autoplayDurationMs,
    ]

    const result = await queryDb(insertQuery, values)
    return res.status(201).json({ message: "Slayt başarıyla eklendi.", slide: result[0] })
  } catch (error: any) {
    return res.status(500).json({ message: "Slayt eklenemedi.", error: error.message })
  }
}
