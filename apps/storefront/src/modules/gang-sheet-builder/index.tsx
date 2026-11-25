"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { addDtfTransferToCart } from "@lib/data/cart"
import {
  DTF_GARMENT_DISCLAIMER,
  fetchDtfCatalog,
  requestServerDtfQuote,
  saveDtfGangSheet,
  type DtfDimensionUnit,
  type DtfGangSheetLengthTier,
  type DtfPricingRule,
  type DtfVerifiedQuote,
  type SavedGangSheetResponse,
} from "@lib/data/dtf"
import { notifyCartUpdated } from "@lib/util/cart-events"
import {
  autoNestClientGangSheet,
  exportGangSheetTransparentPng,
  getRotatedBoundingBox,
  normalizeRotationDeg,
  snapDraggedGangSheetItem,
  validateClientGangSheet,
  type AlignmentGuide,
  type GangSheetCanvasItem,
  type UploadedSheetArtwork,
} from "./layout-engine"

const FALLBACK_LENGTH_TIERS: DtfGangSheetLengthTier[] = [
  { length_in: 12, price_cents: 990, label: '22" × 12" (1 ft)' },
  { length_in: 24, price_cents: 1790, label: '22" × 24" (2 ft)' },
  { length_in: 36, price_cents: 2490, label: '22" × 36" (3 ft)' },
  { length_in: 48, price_cents: 3190, label: '22" × 48" (4 ft)' },
  { length_in: 60, price_cents: 3790, label: '22" × 60" (5 ft)' },
  { length_in: 120, price_cents: 6990, label: '22" × 120" (10 ft)' },
]

const BACKDROP_MODES = [
  { code: "grid", label: "Transparent Grid", hex: "transparent" },
  { code: "anthracite", label: "Anthracite Fabric", hex: "#222325" },
  { code: "cream", label: "Off-White Fabric", hex: "#FAF9F6" },
  { code: "gold", label: "Warm Gold Fabric", hex: "#B29460" },
] as const

const BASE_PX_PER_INCH = 24

function sanitizeSvgToPng(
  svgText: string,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, "image/svg+xml")
  if (doc.querySelector("parsererror")) {
    return Promise.reject(new Error("Invalid SVG markup"))
  }
  doc.querySelectorAll("script, foreignObject").forEach((el) => el.remove())
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of el.getAttributeNames()) {
      if (attr.toLowerCase().startsWith("on")) {
        el.removeAttribute(attr)
      }
    }
  })
  const root = doc.documentElement
  let w = parseFloat(root.getAttribute("width") || "0")
  let h = parseFloat(root.getAttribute("height") || "0")
  if (!w || !h) {
    const vb = root.getAttribute("viewBox")
    if (vb) {
      const nums = vb.split(/[\s,]+/).map(Number)
      if (nums.length === 4 && nums[2] > 0 && nums[3] > 0) {
        w = nums[2]
        h = nums[3]
      }
    }
  }
  if (!w || !h) {
    w = 1200
    h = 1200
  }
  const scale = Math.min(2400 / Math.max(w, h), 3)
  const targetW = Math.max(200, Math.round(w * scale))
  const targetH = Math.max(200, Math.round(h * scale))
  root.setAttribute("width", String(targetW))
  root.setAttribute("height", String(targetH))

  const serialized = new XMLSerializer().serializeToString(doc)
  const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" })
  const blobUrl = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = targetW
        canvas.height = targetH
        const ctx = canvas.getContext("2d")
        if (!ctx) throw new Error("Canvas unavailable")
        ctx.clearRect(0, 0, targetW, targetH)
        ctx.drawImage(img, 0, 0, targetW, targetH)
        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: targetW,
          height: targetH,
        })
      } catch (err) {
        reject(err)
      } finally {
        URL.revokeObjectURL(blobUrl)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl)
      reject(new Error("Could not rasterize SVG"))
    }
    img.src = blobUrl
  })
}

