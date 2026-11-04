import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../lib/db"

/**
 * POST /admin/site-management/publish
 * Yapılan taslak düzenlemeleri canlı yayına alır (Önizlemeden Canlıya Aktarma)
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const publishedAt = new Date().toISOString()

    // 1. Hero slides
    await queryDb("UPDATE hero_slides SET is_published = true, updated_at = NOW() WHERE is_active = true;")

    // 2. Homepage sections
    await queryDb("UPDATE homepage_sections SET is_published = true, updated_at = NOW() WHERE is_active = true;")

    // 3. Garments
    await queryDb("UPDATE garment_display_config SET is_published = true, updated_at = NOW() WHERE is_active = true;")

    // 4. Customizer settings
    await queryDb("UPDATE customizer_settings SET is_published = true, updated_at = NOW() WHERE id = 'default';")

    // 5. Site settings
    await queryDb("UPDATE site_settings SET is_published = true, updated_at = NOW() WHERE id = 'default';")

    return res.status(200).json({
      success: true,
      message: "Tüm site ayarları, slider ve vitrin güncellemeleri başarıyla canlıya yayınlandı!",
      publishedAt,
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Yayınlama işlemi sırasında hata oluştu.",
      error: error.message,
    })
  }
}
