import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../lib/db"

/**
 * GET /admin/site-management/homepage-sections
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const sections = await queryDb("SELECT * FROM homepage_sections ORDER BY rank ASC;")
    return res.status(200).json({ sections })
  } catch (error: any) {
    return res.status(500).json({ message: "Bölümler okunamadı.", error: error.message })
  }
}

/**
 * POST /admin/site-management/homepage-sections
 * Bölümleri günceller veya toplu sıralama/aktiflik ayarlar
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    if (Array.isArray(body.sections)) {
      for (const s of body.sections) {
        await queryDb(
          `
          UPDATE homepage_sections
          SET
            name = COALESCE($1, name),
            badge_text = COALESCE($2, badge_text),
            title = COALESCE($3, title),
            subtitle = COALESCE($4, subtitle),
            rank = COALESCE($5, rank),
            is_active = COALESCE($6, is_active),
            is_published = COALESCE($7, is_published),
            config = COALESCE($8, config),
            updated_at = NOW()
          WHERE id = $9;
          `,
          [
            s.name,
            s.badge_text,
            s.title,
            s.subtitle,
            typeof s.rank === "number" ? s.rank : null,
            typeof s.is_active === "boolean" ? s.is_active : null,
            typeof s.is_published === "boolean" ? s.is_published : null,
            s.config ? JSON.stringify(s.config) : null,
            s.id,
          ]
        )
      }
    } else if (body.id) {
      await queryDb(
        `
        UPDATE homepage_sections
        SET
          name = COALESCE($1, name),
          badge_text = COALESCE($2, badge_text),
          title = COALESCE($3, title),
          subtitle = COALESCE($4, subtitle),
          rank = COALESCE($5, rank),
          is_active = COALESCE($6, is_active),
          is_published = COALESCE($7, is_published),
          config = COALESCE($8, config),
          updated_at = NOW()
        WHERE id = $9;
        `,
        [
          body.name,
          body.badge_text,
          body.title,
          body.subtitle,
          typeof body.rank === "number" ? body.rank : null,
          typeof body.is_active === "boolean" ? body.is_active : null,
          typeof body.is_published === "boolean" ? body.is_published : null,
          body.config ? JSON.stringify(body.config) : null,
          body.id,
        ]
      )
    }

    const updated = await queryDb("SELECT * FROM homepage_sections ORDER BY rank ASC;")
    return res.status(200).json({
      message: "Ana sayfa bölümleri başarıyla güncellendi.",
      sections: updated,
    })
  } catch (error: any) {
    return res.status(500).json({ message: "Bölümler güncellenemedi.", error: error.message })
  }
}
