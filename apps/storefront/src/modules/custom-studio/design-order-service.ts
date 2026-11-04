import type { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"
import { printPlacement } from "@lib/3d/product"
import { addCustomDesignToCart } from "@lib/data/cart"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { createProductionPreview } from "./preview"

export type PrintSide = "front" | "back"

export type DesignArtworkInput = {
  url: string
  fileName: string
  mime: string
  aspect: number
  widthMm: number
  xMm: number
  yMm: number
  rotation: number
  positionId?: string
  positionName?: string
}

export type SavedCustomDesign = {
  id: string
  side: PrintSide
  previewUrl: string
  checkoutEnabled: boolean
}

export function calculateClientPrintPricing({
  baseUnitPrice,
  technique,
  maxWidthMm,
  surfaceCount,
  quantity,
}: {
  baseUnitPrice: number
  technique: string
  maxWidthMm: number
  surfaceCount: number
  quantity: number
}) {
  const techCost = technique === "serigrafi" ? 60 : 85
  const sizeMultiplier = maxWidthMm > 210 ? 1.4 : 1.0
  const safeSurfaces = Math.max(1, surfaceCount)
  const discountPct =
    quantity >= 250
      ? 30
      : quantity >= 100
        ? 25
        : quantity >= 50
          ? 20
          : quantity >= 20
            ? 15
            : quantity >= 10
              ? 10
              : quantity >= 5
                ? 5
                : 0
  const printUnitCost = Math.round(
    techCost * sizeMultiplier * safeSurfaces * (1 - discountPct / 100),
  )
  const unitTotal = baseUnitPrice + printUnitCost
  const grandTotal = unitTotal * quantity

  return {
    techCost,
    sizeMultiplier,
    discountPct,
    printUnitCost,
    unitTotal,
    grandTotal,
  }
}

export async function ensureBase64DataUrl(
  url: string,
  fallbackMime = "image/png",
): Promise<{ dataUrl: string; mime: string }> {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;]+);base64,/)
    return {
      dataUrl: url,
      mime: match?.[1] || fallbackMime,
    }
  }
  const response = await fetch(url)
  const blob = await response.blob()
  const mime = blob.type || fallbackMime
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return { dataUrl, mime }
}

export async function saveCustomDesignSurface({
  product,
  variant,
  side,
  artwork,
  colorHex,
  colorName,
  sizeName,
  quantity,
  technique,
}: {
  product: HttpTypes.StoreProduct
  variant: HttpTypes.StoreProductVariant
  side: PrintSide
  artwork: DesignArtworkInput
  colorHex: string
  colorName: string
  sizeName: string
  quantity: number
  technique: string
}): Promise<SavedCustomDesign> {
  const placement = printPlacement(artwork)
  const { dataUrl, mime } = await ensureBase64DataUrl(artwork.url, artwork.mime)
  const layer = {
    ...placement,
    side,
    url: dataUrl,
  }
  const previewImageBase64 = await createProductionPreview(colorHex, layer)

  const response = await sdk.client.fetch<{
    design: { id: string }
    previewUrl: string
    checkoutEnabled?: boolean
  }>("/store/custom-designs", {
    method: "POST",
    body: {
      productId: product.id,
      variantId: variant.id,
      originalFileName: artwork.fileName,
      fileMimeType: mime,
      originalFileBase64: dataUrl,
      previewImageBase64,
      colorName,
      colorHex,
      size: sizeName,
      view: side,
      positionId: artwork.positionId || "custom_metric",
      positionName:
        artwork.positionName ||
        (side === "front" ? "Ön özel baskı" : "Arka özel baskı"),
      transform: {
        ...placement,
        coordinateSystem: "torso-mm-v1",
        origin: "center",
        model: "nizamlar-tee-v1",
      },
      physicalDimensions: {
        ...placement,
        scale: 1,
        x: artwork.xMm,
        y: artwork.yMm,
      },
      quantity,
      pricingInput: {
        basePrice: variant.calculated_price?.calculated_amount,
        currencyCode: variant.calculated_price?.currency_code || "try",
        technique,
        sizeCode: artwork.widthMm > 210 ? "a3" : "a4",
      },
    },
  })

  return {
    id: response.design.id,
    side,
    previewUrl: response.previewUrl,
    checkoutEnabled: response.checkoutEnabled !== false,
  }
}

export async function addSavedDesignsToMedusaCart({
  designIds,
  quantity,
  technique,
  countryCode,
}: {
  designIds: string[]
  quantity: number
  technique: string
  countryCode: string
}) {
  await addCustomDesignToCart({
    designIds,
    quantity,
    technique,
    countryCode,
  })
  notifyCartUpdated()
}
