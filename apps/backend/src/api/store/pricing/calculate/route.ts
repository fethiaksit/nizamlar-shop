import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { customPrintPricingEngine } from "../../../../lib/pricing-engine"
import { Client } from "pg"

function getPgClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"
  return new Client({ connectionString })
}

/**
 * POST /store/pricing/calculate
 * Müşterinin sepeti ve canlı editör için sunucu onaylı anlık fiyat hesaplama
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const body = req.body as any
    if (!body) {
      return res.status(400).json({ message: "İstek gövdesi boş olamaz." })
    }

    const {
      basePrice = 450,
      currencyCode = "TRY",
      technique = "dtf",
      sizeCode = "a4",
      surfaceCount = 1,
      quantity = 1,
      dimensions,
    } = body

    const pricingBreakdown = await customPrintPricingEngine.calculatePriceAsync({
      basePrice: Number(basePrice),
      currencyCode: String(currencyCode),
      technique: technique as any,
      sizeCode: sizeCode as any,
      surfaceCount: Number(surfaceCount),
      quantity: Math.max(1, Number(quantity)),
      dimensions,
    })

    return res.status(200).json({
      pricing: pricingBreakdown,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: "Fiyat hesaplama hatası",
      error: error.message,
    })
  }
}
