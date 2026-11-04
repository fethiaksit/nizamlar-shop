import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../lib/db"

export const AUTHENTICATE = false

/**
 * GET /store/site-content
 * Storefront için yayınlanmış dinamik vitrin, slider, askılık ve customizer ayarlarını döner.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const isPreview = req.query.preview === "1" || req.query.preview === "true"

    // 1. Site Settings
    const settingsRows = await queryDb(
      "SELECT * FROM site_settings WHERE id = 'default' LIMIT 1;"
    )
    const settings = settingsRows[0] || null

    // 2. Hero Slides
    const slidesQuery = isPreview
      ? "SELECT * FROM hero_slides WHERE is_active = true ORDER BY rank ASC, created_at ASC;"
      : "SELECT * FROM hero_slides WHERE is_active = true AND is_published = true ORDER BY rank ASC, created_at ASC;"
    const slides = await queryDb(slidesQuery)

    // 3. Homepage Sections
    const sectionsQuery = isPreview
      ? "SELECT * FROM homepage_sections WHERE is_active = true ORDER BY rank ASC;"
      : "SELECT * FROM homepage_sections WHERE is_active = true AND is_published = true ORDER BY rank ASC;"
    const sections = await queryDb(sectionsQuery)

    // 4. Dimaac Clothes Rack Garments
    const rackQuery = isPreview
      ? "SELECT * FROM garment_display_config WHERE is_active = true ORDER BY rank ASC;"
      : "SELECT * FROM garment_display_config WHERE is_active = true AND is_published = true ORDER BY rank ASC;"
    const rackItems = await queryDb(rackQuery)

    // 5. 3D Customizer Settings
    const customizerRows = await queryDb(
      "SELECT * FROM customizer_settings WHERE id = 'default' LIMIT 1;"
    )
    const customizer = customizerRows[0] || null

    return res.status(200).json({
      success: true,
      isPreview,
      settings,
      slides,
      sections,
      rackItems,
      customizer,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Site içeriği yüklenirken hata oluştu.",
      error: error.message,
    })
  }
}
