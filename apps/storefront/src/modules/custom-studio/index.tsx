"use client"

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react"
import { useMemo, useRef, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import {
  getVariantOptions,
  printPlacement,
  variantColor,
} from "@lib/3d/product"
import { isVariantInStock } from "@lib/util/inventory"
import { convertToLocale } from "@lib/util/money"
import type { PrintLayer } from "@modules/garment-3d/garment-model"
import Studio3DViewer from "./studio-3d-viewer"
import { createProductionPreview } from "./preview"
import {
  addSavedDesignsToMedusaCart,
  calculateClientPrintPricing,
  saveCustomDesignSurface,
} from "./design-order-service"

type Side = "front" | "back"
type Artwork = {
  url: string
  fileName: string
  mime: string
  aspect: number
  widthMm: number
  xMm: number
  yMm: number
  rotation: number
}
type SavedDesign = { id: string; side: Side; previewUrl: string }

export default function CustomPrintStudio({
  product,
  region,
  countryCode,
  initialVariant,
  initialQuantity = 1,
  onClose,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  initialVariant?: HttpTypes.StoreProductVariant
  initialQuantity?: number
  onClose?: () => void
}) {
  const [options, setOptions] = useState(() =>
    getVariantOptions(
      initialVariant || product.variants?.find(isVariantInStock),
    ),
  )
  const [quantity, setQuantity] = useState(initialQuantity)
  const [side, setSide] = useState<Side>("front")
  const [artworks, setArtworks] = useState<Partial<Record<Side, Artwork>>>({})
  const [technique, setTechnique] = useState("dtf")
  const [mode, setMode] = useState<"3d" | "2d">("3d")
  const [preview, setPreview] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [saved, setSaved] = useState<SavedDesign[]>([])
  const input = useRef<HTMLInputElement>(null)
  const variant = useMemo(
    () =>
      product.variants?.find((v) =>
        (product.options || []).every(
          (o) => getVariantOptions(v)[o.id] === options[o.id],
        ),
      ),
    [product, options],
  )
  const color = variantColor(product, variant)
  const active = artworks[side]
  const layers: PrintLayer[] = Object.entries(artworks).map(
    ([surface, art]) => ({
      url: art.url,
      side: surface as Side,
      ...printPlacement(art),
    }),
  )
  const valid =
    layers.length > 0 &&
    Object.values(artworks).every((art) => printPlacement(art).valid)
  const currencyCode =
    variant?.calculated_price?.currency_code || region.currency_code || "try"
  const fallbackPrice =
    product.variants?.find((v) => v.calculated_price?.calculated_amount)?.calculated_price?.calculated_amount || 0
  const baseUnitPrice = variant?.calculated_price?.calculated_amount || fallbackPrice || 0
  const maxWidthMm = Math.max(
    0,
    ...Object.values(artworks).map((a) => a?.widthMm || 0),
  )
  const { printUnitCost, grandTotal } = calculateClientPrintPricing({
    baseUnitPrice,
    technique,
    maxWidthMm,
    surfaceCount: layers.length,
    quantity,
  })
  const update = (patch: Partial<Artwork>) => {
    setArtworks((current) =>
      current[side]
        ? { ...current, [side]: { ...current[side], ...patch } }
        : current,
    )
    setSaved([])
    setMessage("")
  }
  const upload = async (file?: File) => {
    if (!file) return
    setMessage("")
    // Raster artwork keeps the uploaded original bytes and avoids active SVG content.
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 25 * 1024 * 1024
    ) {
      setMessage("En fazla 25 MB PNG, JPG veya WebP yükleyin.")
      return
    }
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const image = new Image()
      image.src = url
      await image.decode()
      const aspect = image.naturalWidth / image.naturalHeight
      setArtworks((current) => ({
        ...current,
        [side]: {
          url,
          fileName: file.name,
          mime: file.type,
          aspect,
          widthMm: Math.min(180, 280 * aspect),
          xMm: 0,
          yMm: 0,
          rotation: 0,
        },
      }))
      setSaved([])
    } catch {
      setMessage("Görsel okunamadı. Geçerli bir dosya deneyin.")
    }
  }
  const save = async (): Promise<SavedDesign[]> => {
    if (!valid || !variant || busy) return []
    setBusy(true)
    setMessage("Orijinal dosya ve üretim ölçüleri kaydediliyor…")
    const results: SavedDesign[] = []
    try {
      const colorOption = product.options?.find((o) =>
        /^(renk|color|colour)$/i.test(o.title),
      )
      const sizeOption = product.options?.find((o) =>
        /^(beden|size)$/i.test(o.title),
      )
      for (const [surface, art] of Object.entries(artworks)) {
        const savedSurface = await saveCustomDesignSurface({
          product,
          variant,
          side: surface as Side,
          artwork: art,
          colorHex: color,
          colorName: colorOption ? options[colorOption.id] : "",
          sizeName: sizeOption ? options[sizeOption.id] : "",
          quantity,
          technique,
        })
        results.push({
          id: savedSurface.id,
          side: savedSurface.side,
          previewUrl: savedSurface.previewUrl,
        })
        // Keep successful references if the second surface fails, so no saved work disappears.
        setSaved([...results])
      }
      setMessage(
        "Tasarım kalıcı kaydedildi. Baskılı ürünü sepete ekleyebilirsiniz.",
      )
      return results
    } catch (error) {
      setMessage(
        `${results.length ? "Bir yüz kaydedildi. " : ""}${error instanceof Error ? error.message : "Kayıt başarısız. Lütfen tekrar deneyin."}`,
      )
      return []
    } finally {
      setBusy(false)
    }
  }
  const addPrintedToCart = async () => {
    if (!valid || !variant || busy) return
    let activeSaved = saved
    if (activeSaved.length !== layers.length) {
      activeSaved = await save()
      if (activeSaved.length !== layers.length) return
    }
    setBusy(true)
    setMessage("Baskılı ürün sepetinize ekleniyor…")
    try {
      await addSavedDesignsToMedusaCart({
        designIds: activeSaved.map((d) => d.id),
        quantity,
        technique,
        countryCode,
      })
      setMessage(
        "Tasarım kalıcı kaydedildi ve baskılı ürün sepetinize eklendi.",
      )
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Baskılı ürün sepete eklenemedi.",
      )
    } finally {
      setBusy(false)
    }
  }
  const show2d = async () => {
    if (!active) {
      setMessage("Önce bu yüze bir tasarım yükleyin.")
      return
    }
    try {
      setPreview(
        await createProductionPreview(color, {
          ...printPlacement(active),
          side,
          url: active.url,
        }),
      )
      setMode("2d")
    } catch {
      setMessage("Önizleme oluşturulamadı.")
    }
  }
  const exportDraft = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            productId: product.id,
            variantId: variant?.id,
            quantity,
            technique,
            designs: saved,
            artworks,
            coordinateSystem: "torso-mm-v1",
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    )
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "nizamlar-tasarim.json"
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Dialog
      open
      onClose={() => {
        if (!busy) onClose?.()
      }}
      className="studio-dialog"
    >
      <div className="studio-overlay" />
      <div className="studio-scroll">
        <DialogPanel className="studio-panel">
          <header className="studio-header">
            <div>
              <p className="studio-eyebrow">NİZAMLAR / DESIGN LAB</p>
              <DialogTitle>Fikrini kumaşa taşı.</DialogTitle>
            </div>
            <button
              onClick={onClose}
              disabled={busy}
              aria-label="Stüdyoyu kapat"
            >
              Kapat ×
            </button>
          </header>
          <div className="studio-workspace">
            <div className="studio-canvas-area">
              <div className="studio-toolbar">
                <div>
                  {(["front", "back"] as const).map((s) => (
                    <button
                      key={s}
                      aria-pressed={side === s}
                      onClick={() => {
                        setSide(s)
                        setMode("3d")
                      }}
                    >
                      {s === "front" ? "Ön Yüz" : "Arka Yüz"}
                      {artworks[s] ? " ·" : ""}
                    </button>
                  ))}
                </div>
                <div>
                  <button
                    aria-pressed={mode === "3d"}
                    onClick={() => setMode("3d")}
                  >
                    3D
                  </button>
                  <button
                    aria-pressed={mode === "2d"}
                    onClick={() => void show2d()}
                  >
                    2D Önizleme
                  </button>
                </div>
              </div>
              <div className="studio-canvas" data-testid="studio-canvas">
                {mode === "3d" ? (
                  <Studio3DViewer side={side} color={color} layers={layers} />
                ) : (
                  <img
                    src={preview}
                    alt="Üretim ölçüleriyle 2D baskı önizlemesi"
                  />
                )}
              </div>
              <p className="studio-canvas-caption">
                Döndürmek için sürükleyin · Yakınlaşmak için iki parmağınızı
                kullanın
              </p>
              <div className="studio-product-info">
                <span>{product.title}</span>
                <span>
                  {Object.values(options).join(" / ")} · {quantity} adet
                </span>
              </div>
            </div>
            <aside className="studio-controls">
              <section>
                <h3>01 / Ürün</h3>
                <div className="studio-selectors">
                  {product.options?.map((o) => (
                    <label key={o.id}>
                      {o.title}
                      <select
                        value={options[o.id] || ""}
                        onChange={(e) => {
                          setOptions((p) => ({ ...p, [o.id]: e.target.value }))
                          setSaved([])
                        }}
                        aria-label={`Stüdyo ${o.title}`}
                        disabled={busy}
                      >
                        {o.values?.map((v) => (
                          <option key={v.value} value={v.value}>
                            {v.value}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <label>
                    Adet
                    <input
                      aria-label="Stüdyo adet"
                      type="number"
                      min={1}
                      max={999}
                      value={quantity}
                      disabled={busy}
                      onChange={(e) => {
                        setQuantity(
                          Math.min(
                            999,
                            Math.max(
                              1,
                              Math.floor(Number(e.target.value) || 1),
                            ),
                          ),
                        )
                        setSaved([])
                      }}
                    />
                  </label>
                </div>
                {!variant && (
                  <p className="studio-warning">
                    Bu renk ve beden birleşimi mevcut değil.
                  </p>
                )}
              </section>
              <section>
                <h3>02 / {side === "front" ? "Ön" : "Arka"} tasarım</h3>
                <input
                  ref={input}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-label="Logo yükle"
                  disabled={busy}
                  onChange={(e) => void upload(e.target.files?.[0])}
                />
                <button
                  className="studio-upload"
                  disabled={busy}
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (!busy) void upload(e.dataTransfer.files[0])
                  }}
                >
                  <span>+</span>
                  {active?.fileName || "Logonuzu yükleyin veya bırakın"}
                  <small>PNG, JPG, WebP · En fazla 25 MB</small>
                </button>
                {active && (
                  <div className="studio-transforms">
                    {(
                      [
                        ["Genişlik (mm)", "widthMm", 20, 300],
                        ["Yatay konum (mm)", "xMm", -140, 140],
                        ["Dikey konum (mm)", "yMm", -180, 180],
                        ["Döndürme (°)", "rotation", -180, 180],
                      ] as const
                    ).map(([label, key, min, max]) => (
                      <label key={key}>
                        {label}
                        <output>{active[key]}</output>
                        <input
                          type="range"
                          aria-label={label}
                          min={min}
                          max={max}
                          value={active[key]}
                          disabled={busy}
                          onChange={(e) =>
                            update({ [key]: Number(e.target.value) })
                          }
                        />
                      </label>
                    ))}
                    <p>
                      {Math.round(active.widthMm)} ×{" "}
                      {Math.round(active.widthMm / active.aspect)} mm ·{" "}
                      {Math.round(
                        (active.widthMm * active.widthMm) / active.aspect / 100,
                      )}{" "}
                      cm²
                    </p>
                    <div className="studio-presets">
                      <button
                        onClick={() =>
                          update({
                            widthMm: Math.min(90, 100 * active.aspect),
                            xMm: -75,
                            yMm: -95,
                            rotation: 0,
                          })
                        }
                      >
                        Sol göğüs
                      </button>
                      <button
                        onClick={() =>
                          update({
                            widthMm: Math.min(180, 280 * active.aspect),
                            xMm: 0,
                            yMm: 0,
                            rotation: 0,
                          })
                        }
                      >
                        Ortala
                      </button>
                      <button
                        onClick={() => {
                          setArtworks((a) => {
                            const next = { ...a }
                            delete next[side]
                            return next
                          })
                          setSaved([])
                        }}
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                )}
              </section>
              <section>
                <h3>03 / Üretim</h3>
                <label className="studio-technique">
                  Baskı tekniği
                  <select
                    aria-label="Baskı tekniği"
                    value={technique}
                    disabled={busy}
                    onChange={(e) => {
                      setTechnique(e.target.value)
                      setSaved([])
                    }}
                  >
                    <option value="dtf">DTF Dijital Baskı</option>
                    <option value="serigrafi">Serigrafi</option>
                  </select>
                </label>
                <p className="studio-price-note">
                  Birim ürün:{" "}
                  {convertToLocale({
                    amount: baseUnitPrice,
                    currency_code: currencyCode,
                  })}{" "}
                  · Baskı ({layers.length || 1} yüz): +
                  {convertToLocale({
                    amount: printUnitCost,
                    currency_code: currencyCode,
                  })}{" "}
                  · Toplam ({quantity} adet):{" "}
                  <strong>
                    {convertToLocale({
                      amount: grandTotal,
                      currency_code: currencyCode,
                    })}
                  </strong>
                </p>
                {layers.length > 0 && !valid && (
                  <p role="alert" className="studio-warning">
                    Baskı 320 × 400 mm alanın dışına taşıyor. Boyutu veya konumu
                    düzeltin.
                  </p>
                )}
              </section>
              <button
                className="studio-save"
                disabled={!valid || !variant || busy}
                onClick={() => void save()}
              >
                {busy ? "Kaydediliyor…" : "Tasarımı Kalıcı Kaydet"}
              </button>
              <button
                className="studio-checkout"
                data-testid="add-printed-to-cart"
                disabled={!valid || !variant || busy}
                onClick={() => void addPrintedToCart()}
              >
                {busy
                  ? "İşleniyor…"
                  : `Baskılı Sepete Ekle · ${convertToLocale({
                      amount: grandTotal,
                      currency_code: currencyCode,
                    })}`}
              </button>
              <button
                className="studio-export"
                disabled={!layers.length}
                onClick={exportDraft}
              >
                Üretim taslağını indir ↗
              </button>
              <p role="status" className="studio-status">
                {message}
              </p>
              {saved.map((d) => (
                <div
                  key={d.id}
                  className="studio-saved"
                  data-testid="saved-design"
                >
                  <span>
                    {d.side === "front" ? "Ön" : "Arka"} · {d.id}
                  </span>
                  <small>
                    Orijinal dosya, önizleme ve fiziksel ölçüler saklandı.
                  </small>
                </div>
              ))}
            </aside>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