export default function GangSheetBuilder({
  countryCode,
  carrierVariantId,
}: {
  countryCode: string
  carrierVariantId?: string
}) {
  const [rule, setRule] = useState<DtfPricingRule | null>(null)
  const [unit, setUnit] = useState<DtfDimensionUnit>("in")
  const [sheetLengthIn, setSheetLengthIn] = useState<number>(24)
  const [quantity, setQuantity] = useState<number>(1)
  const [artworks, setArtworks] = useState<UploadedSheetArtwork[]>([])
  const [items, setItems] = useState<GangSheetCanvasItem[]>([])
  const [history, setHistory] = useState<GangSheetCanvasItem[][]>([[]])
  const [historyIdx, setHistoryIdx] = useState<number>(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lockAspect, setLockAspect] = useState<boolean>(true)
  const [zoom, setZoom] = useState<number>(1)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [backdrop, setBackdrop] = useState<
    (typeof BACKDROP_MODES)[number]["code"]
  >("grid")
  const [guides, setGuides] = useState<AlignmentGuide[]>([])
  const [quote, setQuote] = useState<DtfVerifiedQuote | null>(null)
  const [allowLowDpi, setAllowLowDpi] = useState<boolean>(false)
  const [savedSheet, setSavedSheet] = useState<SavedGangSheetResponse | null>(
    null,
  )
  const [busy, setBusy] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string>("")

  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragStateRef = useRef<{
    type: "item" | "pan"
    itemId?: string
    startClientX: number
    startClientY: number
    origXIn: number
    origYIn: number
    origPanX: number
    origPanY: number
  } | null>(null)

  const sheetWidthIn = rule?.gang_sheet_width_in || 22
  const minMarginIn = rule?.min_margin_in ?? 0.25
  const minGapIn = rule?.min_gap_in ?? 0.25
  const minAcceptableDpi = rule?.min_acceptable_dpi ?? 150
  const targetDpi = rule?.target_dpi ?? 300
  const lengthTiers = rule?.gang_sheet_lengths?.length
    ? rule.gang_sheet_lengths
    : FALLBACK_LENGTH_TIERS

  useEffect(() => {
    let active = true
    fetchDtfCatalog()
      .then((catalog) => {
        if (!active || !catalog) return
        setRule(catalog.pricingRule)
      })
      .catch(() => {
        // Keep safe defaults
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    requestServerDtfQuote({
      productType: "gang_sheet",
      unit: "in",
      width: sheetWidthIn,
      height: sheetLengthIn,
      filmLengthIn: sheetLengthIn,
      quantity,
    })
      .then((res) => {
        if (active) setQuote(res.quote)
      })
      .catch(() => {
        if (active) setQuote(null)
      })
    return () => {
      active = false
    }
  }, [sheetWidthIn, sheetLengthIn, quantity])

  const commitItems = useCallback(
    (nextItems: GangSheetCanvasItem[], pushToHistory = true) => {
      setItems(nextItems)
      setSavedSheet(null)
      if (pushToHistory) {
        setHistory((prev) => {
          const sliced = prev.slice(0, historyIdx + 1)
          const appended = [...sliced, nextItems.map((i) => ({ ...i }))]
          return appended.slice(-50)
        })
        setHistoryIdx((idx) => Math.min(49, idx + 1))
      }
    },
    [historyIdx],
  )

  const handleUndo = useCallback(() => {
    if (historyIdx <= 0) return
    const nextIdx = historyIdx - 1
    const snapshot = history[nextIdx] || []
    setHistoryIdx(nextIdx)
    setItems(snapshot.map((i) => ({ ...i })))
    setSavedSheet(null)
  }, [history, historyIdx])

  const handleRedo = useCallback(() => {
    if (historyIdx >= history.length - 1) return
    const nextIdx = historyIdx + 1
    const snapshot = history[nextIdx] || []
    setHistoryIdx(nextIdx)
    setItems(snapshot.map((i) => ({ ...i })))
    setSavedSheet(null)
  }, [history, historyIdx])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault()
        if (e.shiftKey) handleRedo()
        else handleUndo()
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [handleUndo, handleRedo])

  const validation = useMemo(
    () =>
      validateClientGangSheet(items, {
        sheetWidthIn,
        sheetLengthIn,
        minMarginIn,
        minGapIn,
        minAcceptableDpi,
        targetDpi,
      }),
    [
      items,
      sheetWidthIn,
      sheetLengthIn,
      minMarginIn,
      minGapIn,
      minAcceptableDpi,
      targetDpi,
    ],
  )

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId],
  )

  const formatMeasure = (inches: number) =>
    unit === "in"
      ? `${Number(inches.toFixed(2))}"`
      : `${Number((inches * 2.54).toFixed(2))} cm`

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    setStatusMessage("")
    const newlyUploaded: UploadedSheetArtwork[] = []
    const addedCanvasItems: GangSheetCanvasItem[] = []

    for (const file of Array.from(fileList)) {
      if (file.size > 25 * 1024 * 1024) {
        setStatusMessage(`Skipped ${file.name}: exceeds 25 MB maximum.`)
        continue
      }
      const lower = (file.type || file.name).toLowerCase()
      const isSvg = lower.includes("svg")
      const isPng = lower.includes("png")
      const isJpg = lower.includes("jp")
      const isWebp = lower.includes("webp")
      if (!isSvg && !isPng && !isJpg && !isWebp) {
        setStatusMessage(`Unsupported file format: ${file.name}`)
        continue
      }

      try {
        let dataUrl = ""
        let pixelWidth = 1200
        let pixelHeight = 1200
        let mimeType = "image/png"

        if (isSvg) {
          const text = await file.text()
          const raster = await sanitizeSvgToPng(text)
          dataUrl = raster.dataUrl
          pixelWidth = raster.width
          pixelHeight = raster.height
        } else {
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(new Error("File read error"))
            reader.readAsDataURL(file)
          })
          const img = new Image()
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = () => reject(new Error("Corrupt image"))
            img.src = dataUrl
          })
          pixelWidth = Math.max(1, img.naturalWidth || 600)
          pixelHeight = Math.max(1, img.naturalHeight || 600)
          mimeType = isWebp
            ? "image/webp"
            : isJpg
              ? "image/jpeg"
              : "image/png"
        }

        const aspect = Math.max(0.1, pixelWidth / pixelHeight)
        const defaultWIn = Math.min(
          10,
          Math.max(2, Number((pixelWidth / 300).toFixed(2))),
        )
        const defaultHIn = Math.max(
          0.75,
          Number((defaultWIn / aspect).toFixed(2)),
        )
        const artId = `art_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const artEntry: UploadedSheetArtwork = {
          id: artId,
          fileName: file.name,
          mimeType,
          dataUrl,
          pixelWidth,
          pixelHeight,
          aspect,
        }
        newlyUploaded.push(artEntry)

        addedCanvasItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          artworkId: artId,
          fileName: file.name,
          mimeType,
          dataUrl,
          pixelWidth,
          pixelHeight,
          xIn: minMarginIn,
          yIn: minMarginIn,
          widthIn: defaultWIn,
          heightIn: defaultHIn,
          rotationDeg: 0,
        })
      } catch (err) {
        setStatusMessage(
          err instanceof Error ? err.message : `Could not load ${file.name}`,
        )
      }
    }

    if (newlyUploaded.length > 0) {
      setArtworks((prev) => [...prev, ...newlyUploaded])
      const combined = [...items, ...addedCanvasItems]
      const nested = autoNestClientGangSheet(combined, {
        sheetWidthIn,
        minMarginIn,
        minGapIn,
      })
      if (nested.requiredLengthIn > sheetLengthIn) {
        const nextTier = lengthTiers.find(
          (t) => t.length_in >= nested.requiredLengthIn,
        )
        if (nextTier) {
          setSheetLengthIn(nextTier.length_in)
        }
      }
      commitItems(nested.placedItems, true)
      setSelectedId(addedCanvasItems[addedCanvasItems.length - 1].id)
      setStatusMessage(
        `Added ${addedCanvasItems.length} artwork(s) and auto-nested onto ${sheetWidthIn}" roll.`,
      )
    }
  }

  const handleAutoNest = () => {
    if (!items.length) return
    const nested = autoNestClientGangSheet(items, {
      sheetWidthIn,
      minMarginIn,
      minGapIn,
    })
    if (nested.requiredLengthIn > sheetLengthIn) {
      const nextTier = lengthTiers.find(
        (t) => t.length_in >= nested.requiredLengthIn,
      )
      if (nextTier) {
        setSheetLengthIn(nextTier.length_in)
      }
    }
    commitItems(nested.placedItems, true)
    setStatusMessage(
      `Auto-nested ${items.length} transfer(s). Required length: ${nested.requiredLengthIn.toFixed(1)}".`,
    )
  }

  const handleDuplicateSelected = (copies: number) => {
    if (!selectedItem) return
    const clones: GangSheetCanvasItem[] = Array.from(
      { length: copies },
      (_, idx) => ({
        ...selectedItem,
        id: `item_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      }),
    )
    const nested = autoNestClientGangSheet([...items, ...clones], {
      sheetWidthIn,
      minMarginIn,
      minGapIn,
    })
    if (nested.requiredLengthIn > sheetLengthIn) {
      const nextTier = lengthTiers.find(
        (t) => t.length_in >= nested.requiredLengthIn,
      )
      if (nextTier) setSheetLengthIn(nextTier.length_in)
    }
    commitItems(nested.placedItems, true)
    setStatusMessage(`Duplicated +${copies} copy/copies and auto-nested.`)
  }

  const updateSelectedItem = (
    patch: Partial<GangSheetCanvasItem>,
    pushHistoryFlag = true,
  ) => {
    if (!selectedItem) return
    const next = items.map((it) =>
      it.id === selectedItem.id ? { ...it, ...patch } : it,
    )
    commitItems(next, pushHistoryFlag)
  }

  const handleAlignSelected = (
    alignment: "left" | "center" | "right" | "top" | "middle" | "bottom",
  ) => {
    if (!selectedItem) return
    const box = getRotatedBoundingBox(selectedItem)
    let dx = 0
    let dy = 0
    if (alignment === "left") dx = minMarginIn - box.leftIn
    if (alignment === "center") dx = sheetWidthIn / 2 - box.centerXIn
    if (alignment === "right") dx = sheetWidthIn - minMarginIn - box.rightIn
    if (alignment === "top") dy = minMarginIn - box.topIn
    if (alignment === "middle") dy = sheetLengthIn / 2 - box.centerYIn
    if (alignment === "bottom") dy = sheetLengthIn - minMarginIn - box.bottomIn

    updateSelectedItem(
      {
        xIn: Number((selectedItem.xIn + dx).toFixed(3)),
        yIn: Number((selectedItem.yIn + dy).toFixed(3)),
      },
      true,
    )
  }

  const pxPerIn = BASE_PX_PER_INCH * zoom

  const handlePointerMoveCanvas = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current
    if (!drag) return
    if (drag.type === "pan") {
      setPanOffset({
        x: drag.origPanX + (e.clientX - drag.startClientX),
        y: drag.origPanY + (e.clientY - drag.startClientY),
      })
      return
    }
    if (drag.type === "item" && drag.itemId) {
      const dxIn = (e.clientX - drag.startClientX) / pxPerIn
      const dyIn = (e.clientY - drag.startClientY) / pxPerIn
      const target = items.find((i) => i.id === drag.itemId)
      if (!target) return
      const candidate: GangSheetCanvasItem = {
        ...target,
        xIn: Number((drag.origXIn + dxIn).toFixed(3)),
        yIn: Number((drag.origYIn + dyIn).toFixed(3)),
      }
      const snapped = snapDraggedGangSheetItem(candidate, items, {
        sheetWidthIn,
        sheetLengthIn,
        minMarginIn,
      })
      setGuides(snapped.guides)
      setItems((prev) =>
        prev.map((it) =>
          it.id === drag.itemId
            ? { ...it, xIn: snapped.xIn, yIn: snapped.yIn }
            : it,
        ),
      )
      setSavedSheet(null)
    }
  }

  const handlePointerUpCanvas = () => {
    const drag = dragStateRef.current
    if (!drag) return
    dragStateRef.current = null
    setGuides([])
    if (drag.type === "item") {
      commitItems(items, true)
    }
  }

  const handleExportTransparentPng = async () => {
    if (!items.length || busy) return
    setBusy(true)
    setStatusMessage("Rendering 300-DPI transparent gang sheet PNG…")
    try {
      const exported = await exportGangSheetTransparentPng({
        items,
        sheetWidthIn,
        sheetLengthIn,
        targetDpi,
      })
      const a = document.createElement("a")
      a.href = exported.dataUrl
      a.download = `nizamlar-gang-sheet-${sheetWidthIn}x${sheetLengthIn}in-transparent.png`
      a.click()
      setStatusMessage(
        `Exported print-ready transparent PNG (${exported.pixelWidth} × ${exported.pixelHeight} px).`,
      )
    } catch (err) {
      setStatusMessage(
        err instanceof Error ? err.message : "Could not export gang sheet PNG.",
      )
    } finally {
      setBusy(false)
    }
  }

  const handleExportDraftJson = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            nizamlarGangSheet: "v1.0",
            disclaimer: DTF_GARMENT_DISCLAIMER,
            sheetWidthIn,
            sheetLengthIn,
            quantity,
            items: items.map((i) => ({
              id: i.id,
              artworkId: i.artworkId,
              fileName: i.fileName,
              mimeType: i.mimeType,
              pixelWidth: i.pixelWidth,
              pixelHeight: i.pixelHeight,
              xIn: i.xIn,
              yIn: i.yIn,
              widthIn: i.widthIn,
              heightIn: i.heightIn,
              rotationDeg: i.rotationDeg,
            })),
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
    a.download = `nizamlar-gang-sheet-${sheetWidthIn}x${sheetLengthIn}in.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const persistGangSheetOnServer =
    async (): Promise<SavedGangSheetResponse | null> => {
      if (!items.length || busy) return null
      if (!validation.isValid) {
        setStatusMessage(
          "Resolve overlapping or out-of-bounds artworks (or click Auto-Nest) before saving.",
        )
        return null
      }
      if (validation.lowDpiIds.length > 0 && !allowLowDpi) {
        setStatusMessage(
          "One or more items are below 150 DPI. Scale them down, replace artwork, or confirm low-DPI override.",
        )
        return null
      }

      setBusy(true)
      setStatusMessage(
        "Generating transparent 300-DPI print sheet & verifying server layout…",
      )
      try {
        const exported = await exportGangSheetTransparentPng({
          items,
          sheetWidthIn,
          sheetLengthIn,
          targetDpi,
        })
        const saved = await saveDtfGangSheet({
          productHandle: "dtf-gang-sheet",
          sheetWidthIn,
          sheetLengthIn,
          quantity,
          items: items.map((i) => ({
            id: i.id,
            artworkId: i.artworkId,
            fileName: i.fileName,
            mimeType: i.mimeType,
            pixelWidth: i.pixelWidth,
            pixelHeight: i.pixelHeight,
            xIn: i.xIn,
            yIn: i.yIn,
            widthIn: i.widthIn,
            heightIn: i.heightIn,
            rotationDeg: i.rotationDeg,
          })),
          productionPrintPngBase64: exported.dataUrl,
          previewGarmentColor: backdrop,
          allowLowDpi,
        })
        setSavedSheet(saved)
        setQuote(saved.quote)
        setStatusMessage(
          `Gang sheet saved (${saved.designAsset.id} · ${sheetWidthIn}" × ${sheetLengthIn}"). ${DTF_GARMENT_DISCLAIMER}`,
        )
        return saved
      } catch (err) {
        setStatusMessage(
          err instanceof Error
            ? err.message
            : "Server rejected gang sheet layout.",
        )
        return null
      } finally {
        setBusy(false)
      }
    }

  const handleAddGangSheetToCart = async () => {
    if (!carrierVariantId) {
      setStatusMessage("No carrier variant available for cart checkout.")
      return
    }
    let currentSaved = savedSheet
    if (!currentSaved) {
      currentSaved = await persistGangSheetOnServer()
      if (!currentSaved) return
    }

    setBusy(true)
    setStatusMessage("Adding verified DTF gang sheet to cart…")
    try {
      await addDtfTransferToCart({
        variantId: carrierVariantId,
        productType: "gang_sheet",
        unit: "in",
        width: sheetWidthIn,
        height: sheetLengthIn,
        filmLengthIn: sheetLengthIn,
        quantity,
        designAssetId: currentSaved.designAsset.id,
        quoteSignature: currentSaved.quoteSignature,
        countryCode,
      })
      notifyCartUpdated()
      setStatusMessage(
        `Added ${quantity} × (${sheetWidthIn}" × ${sheetLengthIn}") DTF Gang Sheet to cart! ${DTF_GARMENT_DISCLAIMER}`,
      )
    } catch (err) {
      setStatusMessage(
        err instanceof Error
          ? err.message
          : "Could not add gang sheet to cart.",
      )
    } finally {
      setBusy(false)
    }
  }

  const sheetWidthPx = Math.round(sheetWidthIn * pxPerIn)
  const sheetHeightPx = Math.round(sheetLengthIn * pxPerIn)
  const activeBackdrop =
    BACKDROP_MODES.find((b) => b.code === backdrop) || BACKDROP_MODES[0]

  return (
    <section
      data-testid="gang-sheet-builder-page"
      className="min-h-screen bg-brand-cream-light text-brand-anthracite py-8 px-4 sm:px-8"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        data-testid="gang-sheet-file-input"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg"
        className="sr-only"
        onChange={(e) => {
          void handleUploadFiles(e.target.files)
          e.target.value = ""
        }}
      />

      {/* Editorial Header */}
      <div className="mx-auto max-w-[1440px] mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-brand-stone pb-5">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-brown block mb-1">
            NIZAMLAR / US DTF PRODUCTION STUDIO
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-anthracite tracking-tight">
            DTF Gang Sheet Builder ({sheetWidthIn}&quot; Roll)
          </h1>
          <p
            data-testid="gang-sheet-disclaimer"
            className="mt-1.5 inline-flex items-center gap-2 rounded-md bg-brand-anthracite px-3 py-1 text-xs font-bold text-brand-cream-light border border-brand-gold"
          >
            {DTF_GARMENT_DISCLAIMER}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {rule && !rule.printer_rip_verified && (
            <span
              data-testid="gang-sheet-rip-notice"
              className="rounded-md border border-brand-gold/60 bg-brand-white px-3 py-1.5 text-[11px] font-semibold text-brand-brown-dark"
            >
              Default {sheetWidthIn}&quot; roll width active (Admin RIP verification configurable)
            </span>
          )}
          <div className="rounded-xl bg-brand-anthracite px-4 py-2.5 text-brand-cream-light border border-brand-gold shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-brand-gold block font-bold">
              Verified Sheet Quote
            </span>
            <strong
              data-testid="gang-sheet-live-price"
              className="text-lg font-extrabold"
            >
              {quote ? `${quote.subtotalFormatted} USD` : "Calculating…"}
            </strong>
          </div>
        </div>
      </div>

      {/* Main 3-Column Builder Grid */}
      <div className="mx-auto max-w-[1440px] grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Sheet Config & Multi-Image Upload Library */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          <div className="rounded-2xl border border-brand-stone bg-brand-white p-4 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-brown">
                01 / Roll Size &amp; Units
              </h2>
              <div className="flex rounded-md border border-brand-stone overflow-hidden text-[11px] font-bold">
                {(["in", "cm"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    aria-pressed={unit === u}
                    onClick={() => setUnit(u)}
                    className={`px-2.5 py-1 ${
                      unit === u
                        ? "bg-brand-anthracite text-brand-cream-light"
                        : "bg-brand-cream-light text-brand-brown-dark"
                    }`}
                  >
                    {u.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1 text-xs font-bold text-brand-anthracite">
              <span>{sheetWidthIn}&quot; Film Length</span>
              <select
                value={sheetLengthIn}
                data-testid="gang-sheet-length-select"
                onChange={(e) => {
                  setSheetLengthIn(Number(e.target.value))
                  setSavedSheet(null)
                }}
                className="rounded-lg border border-brand-stone bg-brand-cream-light px-3 py-2 text-xs font-bold text-brand-anthracite"
              >
                {lengthTiers.map((tier) => (
                  <option key={tier.length_in} value={tier.length_in}>
                    {tier.label || `${sheetWidthIn}" × ${tier.length_in}"`} — $
                    {(tier.price_cents / 100).toFixed(2)} USD
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-bold text-brand-anthracite">
              <span>Sheet Quantity</span>
              <input
                type="number"
                min={1}
                max={1000}
                value={quantity}
                data-testid="gang-sheet-qty-input"
                onChange={(e) => {
                  setQuantity(
                    Math.max(1, Math.min(1000, Math.floor(Number(e.target.value) || 1))),
                  )
                  setSavedSheet(null)
                }}
                className="rounded-lg border border-brand-stone bg-brand-cream-light px-3 py-2 text-xs font-bold text-brand-anthracite"
              />
            </label>
          </div>

          {/* Upload Dropzone & Artwork Bin */}
          <div className="rounded-2xl border border-brand-stone bg-brand-white p-4 shadow-xs flex flex-col gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-brown">
              02 / Upload Artworks
            </h2>
            <button
              type="button"
              data-testid="gang-sheet-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                void handleUploadFiles(e.dataTransfer.files)
              }}
              className="w-full rounded-xl border-2 border-dashed border-brand-gold bg-brand-cream-light/70 hover:bg-brand-cream p-4 text-center transition"
            >
              <span className="block text-lg font-bold text-brand-gold">+</span>
              <strong className="block text-xs font-extrabold text-brand-anthracite">
                Upload Multiple Artworks
              </strong>
              <span className="text-[11px] text-brand-brown-dark">
                PNG, WebP, SVG, JPG · 300 DPI Recommended
              </span>
            </button>

            {artworks.length > 0 && (
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                {artworks.map((art) => (
                  <div
                    key={art.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-brand-stone bg-brand-cream-light p-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={art.dataUrl}
                        alt={art.fileName}
                        className="h-9 w-9 rounded object-contain bg-brand-white border border-brand-stone shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-brand-anthracite">
                          {art.fileName}
                        </p>
                        <p className="text-[10px] font-mono text-brand-brown">
                          {art.pixelWidth}×{art.pixelHeight}px
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultWIn = Math.min(
                          10,
                          Math.max(2, Number((art.pixelWidth / 300).toFixed(2))),
                        )
                        const nextItem: GangSheetCanvasItem = {
                          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                          artworkId: art.id,
                          fileName: art.fileName,
                          mimeType: art.mimeType,
                          dataUrl: art.dataUrl,
                          pixelWidth: art.pixelWidth,
                          pixelHeight: art.pixelHeight,
                          xIn: minMarginIn,
                          yIn: minMarginIn,
                          widthIn: defaultWIn,
                          heightIn: Number((defaultWIn / art.aspect).toFixed(2)),
                          rotationDeg: 0,
                        }
                        const nested = autoNestClientGangSheet(
                          [...items, nextItem],
                          { sheetWidthIn, minMarginIn, minGapIn },
                        )
                        commitItems(nested.placedItems, true)
                        setSelectedId(nextItem.id)
                      }}
                      className="rounded bg-brand-anthracite px-2.5 py-1 text-[11px] font-bold text-brand-cream-light hover:bg-brand-brown shrink-0"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER COLUMN: Interactive Rulers, Toolbar & Gang Sheet Canvas */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          {/* Builder Action Toolbar */}
          <div className="rounded-xl border border-brand-stone bg-brand-white p-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                data-testid="gang-auto-place"
                disabled={!items.length || busy}
                onClick={handleAutoNest}
                className="rounded-lg bg-brand-anthracite px-3 py-1.5 text-xs font-bold text-brand-cream-light border border-brand-gold disabled:opacity-40"
              >
                Auto-Nest Sheet
              </button>
              <button
                type="button"
                data-testid="gang-undo"
                disabled={historyIdx <= 0 || busy}
                onClick={handleUndo}
                className="rounded-lg border border-brand-stone bg-brand-cream-light px-2.5 py-1.5 text-xs font-bold text-brand-anthracite disabled:opacity-40"
              >
                Undo
              </button>
              <button
                type="button"
                data-testid="gang-redo"
                disabled={historyIdx >= history.length - 1 || busy}
                onClick={handleRedo}
                className="rounded-lg border border-brand-stone bg-brand-cream-light px-2.5 py-1.5 text-xs font-bold text-brand-anthracite disabled:opacity-40"
              >
                Redo
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() =>
                  setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))
                }
                className="rounded border border-brand-stone bg-brand-cream-light px-2 py-1"
              >
                −
              </button>
              <span className="font-mono text-[11px] px-1">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() =>
                  setZoom((z) => Math.min(2.2, Number((z + 0.15).toFixed(2))))
                }
                className="rounded border border-brand-stone bg-brand-cream-light px-2 py-1"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1)
                  setPanOffset({ x: 0, y: 0 })
                }}
                className="rounded border border-brand-stone bg-brand-cream-light px-2 py-1 text-[11px]"
              >
                Reset View
              </button>
            </div>
          </div>

          {/* Preview Fabric Backdrop Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-brand-brown">
                Contrast Preview Backdrop:
              </span>
              {BACKDROP_MODES.map((m) => (
                <button
                  key={m.code}
                  type="button"
                  onClick={() => setBackdrop(m.code)}
                  className={`rounded-md px-2 py-0.5 font-semibold border ${
                    backdrop === m.code
                      ? "border-brand-gold bg-brand-anthracite text-brand-cream-light"
                      : "border-brand-stone bg-brand-white text-brand-anthracite"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <span className="font-mono font-bold text-brand-brown-dark">
              Utilization: {validation.utilizationPercent}% ({items.length} pcs)
            </span>
          </div>

          {/* Interactive Rulers + Sheet Viewport */}
          <div
            data-testid="gang-sheet-viewport"
            onPointerMove={handlePointerMoveCanvas}
            onPointerUp={handlePointerUpCanvas}
            onPointerLeave={handlePointerUpCanvas}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedId(null)
                dragStateRef.current = {
                  type: "pan",
                  startClientX: e.clientX,
                  startClientY: e.clientY,
                  origXIn: 0,
                  origYIn: 0,
                  origPanX: panOffset.x,
                  origPanY: panOffset.y,
                }
              }
            }}
            className="relative h-[580px] overflow-auto rounded-2xl border border-brand-stone bg-[#EAE6DD] p-6 select-none"
          >
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              }}
              className="inline-block"
            >
              {/* Top Horizontal Ruler */}
              <div
                style={{ width: `${sheetWidthPx}px` }}
                className="ml-6 h-6 flex items-end border-b border-brand-anthracite/40 text-[9px] font-mono text-brand-anthracite relative"
              >
                {Array.from(
                  { length: Math.floor(sheetWidthIn / 2) + 1 },
                  (_, idx) => idx * 2,
                ).map((inchTick) => (
                  <span
                    key={inchTick}
                    style={{ left: `${inchTick * pxPerIn}px` }}
                    className="absolute bottom-0.5 -translate-x-1/2"
                  >
                    {formatMeasure(inchTick)}
                  </span>
                ))}
              </div>

              <div className="flex">
                {/* Left Vertical Ruler */}
                <div
                  style={{ height: `${sheetHeightPx}px` }}
                  className="w-6 border-r border-brand-anthracite/40 text-[9px] font-mono text-brand-anthracite relative shrink-0"
                >
                  {Array.from(
                    { length: Math.floor(sheetLengthIn / 4) + 1 },
                    (_, idx) => idx * 4,
                  ).map((inchTick) => (
                    <span
                      key={inchTick}
                      style={{ top: `${inchTick * pxPerIn}px` }}
                      className="absolute right-1 -translate-y-1/2"
                    >
                      {inchTick}
                    </span>
                  ))}
                </div>

                {/* Actual Sheet Film Surface */}
                <div
                  data-testid="gang-sheet-surface"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setSelectedId(null)
                  }}
                  style={{
                    width: `${sheetWidthPx}px`,
                    height: `${sheetHeightPx}px`,
                    backgroundColor:
                      activeBackdrop.code === "grid"
                        ? "#FFFFFF"
                        : activeBackdrop.hex,
                    backgroundImage:
                      activeBackdrop.code === "grid"
                        ? "linear-gradient(45deg, #e5e2dc 25%, transparent 25%), linear-gradient(-45deg, #e5e2dc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e2dc 75%), linear-gradient(-45deg, transparent 75%, #e5e2dc 75%)"
                        : undefined,
                    backgroundSize:
                      activeBackdrop.code === "grid" ? "16px 16px" : undefined,
                    backgroundPosition:
                      activeBackdrop.code === "grid"
                        ? "0 0, 0 8px, 8px -8px, -8px 0px"
                        : undefined,
                  }}
                  className="relative shadow-lg border border-brand-anthracite overflow-hidden"
                >
                  {/* Safe Margin Dashed Guide */}
                  <div
                    style={{
                      left: `${minMarginIn * pxPerIn}px`,
                      top: `${minMarginIn * pxPerIn}px`,
                      right: `${minMarginIn * pxPerIn}px`,
                      bottom: `${minMarginIn * pxPerIn}px`,
                    }}
                    className="pointer-events-none absolute border border-dashed border-brand-gold/70"
                  />

                  {/* Live Snap Alignment Guides */}
                  {guides.map((g, idx) =>
                    g.axis === "vertical" ? (
                      <div
                        key={`v_${idx}`}
                        style={{ left: `${g.positionIn * pxPerIn}px` }}
                        className="pointer-events-none absolute top-0 bottom-0 w-px bg-brand-gold z-30"
                      />
                    ) : (
                      <div
                        key={`h_${idx}`}
                        style={{ top: `${g.positionIn * pxPerIn}px` }}
                        className="pointer-events-none absolute left-0 right-0 h-px bg-brand-gold z-30"
                      />
                    ),
                  )}

                  {/* Placed Transfer Artworks */}
                  {items.map((item) => {
                    const isSelected = item.id === selectedId
                    const hasIssue =
                      validation.overlapIds.includes(item.id) ||
                      validation.outOfBoundsIds.includes(item.id) ||
                      validation.marginViolationIds.includes(item.id)
                    return (
                      <div
                        key={item.id}
                        data-testid={`gang-sheet-item-${item.id}`}
                        onPointerDown={(e) => {
                          e.stopPropagation()
                          setSelectedId(item.id)
                          dragStateRef.current = {
                            type: "item",
                            itemId: item.id,
                            startClientX: e.clientX,
                            startClientY: e.clientY,
                            origXIn: item.xIn,
                            origYIn: item.yIn,
                            origPanX: panOffset.x,
                            origPanY: panOffset.y,
                          }
                        }}
                        style={{
                          left: `${item.xIn * pxPerIn}px`,
                          top: `${item.yIn * pxPerIn}px`,
                          width: `${item.widthIn * pxPerIn}px`,
                          height: `${item.heightIn * pxPerIn}px`,
                          transform: `rotate(${item.rotationDeg}deg)`,
                        }}
                        className={`absolute cursor-move transition-shadow ${
                          hasIssue
                            ? "ring-2 ring-[#BE123C] bg-[#BE123C]/10"
                            : isSelected
                              ? "ring-2 ring-brand-gold shadow-md"
                              : "hover:ring-1 hover:ring-brand-brown"
                        }`}
                      >
                        <img
                          src={item.dataUrl}
                          alt={item.fileName}
                          draggable={false}
                          className="w-full h-full object-fill pointer-events-none"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Item Transform, Collision Report & Checkout */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          {/* Selected Item Inspector */}
          <div className="rounded-2xl border border-brand-stone bg-brand-white p-4 shadow-xs flex flex-col gap-3">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-brown">
              03 / Transform &amp; Duplicate
            </h2>

            {selectedItem ? (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold truncate max-w-[160px]">
                    {selectedItem.fileName}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-brand-gold">
                    {validation.itemDpiMap[selectedItem.id] || 300} DPI
                  </span>
                </div>

                {/* Duplicate Quick Buttons */}
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      data-testid={`gang-duplicate-${count}`}
                      onClick={() => handleDuplicateSelected(count)}
                      className="rounded-md border border-brand-stone bg-brand-cream-light hover:border-brand-gold py-1.5 text-xs font-bold text-brand-anthracite"
                    >
                      +{count} Copy
                    </button>
                  ))}
                </div>

                {/* Scale Width & Height */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-brand-brown-dark">
                    Dimensions ({unit})
                  </span>
                  <label className="flex items-center gap-1 text-[10px] font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={lockAspect}
                      onChange={(e) => setLockAspect(e.target.checked)}
                    />
                    Lock Ratio
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex flex-col gap-0.5 text-[10px] font-bold">
                    <span>Width ({unit})</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0.5}
                      max={55}
                      value={
                        unit === "in"
                          ? selectedItem.widthIn
                          : Number((selectedItem.widthIn * 2.54).toFixed(2))
                      }
                      onChange={(e) => {
                        const raw = Math.max(0.5, Number(e.target.value) || 0.5)
                        const nextWIn =
                          unit === "in" ? raw : Number((raw / 2.54).toFixed(3))
                        const ratio =
                          selectedItem.widthIn /
                          Math.max(0.1, selectedItem.heightIn)
                        const nextHIn = lockAspect
                          ? Number((nextWIn / ratio).toFixed(3))
                          : selectedItem.heightIn
                        updateSelectedItem(
                          { widthIn: nextWIn, heightIn: nextHIn },
                          true,
                        )
                      }}
                      className="rounded border border-brand-stone bg-brand-cream-light px-2 py-1.5 text-xs font-bold"
                    />
                  </label>
                  <label className="flex flex-col gap-0.5 text-[10px] font-bold">
                    <span>Height ({unit})</span>
                    <input
                      type="number"
                      step="0.1"
                      min={0.5}
                      max={300}
                      value={
                        unit === "in"
                          ? selectedItem.heightIn
                          : Number((selectedItem.heightIn * 2.54).toFixed(2))
                      }
                      onChange={(e) => {
                        const raw = Math.max(0.5, Number(e.target.value) || 0.5)
                        const nextHIn =
                          unit === "in" ? raw : Number((raw / 2.54).toFixed(3))
                        const ratio =
                          selectedItem.widthIn /
                          Math.max(0.1, selectedItem.heightIn)
                        const nextWIn = lockAspect
                          ? Number((nextHIn * ratio).toFixed(3))
                          : selectedItem.widthIn
                        updateSelectedItem(
                          { widthIn: nextWIn, heightIn: nextHIn },
                          true,
                        )
                      }}
                      className="rounded border border-brand-stone bg-brand-cream-light px-2 py-1.5 text-xs font-bold"
                    />
                  </label>
                </div>

                {/* Rotation */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>Rotation</span>
                    <span className="font-mono">{selectedItem.rotationDeg}°</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedItem(
                          {
                            rotationDeg: normalizeRotationDeg(
                              selectedItem.rotationDeg - 90,
                            ),
                          },
                          true,
                        )
                      }
                      className="rounded border border-brand-stone bg-brand-cream-light py-1 text-xs font-bold"
                    >
                      −90°
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedItem({ rotationDeg: 0 }, true)
                      }
                      className="rounded border border-brand-stone bg-brand-cream-light py-1 text-xs font-bold"
                    >
                      0°
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSelectedItem(
                          {
                            rotationDeg: normalizeRotationDeg(
                              selectedItem.rotationDeg + 90,
                            ),
                          },
                          true,
                        )
                      }
                      className="rounded border border-brand-stone bg-brand-cream-light py-1 text-xs font-bold"
                    >
                      +90°
                    </button>
                  </div>
                </div>

                {/* Sheet Alignment Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {(
                    [
                      ["left", "Align L"],
                      ["center", "Center X"],
                      ["right", "Align R"],
                      ["top", "Align T"],
                      ["middle", "Center Y"],
                      ["bottom", "Align B"],
                    ] as const
                  ).map(([code, label]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleAlignSelected(code)}
                      className="rounded border border-brand-stone bg-brand-cream-light py-1 text-[11px] font-semibold hover:border-brand-gold"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    commitItems(
                      items.filter((i) => i.id !== selectedItem.id),
                      true,
                    )
                    setSelectedId(null)
                  }}
                  className="mt-1 w-full rounded-lg border border-[#FECDD3] bg-[#FFF1F2] py-1.5 text-xs font-bold text-[#BE123C]"
                >
                  Remove Selected Item
                </button>
              </>
            ) : (
              <p className="text-xs text-brand-brown-dark leading-relaxed">
                Upload artwork or click any placed graphic on the {sheetWidthIn}
                &quot; sheet to duplicate, scale, rotate, or align.
              </p>
            )}
          </div>

          {/* Live Validation & Export / Cart Panel */}
          <div
            data-testid="gang-sheet-validation-panel"
            className="rounded-2xl border border-brand-stone bg-brand-white p-4 shadow-xs flex flex-col gap-3"
          >
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-brand-brown">
              04 / Pre-Flight Check &amp; Order
            </h2>

            <div className="rounded-xl bg-brand-cream-light border border-brand-stone p-3 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span>Overlap Collisions:</span>
                <strong
                  className={
                    validation.overlapIds.length > 0
                      ? "text-[#BE123C]"
                      : "text-[#15803d]"
                  }
                >
                  {validation.overlapIds.length === 0
                    ? "0 (Clear)"
                    : `${validation.overlapIds.length} Overlapping`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Roll Bounds &amp; {minMarginIn}&quot; Margin:</span>
                <strong
                  className={
                    validation.outOfBoundsIds.length +
                      validation.marginViolationIds.length >
                    0
                      ? "text-[#BE123C]"
                      : "text-[#15803d]"
                  }
                >
                  {validation.outOfBoundsIds.length +
                    validation.marginViolationIds.length ===
                  0
                    ? "Pass"
                    : "Out of Safe Area"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Min Gap ({minGapIn}&quot;):</span>
                <strong className="text-brand-anthracite">
                  {validation.gapViolationIds.length === 0
                    ? "Optimal"
                    : `${validation.gapViolationIds.length} Tight`}
                </strong>
              </div>
            </div>

            {validation.lowDpiIds.length > 0 && (
              <label className="flex items-start gap-2 rounded-lg border border-[#FECDD3] bg-[#FFF1F2] p-2.5 text-[11px] text-[#BE123C] cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowLowDpi}
                  onChange={(e) => setAllowLowDpi(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Approve {validation.lowDpiIds.length} item(s) below{" "}
                  {minAcceptableDpi} DPI
                </span>
              </label>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!items.length || busy}
                  onClick={handleExportDraftJson}
                  className="rounded-lg border border-brand-stone bg-brand-cream-light py-2 text-[11px] font-bold text-brand-anthracite disabled:opacity-40"
                >
                  Save Draft JSON
                </button>
                <button
                  type="button"
                  data-testid="gang-export-png"
                  disabled={!items.length || busy}
                  onClick={() => void handleExportTransparentPng()}
                  className="rounded-lg border border-brand-gold bg-brand-white py-2 text-[11px] font-bold text-brand-anthracite disabled:opacity-40"
                >
                  300-DPI PNG ↗
                </button>
              </div>

              <button
                type="button"
                data-testid="gang-save-server"
                disabled={!items.length || !validation.isValid || busy}
                onClick={() => void persistGangSheetOnServer()}
                className="w-full rounded-lg border border-brand-anthracite bg-brand-white py-2 text-xs font-bold text-brand-anthracite hover:bg-brand-cream disabled:opacity-40"
              >
                {busy ? "Processing…" : "Validate & Save Gang Sheet"}
              </button>

              <button
                type="button"
                data-testid="gang-add-to-cart"
                disabled={!items.length || !validation.isValid || busy}
                onClick={() => void handleAddGangSheetToCart()}
                className="w-full rounded-lg border border-brand-gold bg-brand-anthracite hover:bg-brand-brown py-3 text-xs font-extrabold text-brand-cream-light shadow-md disabled:opacity-40"
              >
                {busy
                  ? "Adding…"
                  : `Add Gang Sheet to Cart · ${
                      quote ? `${quote.subtotalFormatted} USD` : "…"
                    }`}
              </button>
            </div>

            {statusMessage && (
              <p
                role="status"
                data-testid="gang-sheet-status"
                className="text-xs font-semibold text-brand-brown-dark leading-snug"
              >
                {statusMessage}
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}
