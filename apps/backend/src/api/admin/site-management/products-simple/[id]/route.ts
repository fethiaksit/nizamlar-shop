import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { pgPool } from "../../../../../lib/db"
import { notifyStorefrontSync } from "../../../../../lib/storefront-sync"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const prodRes = await pgPool.query(
      `SELECT id, title, description, thumbnail, handle, status, created_at, updated_at FROM product WHERE id = $1 AND deleted_at IS NULL;`,
      [id]
    )
    if (prodRes.rowCount === 0) {
      return res.status(404).json({ error: "Ürün bulunamadı" })
    }
    const product = prodRes.rows[0]

    const varsRes = await pgPool.query(
      `
      SELECT 
        pv.id as variant_id,
        pv.title as variant_title,
        pv.sku,
        pr.amount as price_amount,
        COALESCE(il.stocked_quantity::numeric, 0) as stock_quantity
      FROM product_variant pv
      LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
      LEFT JOIN price pr ON pvps.price_set_id = pr.price_set_id AND pr.currency_code = 'try'
      LEFT JOIN product_variant_inventory_item pvii ON pv.id = pvii.variant_id
      LEFT JOIN inventory_level il ON pvii.inventory_item_id = il.inventory_item_id
      WHERE pv.product_id = $1 AND pv.deleted_at IS NULL;
      `,
      [id]
    )

    const variants = varsRes.rows.map((v) => ({
      id: v.variant_id,
      title: v.variant_title,
      sku: v.sku,
      priceTRY: v.price_amount ? Number(v.price_amount) : null,
      stock: Number(v.stock_quantity || 0),
    }))

    const tryPrices = variants
      .map((v) => v.priceTRY)
      .filter((p): p is number => p !== null && !isNaN(p))
    const priceTRY = tryPrices.length ? tryPrices[0] : 0
    const totalStock = variants.reduce((sum, v) => sum + v.stock, 0)

    return res.json({
      product: {
        ...product,
        priceTRY,
        totalStock,
        stockQuantity: totalStock,
        variants,
      },
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Ürün yüklenirken hata oluştu" })
  }
}

export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const { title, description, thumbnail, status, priceTRY, stockQuantity } = req.body as any

    if (!title) {
      return res.status(400).json({ error: "Ürün adı boş bırakılamaz." })
    }

    // Ürün temel bilgilerini güncelle
    await pgPool.query(
      `
      UPDATE product
      SET title = $1,
          description = $2,
          thumbnail = $3,
          status = $4,
          updated_at = NOW()
      WHERE id = $5 AND deleted_at IS NULL;
      `,
      [title, description || "", thumbnail || "", status || "published", id]
    )

    // Fiyatı güncelle
    if (typeof priceTRY === "number" && priceTRY >= 0) {
      await pgPool.query(
        `
        UPDATE price pr
        SET amount = $1::numeric,
            raw_amount = jsonb_build_object('value', $1::text, 'precision', 20),
            updated_at = NOW()
        FROM product_variant_price_set pvps
        JOIN product_variant pv ON pvps.variant_id = pv.id
        WHERE pr.price_set_id = pvps.price_set_id
          AND pv.product_id = $2
          AND pr.currency_code = 'try';
        `,
        [String(priceTRY), id]
      )
    }

    // Stok adedini güncelle
    if (typeof stockQuantity === "number" && stockQuantity >= 0) {
      await pgPool.query(
        `
        UPDATE inventory_level il
        SET stocked_quantity = $1::numeric,
            raw_stocked_quantity = jsonb_build_object('value', $1::text, 'precision', 20),
            updated_at = NOW()
        FROM product_variant_inventory_item pvii
        JOIN product_variant pv ON pvii.variant_id = pv.id
        WHERE il.inventory_item_id = pvii.inventory_item_id
          AND pv.product_id = $2;
        `,
        [String(stockQuantity), id]
      )
    }

    // Storefront senkronizasyonu
    const pHandleRes = await pgPool.query(`SELECT handle FROM product WHERE id = $1`, [id])
    const prodHandle = pHandleRes.rows[0]?.handle
    await notifyStorefrontSync({ productId: id, handle: prodHandle })

    return res.json({
      success: true,
      message: "Ürün bilgileri başarıyla güncellendi.",
      product: { id, title, description, thumbnail, status, priceTRY, stockQuantity },
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Ürün güncellenirken hata oluştu" })
  }
}

export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    const pHandleRes = await pgPool.query(`SELECT handle FROM product WHERE id = $1`, [id])
    const prodHandle = pHandleRes.rows[0]?.handle

    await pgPool.query(
      `UPDATE product SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1;`,
      [id]
    )

    // Storefront senkronizasyonu
    await notifyStorefrontSync({ productId: id, handle: prodHandle })

    return res.json({ success: true, message: "Ürün başarıyla silindi (arşive alındı)." })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Ürün silinirken hata oluştu" })
  }
}
