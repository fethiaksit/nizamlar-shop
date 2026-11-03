import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import fs from "fs"
import { Client } from "pg"

function getPgClient() {
  const connectionString = process.env.DATABASE_URL || "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"
  return new Client({ connectionString })
}

/**
 * GET /store/custom-designs/:id/preview
 * Müşterinin tasarım önizleme görselini güvenli akışla sunar
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params

    const pg = getPgClient()
    await pg.connect()
    const dbRes = await pg.query("SELECT preview_file_path FROM custom_design WHERE id = $1", [id])
    await pg.end()

    if (dbRes.rows.length === 0 || !dbRes.rows[0].preview_file_path) {
      return res.status(404).json({ message: "Önizleme görseli bulunamadı." })
    }

    const filePath = dbRes.rows[0].preview_file_path
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Dosya fiziksel olarak mevcut değil." })
    }

    res.setHeader("Content-Type", "image/png")
    res.setHeader("Cache-Control", "public, max-age=86400")
    const stream = fs.createReadStream(filePath)
    return stream.pipe(res as any)
  } catch (error: any) {
    return res.status(500).json({ message: "Önizleme okuma hatası", error: error.message })
  }
}
