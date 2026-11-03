import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Client } from "pg"
import fs from "fs"

function getPgClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"
  return new Client({ connectionString })
}

/**
 * GET /admin/custom-designs/:id/original
 * Yalnızca yetkili admin kullanıcısının müşterinin yüklediği orijinal baskı dosyasını indirmesini sağlar
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params

    const pg = getPgClient()
    await pg.connect()
    const dbRes = await pg.query("SELECT * FROM custom_design WHERE id = $1", [id])
    await pg.end()

    if (dbRes.rows.length === 0) {
      return res.status(404).json({ message: "Tasarım bulunamadı." })
    }

    const design = dbRes.rows[0]
    const filePath = design.original_file_path

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Orijinal dosya diskte bulunamadı." })
    }

    res.setHeader("Content-Type", design.file_type || "application/octet-stream")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(design.original_file_name || 'tasarim')}"`
    )

    const stream = fs.createReadStream(filePath)
    return stream.pipe(res as any)
  } catch (error: any) {
    return res.status(500).json({ message: "Dosya erişim hatası", error: error.message })
  }
}
