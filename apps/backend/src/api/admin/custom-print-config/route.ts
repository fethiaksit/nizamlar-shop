import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Client } from "pg"

function getPgClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"
  return new Client({ connectionString })
}

/**
 * GET /admin/custom-print-config
 * Aktif baskı fiyatlama ve indirim konfigürasyonunu döner
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const pg = getPgClient()
    await pg.connect()
    const result = await pg.query(
      "SELECT * FROM custom_print_config WHERE is_active = true ORDER BY updated_at DESC LIMIT 1;"
    )
    await pg.end()

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Konfigürasyon bulunamadı." })
    }

    return res.status(200).json({ config: result.rows[0] })
  } catch (error: any) {
    return res.status(500).json({ message: "Konfigürasyon okunamadı.", error: error.message })
  }
}

/**
 * POST /admin/custom-print-config
 * Yönetim panelinden baskı maliyetleri ve indirim baremlerini günceller
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    const {
      techniqueDtfCost,
      techniqueSerigrafiCost,
      techniqueNakkasCost,
      sizePocketMult,
      sizeA5Mult,
      sizeA4Mult,
      sizeA3Mult,
      sizeA3PlusMult,
      vatRate,
      discountTiers,
    } = body

    const pg = getPgClient()
    await pg.connect()

    const updateQuery = `
      UPDATE custom_print_config
      SET
        technique_dtf_cost = COALESCE($1, technique_dtf_cost),
        technique_serigrafi_cost = COALESCE($2, technique_serigrafi_cost),
        technique_nakkas_cost = COALESCE($3, technique_nakkas_cost),
        size_pocket_mult = COALESCE($4, size_pocket_mult),
        size_a5_mult = COALESCE($5, size_a5_mult),
        size_a4_mult = COALESCE($6, size_a4_mult),
        size_a3_mult = COALESCE($7, size_a3_mult),
        size_a3_plus_mult = COALESCE($8, size_a3_plus_mult),
        vat_rate = COALESCE($9, vat_rate),
        discount_tiers = COALESCE($10, discount_tiers),
        updated_at = NOW()
      WHERE id = 'default_config'
      RETURNING *;
    `

    const values = [
      techniqueDtfCost,
      techniqueSerigrafiCost,
      techniqueNakkasCost,
      sizePocketMult,
      sizeA5Mult,
      sizeA4Mult,
      sizeA3Mult,
      sizeA3PlusMult,
      vatRate,
      discountTiers ? JSON.stringify(discountTiers) : null,
    ]

    const result = await pg.query(updateQuery, values)
    await pg.end()

    return res.status(200).json({
      message: "Baskı fiyatlandırma konfigürasyonu güncellendi.",
      config: result.rows[0],
    })
  } catch (error: any) {
    return res.status(500).json({ message: "Konfigürasyon güncellenemedi.", error: error.message })
  }
}
