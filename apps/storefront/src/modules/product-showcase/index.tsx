"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import type { HttpTypes } from "@medusajs/types"
import { isTshirt, variantColor } from "@lib/3d/product"
import { isVariantInStock } from "@lib/util/inventory"
import ProductActions from "@modules/products/components/product-actions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const ProductViewer3D = dynamic(() => import("./product-viewer-3d"), {
  ssr: false,
  loading: () => (
    <div
      className="aura-viewer flex items-center justify-center text-xs font-semibold text-brand-brown"
      data-testid="product-viewer"
    >
      3D Sahne Hazırlanıyor…
    </div>
  ),
})

function normalizeGalleryUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.includes("photo-1521572267360-ee0c2909d518")) {
    return "/products/nizamlar-tshirt-anthracite.webp"
  }
  if (url.includes("photo-1503342217505-b0a15ec3261c")) {
    return "/products/nizamlar-tshirt-cream.webp"
  }
  if (
    url.includes("photo-1556905055-8f358a7a47b2") ||
    url.includes("photo-1578632767115-351597cf2477")
  ) {
    return "/products/nizamlar-tshirt-collection.webp"
  }
  return url
}

export default function AuraProductShowcase({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  const hasModel = isTshirt(product)
  const [variant, setVariant] = useState(
    product.variants?.find(isVariantInStock) || product.variants?.[0],
  )
  const [previewColorHex, setPreviewColorHex] = useState<string | null>(null)
  const [tab, setTab] = useState<"3d" | "gallery">(hasModel ? "3d" : "gallery")
  const normalizedImages = (product.images || []).map((img) => ({
    ...img,
    url: normalizeGalleryUrl(img.url) || img.url,
  }))
  const [image, setImage] = useState(
    normalizeGalleryUrl(product.images?.[0]?.url || product.thumbnail),
  )
  const metadata = product.metadata || {}
  const features = [metadata.fabric, metadata.cut, metadata.wash_care].filter(
    (v): v is string => typeof v === "string",
  )
  return (
    <article className="aura-product" data-testid="aura-product" lang="tr">
      <nav className="aura-breadcrumb" aria-label="İçerik yolu">
        <LocalizedClientLink href="/store">Koleksiyon</LocalizedClientLink>
        <span>/</span>
        <span>{product.title}</span>
      </nav>
      <div className="aura-grid">
        <div className="aura-visuals">
          <div className="aura-tabs" role="tablist" aria-label="Ürün görünümü">
            {hasModel && (
              <button
                role="tab"
                aria-selected={tab === "3d"}
                onClick={() => setTab("3d")}
              >
                3D İnceleme
              </button>
            )}
            <button
              role="tab"
              aria-selected={tab === "gallery"}
              onClick={() => setTab("gallery")}
            >
              Ürün Galerisi
            </button>
          </div>
          {tab === "3d" ? (
            <ProductViewer3D
              colorHex={previewColorHex || variantColor(product, variant)}
            />
          ) : (
            <div className="aura-viewer aura-photo">
              {image ? (
                <img src={image} alt={product.title} />
              ) : (
                <p>Bu ürün için görsel henüz eklenmedi.</p>
              )}
            </div>
          )}
          {!!normalizedImages.length && (
            <div className="aura-thumbnails" aria-label="Ürün fotoğrafları">
              {normalizedImages.map((img, i) => (
                <button
                  key={img.id || img.url}
                  aria-label={`Fotoğraf ${i + 1}`}
                  aria-pressed={tab === "gallery" && image === img.url}
                  onClick={() => {
                    setImage(img.url)
                    setTab("gallery")
                  }}
                >
                  <img src={img.url} alt="" />
                </button>
              ))}
            </div>
          )}
          <p className="aura-footnote">
            {hasModel
              ? "3D görünüm ürün formunu ve seçili rengi gösterir. Kumaş tonu ekranınıza göre değişebilir."
              : "Ürünün gerçek fotoğraflarını inceleyin."}
          </p>
        </div>
        <div className="aura-details">
          <p className="studio-eyebrow">NİZAMLAR / ESSENTIALS</p>
          <h1>{product.title}</h1>
          <p className="aura-description">{product.description}</p>
          <ProductActions
            product={product}
            region={region}
            onVariantChange={setVariant}
            onPreviewColorChange={setPreviewColorHex}
          />
          <div className="aura-features">
            {features.map((feature, i) => (
              <div key={feature}>
                <span>0{i + 1}</span>
                <p>{feature}</p>
              </div>
            ))}
          </div>
          <details className="aura-care">
            <summary>Ürün ve bakım bilgileri</summary>
            <p>
              {String(
                metadata.wash_care ||
                  "Bakım ve yıkama talimatları için ürün etiketini kontrol edin.",
              )}
            </p>
            <LocalizedClientLink href="/shipping">
              Teslimat bilgileri
            </LocalizedClientLink>{" "}
            ·{" "}
            <LocalizedClientLink href="/returns">
              İade koşulları
            </LocalizedClientLink>
          </details>
        </div>
      </div>
    </article>
  )
}
