"use client"

import { useEffect, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  DTF_GARMENT_DISCLAIMER,
  requestServerDtfQuote,
  type DtfDimensionUnit,
  type DtfProductType,
  type DtfVerifiedQuote,
} from "@lib/data/dtf"

const PREVIEW_GARMENT_SWATCHES = [
  { name: "Anthracite", hex: "#222325" },
  { name: "Off-White", hex: "#f4f1e9" },
  { name: "Warm Gold", hex: "#b29460" },
  { name: "Espresso Brown", hex: "#49372e" },
  { name: "Stone Cream", hex: "#e6dfd2" },
  { name: "Jet Black", hex: "#18191b" },
] as const

const GANG_SHEET_LENGTHS_IN = [12, 24, 36, 48, 60, 120] as const

const READY_SIZE_PRESETS_IN = [
  { code: "left_chest", label: 'Left Chest 3.5" x 3.5"', w: 3.5, h: 3.5 },
  { code: "youth_front", label: 'Youth 8" x 8"', w: 8, h: 8 },
  { code: "adult_front", label: 'Adult Standard 10" x 11"', w: 10, h: 11 },
  { code: "oversize_back", label: 'Full Back 12" x 15"', w: 12, h: 15 },
] as const

export default function DtfTransferConfigurator({
  product,
  productType,
  onPreviewColorChange,
  onOpenStudio,
  onAddTransferToCart,
}: {
  product: HttpTypes.StoreProduct
  productType: DtfProductType
  countryCode: string
  onPreviewColorChange?: (hex: string) => void
  onOpenStudio?: () => void
  onAddTransferToCart?: (payload: {
    quote: DtfVerifiedQuote
    quoteSignature: string
    previewColorHex: string
    previewColorName: string
  }) => Promise<void>
}) {
  const [unit, setUnit] = useState<DtfDimensionUnit>("in")
  const [width, setWidth] = useState<number>(
    productType === "gang_sheet" ? 22 : 10
  )
  const [height, setHeight] = useState<number>(
    productType === "gang_sheet" ? 24 : 11
  )
  const [presetCode, setPresetCode] = useState<string>("adult_front")
  const [quantity, setQuantity] = useState<number>(1)
  const [previewSwatch, setPreviewSwatch] = useState<{
    name: string
    hex: string
  }>(PREVIEW_GARMENT_SWATCHES[0])
  const [quote, setQuote] = useState<DtfVerifiedQuote | null>(null)
  const [quoteSignature, setQuoteSignature] = useState<string>("")
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [statusMsg, setStatusMsg] = useState<string>("")

  const switchUnit = (nextUnit: DtfDimensionUnit) => {
    if (nextUnit === unit) return
    const factor = nextUnit === "cm" ? 2.54 : 1 / 2.54
    setWidth(Number((width * factor).toFixed(2)))
    setHeight(Number((height * factor).toFixed(2)))
    setUnit(nextUnit)
  }

  useEffect(() => {
    let active = true
    setLoadingQuote(true)
    requestServerDtfQuote({
      productType,
      unit,
      width,
      height,
      quantity,
      filmLengthIn:
        productType === "gang_sheet"
          ? unit === "in"
            ? height
            : Number((height / 2.54).toFixed(2))
          : undefined,
      presetCode: productType === "ready_to_press" ? presetCode : undefined,
    })
      .then((res) => {
        if (!active) return
        setQuote(res.quote)
        setQuoteSignature(res.quoteSignature)
        setStatusMsg("")
      })
      .catch((err) => {
        if (!active) return
        setQuote(null)
        setQuoteSignature("")
        setStatusMsg(
          err instanceof Error
            ? err.message
            : "Unable to verify DTF transfer price"
        )
      })
      .finally(() => {
        if (active) setLoadingQuote(false)
      })

    return () => {
      active = false
    }
  }, [productType, unit, width, height, quantity, presetCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quote || !quoteSignature || submitting) return
    setSubmitting(true)
    setStatusMsg("")
    try {
      await onAddTransferToCart?.({
        quote,
        quoteSignature,
        previewColorHex: previewSwatch.hex,
        previewColorName: previewSwatch.name,
      })
      setStatusMsg(
        `Added ${quote.quantity} DTF transfer(s) (${quote.dimensions.widthIn}" x ${quote.dimensions.heightIn}") to cart.`
      )
    } catch (err) {
      setStatusMsg(
        err instanceof Error ? err.message : "Could not add DTF transfer to cart"
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="aura-actions" data-testid="dtf-transfer-configurator">
      <div className="mb-3 rounded-lg border border-brand-gold/50 bg-brand-anthracite px-3.5 py-2.5 text-xs font-bold text-brand-cream-light">
        <span data-testid="dtf-garment-disclaimer">{DTF_GARMENT_DISCLAIMER}</span>
      </div>

      <div className="aura-price" data-testid="dtf-verified-price">
        {quote ? (
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-extrabold text-brand-anthracite">
              {quote.unitPriceFormatted}
            </span>
            <span className="text-xs font-semibold text-brand-brown">
              / transfer · Total {quote.subtotalFormatted} USD
            </span>
            {quote.discountPercent > 0 && (
              <span className="rounded bg-brand-gold/20 px-2 py-0.5 text-[11px] font-bold text-brand-brown-dark">
                -{quote.discountPercent}% Volume Tier
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm font-semibold text-brand-brown">
            {loadingQuote ? "Verifying USD transfer quote..." : "Enter valid print size"}
          </span>
        )}
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        {/* Unit Selector (in / cm) */}
        <fieldset className="aura-options">
          <legend>
            Measurement Unit <span>{unit.toUpperCase()}</span>
          </legend>
          <div>
            {(["in", "cm"] as const).map((u) => (
              <label key={u}>
                <input
                  type="radio"
                  name={`unit-${product.id}`}
                  value={u}
                  checked={unit === u}
                  onChange={() => switchUnit(u)}
                />
                <span className="aura-size">
                  {u === "in" ? "Inches (in)" : "Centimeters (cm)"}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Presets / Film Length / Width x Height */}
        {productType === "gang_sheet" ? (
          <fieldset className="aura-options">
            <legend>
              22&quot; Roll Film Length{" "}
              <span>
                22&quot; x {unit === "in" ? `${height}"` : `${height} cm`}
              </span>
            </legend>
            <div>
              {GANG_SHEET_LENGTHS_IN.map((lenIn) => {
                const displayVal =
                  unit === "in" ? lenIn : Number((lenIn * 2.54).toFixed(2))
                return (
                  <label key={lenIn}>
                    <input
                      type="radio"
                      name={`sheet-len-${product.id}`}
                      checked={Math.abs(height - displayVal) < 0.05}
                      onChange={() => {
                        setWidth(unit === "in" ? 22 : Number((22 * 2.54).toFixed(2)))
                        setHeight(displayVal)
                      }}
                    />
                    <span className="aura-size">22&quot; x {lenIn}&quot;</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        ) : (
          <>
            <fieldset className="aura-options">
              <legend>Quick Print Size Presets</legend>
              <div>
                {READY_SIZE_PRESETS_IN.map((preset) => (
                  <label key={preset.code}>
                    <input
                      type="radio"
                      name={`preset-${product.id}`}
                      checked={presetCode === preset.code}
                      onChange={() => {
                        setPresetCode(preset.code)
                        setWidth(
                          unit === "in"
                            ? preset.w
                            : Number((preset.w * 2.54).toFixed(2))
                        )
                        setHeight(
                          unit === "in"
                            ? preset.h
                            : Number((preset.h * 2.54).toFixed(2))
                        )
                      }}
                    />
                    <span className="aura-size">{preset.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="my-3 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-bold text-brand-brown-dark">
                <span>Print Width ({unit})</span>
                <input
                  type="number"
                  step="0.1"
                  min={unit === "in" ? 0.5 : 1.27}
                  max={unit === "in" ? 22 : 55.88}
                  value={width}
                  data-testid="dtf-width-input"
                  onChange={(e) => {
                    setPresetCode("")
                    setWidth(Number(e.target.value) || 0.5)
                  }}
                  className="rounded-md border border-brand-stone bg-brand-white px-3 py-2 text-sm font-bold text-brand-anthracite"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold text-brand-brown-dark">
                <span>Print Height ({unit})</span>
                <input
                  type="number"
                  step="0.1"
                  min={unit === "in" ? 0.5 : 1.27}
                  max={unit === "in" ? 120 : 304.8}
                  value={height}
                  data-testid="dtf-height-input"
                  onChange={(e) => {
                    setPresetCode("")
                    setHeight(Number(e.target.value) || 0.5)
                  }}
                  className="rounded-md border border-brand-stone bg-brand-white px-3 py-2 text-sm font-bold text-brand-anthracite"
                />
              </label>
            </div>
          </>
        )}

        {/* Preview-Only Garment Color Swatches (No Garment Size Required!) */}
        <fieldset className="aura-options">
          <legend>
            Preview Fabric Color (Preview Only){" "}
            <span>{previewSwatch.name}</span>
          </legend>
          <div>
            {PREVIEW_GARMENT_SWATCHES.map((swatch) => (
              <label key={swatch.name} title={`${swatch.name} (Preview Only)`}>
                <input
                  type="radio"
                  name={`preview-color-${product.id}`}
                  aria-label={`Preview Fabric Color: ${swatch.name}`}
                  checked={previewSwatch.hex === swatch.hex}
                  onChange={() => {
                    setPreviewSwatch(swatch)
                    onPreviewColorChange?.(swatch.hex)
                  }}
                />
                <span
                  className="aura-swatch"
                  style={{ backgroundColor: swatch.hex }}
                >
                  <span className="sr-only">{swatch.name}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Quantity Input */}
        <div className="aura-quantity">
          <label htmlFor={`dtf-qty-${product.id}`}>Transfer Quantity</label>
          <input
            id={`dtf-qty-${product.id}`}
            data-testid="dtf-quantity-input"
            type="number"
            min={1}
            max={10000}
            value={quantity}
            onChange={(e) =>
              setQuantity(
                Math.max(1, Math.min(10000, Math.floor(Number(e.target.value) || 1)))
              )
            }
          />
        </div>

        {quote && !quote.minimumOrderMet && (
          <p className="my-2 rounded-md border border-brand-gold/40 bg-brand-cream px-3 py-2 text-xs font-semibold text-brand-brown-dark">
            Minimum US transfer order is ${(quote.minimumOrderCents / 100).toFixed(2)}{" "}
            USD (add ${(quote.minimumOrderShortfallCents / 100).toFixed(2)} more or
            increase quantity to reach minimum order).
          </p>
        )}

        <button
          className="aura-add"
          type="submit"
          disabled={!quote || loadingQuote || submitting}
          data-testid="add-dtf-transfer-button"
        >
          {submitting ? "Adding DTF Transfer..." : "ORDER DTF TRANSFER FILM"}
          <span aria-hidden="true">↗</span>
        </button>

        {onOpenStudio && (
          <button
            className="aura-design"
            type="button"
            onClick={onOpenStudio}
            data-testid="open-studio"
          >
            UPLOAD ARTWORK IN 3D DTF STUDIO <span aria-hidden="true">→</span>
          </button>
        )}

        <LocalizedClientLink
          href="/gang-sheet-builder"
          data-testid="open-gang-sheet-builder"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-brand-gold bg-brand-cream-light px-4 py-2.5 text-xs font-extrabold uppercase tracking-wider text-brand-anthracite hover:bg-brand-cream transition"
        >
          OPEN MULTI-DESIGN GANG SHEET BUILDER <span aria-hidden="true">↗</span>
        </LocalizedClientLink>

        {statusMsg && (
          <p role="status" className="aura-message">
            {statusMsg}
          </p>
        )}
      </form>
    </div>
  )
}
