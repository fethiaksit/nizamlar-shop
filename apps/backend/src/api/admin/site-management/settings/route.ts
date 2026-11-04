import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../lib/db"

/**
 * GET /admin/site-management/settings
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const rows = await queryDb("SELECT * FROM site_settings WHERE id = 'default' LIMIT 1;")
    if (rows.length === 0) {
      return res.status(404).json({ message: "Site ayarları bulunamadı." })
    }
    return res.status(200).json({ settings: rows[0] })
  } catch (error: any) {
    return res.status(500).json({ message: "Ayarlar okunamadı.", error: error.message })
  }
}

/**
 * POST /admin/site-management/settings
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    const {
      siteTitle,
      tagline,
      announcementText,
      announcementLink,
      contactEmail,
      contactPhone,
      whatsappNumber,
      address,
      socialInstagram,
      socialLinkedin,
      footerCopyright,
      navigationItems,
      footerColumns,
      isPublished,
    } = body

    const updateQuery = `
      UPDATE site_settings
      SET
        site_title = COALESCE($1, site_title),
        tagline = COALESCE($2, tagline),
        announcement_text = COALESCE($3, announcement_text),
        announcement_link = COALESCE($4, announcement_link),
        contact_email = COALESCE($5, contact_email),
        contact_phone = COALESCE($6, contact_phone),
        whatsapp_number = COALESCE($7, whatsapp_number),
        address = COALESCE($8, address),
        social_instagram = COALESCE($9, social_instagram),
        social_linkedin = COALESCE($10, social_linkedin),
        footer_copyright = COALESCE($11, footer_copyright),
        navigation_items = COALESCE($12, navigation_items),
        footer_columns = COALESCE($13, footer_columns),
        is_published = COALESCE($14, is_published),
        updated_at = NOW()
      WHERE id = 'default'
      RETURNING *;
    `

    const values = [
      siteTitle,
      tagline,
      announcementText,
      announcementLink,
      contactEmail,
      contactPhone,
      whatsappNumber,
      address,
      socialInstagram,
      socialLinkedin,
      footerCopyright,
      navigationItems ? JSON.stringify(navigationItems) : null,
      footerColumns ? JSON.stringify(footerColumns) : null,
      typeof isPublished === "boolean" ? isPublished : null,
    ]

    const updated = await queryDb(updateQuery, values)
    return res.status(200).json({
      message: "Site ayarları başarıyla güncellendi.",
      settings: updated[0],
    })
  } catch (error: any) {
    return res.status(500).json({ message: "Ayarlar güncellenemedi.", error: error.message })
  }
}
