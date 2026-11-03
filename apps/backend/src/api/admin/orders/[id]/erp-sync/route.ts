import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Client } from "pg"
import { nizamlarErpClient } from "../../../../../lib/erp-client"

function getPgClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"
  return new Client({ connectionString })
}

/**
 * GET /admin/orders/:id/erp-sync
 * Siparişin ERP aktarım durumunu, iş emri detaylarını ve tasarım kayıtlarını listeler
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: orderId } = req.params

    const pg = getPgClient()
    await pg.connect()

    const syncLogs = await pg.query(
      "SELECT * FROM erp_sync_log WHERE order_id = $1 ORDER BY created_at DESC",
      [orderId]
    )

    const designs = await pg.query(
      `SELECT id, product_id, color_name, size, view, position_name, physical_dimensions, quantity, pricing_estimate, preview_file_path, original_file_name
       FROM custom_design
       WHERE cart_id IN (SELECT cart_id FROM "order" WHERE id = $1)
          OR id IN (
            SELECT (items.metadata->>'design_id')
            FROM order_item items
            WHERE items.order_id = $1 AND items.metadata->>'design_id' IS NOT NULL
          )`,
      [orderId]
    )

    await pg.end()

    return res.status(200).json({
      orderId,
      syncLogs: syncLogs.rows,
      designs: designs.rows,
    })
  } catch (error: any) {
    return res.status(500).json({ message: "ERP senkronizasyon bilgisi okunamadı.", error: error.message })
  }
}

/**
 * POST /admin/orders/:id/erp-sync
 * Başarısız veya bekleyen bir siparişi manuel olarak Nizamlar ERP'ye yeniden aktarır
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: orderId } = req.params

    const result = await nizamlarErpClient.syncOrderToErp(orderId, { force: true })

    return res.status(200).json({
      message: "ERP aktarım işlemi tamamlandı.",
      result,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: "ERP aktarımı başarısız oldu.",
      error: error.message,
    })
  }
}
