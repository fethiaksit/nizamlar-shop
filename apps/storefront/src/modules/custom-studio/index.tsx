"use client"

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { HttpTypes } from "@medusajs/types"
import { sdk } from "@lib/config"
import {
  colorHex,
  getVariantOptions,
  isTshirt,
  printPlacement,
  variantColor,
} from "@lib/3d/product"
import {
  DTF_GARMENT_DISCLAIMER,
  requestServerDtfQuote,
  resolveProductDtfType,
  type DtfDimensionUnit,
  type DtfSavedDesignAssetResponse,
  type DtfVerifiedQuote,
} from "@lib/data/dtf"
import { isVariantInStock } from "@lib/util/inventory"
import { convertToLocale } from "@lib/util/money"
import type { PrintLayer } from "@modules/garment-3d/garment-model"
import Studio3DViewer from "./studio-3d-viewer"
import InteractiveCanvas2D, { type Artwork } from "./interactive-canvas-2d"
import {
  createTransparentDtfPrintPng,
  inspectClientArtworkForDtf,
  type DtfClientResolutionInfo,
} from "./preview"
import {
  addSavedDesignsToMedusaCart,
  addSavedDtfTransferToCart,
  calculateClientPrintPricing,
  saveCustomDesignSurface,
  saveCustomDtfTransferSurface,
} from "./design-order-service"

const DTF_STUDIO_PREVIEW_SWATCHES = [
  { name: "Anthracite", hex: "#222325" },
  { name: "Off-White", hex: "#F4F1E9" },
  { name: "Warm Gold", hex: "#B29460" },
  { name: "Espresso Brown", hex: "#49372E" },
  { name: "Stone Cream", hex: "#E6DFD2" },
  { name: "Jet Black", hex: "#18191B" },
] as const

type Side = "front" | "back"
type SavedDesign = { id: string; side: Side; previewUrl: string }

