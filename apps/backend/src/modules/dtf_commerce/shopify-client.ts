import crypto from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"
import {
  DTF_GARMENT_DISCLAIMER,
  formatUsdCents,
  type DtfVerifiedQuote,
} from "./pricing"

export type ShopifyConnectionMode =
  | "live_configured"
  | "mock_test_adapter"
  | "disabled"

export interface ShopifyRuntimeStatus {
  commerceEnabled: boolean
  testAdapterEnabled: boolean
  liveCredentialsConfigured: boolean
  webhookSecretConfigured: boolean
  connectionMode: ShopifyConnectionMode
  apiVersion: string
  storeDomain: string | null
  disclaimer: string
}

export interface ShopifyCartLineInput {
  merchandiseId: string
  quantity: number
  attributes?: Array<{ key: string; value: string }>
}

export interface ShopifyCartLineUpdateInput {
  id: string
  quantity: number
}

export interface ShopifyCartSnapshot {
  id: string
  checkoutUrl: string
  totalQuantity: number
  subtotalUsd: string
  totalUsd: string
  currencyCode: "USD"
  discountCodes: string[]
  isSimulatedTestAdapter: boolean
  lines: Array<{
    id: string
    merchandiseId: string
    title: string
    quantity: number
    lineTotalUsd: string
    attributes: Array<{ key: string; value: string }>
  }>
}

export interface ShopifyVerifiedDraftCheckoutResult {
  draftOrderId: string
  draftOrderName: string
  invoiceUrl: string
  currencyCode: "USD"
  unitPriceUsd: string
  subtotalUsd: string
  isServerPriceVerified: true
  isSimulatedTestAdapter: boolean
}

const DEFAULT_SHOPIFY_API_VERSION = "2026-10"

// Isolated in-memory store used ONLY when DTF_SHOPIFY_TEST_ADAPTER === "true"
const mockCartStore = new Map<string, ShopifyCartSnapshot>()

export function getShopifyRuntimeStatus(): ShopifyRuntimeStatus {
  const commerceEnabled =
    process.env.DTF_SHOPIFY_COMMERCE_ENABLED === "true"
  const testAdapterEnabled =
    process.env.DTF_SHOPIFY_TEST_ADAPTER === "true"
  const storeDomain = (process.env.SHOPIFY_STORE_DOMAIN || "").trim() || null
  const storefrontToken = (
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || ""
  ).trim()
  const adminToken = (process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || "").trim()
  const webhookSecret = (process.env.SHOPIFY_WEBHOOK_SECRET || "").trim()
  const apiVersion =
    (process.env.SHOPIFY_API_VERSION || "").trim() ||
    DEFAULT_SHOPIFY_API_VERSION

  const liveCredentialsConfigured = Boolean(
    storeDomain && storefrontToken && adminToken
  )

  let connectionMode: ShopifyConnectionMode = "disabled"
  if (commerceEnabled) {
    if (liveCredentialsConfigured && !testAdapterEnabled) {
      connectionMode = "live_configured"
    } else if (testAdapterEnabled) {
      connectionMode = "mock_test_adapter"
    }
  }

  return {
    commerceEnabled,
    testAdapterEnabled,
    liveCredentialsConfigured,
    webhookSecretConfigured: Boolean(webhookSecret),
    connectionMode,
    apiVersion,
    storeDomain,
    disclaimer: DTF_GARMENT_DISCLAIMER,
  }
}

export function verifyShopifyWebhookHmac(
  rawBody: Buffer | string | undefined,
  hmacHeader: string | undefined,
  secretOverride?: string
): boolean {
  const secret = (
    secretOverride ??
    process.env.SHOPIFY_WEBHOOK_SECRET ??
    ""
  ).trim()
  if (!secret || !hmacHeader || rawBody === undefined) {
    return false
  }

  const bodyBuf = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(rawBody, "utf8")

  const computedBase64 = crypto
    .createHmac("sha256", secret)
    .update(bodyBuf)
    .digest("base64")

  const providedBuf = Buffer.from(hmacHeader.trim(), "utf8")
  const expectedBuf = Buffer.from(computedBase64, "utf8")

  if (providedBuf.length !== expectedBuf.length) {
    return false
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf)
}

export function computeShopifyWebhookHmacForTest(
  rawBody: Buffer | string,
  secret: string
): string {
  const buf = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8")
  return crypto.createHmac("sha256", secret).update(buf).digest("base64")
}

