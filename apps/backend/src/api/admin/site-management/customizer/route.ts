import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../lib/db"

/**
 * GET /admin/site-management/customizer
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const rows = await queryDb(
      "SELECT * FROM customizer_settings WHERE id = 'default' LIMIT 1;"
    )
    if (rows.length === 0) {
      return res.status(404).json({ message: "3D customizer ayarları bulunamadı." })
    }
    return res.status(200).json({ customizer: rows[0] })
  } catch (error: any) {
    return res.status(500).json({ message: "Ayarlar okunamadı.", error: error.message })
  }
}

/**
 * POST /admin/site-management/customizer
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    const {
      sectionTitle,
      sectionSubtitle,
      badgeText,
      defaultModelPath,
      defaultShirtColor,
      colorPalette,
      defaultLogoUrl,
      defaultFullUrl,
      logoPosX,
      logoPosY,
      logoPosZ,
      logoScale,
      maxFileSizeMb,
      allowedFormats,
      ctaButtonText,
      secondaryButtonText,
      isPublished,
    } = body

    const updateQuery = `
      UPDATE customizer_settings
      SET
        section_title = COALESCE($1, section_title),
        section_subtitle = COALESCE($2, section_subtitle),
        badge_text = COALESCE($3, badge_text),
        default_model_path = COALESCE($4, default_model_path),
        default_shirt_color = COALESCE($5, default_shirt_color),
        color_palette = COALESCE($6, color_palette),
        default_logo_url = COALESCE($7, default_logo_url),
        default_full_url = COALESCE($8, default_full_url),
        logo_pos_x = COALESCE($9, logo_pos_x),
        logo_pos_y = COALESCE($10, logo_pos_y),
        logo_pos_z = COALESCE($11, logo_pos_z),
        logo_scale = COALESCE($12, logo_scale),
        max_file_size_mb = COALESCE($13, max_file_size_mb),
        allowed_formats = COALESCE($14, allowed_formats),
        cta_button_text = COALESCE($15, cta_button_text),
        secondary_button_text = COALESCE($16, secondary_button_text),
        is_published = COALESCE($17, is_published),
        updated_at = NOW()
      WHERE id = 'default'
      RETURNING *;
    `

    const values = [
      sectionTitle,
      sectionSubtitle,
      badgeText,
      defaultModelPath,
      defaultShirtColor,
      colorPalette ? JSON.stringify(colorPalette) : null,
      defaultLogoUrl,
      defaultFullUrl,
      typeof logoPosX === "number" ? logoPosX : null,
      typeof logoPosY === "number" ? logoPosY : null,
      typeof logoPosZ === "number" ? logoPosZ : null,
      typeof logoScale === "number" ? logoScale : null,
      typeof maxFileSizeMb === "number" ? maxFileSizeMb : null,
      allowedFormats ? JSON.stringify(allowedFormats) : null,
      ctaButtonText,
      secondaryButtonText,
      typeof isPublished === "boolean" ? isPublished : null,
    ]

    const updated = await queryDb(updateQuery, values)
    return res.status(200).json({
      message: "3D Customizer ayarları başarıyla güncellendi.",
      customizer: updated[0],
    })
  } catch (error: any) {
    return res.status(500).json({ message: "Ayarlar güncellenemedi.", error: error.message })
  }
}
