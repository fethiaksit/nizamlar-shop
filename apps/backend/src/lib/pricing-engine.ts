import { Client } from "pg"

export type PrintTechnique = "dtf" | "serigrafi" | "nakkas"
export type PrintSizeCode = "pocket" | "a5" | "a4" | "a3" | "a3_plus"

export interface PhysicalPrintDimensions {
  widthMm: number
  heightMm: number
  areaCm2: number
  scale: number
  rotation: number
  x: number
  y: number
}

export interface PricingInput {
  basePrice: number // Baz ürün fiyatı (örneğin 450 TL)
  currencyCode: string // "TRY"
  technique: PrintTechnique
  sizeCode: PrintSizeCode
  surfaceCount: number // 1 (yalnızca ön veya sırt) veya 2 (ön + sırt)
  quantity: number
  dimensions?: PhysicalPrintDimensions
}

export interface PricingBreakdown {
  baseProductUnitPrice: number
  printCostUnitPrice: number
  subtotalUnitPrice: number
  vatUnitPrice: number
  finalUnitPriceWithVat: number
  totalAmountWithoutVat: number
  totalVatAmount: number
  totalAmountWithVat: number
  quantityDiscountPercent: number
  vatRatePercent: number
  currencyCode: string
  isPriceVerified: boolean
  verificationNote: string
}

export interface ConfigRow {
  technique_dtf_cost: string | number
  technique_serigrafi_cost: string | number
  technique_nakkas_cost: string | number
  size_pocket_mult: string | number
  size_a5_mult: string | number
  size_a4_mult: string | number
  size_a3_mult: string | number
  size_a3_plus_mult: string | number
  vat_rate: string | number
  discount_tiers: Array<{ min_qty: number; discount: number }>
}

function getPgClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"
  return new Client({ connectionString })
}

export class CustomPrintPricingEngine {
  private configCache: ConfigRow | null = null
  private cacheExpiry: number = 0
  private configVerified: boolean = false

  public async getActiveConfig(): Promise<{ config: ConfigRow; verified: boolean }> {
    if (this.configCache && Date.now() < this.cacheExpiry) {
      return { config: this.configCache, verified: this.configVerified }
    }

    try {
      const pg = getPgClient()
      await pg.connect()
      const res = await pg.query(
        "SELECT * FROM custom_print_config WHERE is_active = true ORDER BY updated_at DESC LIMIT 1;"
      )
      await pg.end()

      if (res.rows.length > 0) {
        this.configCache = res.rows[0]
        this.configVerified = true
        this.cacheExpiry = Date.now() + 60 * 1000 // 60 saniye cache
        return { config: this.configCache!, verified: true }
      }
    } catch (e) {
      console.warn("[PricingEngine] DB config fetch failed, using fallback:", e)
    }

    // Fallback varsayılanları
    return {
      verified: false,
      config: {
        technique_dtf_cost: 85,
        technique_serigrafi_cost: 60,
        technique_nakkas_cost: 110,
        size_pocket_mult: 0.6,
        size_a5_mult: 0.8,
        size_a4_mult: 1.0,
        size_a3_mult: 1.4,
        size_a3_plus_mult: 1.8,
        vat_rate: 20.0,
        discount_tiers: [
          { min_qty: 5, discount: 5 },
          { min_qty: 10, discount: 10 },
          { min_qty: 20, discount: 15 },
          { min_qty: 50, discount: 20 },
          { min_qty: 100, discount: 25 },
          { min_qty: 250, discount: 30 },
        ],
      },
    }
  }