export default function CustomPrintStudio({
  product: initialProduct,
  region,
  countryCode,
  initialVariant,
  initialQuantity = 1,
  dtfMode,
  onClose,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  initialVariant?: HttpTypes.StoreProductVariant
  initialQuantity?: number
  dtfMode?: boolean
  onClose?: () => void
}) {
  const isDtfTransferStudio = useMemo(
    () =>
      Boolean(dtfMode) ||
      (countryCode || "").toLowerCase() === "us" ||
      Boolean(resolveProductDtfType(initialProduct, countryCode)),
    [dtfMode, countryCode, initialProduct],
  )
  // Product & available t-shirts state
  const [product, setProduct] = useState<HttpTypes.StoreProduct>(initialProduct)
  const [availableTshirts, setAvailableTshirts] = useState<HttpTypes.StoreProduct[]>([])

  // Fetch all available t-shirts once
  useEffect(() => {
    let active = true
    sdk.client
      .fetch<HttpTypes.StoreProductListResponse>("/store/products?limit=25")
      .then((res) => {
        if (!active) return
        const tshirts = (res.products || []).filter(
          (p) => isTshirt(p) || p.handle?.includes("t-shirt") || p.handle?.includes("tee"),
        )
        if (tshirts.length > 0) {
          setAvailableTshirts(tshirts)
        }
      })
      .catch(() => {
        // Fallback: use current product
      })
    return () => {
      active = false
    }
  }, [])

  // Variant options
  const [options, setOptions] = useState(() =>
    getVariantOptions(
      initialVariant || initialProduct.variants?.find(isVariantInStock),
    ),
  )
  const [quantity, setQuantity] = useState(initialQuantity)
  const [side, setSide] = useState<Side>("front")
  const [artworks, setArtworks] = useState<Partial<Record<Side, Artwork>>>({})
  const [technique, setTechnique] = useState("dtf")
  const [mode, setMode] = useState<"3d" | "2d">("3d")
  const [cameraResetKey, setCameraResetKey] = useState(0)
  const [mobileTab, setMobileTab] = useState<"product" | "tools">("tools")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  const [saved, setSaved] = useState<SavedDesign[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // DTF Transfer Studio State (active when isDtfTransferStudio === true)
  const [dtfUnit, setDtfUnit] = useState<DtfDimensionUnit>("in")
  const [dtfWidth, setDtfWidth] = useState<number>(10)
  const [dtfHeight, setDtfHeight] = useState<number>(11)
  const [dtfLockAspect, setDtfLockAspect] = useState<boolean>(true)
  const [dtfPreviewSwatch, setDtfPreviewSwatch] = useState<{
    name: string
    hex: string
  }>(DTF_STUDIO_PREVIEW_SWATCHES[0])
  const [dtfQuote, setDtfQuote] = useState<DtfVerifiedQuote | null>(null)
  const [dtfResolution, setDtfResolution] =
    useState<DtfClientResolutionInfo | null>(null)
  const [dtfAllowLowDpi, setDtfAllowLowDpi] = useState<boolean>(false)
  const [dtfSavedAsset, setDtfSavedAsset] =
    useState<DtfSavedDesignAssetResponse | null>(null)

  // Undo / Redo History Stack
  const [history, setHistory] = useState<Array<Partial<Record<Side, Artwork>>>>([{}])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Push new state to history
  const pushHistory = useCallback(
    (newArtworks: Partial<Record<Side, Artwork>>) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1)
        return [...next, { ...newArtworks }]
      })
      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex],
  )

  // Listen to 2D / 3D artwork errors and notify user
  useEffect(() => {
    const handleStudioError = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.message) {
        setMessage(`⚠️ ${detail.message}`)
      }
    }
    window.addEventListener("nizamlar:studio-error", handleStudioError)
    return () => {
      window.removeEventListener("nizamlar:studio-error", handleStudioError)
    }
  }, [])

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1
      const restored = history[targetIndex] || {}
      setHistoryIndex(targetIndex)
      setArtworks(restored)
      setSaved([])
      setMessage("İşlem geri alındı.")
    }
  }, [history, historyIndex])

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1
      const restored = history[targetIndex] || {}
      setHistoryIndex(targetIndex)
      setArtworks(restored)
      setSaved([])
      setMessage("İşlem yinelendi.")
    }
  }, [history, historyIndex])

  // Keyboard Shortcuts (Ctrl+Z / Cmd+Z for Undo, Ctrl+Shift+Z / Cmd+Shift+Z / Ctrl+Y for Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return
      }
      const isMac =
        typeof navigator !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const modifier = isMac ? e.metaKey : e.ctrlKey
      if (modifier && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
      } else if (modifier && e.key.toLowerCase() === "y") {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleUndo, handleRedo])

  // Active Variant lookup
  const variant = useMemo(
    () =>
      product.variants?.find((v) =>
        (product.options || []).every(
          (o) => getVariantOptions(v)[o.id] === options[o.id],
        ),
      ),
    [product, options],
  )

  const isStock = useMemo(() => {
    if (!variant) return false
    return isVariantInStock(variant)
  }, [variant])

  const variantColorHex = variantColor(product, variant)
  const color = isDtfTransferStudio ? dtfPreviewSwatch.hex : variantColorHex
  const activeArtwork = artworks[side]

  // Convert artworks to 3D print layers
  const layers: PrintLayer[] = useMemo(
    () =>
      Object.entries(artworks).map(([surface, art]) => ({
        url: art!.url,
        side: surface as Side,
        ...printPlacement(art!),
      })),
    [artworks],
  )

  // Physical placement validation across all layers
  const valid =
    layers.length > 0 &&
    Object.values(artworks).every((art) => art && printPlacement(art).valid)

  // Current active surface placement
  const activePlacement = useMemo(() => {
    if (!activeArtwork) return null
    return printPlacement(activeArtwork)
  }, [activeArtwork])

  // Pricing calculations
  const currencyCode =
    variant?.calculated_price?.currency_code || region.currency_code || "try"
  const fallbackPrice =
    product.variants?.find((v) => v.calculated_price?.calculated_amount)
      ?.calculated_price?.calculated_amount || 0
  const baseUnitPrice =
    variant?.calculated_price?.calculated_amount || fallbackPrice || 0
  const maxWidthMm = Math.max(
    0,
    ...Object.values(artworks).map((a) => a?.widthMm || 0),
  )

  const { printUnitCost, grandTotal, discountPct } = calculateClientPrintPricing({
    baseUnitPrice,
    technique,
    maxWidthMm,
    surfaceCount: layers.length,
    quantity,
  })

  // Update artwork helper
  const updateActiveArtwork = useCallback(
    (patch: Partial<Artwork>, pushToHistoryFlag = false) => {
      const currSide = artworks[side]
      if (!currSide) return
      const nextArt = { ...currSide, ...patch }
      const nextMap = { ...artworks, [side]: nextArt }
      setArtworks(nextMap)
      if (pushToHistoryFlag) {
        pushHistory(nextMap)
      }
      setSaved([])
      setDtfSavedAsset(null)
      setMessage("")
    },
    [artworks, pushHistory, side],
  )

  const switchDtfUnit = (nextUnit: DtfDimensionUnit) => {
    if (nextUnit === dtfUnit) return
    const factor = nextUnit === "cm" ? 2.54 : 1 / 2.54
    setDtfWidth(Number((dtfWidth * factor).toFixed(2)))
    setDtfHeight(Number((dtfHeight * factor).toFixed(2)))
    setDtfUnit(nextUnit)
    setDtfSavedAsset(null)
  }

  const applyDtfDimensions = (nextW: number, nextH?: number) => {
    const minVal = dtfUnit === "in" ? 0.5 : 1.27
    const maxW = dtfUnit === "in" ? 22 : 55.88
    const maxH = dtfUnit === "in" ? 120 : 304.8
    const clampedW = Math.max(minVal, Math.min(maxW, Number(nextW.toFixed(2))))
    const aspect = activeArtwork?.aspect || dtfWidth / Math.max(0.1, dtfHeight) || 1
    const rawH =
      typeof nextH === "number"
        ? nextH
        : dtfLockAspect
          ? clampedW / Math.max(0.1, aspect)
          : dtfHeight
    const clampedH = Math.max(minVal, Math.min(maxH, Number(rawH.toFixed(2))))
    setDtfWidth(clampedW)
    setDtfHeight(clampedH)
    setDtfSavedAsset(null)

    if (activeArtwork) {
      const widthMm = Math.round(
        (dtfUnit === "in" ? clampedW * 25.4 : clampedW * 10)
      )
      updateActiveArtwork({
        widthMm: Math.max(25, Math.min(300, widthMm)),
      })
    }
  }

  // Live server USD quote for DTF Transfer Studio mode
  useEffect(() => {
    if (!isDtfTransferStudio) return
    let active = true
    requestServerDtfQuote({
      productType: "custom_dtf",
      unit: dtfUnit,
      width: dtfWidth,
      height: dtfHeight,
      quantity,
    })
      .then((res) => {
        if (!active) return
        setDtfQuote(res.quote)
      })
      .catch(() => {
        if (!active) return
        setDtfQuote(null)
      })
    return () => {
      active = false
    }
  }, [isDtfTransferStudio, dtfUnit, dtfWidth, dtfHeight, quantity])

  // Live client resolution / DPI & alpha transparency inspection
  useEffect(() => {
    if (!isDtfTransferStudio || !activeArtwork) {
      return
    }
    let active = true
    const widthIn = dtfUnit === "in" ? dtfWidth : dtfWidth / 2.54
    const heightIn = dtfUnit === "in" ? dtfHeight : dtfHeight / 2.54
    inspectClientArtworkForDtf({
      artworkUrl: activeArtwork.url,
      mimeType: activeArtwork.mime,
      widthIn,
      heightIn,
    })
      .then((info) => {
        if (active) setDtfResolution(info)
      })
      .catch(() => {
        if (active) setDtfResolution(null)
      })
    return () => {
      active = false
    }
  }, [isDtfTransferStudio, activeArtwork, dtfUnit, dtfWidth, dtfHeight])

  const handleDownloadTransparentDtfPng = async () => {
    if (!activeArtwork) return
    try {
      const widthIn = dtfUnit === "in" ? dtfWidth : dtfWidth / 2.54
      const heightIn = dtfUnit === "in" ? dtfHeight : dtfHeight / 2.54
      const pngDataUrl = await createTransparentDtfPrintPng({
        artworkUrl: activeArtwork.url,
        widthIn,
        heightIn,
        rotationDeg: activeArtwork.rotation,
        targetDpi: 300,
      })
      const a = document.createElement("a")
      a.href = pngDataUrl
      a.download = `nizamlar-dtf-print-ready-${widthIn.toFixed(1)}x${heightIn.toFixed(1)}in.png`
      a.click()
      setMessage(
        "Print-ready transparent PNG exported (artwork only, zero garment background)."
      )
    } catch (err) {
      setMessage(
        err instanceof Error
          ? err.message
          : "Could not export print-ready transparent PNG."
      )
    }
  }

  // Safe SVG sanitization and rasterization to PNG
  const convertSvgToPngDataUrl = async (
    svgText: string,
  ): Promise<{ dataUrl: string; width: number; height: number }> => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(svgText, "image/svg+xml")
    const parserError = doc.querySelector("parsererror")
    if (parserError) {
      throw new Error("SVG dosyası ayrıştırılamadı. Lütfen geçerli bir SVG vektör dosyası yükleyin.")
    }

    // XSS sanitization: remove scripts, foreignObject, and inline event handlers
    doc.querySelectorAll("script, foreignObject").forEach((el) => el.remove())
    doc.querySelectorAll("*").forEach((el) => {
      for (const attr of el.getAttributeNames()) {
        if (attr.toLowerCase().startsWith("on")) {
          el.removeAttribute(attr)
        }
      }
    })

    const svgElement = doc.documentElement
    let w = parseFloat(svgElement.getAttribute("width") || "0")
    let h = parseFloat(svgElement.getAttribute("height") || "0")
    if (!w || !h || isNaN(w) || isNaN(h)) {
      const viewBox = svgElement.getAttribute("viewBox")
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/).map(Number)
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          w = parts[2]
          h = parts[3]
        }
      }
    }
    if (!w || !h || isNaN(w) || isNaN(h)) {
      w = 800
      h = 800
    }

    const scale = Math.min(1600 / Math.max(w, h), 2)
    const targetW = Math.max(100, Math.round(w * scale))
    const targetH = Math.max(100, Math.round(h * scale))

    svgElement.setAttribute("width", String(targetW))
    svgElement.setAttribute("height", String(targetH))

    const cleanSvgString = new XMLSerializer().serializeToString(doc)
    const blob = new Blob([cleanSvgString], { type: "image/svg+xml;charset=utf-8" })
    const blobUrl = URL.createObjectURL(blob)

    try {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("SVG görseli oluşturulamadı."))
        img.src = blobUrl
      })

      const canvas = document.createElement("canvas")
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas 2D başlatılamadı.")
      ctx.drawImage(img, 0, 0, targetW, targetH)
      const dataUrl = canvas.toDataURL("image/png")
      return { dataUrl, width: targetW, height: targetH }
    } finally {
      URL.revokeObjectURL(blobUrl)
    }
  }

  // File upload handler supporting PNG, JPG, WebP and safe SVG
  const handleUpload = async (file?: File) => {
    if (!file) return
    setMessage("")

    const name = file.name || "logo"
    const ext = "." + (name.split(".").pop() || "").toLowerCase()
    const mime = (file.type || "").toLowerCase().trim()

    const isPng = mime === "image/png" || ext === ".png"
    const isJpg =
      mime === "image/jpeg" ||
      mime === "image/jpg" ||
      mime === "image/pjpeg" ||
      ext === ".jpg" ||
      ext === ".jpeg"
    const isWebp = mime === "image/webp" || ext === ".webp"
    const isSvg = mime === "image/svg+xml" || ext === ".svg"

    if (!isPng && !isJpg && !isWebp && !isSvg) {
      setMessage("Desteklenmeyen dosya türü. Lütfen PNG, JPG, WebP veya SVG formatında bir görsel yükleyin.")
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      setMessage("Dosya boyutu çok büyük (en fazla 25 MB yükleyebilirsiniz).")
      return
    }

    try {
      let url = ""
      let aspect = 1
      let finalMime = "image/png"

      if (isSvg) {
        setMessage("Vektör logo işleniyor…")
        const svgText = await file.text()
        const converted = await convertSvgToPngDataUrl(svgText)
        url = converted.dataUrl
        aspect = converted.width / converted.height
        finalMime = "image/png"
      } else {
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error("Dosya okunamadı."))
          reader.readAsDataURL(file)
        })

        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("Görsel formatı okunamadı veya dosya bozuk."))
          img.src = url
        })

        const nw = img.naturalWidth || 100
        const nh = img.naturalHeight || 100
        aspect = nw / nh
        finalMime = isWebp ? "image/webp" : isJpg ? "image/jpeg" : "image/png"
      }

      if (!aspect || isNaN(aspect) || aspect <= 0) {
        aspect = 1
      }

      const initialWidth =
        side === "front"
          ? Math.min(180, Math.round(240 * aspect))
          : Math.min(220, Math.round(260 * aspect))

      const newArt: Artwork = {
        url,
        fileName: file.name,
        mime: finalMime,
        aspect,
        widthMm: Math.max(30, Math.min(260, Math.round(initialWidth))),
        xMm: 0,
        yMm: side === "front" ? -30 : 0,
        rotation: 0,
      }

      const nextArtworks = {
        ...artworks,
        [side]: newArt,
      }
      setArtworks(nextArtworks)
      pushHistory(nextArtworks)
      setSaved([])
      setDtfSavedAsset(null)
      if (isDtfTransferStudio) {
        const baseWIn = Math.min(12, Math.max(3.5, Number((newArt.widthMm / 25.4).toFixed(2))))
        const baseHIn = Math.min(16, Math.max(1, Number((baseWIn / Math.max(0.1, aspect)).toFixed(2))))
        setDtfWidth(
          dtfUnit === "in" ? baseWIn : Number((baseWIn * 2.54).toFixed(2))
        )
        setDtfHeight(
          dtfUnit === "in" ? baseHIn : Number((baseHIn * 2.54).toFixed(2))
        )
        setMessage(
          `Artwork uploaded (${file.name}). ${DTF_GARMENT_DISCLAIMER}`
        )
      } else {
        setMessage(`${side === "front" ? "Ön" : "Arka"} yüz tasarımı başarıyla yüklendi.`)
      }
    } catch (err) {
      console.error("[Logo Upload Error]:", err)
      const errMsg =
        err instanceof Error ? err.message : "Görsel yüklenirken bir hata oluştu."
      setMessage(`Görsel yüklenemedi: ${errMsg}`)
    }
  }

  // Clear current side
  const handleClearCurrentSide = () => {
    if (!artworks[side]) return
    const nextArtworks = { ...artworks }
    delete nextArtworks[side]
    setArtworks(nextArtworks)
    pushHistory(nextArtworks)
    setSaved([])
    setMessage(`${side === "front" ? "Ön" : "Arka"} yüz tasarımı kaldırıldı.`)
  }

  // Fit to bounds
  const handleFitToBounds = () => {
    if (!activeArtwork) return
    const safeWidth = Math.min(activeArtwork.widthMm, 220)
    updateActiveArtwork(
      {
        xMm: 0,
        yMm: 0,
        widthMm: safeWidth,
        rotation: 0,
      },
      true,
    )
    setMessage("Tasarım baskı sınırlarına ortalandı.")
  }

  // Presets
  const applyPreset = (
    preset:
      | "left-chest"
      | "right-chest"
      | "center-chest"
      | "back-full"
      | "back-upper"
      | "center",
  ) => {
    if (!activeArtwork) return
    const asp = activeArtwork.aspect || 1
    if (preset === "left-chest") {
      updateActiveArtwork(
        {
          widthMm: Math.min(85, Math.round(90 * asp)),
          xMm: -75,
          yMm: -95,
          rotation: 0,
        },
        true,
      )
      setMessage("Sol göğüs konumu uygulandı.")
    } else if (preset === "right-chest") {
      updateActiveArtwork(
        {
          widthMm: Math.min(85, Math.round(90 * asp)),
          xMm: 75,
          yMm: -95,
          rotation: 0,
        },
        true,
      )
      setMessage("Sağ göğüs konumu uygulandı.")
    } else if (preset === "center-chest") {
      updateActiveArtwork(
        {
          widthMm: Math.min(180, Math.round(220 * asp)),
          xMm: 0,
          yMm: -60,
          rotation: 0,
        },
        true,
      )
      setMessage("Orta göğüs konumu uygulandı.")
    } else if (preset === "back-full") {
      updateActiveArtwork(
        {
          widthMm: Math.min(240, Math.round(280 * asp)),
          xMm: 0,
          yMm: 0,
          rotation: 0,
        },
        true,
      )
      setMessage("Tam sırt konumu uygulandı.")
    } else if (preset === "back-upper") {
      updateActiveArtwork(
        {
          widthMm: Math.min(180, Math.round(200 * asp)),
          xMm: 0,
          yMm: -80,
          rotation: 0,
        },
        true,
      )
      setMessage("Üst sırt konumu uygulandı.")
    } else if (preset === "center") {
      updateActiveArtwork(
        {
          xMm: 0,
          yMm: 0,
          rotation: 0,
        },
        true,
      )
      setMessage("Tasarım ortalandı.")
    }
  }

  // Save designs to backend
  const handleSave = async (): Promise<SavedDesign[]> => {
    if (isDtfTransferStudio) {
      if (!activeArtwork || busy) return []
      if (
        dtfResolution &&
        !dtfResolution.meetsMinimum150Dpi &&
        !dtfAllowLowDpi
      ) {
        setMessage(
          `Artwork resolution (${dtfResolution.effectiveDpi} DPI) is below 150 DPI minimum. Reduce print size, upload higher-DPI file, or confirm low-DPI override.`
        )
        return []
      }
      setBusy(true)
      setMessage("Validating artwork DPI, generating transparent print PNG & saving DTF transfer…")
      try {
        const res = await saveCustomDtfTransferSurface({
          productHandle: product.handle || undefined,
          artwork: activeArtwork,
          side,
          unit: dtfUnit,
          width: dtfWidth,
          height: dtfHeight,
          quantity,
          previewColorHex: dtfPreviewSwatch.hex,
          previewColorName: dtfPreviewSwatch.name,
          allowLowDpi: dtfAllowLowDpi,
        })
        setDtfSavedAsset(res)
        setDtfQuote(res.quote)
        const item: SavedDesign = {
          id: res.designAsset.id,
          side,
          previewUrl: res.mockupUrl || "",
        }
        setSaved([item])
        setMessage(
          `DTF transfer saved (${res.quote.dimensions.widthIn}" x ${res.quote.dimensions.heightIn}", ${res.resolutionReport.effectiveDpi} DPI). ${DTF_GARMENT_DISCLAIMER}`
        )
        return [item]
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not save custom DTF transfer design."
        )
        return []
      } finally {
        setBusy(false)
      }
    }

    if (!valid || !variant || !isStock || busy) return []
    setBusy(true)
    setMessage("Tasarım ve üretim ölçüleri sunucuya kaydediliyor…")
    const results: SavedDesign[] = []
    try {
      const colorOption = product.options?.find((o) =>
        /^(renk|color|colour)$/i.test(o.title),
      )
      const sizeOption = product.options?.find((o) =>
        /^(beden|size)$/i.test(o.title),
      )

      for (const [surface, art] of Object.entries(artworks)) {
        if (!art) continue
        const savedSurface = await saveCustomDesignSurface({
          product,
          variant,
          side: surface as Side,
          artwork: art,
          colorHex: color,
          colorName: colorOption ? options[colorOption.id] || "" : "",
          sizeName: sizeOption ? options[sizeOption.id] || "" : "",
          quantity,
          technique,
        })
        results.push({
          id: savedSurface.id,
          side: savedSurface.side,
          previewUrl: savedSurface.previewUrl,
        })
        setSaved([...results])
      }
      setMessage("Tasarım kalıcı olarak kaydedildi. Baskılı ürünü sepetinize ekleyebilirsiniz.")
      return results
    } catch (error) {
      setMessage(
        `${results.length ? "Bir yüz kaydedildi. " : ""}${
          error instanceof Error ? error.message : "Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin."
        }`,
      )
      return []
    } finally {
      setBusy(false)
    }
  }

  // Add to Medusa Cart
  const handleAddToCart = async () => {
    if (isDtfTransferStudio) {
      if (!activeArtwork || busy) return
      const carrierVariant = variant || product.variants?.[0]
      if (!carrierVariant) {
        setMessage("No carrier variant available for cart checkout.")
        return
      }
      let currentDtfSaved = dtfSavedAsset
      if (!currentDtfSaved) {
        setBusy(true)
        try {
          currentDtfSaved = await saveCustomDtfTransferSurface({
            productHandle: product.handle || undefined,
            artwork: activeArtwork,
            side,
            unit: dtfUnit,
            width: dtfWidth,
            height: dtfHeight,
            quantity,
            previewColorHex: dtfPreviewSwatch.hex,
            previewColorName: dtfPreviewSwatch.name,
            allowLowDpi: dtfAllowLowDpi,
          })
          setDtfSavedAsset(currentDtfSaved)
          setSaved([
            {
              id: currentDtfSaved.designAsset.id,
              side,
              previewUrl: currentDtfSaved.mockupUrl || "",
            },
          ])
        } catch (err) {
          setBusy(false)
          setMessage(
            err instanceof Error
              ? err.message
              : "Failed to validate & save DTF transfer artwork."
          )
          return
        }
      }

      setBusy(true)
      setMessage("Adding custom DTF transfer film to cart…")
      try {
        await addSavedDtfTransferToCart({
          variantId: carrierVariant.id,
          savedTransfer: currentDtfSaved,
          previewColorName: dtfPreviewSwatch.name,
          previewColorHex: dtfPreviewSwatch.hex,
          countryCode,
        })
        setMessage(
          `Custom DTF transfer (${currentDtfSaved.quote.dimensions.widthIn}" x ${currentDtfSaved.quote.dimensions.heightIn}") added to cart! ${DTF_GARMENT_DISCLAIMER}`
        )
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Could not add DTF transfer to cart."
        )
      } finally {
        setBusy(false)
      }
      return
    }

    if (!valid || !variant || !isStock || busy) return
    let activeSaved = saved
    if (activeSaved.length !== layers.length) {
      activeSaved = await handleSave()
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
      setMessage("Baskılı tişört başarıyla sepetinize eklendi! Alışverişe devam edebilir veya sepete gidebilirsiniz.")
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Baskılı ürün sepete eklenemedi. Lütfen tekrar deneyin.",
      )
    } finally {
      setBusy(false)
    }
  }

  // Export Draft JSON
  const handleExportDraft = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            nizamlarStudio: "v2.0",
            productId: product.id,
            productTitle: product.title,
            variantId: variant?.id,
            color,
            options,
            quantity,
            technique,
            artworks,
            layers,
            pricing: {
              baseUnitPrice,
              printUnitCost,
              grandTotal,
              discountPct,
              currencyCode,
            },
            designs: saved,
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
    a.download = `nizamlar-tasarim-${product.handle || "tee"}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Product color options & size options
  const colorOption = product.options?.find((o) => /^(renk|color|colour)$/i.test(o.title))
  const sizeOption = product.options?.find((o) => /^(beden|size)$/i.test(o.title))
  const otherOptions = product.options?.filter(
    (o) => o.id !== colorOption?.id && o.id !== sizeOption?.id,
  )

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
          {/* GİZLİ VE GÜVENİLİR DOSYA SEÇİCİ INPUT (HER ZAMAN DOM'DA) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
            aria-label="Logo veya görsel yükle"
            disabled={busy}
            tabIndex={-1}
            style={{
              position: "fixed",
              top: "-10000px",
              left: "-10000px",
              opacity: 0,
              width: "1px",
              height: "1px",
              pointerEvents: "none",
            }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = "" // Aynı dosyayı tekrar seçebilmeyi sağlar
              if (file) void handleUpload(file)
            }}
          />

          {/* HEADER */}
          <header className="studio-header">
            <div className="min-w-0 flex-1">
              <p className="studio-eyebrow">
                {isDtfTransferStudio
                  ? "NIZAMLAR / CUSTOM DTF TRANSFER STUDIO"
                  : "NİZAMLAR / DESIGN LAB"}
              </p>
              <DialogTitle className="truncate">
                {isDtfTransferStudio ? (
                  `Custom DTF Transfer Studio — ${DTF_GARMENT_DISCLAIMER}`
                ) : (
                  <>{product.title} — Özel Tasarım Stüdyosu</>
                )}
              </DialogTitle>
            </div>
            <button
              onClick={onClose}
              disabled={busy}
              aria-label={isDtfTransferStudio ? "Close DTF studio" : "Stüdyoyu kapat"}
              className="shrink-0"
            >
              {isDtfTransferStudio ? "Close ×" : "Kapat ×"}
            </button>
          </header>

          {/* MOBİL TAB BUTONLARI (<= 1024px) */}
          <div className="flex md:hidden bg-[#FFFFFF] border-b border-[#DDD9D1] px-4 py-2 gap-2">
            <button
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mobileTab === "tools"
                  ? "bg-[#222325] text-[#FFFFFF]"
                  : "bg-[#F7F6F3] text-[#6B6863] border border-[#DDD9D1]"
              }`}
              onClick={() => setMobileTab("tools")}
            >
              01 / Tasarım Araçları
            </button>
            <button
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                mobileTab === "product"
                  ? "bg-[#222325] text-[#FFFFFF]"
                  : "bg-[#F7F6F3] text-[#6B6863] border border-[#DDD9D1]"
              }`}
              onClick={() => setMobileTab("product")}
            >
              02 / Ürün & Beden
            </button>
          </div>

          {/* WORKSPACE 3-KOLON */}
          <div className="studio-workspace">
            {/* SOL KOLON: ÜRÜN, RENK, BEDEN, ADET, BASKI TEKNİĞİ */}
            <aside
              className={`studio-col-left ${
                mobileTab !== "product" ? "hidden md:block" : "block"
              }`}
            >
              {isDtfTransferStudio ? (
                <>
                  <div
                    data-testid="studio-dtf-disclaimer"
                    className="mb-3 rounded-lg border border-[#B29460] bg-[#222325] p-3 text-xs font-bold text-[#FAF9F6]"
                  >
                    {DTF_GARMENT_DISCLAIMER}
                  </div>

                  {/* Preview-Only Garment Color Swatches (No Garment Size Required!) */}
                  <div className="studio-section">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="studio-section-title !mb-0">
                        Preview Fabric Color
                      </h3>
                      <span className="text-xs text-[#B29460] font-semibold">
                        {dtfPreviewSwatch.name} (Preview)
                      </span>
                    </div>
                    <p className="text-[10px] text-[#6B6863] mb-2">
                      3D shirt previews contrast only. Only unapplied DTF transfer film ships.
                    </p>
                    <div
                      className="studio-swatches"
                      role="radiogroup"
                      aria-label="Preview Fabric Color"
                    >
                      {DTF_STUDIO_PREVIEW_SWATCHES.map((swatch) => {
                        const isSelected =
                          dtfPreviewSwatch.hex.toLowerCase() ===
                          swatch.hex.toLowerCase()
                        return (
                          <button
                            key={swatch.name}
                            type="button"
                            className="studio-swatch"
                            style={{ backgroundColor: swatch.hex }}
                            aria-label={`Preview ${swatch.name}`}
                            aria-pressed={isSelected}
                            disabled={busy}
                            onClick={() => {
                              setDtfPreviewSwatch(swatch)
                              setDtfSavedAsset(null)
                            }}
                            title={`${swatch.name} (Preview only)`}
                          />
                        )
                      })}
                    </div>
                  </div>

                  {/* Unit System Toggle (in / cm) */}
                  <div className="studio-section">
                    <h3 className="studio-section-title">Measurement Unit</h3>
                    <div className="studio-sizes" role="radiogroup" aria-label="Unit">
                      {(["in", "cm"] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          className="studio-size-pill"
                          aria-pressed={dtfUnit === u}
                          disabled={busy}
                          onClick={() => switchDtfUnit(u)}
                        >
                          {u === "in" ? "Inches (in)" : "Centimeters (cm)"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Real Physical Print Dimensions */}
                  <div className="studio-section">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="studio-section-title !mb-0">
                        Transfer Print Size ({dtfUnit})
                      </h3>
                      <label className="flex items-center gap-1 text-[10px] font-semibold text-[#49372E] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dtfLockAspect}
                          onChange={(e) => setDtfLockAspect(e.target.checked)}
                        />
                        Lock Ratio
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <label className="flex flex-col gap-1 text-[11px] font-semibold text-[#222325]">
                        <span>Width ({dtfUnit})</span>
                        <input
                          type="number"
                          step="0.1"
                          min={dtfUnit === "in" ? 0.5 : 1.27}
                          max={dtfUnit === "in" ? 22 : 55.88}
                          value={dtfWidth}
                          data-testid="studio-dtf-width"
                          disabled={busy}
                          onChange={(e) =>
                            applyDtfDimensions(Number(e.target.value) || 0.5)
                          }
                          className="w-full rounded-lg border border-[#DDD9D1] bg-[#F7F6F3] p-2 text-xs font-bold text-[#222325]"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-[11px] font-semibold text-[#222325]">
                        <span>Height ({dtfUnit})</span>
                        <input
                          type="number"
                          step="0.1"
                          min={dtfUnit === "in" ? 0.5 : 1.27}
                          max={dtfUnit === "in" ? 120 : 304.8}
                          value={dtfHeight}
                          data-testid="studio-dtf-height"
                          disabled={busy}
                          onChange={(e) =>
                            applyDtfDimensions(
                              dtfWidth,
                              Number(e.target.value) || 0.5
                            )
                          }
                          className="w-full rounded-lg border border-[#DDD9D1] bg-[#F7F6F3] p-2 text-xs font-bold text-[#222325]"
                        />
                      </label>
                    </div>
                    <div className="studio-presets">
                      {[
                        { label: '3.5" × 3.5"', wIn: 3.5, hIn: 3.5 },
                        { label: '8" × 8"', wIn: 8, hIn: 8 },
                        { label: '10" × 11"', wIn: 10, hIn: 11 },
                        { label: '12" × 15"', wIn: 12, hIn: 15 },
                      ].map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            const f = dtfUnit === "in" ? 1 : 2.54
                            applyDtfDimensions(
                              Number((p.wIn * f).toFixed(2)),
                              Number((p.hIn * f).toFixed(2))
                            )
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transfer Quantity */}
                  <div className="studio-section">
                    <h3 className="studio-section-title">Transfer Quantity</h3>
                    <div className="studio-stepper">
                      <button
                        type="button"
                        disabled={busy || quantity <= 1}
                        onClick={() => {
                          setQuantity((q) => Math.max(1, q - 1))
                          setDtfSavedAsset(null)
                        }}
                        aria-label="Decrease transfer quantity"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={quantity}
                        data-testid="studio-dtf-quantity"
                        disabled={busy}
                        onChange={(e) => {
                          const val = Math.min(
                            10000,
                            Math.max(1, Math.floor(Number(e.target.value) || 1))
                          )
                          setQuantity(val)
                          setDtfSavedAsset(null)
                        }}
                        aria-label="Transfer quantity"
                      />
                      <button
                        type="button"
                        disabled={busy || quantity >= 10000}
                        onClick={() => {
                          setQuantity((q) => Math.min(10000, q + 1))
                          setDtfSavedAsset(null)
                        }}
                        aria-label="Increase transfer quantity"
                      >
                        +
                      </button>
                    </div>
                    {dtfQuote && dtfQuote.discountPercent > 0 && (
                      <p className="text-[11px] text-[#B29460] font-bold mt-1.5">
                        -{dtfQuote.discountPercent}% Bulk Transfer Discount Applied
                      </p>
                    )}
                    {dtfQuote && !dtfQuote.minimumOrderMet && (
                      <p className="text-[10px] text-[#49372E] mt-1">
                        Minimum US DTF order floor: ${(dtfQuote.minimumOrderCents / 100).toFixed(2)} USD
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
              {/* Tişört Modeli Seçimi */}
              <div className="studio-section">
                <h3 className="studio-section-title">01 / Tişört Modeli</h3>
                {availableTshirts.length > 1 ? (
                  <select
                    className="w-full bg-[#F7F6F3] text-[#222325] border border-[#DDD9D1] rounded-lg p-2.5 text-xs focus:border-[#B29460] focus:bg-[#FFFFFF] outline-none transition"
                    value={product.id}
                    disabled={busy}
                    onChange={(e) => {
                      const selected = availableTshirts.find((p) => p.id === e.target.value)
                      if (selected) {
                        setProduct(selected)
                        setOptions(
                          getVariantOptions(
                            selected.variants?.find(isVariantInStock) || selected.variants?.[0],
                          ),
                        )
                        setSaved([])
                      }
                    }}
                  >
                    {availableTshirts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-[#222325] font-semibold bg-[#F7F6F3] p-2.5 rounded-lg border border-[#DDD9D1]">
                    {product.title}
                  </div>
                )}
              </div>

              {/* Renk Seçenekleri (Swatches) */}
              {colorOption && (
                <div className="studio-section">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="studio-section-title !mb-0">{colorOption.title}</h3>
                    <span className="text-xs text-[#B29460] font-semibold">
                      {options[colorOption.id] || "Seçiniz"}
                    </span>
                  </div>
                  <div className="studio-swatches" role="radiogroup" aria-label="Renk Seçenekleri">
                    {colorOption.values?.map((v) => {
                      const hex = colorHex(v.value)
                      const isSelected = options[colorOption.id] === v.value
                      return (
                        <button
                          key={v.value}
                          type="button"
                          className="studio-swatch"
                          style={{ backgroundColor: hex }}
                          aria-label={v.value}
                          aria-pressed={isSelected}
                          disabled={busy}
                          onClick={() => {
                            setOptions((prev) => ({ ...prev, [colorOption.id]: v.value }))
                            setSaved([])
                          }}
                          title={v.value}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Beden Seçenekleri (Pills) */}
              {sizeOption && (
                <div className="studio-section">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="studio-section-title !mb-0">{sizeOption.title}</h3>
                    <span className="text-xs text-[#B29460] font-semibold">
                      {options[sizeOption.id] || "Seçiniz"}
                    </span>
                  </div>
                  <div className="studio-sizes" role="radiogroup" aria-label="Beden Seçenekleri">
                    {sizeOption.values?.map((v) => {
                      const isSelected = options[sizeOption.id] === v.value
                      return (
                        <button
                          key={v.value}
                          type="button"
                          className="studio-size-pill"
                          aria-pressed={isSelected}
                          disabled={busy}
                          onClick={() => {
                            setOptions((prev) => ({ ...prev, [sizeOption.id]: v.value }))
                            setSaved([])
                          }}
                        >
                          {v.value}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Diğer Varyant Seçenekleri (Varsa) */}
              {otherOptions?.map((o) => (
                <div key={o.id} className="studio-section">
                  <h3 className="studio-section-title">{o.title}</h3>
                  <select
                    className="w-full bg-[#F7F6F3] text-[#222325] border border-[#DDD9D1] rounded-lg p-2.5 text-xs focus:border-[#B29460] focus:bg-[#FFFFFF] outline-none transition"
                    value={options[o.id] || ""}
                    disabled={busy}
                    onChange={(e) => {
                      setOptions((prev) => ({ ...prev, [o.id]: e.target.value }))
                      setSaved([])
                    }}
                  >
                    {o.values?.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.value}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Canlı Stok Durumu */}
              <div className="studio-section">
                <h3 className="studio-section-title">Stok Durumu</h3>
                {isStock ? (
                  <div className="studio-stock-badge in-stock">
                    <span>✓</span>
                    <span>Stokta Mevcut</span>
                  </div>
                ) : (
                  <div className="studio-stock-badge out-of-stock">
                    <span>✕</span>
                    <span>Seçili Varyant Tükendi</span>
                  </div>
                )}
              </div>

              {/* Sipariş Adedi (Stepper) */}
              <div className="studio-section">
                <h3 className="studio-section-title">Adet</h3>
                <div className="studio-stepper">
                  <button
                    type="button"
                    disabled={busy || quantity <= 1}
                    onClick={() => {
                      setQuantity((q) => Math.max(1, q - 1))
                      setSaved([])
                    }}
                    aria-label="Adet azalt"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={quantity}
                    disabled={busy}
                    onChange={(e) => {
                      const val = Math.min(
                        999,
                        Math.max(1, Math.floor(Number(e.target.value) || 1)),
                      )
                      setQuantity(val)
                      setSaved([])
                    }}
                    aria-label="Ürün adedi"
                  />
                  <button
                    type="button"
                    disabled={busy || quantity >= 999}
                    onClick={() => {
                      setQuantity((q) => Math.min(999, q + 1))
                      setSaved([])
                    }}
                    aria-label="Adet artır"
                  >
                    +
                  </button>
                </div>
                {discountPct > 0 && (
                  <p className="text-[10px] text-[#4ade80] font-semibold mt-1">
                    %{discountPct} Adet İndirimi Uygulandı!
                  </p>
                )}
              </div>

              {/* Baskı Tekniği */}
              <div className="studio-section">
                <h3 className="studio-section-title">Baskı Tekniği</h3>
                <div className="studio-tech-cards">
                  <button
                    type="button"
                    className="studio-tech-card"
                    aria-pressed={technique === "dtf"}
                    disabled={busy}
                    onClick={() => {
                      setTechnique("dtf")
                      setSaved([])
                    }}
                  >
                    <strong>DTF Dijital Baskı</strong>
                    <span>Canlı renkler, yüksek detay ve esnek kumaş hissi</span>
                  </button>
                  <button
                    type="button"
                    className="studio-tech-card"
                    aria-pressed={technique === "serigrafi"}
                    disabled={busy}
                    onClick={() => {
                      setTechnique("serigrafi")
                      setSaved([])
                    }}
                  >
                    <strong>Geleneksel Serigrafi</strong>
                    <span>Dayanıklı pigment, yüksek adetli siparişler için ekonomik</span>
                  </button>
                </div>
              </div>
                </>
              )}
            </aside>

            {/* ORTA KOLON: BÜYÜK ETKİLEŞİMLİ 3D & 2D ÖNİZLEME ALANI */}
            <main className="studio-col-center">
              {/* Toolbar: Yüz Seçimi & 3D/2D Geçiş & Ortala */}
              <div className="studio-toolbar">
                {/* Ön / Arka Yüz Butonları */}
                <div>
                  {(["front", "back"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={side === s}
                      onClick={() => setSide(s)}
                    >
                      {s === "front" ? "Ön Yüz" : "Arka Yüz"}
                      {artworks[s] && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B29460] inline-block ml-0.5" />
                      )}
                    </button>
                  ))}
                </div>

                {/* 3D / 2D Görünüm Butonları & Kamera Sıfırlama */}
                <div>
                  <button
                    type="button"
                    aria-pressed={mode === "3d"}
                    onClick={() => setMode("3d")}
                  >
                    3D Model
                  </button>
                  <button
                    type="button"
                    aria-pressed={mode === "2d"}
                    onClick={() => setMode("2d")}
                  >
                    2D Düzenle
                  </button>
                  {mode === "3d" && (
                    <button
                      type="button"
                      onClick={() => setCameraResetKey((k) => k + 1)}
                      title="Kamera bakışını varsayılana getir"
                    >
                      Ortala
                    </button>
                  )}
                </div>
              </div>

              {/* Ana Canvas Kutusu */}
              <div className="studio-canvas" data-testid="studio-canvas">
                {mode === "3d" ? (
                  <Studio3DViewer
                    side={side}
                    color={color}
                    layers={layers}
                    resetKey={cameraResetKey}
                  />
                ) : (
                  <InteractiveCanvas2D
                    side={side}
                    color={color}
                    artwork={activeArtwork}
                    onUpdate={updateActiveArtwork}
                    onUploadClick={() => fileInputRef.current?.click()}
                    onFileDrop={(file) => void handleUpload(file)}
                  />
                )}
              </div>

              {/* İpucu ve Bilgi Metni */}
              <p className="studio-canvas-caption">
                {mode === "3d"
                  ? "Döndürmek için sürükleyin · Yakınlaşmak için kaydırın veya iki parmak kullanın"
                  : "Tasarımı taşımak için sürükleyin · Boyutlandırmak için köşeleri kullanın"}
              </p>

              {/* Alt Ürün Özeti */}
              <div className="studio-product-info">
                <span>{product.title}</span>
                <span>
                  {Object.values(options).filter(Boolean).join(" / ")} · {quantity} adet
                </span>
              </div>
            </main>

            {/* SAĞ KOLON: GÖRSEL YÜKLEME, KONUMLANDIRMA, BOYUTLANDIRMA VE TASARIM ARAÇLARI */}
            <aside
              className={`studio-col-right ${
                mobileTab !== "tools" ? "hidden md:block" : "block"
              }`}
            >
              {/* Görsel Yükleme Kartı */}
              <div className="studio-section">
                <h3 className="studio-section-title">
                  02 / {side === "front" ? "Ön" : "Arka"} Görseli
                </h3>

                {activeArtwork ? (
                  <div className="bg-[#FAF9F6] border border-[#DDD9D1] rounded-xl p-3.5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-11 h-11 rounded-lg bg-[#EAE8E3] border border-[#DDD9D1] flex items-center justify-center overflow-hidden shrink-0">
                        <img
                          src={activeArtwork.url}
                          alt="Yüklenen logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#222325] truncate" title={activeArtwork.fileName}>
                          {activeArtwork.fileName}
                        </p>
                        <p className="text-[10px] text-[#B29460] font-medium">
                          {side === "front" ? "Ön Yüz Baskısı" : "Arka Yüz Baskısı"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-1.5 px-2 bg-[#FFFFFF] hover:bg-[#FAF5EB] text-[#222325] hover:text-[#B29460] border border-[#DDD9D1] hover:border-[#B29460] rounded-md text-[11px] font-semibold transition"
                      >
                        🔄 Değiştir
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleClearCurrentSide}
                        className="py-1.5 px-3 bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#BE123C] border border-[#FECDD3] rounded-md text-[11px] font-semibold transition"
                      >
                        ✕ Kaldır
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="studio-upload"
                    disabled={busy}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (!busy && e.dataTransfer.files?.[0]) {
                        void handleUpload(e.dataTransfer.files[0])
                      }
                    }}
                  >
                    <span>+</span>
                    <strong>Logonuzu Yükleyin veya Bırakın</strong>
                    <small>PNG, JPG, WebP veya SVG · En fazla 25 MB</small>
                  </button>
                )}
              </div>

              {/* Hızlı Konumlandırma Şablonları (Presets) */}
              {activeArtwork && (
                <div className="studio-section">
                  <h3 className="studio-section-title">Hızlı Konumlar</h3>
                  <div className="studio-presets">
                    {side === "front" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => applyPreset("left-chest")}
                          disabled={busy}
                        >
                          Sol Göğüs
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("right-chest")}
                          disabled={busy}
                        >
                          Sağ Göğüs
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("center-chest")}
                          disabled={busy}
                        >
                          Orta Göğüs
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => applyPreset("back-full")}
                          disabled={busy}
                        >
                          Tam Sırt
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset("back-upper")}
                          disabled={busy}
                        >
                          Üst Sırt
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => applyPreset("center")}
                      disabled={busy}
                    >
                      Ortala
                    </button>
                    <button
                      type="button"
                      onClick={handleFitToBounds}
                      disabled={busy}
                    >
                      Sığdır
                    </button>
                  </div>
                </div>
              )}

              {/* Boyutlandırma ve İnce Ayar Kaydırıcıları & Milimetre Girişleri */}
              {activeArtwork && (
                <div className="studio-section">
                  <h3 className="studio-section-title">Hassas Ölçü & Konum</h3>
                  <div className="studio-transforms">
                    {/* Genişlik */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[#6B6863] font-medium">Genişlik (mm)</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={25}
                            max={300}
                            value={activeArtwork.widthMm}
                            disabled={busy}
                            onChange={(e) => {
                              const val = Math.max(25, Math.min(300, Number(e.target.value) || 25))
                              updateActiveArtwork({ widthMm: val }, true)
                            }}
                            className="studio-num-input"
                          />
                          <span className="text-[10px] text-[#B29460] font-mono">mm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={25}
                        max={300}
                        value={activeArtwork.widthMm}
                        disabled={busy}
                        onChange={(e) =>
                          updateActiveArtwork({ widthMm: Number(e.target.value) })
                        }
                        onPointerUp={() =>
                          pushHistory({
                            ...artworks,
                            [side]: { ...activeArtwork },
                          })
                        }
                      />
                    </div>

                    {/* Yatay Konum (X) */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[#6B6863] font-medium">Yatay Konum X (mm)</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={-140}
                            max={140}
                            value={activeArtwork.xMm}
                            disabled={busy}
                            onChange={(e) => {
                              const val = Math.max(-140, Math.min(140, Number(e.target.value) || 0))
                              updateActiveArtwork({ xMm: val }, true)
                            }}
                            className="studio-num-input"
                          />
                          <span className="text-[10px] text-[#B29460] font-mono">mm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={-140}
                        max={140}
                        value={activeArtwork.xMm}
                        disabled={busy}
                        onChange={(e) =>
                          updateActiveArtwork({ xMm: Number(e.target.value) })
                        }
                        onPointerUp={() =>
                          pushHistory({
                            ...artworks,
                            [side]: { ...activeArtwork },
                          })
                        }
                      />
                    </div>

                    {/* Dikey Konum (Y) */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[#6B6863] font-medium">Dikey Konum Y (mm)</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={-180}
                            max={180}
                            value={activeArtwork.yMm}
                            disabled={busy}
                            onChange={(e) => {
                              const val = Math.max(-180, Math.min(180, Number(e.target.value) || 0))
                              updateActiveArtwork({ yMm: val }, true)
                            }}
                            className="studio-num-input"
                          />
                          <span className="text-[10px] text-[#B29460] font-mono">mm</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={activeArtwork.yMm}
                        disabled={busy}
                        onChange={(e) =>
                          updateActiveArtwork({ yMm: Number(e.target.value) })
                        }
                        onPointerUp={() =>
                          pushHistory({
                            ...artworks,
                            [side]: { ...activeArtwork },
                          })
                        }
                      />
                    </div>

                    {/* Döndürme */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-[#6B6863] font-medium">Döndürme (°)</span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={-180}
                            max={180}
                            value={activeArtwork.rotation}
                            disabled={busy}
                            onChange={(e) => {
                              let val = Number(e.target.value) || 0
                              if (val > 180) val -= 360
                              if (val < -180) val += 360
                              updateActiveArtwork({ rotation: val }, true)
                            }}
                            className="studio-num-input"
                          />
                          <span className="text-[10px] text-[#B29460] font-mono">°</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={activeArtwork.rotation}
                        disabled={busy}
                        onChange={(e) =>
                          updateActiveArtwork({ rotation: Number(e.target.value) })
                        }
                        onPointerUp={() =>
                          pushHistory({
                            ...artworks,
                            [side]: { ...activeArtwork },
                          })
                        }
                      />
                    </div>

                    {/* Fiziksel Ölçü Rozeti */}
                    {activePlacement && (
                      <div className="studio-dimension-badge">
                        Baskı Ölçüsü: {Math.round(activePlacement.widthMm)} ×{" "}
                        {Math.round(activePlacement.heightMm)} mm ·{" "}
                        {Math.round(activePlacement.areaCm2)} cm²
                      </div>
                    )}

                    {/* Sınır Aşımı Uyarısı */}
                    {activePlacement && !activePlacement.valid && (
                      <div role="alert" className="studio-warning">
                        ⚠️ Tasarım 320 × 400 mm baskı sınırının dışına taşıyor! Lütfen boyutu küçültün veya içeri kaydırın.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Geçmiş (Undo / Redo) ve Sıfırlama Butonları */}
              {isDtfTransferStudio && activeArtwork && dtfResolution && (
                <div
                  className="studio-section"
                  data-testid="studio-dtf-dpi-report"
                >
                  <h3 className="studio-section-title">
                    Print Resolution &amp; Alpha Check
                  </h3>
                  <div className="rounded-xl border border-[#DDD9D1] bg-[#FAF9F6] p-3 text-xs flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B6863]">Source Pixels:</span>
                      <span className="font-mono font-bold text-[#222325]">
                        {dtfResolution.pixelWidth} × {dtfResolution.pixelHeight} px
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B6863]">Effective Print DPI:</span>
                      <span
                        data-testid="studio-dtf-effective-dpi"
                        className={`font-mono font-extrabold ${
                          dtfResolution.meetsTarget300Dpi
                            ? "text-[#15803d]"
                            : dtfResolution.meetsMinimum150Dpi
                              ? "text-[#B29460]"
                              : "text-[#BE123C]"
                        }`}
                      >
                        {dtfResolution.effectiveDpi} DPI
                        {dtfResolution.meetsTarget300Dpi
                          ? " · Optimal (300+)"
                          : dtfResolution.meetsMinimum150Dpi
                            ? " · Acceptable (150+)"
                            : " · Low (<150 DPI)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B6863]">Background Alpha:</span>
                      <span className="font-semibold text-[#222325]">
                        {dtfResolution.hasTransparency
                          ? "Transparent RGBA"
                          : "Solid Background (Will Print)"}
                      </span>
                    </div>
                    {!dtfResolution.meetsMinimum150Dpi && (
                      <label className="mt-1 flex items-start gap-2 rounded-md border border-[#FECDD3] bg-[#FFF1F2] p-2 text-[11px] text-[#BE123C] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={dtfAllowLowDpi}
                          data-testid="studio-dtf-low-dpi-override"
                          onChange={(e) => setDtfAllowLowDpi(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span>
                          Approve printing below 150 DPI ({dtfResolution.effectiveDpi} DPI)
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {activeArtwork && (
                <div className="studio-section">
                  <h3 className="studio-section-title">İşlemler</h3>
                  <div className="studio-history-bar">
                    <button
                      type="button"
                      disabled={historyIndex <= 0 || busy}
                      onClick={handleUndo}
                      title="Geri Al"
                    >
                      ↩ Geri Al
                    </button>
                    <button
                      type="button"
                      disabled={historyIndex >= history.length - 1 || busy}
                      onClick={handleRedo}
                      title="İleri Al"
                    >
                      ↪ İleri Al
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleClearCurrentSide}
                      title="Bu yüzdeki tasarımı kaldır"
                    >
                      ✕ Kaldır
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </div>

          {/* ALT SABİT ÇUBUK: FİYAT, KAYDET, SEPETE EKLE */}
          <footer className="studio-bottom-bar">
            {isDtfTransferStudio ? (
              <>
                <div className="studio-price-summary" data-testid="studio-dtf-price-summary">
                  <div>
                    <span>Unit DTF Film: </span>
                    <span className="font-semibold text-[#222325]">
                      {dtfQuote ? dtfQuote.unitPriceFormatted : "…"}
                    </span>
                  </div>
                  <div>
                    <span>
                      Size ({dtfWidth} × {dtfHeight} {dtfUnit}):{" "}
                    </span>
                    <span className="font-semibold text-[#B29460]">
                      Garment $0.00 (Not Included)
                    </span>
                  </div>
                  <div className="border-l border-[#DDD9D1] pl-4">
                    <span>Total ({quantity} pcs): </span>
                    <strong data-testid="studio-dtf-total">
                      {dtfQuote ? `${dtfQuote.subtotalFormatted} USD` : "…"}
                    </strong>
                  </div>
                </div>

                <div className="studio-action-buttons">
                  <button
                    type="button"
                    className="studio-export-btn"
                    data-testid="studio-export-transparent-png"
                    disabled={!activeArtwork || busy}
                    onClick={() => void handleDownloadTransparentDtfPng()}
                  >
                    Print-Ready PNG ↗
                  </button>

                  <button
                    type="button"
                    className="studio-save"
                    data-testid="studio-dtf-save"
                    disabled={!activeArtwork || busy}
                    onClick={() => void handleSave()}
                  >
                    {busy ? "Saving…" : "Save DTF Transfer"}
                  </button>

                  <button
                    type="button"
                    className="studio-checkout"
                    data-testid="add-printed-to-cart"
                    disabled={!activeArtwork || !dtfQuote || busy}
                    onClick={() => void handleAddToCart()}
                  >
                    {busy
                      ? "Processing…"
                      : `Add DTF Transfer · ${
                          dtfQuote ? `${dtfQuote.subtotalFormatted} USD` : "…"
                        }`}
                  </button>
                </div>
              </>
            ) : (
              <>
            {/* Canlı Fiyatlandırma Dökümü */}
            <div className="studio-price-summary">
              <div>
                <span>Birim Tişört: </span>
                <span className="font-semibold text-[#222325]">
                  {convertToLocale({
                    amount: baseUnitPrice,
                    currency_code: currencyCode,
                  })}
                </span>
              </div>
              <div>
                <span>Baskı ({layers.length} yüz): </span>
                <span className="font-semibold text-[#B29460]">
                  +{convertToLocale({
                    amount: printUnitCost,
                    currency_code: currencyCode,
                  })}
                </span>
              </div>
              <div className="border-l border-[#DDD9D1] pl-4">
                <span>Toplam ({quantity} adet): </span>
                <strong>
                  {convertToLocale({
                    amount: grandTotal,
                    currency_code: currencyCode,
                  })}
                </strong>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="studio-action-buttons">
              {/* Taslak İndir */}
              <button
                type="button"
                className="studio-export-btn"
                disabled={!layers.length}
                onClick={handleExportDraft}
              >
                Taslağı İndir ↗
              </button>

              {/* Tasarımı Kalıcı Kaydet */}
              <button
                type="button"
                className="studio-save"
                disabled={!valid || !variant || !isStock || busy}
                onClick={() => void handleSave()}
              >
                {busy ? "Kaydediliyor…" : "Tasarımı Kalıcı Kaydet"}
              </button>

              {/* Baskılı Sepete Ekle */}
              <button
                type="button"
                className="studio-checkout"
                data-testid="add-printed-to-cart"
                disabled={!valid || !variant || !isStock || busy}
                onClick={() => void handleAddToCart()}
              >
                {busy
                  ? "İşleniyor…"
                  : `Baskılı Sepete Ekle · ${convertToLocale({
                      amount: grandTotal,
                      currency_code: currencyCode,
                    })}`}
              </button>
            </div>
              </>
            )}
          </footer>

          {/* Durum Mesajı ve Kaydedilen Tasarım Rozetleri (Varsa) */}
          {(message || saved.length > 0) && (
            <div className="bg-[#FFFFFF] border-t border-[#DDD9D1] px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
              {message && (
                <p role="status" className="studio-status">
                  {message}
                </p>
              )}
              {saved.length > 0 && (
                <div className="flex gap-2">
                  {saved.map((d) => (
                    <div
                      key={d.id}
                      className="studio-saved !my-0 !py-1 !px-2.5 flex items-center gap-2"
                      data-testid="saved-design"
                    >
                      <span className="font-bold text-[#B29460]">
                        {d.side === "front" ? "Ön" : "Arka"}
                      </span>
                      <span className="font-mono text-[9px] text-[#6B6863]">
                        {d.id}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