async function callShopifyGraphql<T>(params: {
  endpointUrl: string
  headers: Record<string, string>
  query: string
  variables?: Record<string, unknown>
}): Promise<T> {
  const response = await fetch(params.endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...params.headers,
    },
    body: JSON.stringify({
      query: params.query,
      variables: params.variables || {},
    }),
  })

  if (!response.ok) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Shopify GraphQL request failed with HTTP ${response.status}`
    )
  }

  const json = (await response.json()) as {
    data?: T
    errors?: Array<{ message: string }>
  }
  if (json.errors?.length) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Shopify GraphQL error: ${json.errors[0].message}`
    )
  }
  if (!json.data) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Empty data returned from Shopify GraphQL endpoint"
    )
  }
  return json.data
}

function assertActiveShopifyConnection(): ShopifyRuntimeStatus {
  const status = getShopifyRuntimeStatus()
  if (!status.commerceEnabled) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Shopify US commerce integration is currently disabled (DTF_SHOPIFY_COMMERCE_ENABLED=false)"
    )
  }
  if (status.connectionMode === "disabled") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Shopify credentials are not configured; failing closed rather than using unverified pricing"
    )
  }
  return status
}

const CART_FRAGMENT_GRAPHQL = `
  fragment CartSnapshotFields on Cart {
    id
    checkoutUrl
    totalQuantity
    discountCodes {
      applicable
      code
    }
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 50) {
      nodes {
        id
        quantity
        attributes { key value }
        cost { totalAmount { amount currencyCode } }
        merchandise {
          ... on ProductVariant {
            id
            title
            product { title }
          }
        }
      }
    }
  }
`

function mapStorefrontCartNode(rawCart: Record<string, unknown>): ShopifyCartSnapshot {
  const cost = (rawCart.cost || {}) as {
    subtotalAmount?: { amount?: string }
    totalAmount?: { amount?: string }
  }
  const discountCodes = Array.isArray(rawCart.discountCodes)
    ? (rawCart.discountCodes as Array<{ code: string }>).map((d) => d.code)
    : []
  const lineNodes =
    ((rawCart.lines as { nodes?: Array<Record<string, unknown>> })?.nodes) || []

  return {
    id: String(rawCart.id),
    checkoutUrl: String(rawCart.checkoutUrl),
    totalQuantity: Number(rawCart.totalQuantity || 0),
    subtotalUsd: `$${Number(cost.subtotalAmount?.amount || 0).toFixed(2)}`,
    totalUsd: `$${Number(cost.totalAmount?.amount || 0).toFixed(2)}`,
    currencyCode: "USD",
    discountCodes,
    isSimulatedTestAdapter: false,
    lines: lineNodes.map((n) => {
      const merch = (n.merchandise || {}) as {
        id?: string
        title?: string
        product?: { title?: string }
      }
      const lineCost = (n.cost || {}) as {
        totalAmount?: { amount?: string }
      }
      const attrs = Array.isArray(n.attributes)
        ? (n.attributes as Array<{ key: string; value: string }>)
        : []
      return {
        id: String(n.id),
        merchandiseId: String(merch.id || ""),
        title: merch.product?.title
          ? `${merch.product.title} — ${merch.title || ""}`
          : String(merch.title || "DTF Transfer"),
        quantity: Number(n.quantity || 1),
        lineTotalUsd: `$${Number(lineCost.totalAmount?.amount || 0).toFixed(2)}`,
        attributes: attrs,
      }
    }),
  }
}

function recalculateMockCart(cart: ShopifyCartSnapshot): ShopifyCartSnapshot {
  const unitCents = 490
  const discountMultiplier = cart.discountCodes.includes("DTF10") ? 0.9 : 1
  let totalQuantity = 0
  let subtotalCents = 0
  const updatedLines = cart.lines.map((line) => {
    totalQuantity += line.quantity
    const lineCents = unitCents * line.quantity
    subtotalCents += lineCents
    return {
      ...line,
      lineTotalUsd: formatUsdCents(lineCents),
    }
  })
  const totalCents = Math.round(subtotalCents * discountMultiplier)
  return {
    ...cart,
    lines: updatedLines,
    totalQuantity,
    subtotalUsd: formatUsdCents(subtotalCents),
    totalUsd: formatUsdCents(totalCents),
  }
}

