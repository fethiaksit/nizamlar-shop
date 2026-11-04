import { customPrintPricingEngine } from "../pricing-engine"

describe("production dimensions and price verification", () => {
  it("rejects absent, non-finite and forged areas", () => {
    expect(customPrintPricingEngine.validatePrintDimensions(undefined)).toBe(
      false,
    )
    expect(
      customPrintPricingEngine.validatePrintDimensions({
        widthMm: NaN,
        heightMm: 100,
        areaCm2: 1,
      } as any),
    ).toBe(false)
    expect(
      customPrintPricingEngine.validatePrintDimensions({
        widthMm: 500,
        heightMm: 500,
        areaCm2: 1,
      } as any),
    ).toBe(false)
  })
  it("accepts real area and keeps fallback estimates unverified", () => {
    expect(
      customPrintPricingEngine.validatePrintDimensions({
        widthMm: 180,
        heightMm: 90,
        areaCm2: 162,
      } as any),
    ).toBe(true)
    expect(
      customPrintPricingEngine.calculatePrice({
        basePrice: 450,
        currencyCode: "TRY",
        technique: "dtf",
        sizeCode: "a4",
        surfaceCount: 1,
        quantity: 1,
      }).isPriceVerified,
    ).toBe(false)
  })
})
