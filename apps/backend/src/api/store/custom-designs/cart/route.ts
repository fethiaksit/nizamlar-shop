import { MedusaStoreRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { Client } from "pg"
import { customPrintPricingEngine } from "../../../../lib/pricing-engine"

function getPgClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"
  return new Client({ connectionString })
}

export async function POST(req: MedusaStoreRequest, res: MedusaResponse) {
  const pg = getPgClient()
  try {
    const body = (req.body || {}) as {
      cartId?: string
      designIds?: string[]
      quantity?: number
      technique?: string
    }
    const cartId = String(body.cartId || "").trim()
    const designIds = Array.isArray(body.designIds)
      ? body.designIds.map((id) => String(id).trim()).filter(Boolean)
      : []

    if (!cartId || designIds.length === 0 || designIds.length > 2) {
      return res.status(400).json({
        message: "Geçerli bir cartId ve en az 1 tasarım kimliği gereklidir.",
      })
    }

    await pg.connect()
    const designRes = await pg.query(
      `SELECT * FROM custom_design WHERE id = ANY($1::text[]) ORDER BY created_at ASC`,
      [designIds],
    )
    const rows = designRes.rows
    if (rows.length !== designIds.length) {
      await pg.end()
      return res.status(404).json({
        message: "Kaydedilmiş tasarım kayıtlarından biri bulunamadı.",
      })
    }

    const first = rows[0]
    const productId = first.product_id as string
    const variantId = first.variant_id as string
    if (
      !productId ||
      !variantId ||
      rows.some((r) => r.product_id !== productId || r.variant_id !== variantId)
    ) {
      await pg.end()
      return res.status(400).json({
        message: "Tasarımlar aynı ürün ve varyanta ait olmalıdır.",
      })
    }

    const safeQty = Math.min(
      999,
      Math.max(1, Math.floor(Number(body.quantity || first.quantity || 1))),
    )

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "status", "variants.id", "sales_channels.id"],
      filters: { id: productId },
    })
    const product = products[0]
    const channels = req.publishable_key_context?.sales_channel_ids || []
    if (
      !product ||
      product.status !== "published" ||
      !product.variants?.some((v) => v.id === variantId) ||
      !product.sales_channels?.some((c) => c && channels.includes(c.id))
    ) {
      await pg.end()
      return res.status(400).json({
        message: "Ürün ve varyant bu mağazada kullanılamıyor.",
      })
    }

    const priceRes = await pg.query(
      `SELECT p.amount, p.currency_code
       FROM product_variant_price_set pvps
       JOIN price p ON p.price_set_id = pvps.price_set_id
       WHERE pvps.variant_id = $1 AND pvps.deleted_at IS NULL AND p.deleted_at IS NULL
       ORDER BY CASE WHEN LOWER(p.currency_code) = 'try' THEN 0 ELSE 1 END
       LIMIT 1`,
      [variantId],
    )
    const dbBasePrice = Number(priceRes.rows[0]?.amount || 0)
    if (dbBasePrice <= 0) {
      await pg.end()
      return res.status(400).json({
        message: "Varyant temel fiyatı doğrulanamadı.",
      })
    }

    const savedEstimate = first.pricing_estimate || {}
    const techniqueRaw = String(
      body.technique || savedEstimate?.breakdown?.technique || "dtf",
    ).toLowerCase()
    const technique = techniqueRaw.includes("serigraf") ? "serigrafi" : "dtf"
    const maxWidthMm = Math.max(
      ...rows.map((r) => Number(r.physical_dimensions?.widthMm || 180)),
    )
    const sizeCode = maxWidthMm > 210 ? "a3" : "a4"

    const pricingEstimate = await customPrintPricingEngine.calculatePriceAsync({
      basePrice: dbBasePrice,
      currencyCode: String(priceRes.rows[0]?.currency_code || "TRY").toUpperCase(),
      technique: technique as any,
      sizeCode: sizeCode as any,
      surfaceCount: rows.length >= 2 ? 2 : 1,
      quantity: safeQty,
      dimensions: first.physical_dimensions,
    })

    if (!pricingEstimate.isPriceVerified) {
      await pg.end()
      return res.status(400).json({
        message: "Baskı fiyatlandırması doğrulanamadı.",
      })
    }

    const surfaces = rows
      .map((r) => (r.view === "back" ? "Arka" : "Ön"))
      .join(" + ")

    await addToCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        items: [
          {
            variant_id: variantId,
            quantity: safeQty,
            unit_price: pricingEstimate.subtotalUnitPrice,
            metadata: {
              design_id: first.id,
              design_ids: rows.map((r) => r.id).join(","),
              print_mode: "custom",
              technique,
              surfaces,
              color_name: first.color_name,
              size: first.size,
              preview_url: `/store/custom-designs/${first.id}/preview`,
              base_price_unit: pricingEstimate.baseProductUnitPrice,
              print_cost_unit: pricingEstimate.printCostUnitPrice,
            },
          },
        ],
      },
    })

    await pg.query(
      `UPDATE custom_design
       SET cart_id = $1, status = 'in_cart', quantity = $2, pricing_estimate = $3, updated_at = NOW()
       WHERE id = ANY($4::text[])`,
      [cartId, safeQty, JSON.stringify(pricingEstimate), designIds],
    )
    await pg.end()

    return res.status(200).json({
      success: true,
      cartId,
      designIds,
      pricingEstimate,
    })
  } catch (error: any) {
    try {
      await pg.end()
    } catch {
      // ignore
    }
    console.error("[CustomDesign Cart POST Error]:", error)
    return res.status(500).json({
      message:
        error?.message || "Baskılı ürün sepete eklenirken sunucu hatası oluştu.",
    })
  }
}
