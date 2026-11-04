import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { pgPool } from "../../../../lib/db"
import { notifyStorefrontSync } from "../../../../lib/storefront-sync"

export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  try {
    const productsQuery = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.thumbnail,
        p.handle,
        p.status,
        p.created_at,
        p.updated_at
      FROM product p
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC;
    `
    const productsRes = await pgPool.query(productsQuery)
    const products = productsRes.rows

    // Get variants, prices and inventory for each product
    const variantsQuery = `
      SELECT 
        pv.id as variant_id,
        pv.product_id,
        pv.title as variant_title,
        pv.sku,
        pv.manage_inventory,
        pr.id as price_id,
        pr.currency_code,
        pr.amount as price_amount,
        COALESCE(il.stocked_quantity::numeric, 0) as stock_quantity
      FROM product_variant pv
      LEFT JOIN product_variant_price_set pvps ON pv.id = pvps.variant_id
      LEFT JOIN price pr ON pvps.price_set_id = pr.price_set_id AND pr.currency_code = 'try'
      LEFT JOIN product_variant_inventory_item pvii ON pv.id = pvii.variant_id
      LEFT JOIN inventory_level il ON pvii.inventory_item_id = il.inventory_item_id
      WHERE pv.deleted_at IS NULL
      ORDER BY pv.created_at ASC;
    `
    const variantsRes = await pgPool.query(variantsQuery)
    const allVariants = variantsRes.rows

    const variantMap = new Map<string, any[]>()
    for (const v of allVariants) {
      if (!variantMap.has(v.product_id)) {
        variantMap.set(v.product_id, [])
      }
      variantMap.get(v.product_id)!.push({
        id: v.variant_id,
        title: v.variant_title,
        sku: v.sku,
        priceTRY: v.price_amount ? Number(v.price_amount) : null,
        stock: Number(v.stock_quantity || 0),
        manageInventory: v.manage_inventory,
      })
    }

    const result = products.map((prod) => {
      const vars = variantMap.get(prod.id) || []
      const tryPrices = vars
        .map((v) => v.priceTRY)
        .filter((p): p is number => p !== null && !isNaN(p))
      
      const minPrice = tryPrices.length ? Math.min(...tryPrices) : 0
      const maxPrice = tryPrices.length ? Math.max(...tryPrices) : 0
      const totalStock = vars.reduce((sum, v) => sum + (v.stock || 0), 0)

      return {
        id: prod.id,
        title: prod.title,
        description: prod.description || "",
        thumbnail: prod.thumbnail || "",
        handle: prod.handle,
        status: prod.status, // "published" | "draft"
        priceTRY: minPrice,
        priceMinTRY: minPrice,
        priceMaxTRY: maxPrice,
        hasVariablePrice: minPrice !== maxPrice,
        totalStock,
        variantsCount: vars.length,
        variants: vars,
        updatedAt: prod.updated_at,
      }
    })

    return res.json({ products: result })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "Ürünler listelenirken hata oluştu" })
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const body = req.body as any

    // Hızlı Fiyat Güncelleme
    if (body.action === "update_price") {
      const { productId, newPrice, variantId } = body
      if (!productId || typeof newPrice !== "number" || newPrice < 0) {
        return res.status(400).json({ error: "Geçerli bir ürün ve fiyat girilmelidir." })
      }

      let updateQuery: string
      let params: any[]

      if (variantId) {
        // Tekil varyant fiyatını güncelle
        updateQuery = `
          UPDATE price pr
          SET amount = $1::numeric, 
              raw_amount = jsonb_build_object('value', $1::text, 'precision', 20),
              updated_at = NOW()
          FROM product_variant_price_set pvps
          WHERE pr.price_set_id = pvps.price_set_id
            AND pvps.variant_id = $2
            AND pr.currency_code = 'try';
        `
        params = [String(newPrice), variantId]
      } else {
        // Ürünün tüm varyantlarının TRY fiyatını güncelle
        updateQuery = `
          UPDATE price pr
          SET amount = $1::numeric, 
              raw_amount = jsonb_build_object('value', $1::text, 'precision', 20),
              updated_at = NOW()
          FROM product_variant_price_set pvps
          JOIN product_variant pv ON pvps.variant_id = pv.id
          WHERE pr.price_set_id = pvps.price_set_id
            AND pv.product_id = $2
            AND pr.currency_code = 'try';
        `
        params = [String(newPrice), productId]
      }

      const updateRes = await pgPool.query(updateQuery, params)

      // Eğer henüz TRY fiyat kaydı yoksa ekleyelim
      if (updateRes.rowCount === 0) {
        const psetsQuery = `
          SELECT pvps.price_set_id 
          FROM product_variant_price_set pvps
          JOIN product_variant pv ON pvps.variant_id = pv.id
          WHERE pv.product_id = $1 ${variantId ? "AND pv.id = $2" : ""};
        `
        const psetsRes = await pgPool.query(psetsQuery, variantId ? [productId, variantId] : [productId])
        for (const row of psetsRes.rows) {
          await pgPool.query(
            `
            INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at)
            VALUES ($1, $2, 'try', $3, jsonb_build_object('value', $3::text, 'precision', 20), 0, NOW(), NOW())
            ON CONFLICT DO NOTHING;
            `,
            [`price_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, row.price_set_id, newPrice]
          )
        }
      }

      await pgPool.query(`UPDATE product SET updated_at = NOW() WHERE id = $1;`, [productId])

      // Storefront önbelleğini anında geçersiz kıl (anında senkronizasyon)
      const pHandleRes = await pgPool.query(`SELECT handle FROM product WHERE id = $1`, [productId])
      const prodHandle = pHandleRes.rows[0]?.handle
      await notifyStorefrontSync({ productId, handle: prodHandle })

      return res.json({
        success: true,
        message: "Fiyat başarıyla güncellendi.",
        productId,
        newPrice,
      })
    }

    // Yeni Sade Ürün Ekleme
    const { title, description, thumbnail, priceTRY, stockQuantity, status } = body
    if (!title) {
      return res.status(400).json({ error: "Ürün adı zorunludur." })
    }

    const prodId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const handle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `urun-${Date.now()}`

    // Ürün ekle
    await pgPool.query(
      `
      INSERT INTO product (id, title, description, thumbnail, handle, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());
      `,
      [prodId, title, description || "", thumbnail || "", handle, status || "published"]
    )

    // Temel Standart Varyant ekle
    const varId = `variant_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    await pgPool.query(
      `
      INSERT INTO product_variant (id, product_id, title, sku, manage_inventory, created_at, updated_at)
      VALUES ($1, $2, 'Standart', $3, true, NOW(), NOW());
      `,
      [varId, prodId, `SKU-${Date.now().toString().slice(-6)}`]
    )

    // Fiyat seti & Fiyat ekle
    const priceSetId = `pset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    await pgPool.query(`INSERT INTO price_set (id, created_at, updated_at) VALUES ($1, NOW(), NOW());`, [priceSetId])
    await pgPool.query(
      `
      INSERT INTO product_variant_price_set (id, variant_id, price_set_id, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW());
      `,
      [`pvps_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, varId, priceSetId]
    )

    const finalPrice = typeof priceTRY === "number" ? priceTRY : 0
    await pgPool.query(
      `
      INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at)
      VALUES ($1, $2, 'try', $3, jsonb_build_object('value', $3::text, 'precision', 20), 0, NOW(), NOW());
      `,
      [`price_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, priceSetId, finalPrice]
    )

    // Stok ekle
    const initialStock = typeof stockQuantity === "number" ? stockQuantity : 100
    const iitemId = `iitem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    await pgPool.query(
      `
      INSERT INTO inventory_item (id, sku, title, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW());
      `,
      [iitemId, `SKU-${Date.now().toString().slice(-6)}`, title]
    )
    await pgPool.query(
      `
      INSERT INTO product_variant_inventory_item (id, variant_id, inventory_item_id, required_quantity, created_at, updated_at)
      VALUES ($1, $2, $3, 1, NOW(), NOW());
      `,
      [`pvii_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, varId, iitemId]
    )

    // Default location bul veya ekle
    const locRes = await pgPool.query(`SELECT id FROM stock_location LIMIT 1;`)
    const locId = locRes.rows[0]?.id || `sloc_${Date.now()}`
    await pgPool.query(
      `
      INSERT INTO inventory_level (id, inventory_item_id, location_id, stocked_quantity, raw_stocked_quantity, created_at, updated_at)
      VALUES ($1, $2, $3, $4, jsonb_build_object('value', $4::text, 'precision', 20), NOW(), NOW());
      `,
      [`ilev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`, iitemId, locId, initialStock]
    )

    // Storefront senkronizasyonu
    await notifyStorefrontSync({ productId: prodId, handle })

    return res.status(201).json({
      success: true,
      message: "Ürün başarıyla oluşturuldu.",
      product: { id: prodId, title, handle, priceTRY: finalPrice, totalStock: initialStock },
    })
  } catch (err: any) {
    return res.status(500).json({ error: err.message || "İşlem sırasında hata oluştu" })
  }
}