export async function shopifyCreateCart(
  lines: ShopifyCartLineInput[] = []
): Promise<ShopifyCartSnapshot> {
  const status = assertActiveShopifyConnection()
  if (status.connectionMode === "mock_test_adapter") {
    const cartId = `gid://shopify/Cart/mock_${crypto.randomBytes(6).toString("hex")}`
    const initial: ShopifyCartSnapshot = recalculateMockCart({
      id: cartId,
      checkoutUrl: `https://mock-shopify.test/checkouts/${encodeURIComponent(cartId)}`,
      totalQuantity: 0,
      subtotalUsd: "$0.00",
      totalUsd: "$0.00",
      currencyCode: "USD",
      discountCodes: [],
      isSimulatedTestAdapter: true,
      lines: lines.map((l, idx) => ({
        id: `gid://shopify/CartLine/mock_${idx + 1}`,
        merchandiseId: l.merchandiseId,
        title: "Ready-to-Press DTF Transfer Film",
        quantity: l.quantity,
        lineTotalUsd: "$0.00",
        attributes: [
          ...(l.attributes || []),
          { key: "disclaimer", value: DTF_GARMENT_DISCLAIMER },
        ],
      })),
    })
    mockCartStore.set(cartId, initial)
    return initial
  }

  const endpointUrl = `https://${status.storeDomain}/api/${status.apiVersion}/graphql.json`
  const data = await callShopifyGraphql<{
    cartCreate: {
      cart: Record<string, unknown> | null
      userErrors: Array<{ message: string }>
    }
  }>({
    endpointUrl,
    headers: {
      "X-Shopify-Storefront-Access-Token":
        process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
    },
    query: `
      ${CART_FRAGMENT_GRAPHQL}
      mutation CartCreate($lines: [CartLineInput!]) @inContext(country: US, language: EN) {
        cartCreate(input: { lines: $lines }) {
          cart { ...CartSnapshotFields }
          userErrors { message }
        }
      }
    `,
    variables: { lines },
  })

  if (data.cartCreate.userErrors?.length || !data.cartCreate.cart) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      data.cartCreate.userErrors?.[0]?.message || "Failed to create Shopify cart"
    )
  }
  return mapStorefrontCartNode(data.cartCreate.cart)
}

