import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../../lib/db"
import { notifyStorefrontSync } from "../../../../../lib/storefront-sync"

/**
 * GET /admin/site-management/garments/:id
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const rows = await queryDb("SELECT * FROM garment_display_config WHERE id = $1 LIMIT 1;", [id])
    if (rows.length === 0) {
      return res.status(404).json({ message: "Askılık ürünü bulunamadı." })
    }
    return res.status(200).json({ garment: rows[0] })
  } catch (error: any) {
    return res.status(500).json({ message: "Askılık ürünü okunamadı.", error: error.message })
  }
}

/**
 * PUT /admin/site-management/garments/:id
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    const {
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
      rank,
      isActive,
      isPublished,
    } = body

    if (productId) {
      const productCheck = await queryDb(
        "SELECT id, handle, title FROM product WHERE id = $1 AND deleted_at IS NULL LIMIT 1;",
        [productId]
      )
      if (productCheck.length === 0) {
        return res.status(400).json({ message: "Seçilen ürün katalogda bulunamadı veya silinmiş." })
      }
    }

    const updateQuery = `
      UPDATE garment_display_config
      SET
        product_id = COALESCE($1, product_id),
        product_handle = COALESCE($2, product_handle),
        name = COALESCE($3, name),
        garment_kind = COALESCE($4, garment_kind),
        colour = COALESCE($5, colour),
        show_nizamlar_logo = COALESCE($6, show_nizamlar_logo),
        logo_scale = COALESCE($7, logo_scale),
        logo_pos_x = COALESCE($8, logo_pos_x),
        logo_pos_y = COALESCE($9, logo_pos_y),
        logo_style = COALESCE($10, logo_style),
        model_3d_file = COALESCE($11, model_3d_file),
        rank = COALESCE($12, rank),
        is_active = COALESCE($13, is_active),
        is_published = COALESCE($14, is_published),
        updated_at = NOW()
      WHERE id = $15
      RETURNING *;
    `

    const values = [
      productId,
      productHandle,
      name,
      garmentKind,
      colour,
      typeof showNizamlarLogo === "boolean" ? showNizamlarLogo : null,
      typeof logoScale === "number" ? logoScale : null,
      typeof logoPosX === "number" ? logoPosX : null,
      typeof logoPosY === "number" ? logoPosY : null,
      logoStyle,
      model3dFile,
      typeof rank === "number" ? rank : null,
      typeof isActive === "boolean" ? isActive : null,
      typeof isPublished === "boolean" ? isPublished : null,
      id,
    ]

    const updated = await queryDb(updateQuery, values)
    if (updated.length === 0) {
      return res.status(404).json({ message: "Güncellenecek askılık ürünü bulunamadı." })
    }

    // Storefront cache revalidation
    await notifyStorefrontSync({ tags: ["site-content"] })

    return res.status(200).json({
      message: "Askılık ürünü başarıyla güncellendi.",
      garment: updated[0],
    })
  } catch (error: any) {
    return res.status(500).json({ message: "Askılık ürünü güncellenemedi.", error: error.message })
  }
}

/**
 * DELETE /admin/site-management/garments/:id
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const deleted = await queryDb(
      "DELETE FROM garment_display_config WHERE id = $1 RETURNING *;",
      [id]
    )
    if (deleted.length === 0) {
      return res.status(404).json({ message: "Silinecek askılık ürünü bulunamadı." })
    }

    // Storefront cache revalidation
    await notifyStorefrontSync({ tags: ["site-content"] })

    return res.status(200).json({ message: "Askılık ürünü başarıyla silindi.", id })
  } catch (error: any) {
    return res.status(500).json({ message: "Askılık ürünü silinemedi.", error: error.message })
  }
}
