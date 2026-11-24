"use client"

import { addDtfTransferToCart, addToCart } from "@lib/data/cart"
import { resolveProductDtfType } from "@lib/data/dtf"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { useIntersection } from "@lib/hooks/use-in-view"
import { isVariantInStock } from "@lib/util/inventory"
import { colorHex, getVariantOptions, isTshirt } from "@lib/3d/product"
import type { HttpTypes } from "@medusajs/types"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import DtfTransferConfigurator from "../dtf-transfer-configurator"
import ProductPrice from "../product-price"

const CustomPrintStudio = dynamic(() => import("@modules/custom-studio"), {
  ssr: false,
})

export default function ProductActions({
  product,
  region,
  disabled,
  onVariantChange,
  onPreviewColorChange,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  onVariantChange?: (variant: HttpTypes.StoreProductVariant | undefined) => void
  onPreviewColorChange?: (hex: string) => void
}) {
  const countryCode = useParams().countryCode as string
  const search = useSearchParams()
  const dtfProductType =
    search.get("dtf") === "1"
      ? resolveProductDtfType(product, "us") || "custom_dtf"
      : resolveProductDtfType(product, countryCode)
  const [options, setOptions] = useState(() =>
    getVariantOptions(
      product.variants?.find((v) => v.id === search.get("v_id")) ||
        product.variants?.find(isVariantInStock) ||
        product.variants?.[0],
    ),
  )
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [message, setMessage] = useState("")
  const [studio, setStudio] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useIntersection(ref, "0px")
  const variant = useMemo(
    () =>
      product.variants?.find((v) =>
        (product.options || []).every(
          (o) => getVariantOptions(v)[o.id] === options[o.id],
        ),
      ),
    [product, options],
  )
  const inStock = isVariantInStock(variant)
  const printEligible = isTshirt(product)
  useEffect(() => {
    onVariantChange?.(variant)
  }, [variant, onVariantChange])
  useEffect(() => {
    if (search.get("studio") === "1" && printEligible) setStudio(true)
  }, [search, printEligible])
  const add = async () => {
    if (!variant || !inStock || adding || disabled) return
    setAdding(true)
    setMessage("")
    try {
      await addToCart({ variantId: variant.id, quantity, countryCode })
      notifyCartUpdated()
      setMessage(`${quantity} adet ürün sepetinize eklendi.`)
      const cart = document.querySelector('[data-testid="nav-cart-link"]')
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
        cart?.animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.12)" },
            { transform: "scale(1)" },
          ],
          { duration: 500 },
        )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Ürün sepete eklenemedi. Lütfen tekrar deneyin.",
      )
    } finally {
      setAdding(false)
    }
  }
  const unavailable =
    !variant || !inStock || disabled || adding || !variant.calculated_price
  return (
    <>
      {dtfProductType ? (
        <DtfTransferConfigurator
          product={product}
          productType={dtfProductType}
          countryCode={countryCode}
          onPreviewColorChange={onPreviewColorChange}
          onOpenStudio={printEligible ? () => setStudio(true) : undefined}
          onAddTransferToCart={async ({
            quote,
            quoteSignature,
            previewColorHex,
            previewColorName,
          }) => {
            const targetVariant = variant || product.variants?.[0]
            if (!targetVariant) {
              throw new Error("No fulfillment carrier variant available")
            }
            await addDtfTransferToCart({
              variantId: targetVariant.id,
              productType: quote.productType,
              unit: quote.dimensions.unit,
              width:
                quote.dimensions.unit === "in"
                  ? quote.dimensions.widthIn
                  : quote.dimensions.widthCm,
              height:
                quote.dimensions.unit === "in"
                  ? quote.dimensions.heightIn
                  : quote.dimensions.heightCm,
              quantity: quote.quantity,
              quoteSignature,
              previewColorHex,
              previewColorName,
              countryCode,
            })
            notifyCartUpdated()
          }}
        />
      ) : (
        <div ref={ref} className="aura-actions" data-testid="product-actions">
        <div className="aura-price" key={variant?.id}>
          <ProductPrice product={product} variant={variant} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void add()
          }}
        >
          {(product.options || []).map((option) => {
            const color = /^(renk|color|colour)$/i.test(option.title)
            return (
              <fieldset
                key={option.id}
                disabled={disabled || adding}
                className="aura-options"
              >
                <legend>
                  {option.title} <span>{options[option.id]}</span>
                </legend>
                <div>
                  {option.values?.map((value) => (
                    <label key={value.id || value.value} title={value.value}>
                      <input
                        type="radio"
                        name={option.id}
                        aria-label={`${option.title}: ${value.value}`}
                        value={value.value}
                        checked={options[option.id] === value.value}
                        onChange={() => {
                          setOptions((o) => ({
                            ...o,
                            [option.id]: value.value,
                          }))
                          setMessage("")
                        }}
                      />
                      <span
                        className={color ? "aura-swatch" : "aura-size"}
                        style={
                          color
                            ? { backgroundColor: colorHex(value.value) }
                            : undefined
                        }
                      >
                        {color ? (
                          <span className="sr-only">{value.value}</span>
                        ) : (
                          value.value
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )
          })}
          <div className="aura-stock" data-testid="product-availability">
            {!variant
              ? "Bu seçenek birleşimi mevcut değil"
              : inStock
                ? variant.manage_inventory && !variant.allow_backorder
                  ? `${variant.inventory_quantity} adet stokta`
                  : "Siparişe açık"
                : "Tükendi"}
          </div>
          <div className="aura-quantity">
            <label htmlFor={`quantity-${product.id}`}>Adet</label>
            <input
              id={`quantity-${product.id}`}
              type="number"
              aria-label="Adet"
              min={1}
              max={
                variant?.manage_inventory && !variant.allow_backorder
                  ? (variant.inventory_quantity ?? 0)
                  : 999
              }
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.max(
                    1,
                    Math.min(999, Math.floor(Number(e.target.value) || 1)),
                  ),
                )
              }
            />
          </div>
          <button
            className="aura-add"
            type="submit"
            disabled={!!unavailable}
            data-testid="add-product-button"
          >
            {adding ? "Sepete ekleniyor…" : "BASKISIZ SATIN AL"}
            <span aria-hidden="true">↗</span>
          </button>
          {printEligible && (
            <button
              className="aura-design"
              type="button"
              disabled={!variant || !inStock}
              onClick={() => setStudio(true)}
              data-testid="open-studio"
            >
              KENDİ TASARIMINLA SATIN AL <span aria-hidden="true">→</span>
            </button>
          )}
          <p role="status" className="aura-message">
            {message}
          </p>
        </form>
      </div>
      )}
      {!dtfProductType && !inView && !studio && (
        <div className="aura-sticky" data-testid="sticky-cart-bar">
          <div>
            <strong>{product.title}</strong>
            <span>
              {Object.values(options).join(" / ")} · {quantity} adet
            </span>
          </div>
          <button onClick={() => void add()} disabled={!!unavailable}>
            {adding ? "Ekleniyor…" : "Sepete Ekle"}
          </button>
        </div>
      )}
      {studio && variant && (
        <CustomPrintStudio
          product={product}
          region={region}
          countryCode={countryCode}
          initialVariant={variant}
          initialQuantity={quantity}
          onClose={() => setStudio(false)}
        />
      )}
    </>
  )
}
