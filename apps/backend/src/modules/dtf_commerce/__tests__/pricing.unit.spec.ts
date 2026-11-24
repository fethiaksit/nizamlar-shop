import {
  calculateDtfTransferQuote,
  calculateEffectiveDpi,
  DEFAULT_DTF_PRICING_RULE,
  DTF_GARMENT_DISCLAIMER,
  formatUsdCents,
  inspectArtworkBuffer,
  normalizePrintDimensions,
  signDtfQuote,
  verifyDtfQuoteSignature,
} from "../pricing"
import {
  assertPaidOrderBeforeProduction,
  assertValidProductionTransition,
  createSignedAssetDownloadToken,
  verifySignedAssetDownloadToken,
} from "../production-state"

describe("DTF USD transfer pricing and validation engine", () => {
  it("normalizes inches and centimeters accurately and enforces printable bounds", () => {
    const inchDims = normalizePrintDimensions(10, 12, "in")
    expect(inchDims).toMatchObject({
      widthIn: 10,
      heightIn: 12,
      widthCm: 25.4,
      heightCm: 30.48,
      areaSqIn: 120,
    })

    const cmDims = normalizePrintDimensions(25.4, 30.48, "cm")
    expect(cmDims.widthIn).toBe(10)
    expect(cmDims.heightIn).toBe(12)
    expect(cmDims.areaSqIn).toBe(120)

    expect(() => normalizePrintDimensions(0, 10, "in")).toThrow()
    expect(() => normalizePrintDimensions(-4, 10, "in")).toThrow()
    expect(() => normalizePrintDimensions(Number.NaN, 10, "in")).toThrow()
    expect(() => normalizePrintDimensions(25, 10, "in")).toThrow(/exceed/)
    expect(() => normalizePrintDimensions(10, 140, "in")).toThrow(/exceed/)
  })

  it("prices custom DTF transfers in integer USD cents with quantity tiers and minimum order check", () => {
    // 10" x 12" = 120 sq.in * 6 cents = 720 cents ($7.20)
    const singleQuote = calculateDtfTransferQuote({
      productType: "custom_dtf",
      unit: "in",
      width: 10,
      height: 12,
      quantity: 1,
    })
    expect(singleQuote.currencyCode).toBe("USD")
    expect(singleQuote.garmentIncluded).toBe(false)
    expect(singleQuote.disclaimer).toBe(DTF_GARMENT_DISCLAIMER)
    expect(singleQuote.baseUnitCents).toBe(720)
    expect(singleQuote.discountedUnitCents).toBe(720)
    expect(singleQuote.subtotalCents).toBe(720)
    expect(singleQuote.minimumOrderMet).toBe(false)
    expect(singleQuote.minimumOrderShortfallCents).toBe(780)
    expect(singleQuote.effectiveOrderTotalCents).toBe(1500)
    expect(singleQuote.unitPriceFormatted).toBe("$7.20")

    // Quantity 25 -> 15% discount: round(720 * 0.85) = 612 cents ($6.12) * 25 = 15300 cents ($153.00)
    const tierQuote = calculateDtfTransferQuote({
      productType: "custom_dtf",
      unit: "in",
      width: 10,
      height: 12,
      quantity: 25,
    })
    expect(tierQuote.discountPercent).toBe(15)
    expect(tierQuote.discountedUnitCents).toBe(612)
    expect(tierQuote.subtotalCents).toBe(15300)
    expect(tierQuote.minimumOrderMet).toBe(true)
    expect(tierQuote.minimumOrderShortfallCents).toBe(0)
    expect(formatUsdCents(tierQuote.subtotalCents)).toBe("$153.00")
  })

  it("enforces minimum single transfer floor on tiny prints", () => {
    const tinyQuote = calculateDtfTransferQuote({
      productType: "custom_dtf",
      unit: "in",
      width: 1,
      height: 1,
      quantity: 1,
    })
    expect(tinyQuote.baseUnitCents).toBe(
      DEFAULT_DTF_PRICING_RULE.min_transfer_unit_cents
    )
  })

  it("prices gang sheets by configured film length and rejects wrong roll width", () => {
    const sheet24 = calculateDtfTransferQuote({
      productType: "gang_sheet",
      unit: "in",
      width: 22,
      height: 24,
      filmLengthIn: 24,
      quantity: 2,
    })
    expect(sheet24.baseUnitCents).toBe(1790)
    expect(sheet24.subtotalCents).toBe(3580)
    expect(sheet24.printerRipVerified).toBe(false)

    expect(() =>
      calculateDtfTransferQuote({
        productType: "gang_sheet",
        unit: "in",
        width: 16,
        height: 24,
        quantity: 1,
      })
    ).toThrow(/roll width/)
  })

  it("signs server quotes with HMAC and detects tampering", () => {
    const quote = calculateDtfTransferQuote({
      productType: "ready_to_press",
      unit: "in",
      width: 8,
      height: 8,
      quantity: 10,
      readyToPressBasePriceCents: 490,
    })
    const sig = signDtfQuote(quote, "dtf_asset_123")
    expect(verifyDtfQuoteSignature(quote, sig, "dtf_asset_123")).toBe(true)
    expect(verifyDtfQuoteSignature(quote, sig, "dtf_asset_other")).toBe(false)

    const tampered = { ...quote, discountedUnitCents: 100 }
    expect(verifyDtfQuoteSignature(tampered, sig, "dtf_asset_123")).toBe(false)
  })

  it("inspects PNG/SVG headers, transparency, DPI, and rejects XSS SVG payloads", () => {
    const rgbaPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    )
    const meta = inspectArtworkBuffer(rgbaPng, "image/png")
    expect(meta).toEqual({
      mimeType: "image/png",
      pixelWidth: 1,
      pixelHeight: 1,
      hasTransparency: true,
    })

    const dpiCheck = calculateEffectiveDpi(3000, 3600, 10, 12, "image/png")
    expect(dpiCheck.effectiveDpi).toBe(300)
    expect(dpiCheck.meetsTarget300Dpi).toBe(true)

    const safeSvg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1200"><circle cx="600" cy="600" r="400"/></svg>',
      "utf8"
    )
    expect(inspectArtworkBuffer(safeSvg, "image/svg+xml")).toMatchObject({
      mimeType: "image/svg+xml",
      hasTransparency: true,
    })

    const xssSvg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      "utf8"
    )
    expect(() => inspectArtworkBuffer(xssSvg, "image/svg+xml")).toThrow(
      /Unsafe SVG/
    )
  })

  it("enforces paid-order gate, state transitions, and expiring download signatures", () => {
    expect(() => assertPaidOrderBeforeProduction(false)).toThrow(/Unpaid/)
    expect(() => assertPaidOrderBeforeProduction(true)).not.toThrow()

    expect(() =>
      assertValidProductionTransition("payment_confirmed", "design_review")
    ).not.toThrow()
    expect(() =>
      assertValidProductionTransition("payment_confirmed", "shipped")
    ).toThrow(/Invalid DTF production transition/)
    expect(() =>
      assertValidProductionTransition(
        "payment_confirmed",
        "design_review",
        "cancelled"
      )
    ).toThrow(/Cancelled/)

    const token = createSignedAssetDownloadToken({
      jobId: "job_1",
      assetKind: "production",
      expiresAtEpochSec: 2000,
      secret: "unit-secret",
    })
    expect(
      verifySignedAssetDownloadToken({
        jobId: "job_1",
        assetKind: "production",
        token,
        nowEpochSec: 1500,
        secret: "unit-secret",
      })
    ).toBe(true)
    expect(
      verifySignedAssetDownloadToken({
        jobId: "job_1",
        assetKind: "production",
        token,
        nowEpochSec: 2001,
        secret: "unit-secret",
      })
    ).toBe(false)
  })
})
