import {
  computeShopifyWebhookHmacForTest,
  getShopifyRuntimeStatus,
  shopifyCreateCart,
  shopifyCreateVerifiedDtfDraftOrder,
  shopifyMutateCart,
  verifyShopifyWebhookHmac,
} from "../shopify-client"
import { calculateDtfTransferQuote, signDtfQuote } from "../pricing"

describe("Shopify Headless Client & Webhook Security", () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it("verifies raw-body X-Shopify-Hmac-Sha256 in constant time and fails closed on tampering", () => {
    const secret = "shpss_test_secret_123456"
    const rawBody = Buffer.from(
      JSON.stringify({ id: 9001, financial_status: "paid", total_price: "35.80" }),
      "utf8"
    )
    const validHmac = computeShopifyWebhookHmacForTest(rawBody, secret)

    expect(verifyShopifyWebhookHmac(rawBody, validHmac, secret)).toBe(true)

    // 1-byte mutation must fail
    const tampered = Buffer.from(
      JSON.stringify({ id: 9001, financial_status: "paid", total_price: "05.80" }),
      "utf8"
    )
    expect(verifyShopifyWebhookHmac(tampered, validHmac, secret)).toBe(false)
    expect(verifyShopifyWebhookHmac(rawBody, "invalid-base64", secret)).toBe(false)
    expect(verifyShopifyWebhookHmac(rawBody, validHmac, "")).toBe(false)
    expect(verifyShopifyWebhookHmac(undefined, validHmac, secret)).toBe(false)
  })

  it("fails closed when Shopify commerce is enabled without live credentials or test adapter", async () => {
    process.env.DTF_SHOPIFY_COMMERCE_ENABLED = "true"
    process.env.DTF_SHOPIFY_TEST_ADAPTER = "false"
    delete process.env.SHOPIFY_STORE_DOMAIN
    delete process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN
    delete process.env.SHOPIFY_ADMIN_ACCESS_TOKEN

    const status = getShopifyRuntimeStatus()
    expect(status.connectionMode).toBe("disabled")
    expect(status.liveCredentialsConfigured).toBe(false)

    await expect(shopifyCreateCart([])).rejects.toThrow(/failing closed/i)

    const quote = calculateDtfTransferQuote({
      productType: "custom_dtf",
      unit: "in",
      width: 10,
      height: 11,
      quantity: 2,
    })
    const sig = signDtfQuote(quote)
    await expect(
      shopifyCreateVerifiedDtfDraftOrder({
        verifiedQuote: quote,
        quoteSignature: sig,
      })
    ).rejects.toThrow(/failing closed/i)
  })

  it("runs Storefront cart lifecycle and authoritative Draft Order checkout under explicit mock_test_adapter", async () => {
    process.env.DTF_SHOPIFY_COMMERCE_ENABLED = "true"
    process.env.DTF_SHOPIFY_TEST_ADAPTER = "true"

    const status = getShopifyRuntimeStatus()
    expect(status.connectionMode).toBe("mock_test_adapter")

    const cart = await shopifyCreateCart([
      { merchandiseId: "gid://shopify/ProductVariant/101", quantity: 2 },
    ])
    expect(cart.isSimulatedTestAdapter).toBe(true)
    expect(cart.totalQuantity).toBe(2)
    expect(cart.subtotalUsd).toBe("$9.80")

    const updated = await shopifyMutateCart({
      action: "updateLines",
      cartId: cart.id,
      updateLines: [{ id: cart.lines[0].id, quantity: 4 }],
    })
    expect(updated.totalQuantity).toBe(4)
    expect(updated.subtotalUsd).toBe("$19.60")

    const discounted = await shopifyMutateCart({
      action: "applyDiscount",
      cartId: cart.id,
      discountCodes: ["DTF10"],
    })
    expect(discounted.discountCodes).toContain("DTF10")
    expect(discounted.totalUsd).toBe("$17.64")

    const quote = calculateDtfTransferQuote({
      productType: "gang_sheet",
      unit: "in",
      width: 22,
      height: 24,
      filmLengthIn: 24,
      quantity: 2,
    })
    const sig = signDtfQuote(quote, "des_gang_1")
    const draft = await shopifyCreateVerifiedDtfDraftOrder({
      verifiedQuote: quote,
      quoteSignature: sig,
      designAssetId: "des_gang_1",
      customerEmail: "buyer@example.com",
    })
    expect(draft.isServerPriceVerified).toBe(true)
    expect(draft.isSimulatedTestAdapter).toBe(true)
    expect(draft.subtotalUsd).toBe("$35.80")
    expect(draft.invoiceUrl).toContain("https://mock-shopify.test/invoices/")
  })
})
