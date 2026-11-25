import "server-only"

import { sdk } from "@lib/config"

export interface StorefrontShopifyStatus {
  commerceEnabled: boolean
  testAdapterEnabled: boolean
  liveCredentialsConfigured: boolean
  webhookSecretConfigured: boolean
  connectionMode: "live_configured" | "mock_test_adapter" | "disabled"
  apiVersion: string
  storeDomain: string | null
  disclaimer: string
}

export interface ShopifyUsProductSummary {
  id: string
  handle: string
  title: string
  description: string
  priceRangeUsd: {
    minAmount: string
    maxAmount: string
    currencyCode: "USD"
  }
  featuredImageUrl: string | null
  variants: Array<{
    id: string
    title: string
    availableForSale: boolean
    priceUsd: string
  }>
}

const DEFAULT_API_VERSION = "2026-10"

export function isShopifyStorefrontFeatureEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_DTF_SHOPIFY_ENABLED === "true" ||
    process.env.DTF_SHOPIFY_COMMERCE_ENABLED === "true"
  )
}

export async function getBackendShopifyStatus(): Promise<StorefrontShopifyStatus | null> {
  try {
    return await sdk.client.fetch<StorefrontShopifyStatus>(
      "/store/dtf/shopify/status",
      {
        method: "GET",
      },
    )
  } catch {
    return null
  }
}

export async function listShopifyUsProducts(
  first = 12,
): Promise<{
  connected: boolean
  products: ShopifyUsProductSummary[]
  reason?: string
}> {
  if (!isShopifyStorefrontFeatureEnabled()) {
    return {
      connected: false,
      products: [],
      reason: "Shopify US commerce feature flag is disabled",
    }
  }

  const domain = (process.env.SHOPIFY_STORE_DOMAIN || "").trim()
  const token = (process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || "").trim()
  const apiVersion =
    (process.env.SHOPIFY_API_VERSION || "").trim() || DEFAULT_API_VERSION

  if (!domain || !token) {
    return {
      connected: false,
      products: [],
      reason: "Shopify Storefront credentials are not configured",
    }
  }

  const response = await fetch(
    `https://${domain}/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({
        query: `
          query ListUsDtfProducts($first: Int!) @inContext(country: US, language: EN) {
            products(first: $first) {
              nodes {
                id
                handle
                title
                description
                featuredImage { url }
                priceRange {
                  minVariantPrice { amount currencyCode }
                  maxVariantPrice { amount currencyCode }
                }
                variants(first: 20) {
                  nodes {
                    id
                    title
                    availableForSale
                    price { amount currencyCode }
                  }
                }
              }
            }
          }
        `,
        variables: { first },
      }),
      next: { revalidate: 60 },
    },
  )

  if (!response.ok) {
    return {
      connected: false,
      products: [],
      reason: `Shopify Storefront API responded with HTTP ${response.status}`,
    }
  }

  const json = (await response.json()) as {
    data?: {
      products?: {
        nodes?: Array<{
          id: string
          handle: string
          title: string
          description: string
          featuredImage?: { url?: string } | null
          priceRange: {
            minVariantPrice: { amount: string }
            maxVariantPrice: { amount: string }
          }
          variants: {
            nodes: Array<{
              id: string
              title: string
              availableForSale: boolean
              price: { amount: string }
            }>
          }
        }>
      }
    }
  }

  const nodes = json.data?.products?.nodes || []
  return {
    connected: true,
    products: nodes.map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      description: p.description,
      featuredImageUrl: p.featuredImage?.url || null,
      priceRangeUsd: {
        minAmount: Number(p.priceRange.minVariantPrice.amount).toFixed(2),
        maxAmount: Number(p.priceRange.maxVariantPrice.amount).toFixed(2),
        currencyCode: "USD",
      },
      variants: p.variants.nodes.map((v) => ({
        id: v.id,
        title: v.title,
        availableForSale: v.availableForSale,
        priceUsd: `$${Number(v.price.amount).toFixed(2)}`,
      })),
    })),
  }
}

export async function createServerVerifiedShopifyDtfCheckout(input: {
  productType: "ready_to_press" | "custom_dtf" | "gang_sheet" | "dtf_bundle"
  unit: "in" | "cm"
  width: number
  height: number
  quantity: number
  filmLengthIn?: number
  designAssetId?: string
  quoteSignature: string
  customerEmail?: string
}) {
  return sdk.client.fetch<{
    checkout: {
      draftOrderId: string
      draftOrderName: string
      invoiceUrl: string
      currencyCode: "USD"
      unitPriceUsd: string
      subtotalUsd: string
      isServerPriceVerified: true
      isSimulatedTestAdapter: boolean
    }
  }>("/store/dtf/shopify/checkout", {
    method: "POST",
    body: input,
  })
}