export async function shopifyMutateCart(input: {
  action: "get" | "addLines" | "updateLines" | "removeLines" | "applyDiscount"
  cartId: string
  lines?: ShopifyCartLineInput[]
  updateLines?: ShopifyCartLineUpdateInput[]
  lineIds?: string[]
  discountCodes?: string[]
}): Promise<ShopifyCartSnapshot> {
  const status = assertActiveShopifyConnection()
  if (status.connectionMode === "mock_test_adapter") {
    const existing = mockCartStore.get(input.cartId)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Mock Shopify cart '${input.cartId}' not found`
      )
    }
    let next = { ...existing, lines: [...existing.lines] }
    if (input.action === "addLines" && input.lines?.length) {
      for (const l of input.lines) {
        next.lines.push({
          id: `gid://shopify/CartLine/mock_${crypto.randomBytes(4).toString("hex")}`,
          merchandiseId: l.merchandiseId,
          title: "Ready-to-Press DTF Transfer Film",
          quantity: l.quantity,
          lineTotalUsd: "$0.00",
          attributes: [
            ...(l.attributes || []),
            { key: "disclaimer", value: DTF_GARMENT_DISCLAIMER },
          ],
        })
      }
    } else if (input.action === "updateLines" && input.updateLines?.length) {
      for (const u of input.updateLines) {
        next.lines = next.lines
          .map((line) =>
            line.id === u.id ? { ...line, quantity: u.quantity } : line
          )
          .filter((line) => line.quantity > 0)
      }
    } else if (input.action === "removeLines" && input.lineIds?.length) {
      const removeSet = new Set(input.lineIds)
      next.lines = next.lines.filter((l) => !removeSet.has(l.id))
    } else if (input.action === "applyDiscount" && input.discountCodes) {
      next.discountCodes = [...input.discountCodes]
    }
    next = recalculateMockCart(next)
    mockCartStore.set(input.cartId, next)
    return next
  }

  const endpointUrl = `https://${status.storeDomain}/api/${status.apiVersion}/graphql.json`
  const headers = {
    "X-Shopify-Storefront-Access-Token":
      process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN!,
  }

  if (input.action === "get") {
    const data = await callShopifyGraphql<{ cart: Record<string, unknown> | null }>({
      endpointUrl,
      headers,
      query: `
        ${CART_FRAGMENT_GRAPHQL}
        query GetCart($cartId: ID!) @inContext(country: US, language: EN) {
          cart(id: $cartId) { ...CartSnapshotFields }
        }
      `,
      variables: { cartId: input.cartId },
    })
    if (!data.cart) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Shopify cart not found")
    }
    return mapStorefrontCartNode(data.cart)
  }

  if (input.action === "addLines") {
    const data = await callShopifyGraphql<{
      cartLinesAdd: {
        cart: Record<string, unknown> | null
        userErrors: Array<{ message: string }>
      }
    }>({
      endpointUrl,
      headers,
      query: `
        ${CART_FRAGMENT_GRAPHQL}
        mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) @inContext(country: US, language: EN) {
          cartLinesAdd(cartId: $cartId, lines: $lines) {
            cart { ...CartSnapshotFields }
            userErrors { message }
          }
        }
      `,
      variables: { cartId: input.cartId, lines: input.lines || [] },
    })
    if (data.cartLinesAdd.userErrors?.length || !data.cartLinesAdd.cart) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        data.cartLinesAdd.userErrors?.[0]?.message || "Unable to add Shopify cart lines"
      )
    }
    return mapStorefrontCartNode(data.cartLinesAdd.cart)
  }

  if (input.action === "updateLines") {
    const data = await callShopifyGraphql<{
      cartLinesUpdate: {
        cart: Record<string, unknown> | null
        userErrors: Array<{ message: string }>
      }
    }>({
      endpointUrl,
      headers,
      query: `
        ${CART_FRAGMENT_GRAPHQL}
        mutation UpdateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) @inContext(country: US, language: EN) {
          cartLinesUpdate(cartId: $cartId, lines: $lines) {
            cart { ...CartSnapshotFields }
            userErrors { message }
          }
        }
      `,
      variables: { cartId: input.cartId, lines: input.updateLines || [] },
    })
    if (data.cartLinesUpdate.userErrors?.length || !data.cartLinesUpdate.cart) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        data.cartLinesUpdate.userErrors?.[0]?.message || "Unable to update Shopify cart"
      )
    }
    return mapStorefrontCartNode(data.cartLinesUpdate.cart)
  }

  if (input.action === "removeLines") {
    const data = await callShopifyGraphql<{
      cartLinesRemove: {
        cart: Record<string, unknown> | null
        userErrors: Array<{ message: string }>
      }
    }>({
      endpointUrl,
      headers,
      query: `
        ${CART_FRAGMENT_GRAPHQL}
        mutation RemoveLines($cartId: ID!, $lineIds: [ID!]!) @inContext(country: US, language: EN) {
          cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
            cart { ...CartSnapshotFields }
            userErrors { message }
          }
        }
      `,
      variables: { cartId: input.cartId, lineIds: input.lineIds || [] },
    })
    if (data.cartLinesRemove.userErrors?.length || !data.cartLinesRemove.cart) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        data.cartLinesRemove.userErrors?.[0]?.message || "Unable to remove Shopify lines"
      )
    }
    return mapStorefrontCartNode(data.cartLinesRemove.cart)
  }

  const data = await callShopifyGraphql<{
    cartDiscountCodesUpdate: {
      cart: Record<string, unknown> | null
      userErrors: Array<{ message: string }>
    }
  }>({
    endpointUrl,
    headers,
    query: `
      ${CART_FRAGMENT_GRAPHQL}
      mutation ApplyDiscounts($cartId: ID!, $discountCodes: [String!]) @inContext(country: US, language: EN) {
        cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
          cart { ...CartSnapshotFields }
          userErrors { message }
        }
      }
    `,
    variables: {
      cartId: input.cartId,
      discountCodes: input.discountCodes || [],
    },
  })
  if (
    data.cartDiscountCodesUpdate.userErrors?.length ||
    !data.cartDiscountCodesUpdate.cart
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      data.cartDiscountCodesUpdate.userErrors?.[0]?.message ||
        "Unable to apply Shopify discount code"
    )
  }
  return mapStorefrontCartNode(data.cartDiscountCodesUpdate.cart)
}

