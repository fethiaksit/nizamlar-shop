import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../../lib/db"

/**
 * GET /admin/site-management/hero-slides/:id
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const rows = await queryDb("SELECT * FROM hero_slides WHERE id = $1 LIMIT 1;", [id])
    if (rows.length === 0) {
      return res.status(404).json({ message: "Slayt bulunamadı." })
    }
    return res.status(200).json({ slide: rows[0] })
  } catch (error: any) {
    return res.status(500).json({ message: "Slayt okunamadı.", error: error.message })
  }
}

/**
 * PUT /admin/site-management/hero-slides/:id
 * Slayt bilgilerini günceller
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    const {
      rank,
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
      badges,
      garmentTag,
      shirtColor,
      shirtRotation,
      model3dPath,
      isActive,
      isPublished,
      autoplayDurationMs,
    } = body

    const updateQuery = `
      UPDATE hero_slides
      SET
        rank = COALESCE($1, rank),
        theme = COALESCE($2, theme),
        eyebrow = COALESCE($3, eyebrow),
        title_line1 = COALESCE($4, title_line1),
        title_line2 = COALESCE($5, title_line2),
        subtitle = COALESCE($6, subtitle),
        cta_label = COALESCE($7, cta_label),
        cta_href = COALESCE($8, cta_href),
        secondary_label = COALESCE($9, secondary_label),
        secondary_href = COALESCE($10, secondary_href),
        image_url = COALESCE($11, image_url),
        image_alt = COALESCE($12, image_alt),
        badges = COALESCE($13, badges),
        garment_tag = COALESCE($14, garment_tag),
        shirt_color = COALESCE($15, shirt_color),
        shirt_rotation = COALESCE($16, shirt_rotation),
        model_3d_path = COALESCE($17, model_3d_path),
        is_active = COALESCE($18, is_active),
        is_published = COALESCE($19, is_published),
        autoplay_duration_ms = COALESCE($20, autoplay_duration_ms),
        updated_at = NOW()
      WHERE id = $21
      RETURNING *;
    `

    const values = [
      typeof rank === "number" ? rank : null,
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
      badges ? JSON.stringify(badges) : null,
      garmentTag,
      shirtColor,
      typeof shirtRotation === "number" ? shirtRotation : null,
      model3dPath,
      typeof isActive === "boolean" ? isActive : null,
      typeof isPublished === "boolean" ? isPublished : null,
      typeof autoplayDurationMs === "number" ? autoplayDurationMs : null,
      id,
    ]

    const updated = await queryDb(updateQuery, values)
    if (updated.length === 0) {
      return res.status(404).json({ message: "Güncellenecek slayt bulunamadı." })
    }

    return res.status(200).json({ message: "Slayt başarıyla güncellendi.", slide: updated[0] })
  } catch (error: any) {
    return res.status(500).json({ message: "Slayt güncellenemedi.", error: error.message })
  }
}

/**
 * DELETE /admin/site-management/hero-slides/:id
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const deleted = await queryDb("DELETE FROM hero_slides WHERE id = $1 RETURNING *;", [id])
    if (deleted.length === 0) {
      return res.status(404).json({ message: "Silinecek slayt bulunamadı." })
    }
    return res.status(200).json({ message: "Slayt başarıyla silindi.", id })
  } catch (error: any) {
    return res.status(500).json({ message: "Slayt silinemedi.", error: error.message })
  }
}