  public async calculatePriceAsync(input: PricingInput): Promise<PricingBreakdown> {
    const { config, verified } = await this.getActiveConfig()

    const techniqueCosts: Record<PrintTechnique, number> = {
      dtf: Number(config.technique_dtf_cost),
      serigrafi: Number(config.technique_serigrafi_cost),
      nakkas: Number(config.technique_nakkas_cost),
    }

    const sizeMults: Record<PrintSizeCode, number> = {
      pocket: Number(config.size_pocket_mult),
      a5: Number(config.size_a5_mult),
      a4: Number(config.size_a4_mult),
      a3: Number(config.size_a3_mult),
      a3_plus: Number(config.size_a3_plus_mult),
    }

    const techCost = techniqueCosts[input.technique] || techniqueCosts.dtf
    const sizeMultiplier = sizeMults[input.sizeCode] || 1.0
    const surfaceMultiplier =
      input.surfaceCount === 0 ? 0 : Math.max(1, input.surfaceCount || 1)
    const quantity = Math.max(1, input.quantity || 1)

    // Ham baskı maliyeti (adet başına)
    const rawPrintCost = techCost * sizeMultiplier * surfaceMultiplier

    // Kademeli iskonto
    let discountPercent = 0
    const tiers = Array.isArray(config.discount_tiers)
      ? config.discount_tiers.sort((a, b) => b.min_qty - a.min_qty)
      : []

    for (const tier of tiers) {
      if (quantity >= tier.min_qty) {
        discountPercent = tier.discount
        break
      }
    }

    const printCostUnitPrice = Math.round(rawPrintCost * (1 - discountPercent / 100))
    const baseProductUnitPrice = Math.round(input.basePrice)
    const subtotalUnitPrice = baseProductUnitPrice + printCostUnitPrice

    const vatRate = Number(config.vat_rate) || 20.0
    const vatUnitPrice = Math.round((subtotalUnitPrice * vatRate) / 100)
    const finalUnitPriceWithVat = subtotalUnitPrice + vatUnitPrice

    const totalAmountWithoutVat = subtotalUnitPrice * quantity
    const totalVatAmount = vatUnitPrice * quantity
    const totalAmountWithVat = finalUnitPriceWithVat * quantity

    return {
      baseProductUnitPrice,
      printCostUnitPrice,
      subtotalUnitPrice,
      vatUnitPrice,
      finalUnitPriceWithVat,
      totalAmountWithoutVat,
      totalVatAmount,
      totalAmountWithVat,
      quantityDiscountPercent: discountPercent,
      vatRatePercent: vatRate,
      currencyCode: (input.currencyCode || "TRY").toUpperCase(),
      isPriceVerified: verified && baseProductUnitPrice > 0,
      verificationNote: verified
        ? `Nizamlar Fiyat Motoru v2 (Doğrulandı): Teknoloji=${input.technique}, Boyut=${input.sizeCode}, Yüzey=${surfaceMultiplier}, İskonto=%${discountPercent}, KDV=%${vatRate}`
        : `Tahmini fiyat; veritabanı konfigürasyonu doğrulanamadı.`,
    }
  }

  // Senkron geriye dönük uyumluluk
  public calculatePrice(input: PricingInput): PricingBreakdown {
    const techCost = input.technique === "serigrafi" ? 60 : input.technique === "nakkas" ? 110 : 85
    const sizeMult = input.sizeCode === "pocket" ? 0.6 : input.sizeCode === "a3" ? 1.4 : input.sizeCode === "a3_plus" ? 1.8 : 1.0
    const surfaceMult = Math.max(1, input.surfaceCount || 1)
    const raw = techCost * sizeMult * surfaceMult
    const qty = Math.max(1, input.quantity || 1)
    let disc = 0
    if (qty >= 250) disc = 30
    else if (qty >= 100) disc = 25
    else if (qty >= 50) disc = 20
    else if (qty >= 20) disc = 15
    else if (qty >= 10) disc = 10
    else if (qty >= 5) disc = 5

    const printCostUnitPrice = Math.round(raw * (1 - disc / 100))
    const baseProductUnitPrice = Math.round(input.basePrice)
    const subtotalUnitPrice = baseProductUnitPrice + printCostUnitPrice
    const vatUnitPrice = Math.round(subtotalUnitPrice * 0.20)
    const finalUnitPriceWithVat = subtotalUnitPrice + vatUnitPrice

    return {
      baseProductUnitPrice,
      printCostUnitPrice,
      subtotalUnitPrice,
      vatUnitPrice,
      finalUnitPriceWithVat,
      totalAmountWithoutVat: subtotalUnitPrice * qty,
      totalVatAmount: vatUnitPrice * qty,
      totalAmountWithVat: finalUnitPriceWithVat * qty,
      quantityDiscountPercent: disc,
      vatRatePercent: 20,
      currencyCode: (input.currencyCode || "TRY").toUpperCase(),
      isPriceVerified: false,
      verificationNote: "Tahmini fiyat: senkron fallback ödeme için doğrulanmış değildir.",
    }
  }

  public validatePrintDimensions(
    dimensions?: PhysicalPrintDimensions,
    maxAllowedAreaCm2: number = 2000
  ): boolean {
    if (!dimensions) return false
    const { widthMm, heightMm, areaCm2 } = dimensions
    if (![widthMm, heightMm, areaCm2].every(Number.isFinite)) return false
    if (widthMm <= 0 || heightMm <= 0) return false
    const actualArea = widthMm * heightMm / 100
    if (actualArea > maxAllowedAreaCm2 || Math.abs(actualArea - areaCm2) > 1) return false
    return true
  }
}

export const customPrintPricingEngine = new CustomPrintPricingEngine()
