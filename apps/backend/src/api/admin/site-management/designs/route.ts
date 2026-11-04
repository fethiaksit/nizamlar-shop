import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { queryDb } from "../../../../lib/db"

/**
 * GET /admin/site-management/designs
 * Müşterilerin 3D stüdyoda oluşturduğu tasarım kayıtlarını listeler
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const status = req.query.status as string
    const limit = parseInt((req.query.limit as string) || "50")
    const offset = parseInt((req.query.offset as string) || "0")

    let query = "SELECT * FROM custom_design"
    const params: any[] = []

    if (status && status !== "all") {
      params.push(status)
      query += ` WHERE status = $${params.length}`
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2};`
    params.push(limit, offset)

    const designs = await queryDb(query, params)

    const countRes = await queryDb("SELECT COUNT(*) FROM custom_design;")
    const totalCount = parseInt(countRes[0]?.count || "0")

    return res.status(200).json({
      designs,
      totalCount,
      limit,
      offset,
    })
  } catch (error: any) {
    return res.status(500).json({ message: "Tasarımlar okunamadı.", error: error.message })
  }
}