/**
 * Creates a server-authoritative Shopify Draft Order for custom-sized DTF transfers & gang sheets.
 * Never trusts client-submitted prices or cart attributes; uses ONLY server-calculated DtfVerifiedQuote.
 */
export async function shopifyCreateVerifiedDtfDraftOrder(input: {
  verifiedQuote: DtfVerifiedQuote
  quoteSignature: string
  designAssetId?: string
  customerEmail?: string
}): Promise<ShopifyVerifiedDraftCheckoutResult> {
  const status = assertActiveShopifyConnection()
  const { verifiedQuote } = input

  if (!verifiedQuote.isServerVerified || verifiedQuote.discountedUnitCents <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Cannot create Shopify draft checkout without a positive server-verified DTF quote"
    )
  }

  const unitMajor = (verifiedQuote.discountedUnitCents / 100).toFixed(2)
  const title =
    verifiedQuote.productType === "gang_sheet"
      ? `Custom DTF Gang Sheet (${verifiedQuote.dimensions.widthIn}" x ${verifiedQuote.dimensions.heightIn}")`
      : `Custom DTF Transfer Film (${verifiedQuote.dimensions.widthIn}" x ${verifiedQuote.dimensions.heightIn}")`

  const customAttributes = [
    { key: "dtf_transfer", value: "true" },
    { key: "garment_included", value: "false" },
    { key: "disclaimer", value: DTF_GARMENT_DISCLAIMER },
    { key: "dtf_product_type", value: verifiedQuote.productType },
    {
      key: "width_in",
      value: String(verifiedQuote.dimensions.widthIn),
    },
    {
      key: "height_in",
      value: String(verifiedQuote.dimensions.heightIn),
    },
    {
      key: "dtf_design_asset_id",
      value: input.designAssetId || "ready_to_press",
    },
    { key: "quote_signature", value: input.quoteSignature },
  ]

  if (status.connectionMode === "mock_test_adapter") {
    const token = crypto.randomBytes(6).toString("hex")
    return {
      draftOrderId: `gid://shopify/DraftOrder/mock_${token}`,
      draftOrderName: `#D-${token.slice(0, 5).toUpperCase()}`,
      invoiceUrl: `https://mock-shopify.test/invoices/${token}`,
      currencyCode: "USD",
      unitPriceUsd: verifiedQuote.unitPriceFormatted,
      subtotalUsd: verifiedQuote.subtotalFormatted,
      isServerPriceVerified: true,
      isSimulatedTestAdapter: true,
    }
  }

  const endpointUrl = `https://${status.storeDomain}/admin/api/${status.apiVersion}/graphql.json`
  const data = await callShopifyGraphql<{
    draftOrderCreate: {
      draftOrder: {
        id: string
        name: string
        invoiceUrl: string | null
      } | null
      userErrors: Array<{ field?: string[]; message: string }>
    }
  }>({
    endpointUrl,
    headers: {
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_ACCESS_TOKEN!,
    },
    query: `
      mutation CreateVerifiedDtfDraftOrder($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            id
            name
            invoiceUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    variables: {
      input: {
        email: input.customerEmail || undefined,
        note: DTF_GARMENT_DISCLAIMER,
        tags: ["dtf-transfer", "nizamlar-us", verifiedQuote.productType],
        lineItems: [
          {
            title,
            quantity: verifiedQuote.quantity,
            requiresShipping: true,
            originalUnitPriceWithCurrency: {
              amount: unitMajor,
              currencyCode: "USD",
            },
            customAttributes,
          },
        ],
      },
    },
  })

  const draft = data.draftOrderCreate.draftOrder
  if (
    data.draftOrderCreate.userErrors?.length ||
    !draft ||
    !draft.invoiceUrl
  ) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      data.draftOrderCreate.userErrors?.[0]?.message ||
        "Shopify Admin draftOrderCreate did not return a valid invoiceUrl; failing closed"
    )
  }

  return {
    draftOrderId: draft.id,
    draftOrderName: draft.name,
    invoiceUrl: draft.invoiceUrl,
    currencyCode: "USD",
    unitPriceUsd: verifiedQuote.unitPriceFormatted,
    subtotalUsd: verifiedQuote.subtotalFormatted,
    isServerPriceVerified: true,
    isSimulatedTestAdapter: false,
  }
}
