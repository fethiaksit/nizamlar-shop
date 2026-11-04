"use client"

/**
 * Nizamlar Baskı — TSHIRT3D Interactive 3D Customizer & Editorial Experience
 * Visual & interaction architecture adapted from https://github.com/accodes21/tshirt3d
 * (MIT License — Copyright (c) 2023 Aarya Chopkar), integrated with Nizamlar Medusa v2
 * custom_design persistence, pricing engine, and cart workflow.
 */

import React, { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { AnimatePresence, motion } from "framer-motion"
import type { HttpTypes } from "@medusajs/types"
import {
  colorHex,
  getVariantOptions,
  isTshirt,
  printPlacement,
} from "@lib/3d/product"
import { isVariantInStock } from "@lib/util/inventory"
import { convertToLocale } from "@lib/util/money"
import {
  addSavedDesignsToMedusaCart,
  calculateClientPrintPricing,
  saveCustomDesignSurface,
  type DesignArtworkInput,
  type SavedCustomDesign,
} from "@modules/custom-studio/design-order-service"
import {
  downloadCanvasElementToPng,
  fadeAnimation,
  fileToDataUrl,
  getContrastingColor,
  headContainerAnimation,
  headContentAnimation,
  headTextAnimation,
  NIZAMLAR_TSHIRT_PALETTE,
  slideAnimation,
} from "./motion"

const Tshirt3dCanvas = dynamic(() => import("./tshirt3d-canvas"), {
  ssr: false,
})

const DEFAULT_LOGO_DECAL = "/tshirt3d/nizamlar-logo-decal.png"
const DEFAULT_FULL_DECAL = "/tshirt3d/nizamlar-full-pattern.png"
const MONOGRAM_DECAL = "/brand/sample-monogram.svg"

type EditorTabName = "" | "colorpicker" | "filepicker" | "aipicker"

const EDITOR_TABS: {
  name: Exclude<EditorTabName, "">
  label: string
  icon: string
}[] = [
  { name: "colorpicker", label: "Renk Seçici", icon: "/tshirt3d/swatch.png" },
  { name: "filepicker", label: "Dosya Yükle", icon: "/tshirt3d/file.png" },
  { name: "aipicker", label: "Nizamlar Desen & AI", icon: "/tshirt3d/ai.png" },
]

const FILTER_TABS: {
  name: "logoShirt" | "stylishShirt"
  label: string
  icon: string
}[] = [
  {
    name: "logoShirt",
    label: "Göğüs Logo Baskı",
    icon: "/tshirt3d/logo-tshirt.png",
  },
  {
    name: "stylishShirt",
    label: "Tam Yüzey Desen",
    icon: "/tshirt3d/stylish-tshirt.png",
  },
]

export default function Tshirt3dExperience({
  products,
  region,
  countryCode,
}: {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  countryCode: string
}) {
  // Match real Medusa T-shirt product (never create fake products)
  const product = useMemo(() => {
    return (
      products.find((p) => p.handle === "premium-oversize-penye-t-shirt") ||
      products.find(
        (p) =>
          isTshirt(p) &&
          (p.options?.some((o) => /^(renk|color|colour)$/i.test(o.title)) ||
            /premium-oversize/i.test(p.handle || "")),
      ) ||
      products.find(isTshirt) ||
      null
    )
  }, [products])

  const [intro, setIntro] = useState(true)
  const [shirtColor, setShirtColor] = useState("#B29460")
  const [isLogoTexture, setIsLogoTexture] = useState(true)
  const [isFullTexture, setIsFullTexture] = useState(false)
  const [logoDecal, setLogoDecal] = useState(DEFAULT_LOGO_DECAL)
  const [fullDecal, setFullDecal] = useState(DEFAULT_FULL_DECAL)
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTabName>("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadedMeta, setUploadedMeta] = useState<{
    logo?: { fileName: string; mime: string; aspect: number; url: string }
    full?: { fileName: string; mime: string; aspect: number; url: string }
  }>({})

  // 3D interaction states
  const [autoRotate, setAutoRotate] = useState(true)
  const [zoom, setZoom] = useState(1)
  const rotationYOffset = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Viewport visibility for lazy-loading & pausing WebGL loop
  const sectionRef = useRef<HTMLElement>(null)
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting
        setIsVisible(intersecting)
        if (intersecting) {
          setHasEnteredViewport(true)
        }
      },
      { rootMargin: "280px 0px", threshold: 0.02 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Medusa variant & order state
  const [options, setOptions] = useState<Record<string, string>>(() =>
    product
      ? getVariantOptions(
          product.variants?.find(isVariantInStock) || product.variants?.[0],
        )
      : {},
  )
  const [quantity, setQuantity] = useState(1)
  const [technique, setTechnique] = useState<"dtf" | "serigrafi">("dtf")
  const [busy, setBusy] = useState(false)
  const [statusMessage, setStatusMessage] = useState("")
  const [savedDesigns, setSavedDesigns] = useState<SavedCustomDesign[]>([])
  const [downloadedCount, setDownloadedCount] = useState(0)
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false)

  const colorOption = useMemo(
    () =>
      product?.options?.find((o) => /^(renk|color|colour)$/i.test(o.title)),
    [product],
  )
  const sizeOption = useMemo(
    () => product?.options?.find((o) => /^(beden|size)$/i.test(o.title)),
    [product],
  )

  const variant = useMemo(() => {
    if (!product?.variants?.length) return undefined
    return (
      product.variants.find((v) =>
        (product.options || []).every(
          (o) => getVariantOptions(v)[o.id] === options[o.id],
        ),
      ) || product.variants[0]
    )
  }, [product, options])

  // Sync color selection to Medusa variant color option when possible
  const handleSelectColor = (hex: string, variantColorLabel?: string) => {
    setShirtColor(hex)
    setSavedDesigns([])
    setStatusMessage("")
    if (colorOption && product) {
      const targetLabel =
        variantColorLabel ||
        NIZAMLAR_TSHIRT_PALETTE.find(
          (p) => p.hex.toLowerCase() === hex.toLowerCase(),
        )?.variantMatch
      if (targetLabel) {
        const matchedValue = colorOption.values?.find(
          (v) =>
            v.value.toLocaleLowerCase("tr-TR") ===
            targetLabel.toLocaleLowerCase("tr-TR"),
        )?.value
        if (matchedValue) {
          setOptions((prev) => ({ ...prev, [colorOption.id]: matchedValue }))
        }
      }
    }
  }

  // Handle filter tab toggles (matching Customizer.jsx)
  const handleActiveFilterTab = (tabName: "logoShirt" | "stylishShirt") => {
    if (tabName === "logoShirt") {
      setIsLogoTexture((prev) => !prev)
    } else if (tabName === "stylishShirt") {
      setIsFullTexture((prev) => !prev)
    }
    setSavedDesigns([])
    setStatusMessage("")
  }

  // Handle file upload & apply to Logo or Full decal (matching Customizer.jsx + FilePicker.jsx)
  const readFileAndApply = async (type: "logo" | "full", fileOverride?: File) => {
    const targetFile = fileOverride || selectedFile
    if (!targetFile) {
      setStatusMessage("Lütfen önce PNG, JPG veya WebP formatında bir dosya seçin.")
      return
    }
    if (
      !["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
        targetFile.type.toLowerCase(),
      ) ||
      targetFile.size > 25 * 1024 * 1024
    ) {
      setStatusMessage("En fazla 25 MB boyutunda PNG, JPG veya WebP yükleyin.")
      return
    }

    try {
      const dataUrl = await fileToDataUrl(targetFile)
      const img = new Image()
      img.src = dataUrl
      await img.decode()
      const aspect = Math.max(0.25, Math.min(4, img.naturalWidth / img.naturalHeight))

      if (type === "logo") {
        setLogoDecal(dataUrl)
        setIsLogoTexture(true)
        setUploadedMeta((prev) => ({
          ...prev,
          logo: {
            fileName: targetFile.name,
            mime: targetFile.type || "image/png",
            aspect,
            url: dataUrl,
          },
        }))
      } else {
        setFullDecal(dataUrl)
        setIsFullTexture(true)
        setUploadedMeta((prev) => ({
          ...prev,
          full: {
            fileName: targetFile.name,
            mime: targetFile.type || "image/png",
            aspect,
            url: dataUrl,
          },
        }))
      }
      setSavedDesigns([])
      setActiveEditorTab("")
      setStatusMessage(
        type === "logo"
          ? `Logo tişört üzerine uygulandı: ${targetFile.name}`
          : `Tam yüzey desen tişörte uygulandı: ${targetFile.name}`,
      )
    } catch {
      setStatusMessage("Görsel okunamadı. Lütfen geçerli bir resim dosyası seçin.")
    }
  }

  // Build physical print artwork spec for Medusa custom_design persistence
  const activeArtworkSpec = useMemo<DesignArtworkInput>(() => {
    if (isFullTexture) {
      const meta = uploadedMeta.full
      const aspect = meta?.aspect || 1
      const widthMm = aspect >= 1 ? 260 : Math.round(260 * aspect)
      return {
        url: meta?.url || fullDecal,
        fileName: meta?.fileName || "nizamlar-full-pattern.png",
        mime: meta?.mime || "image/png",
        aspect,
        widthMm,
        xMm: 0,
        yMm: 0,
        rotation: 0,
        positionId: "full_on",
        positionName: "Tam Yüzey Özel Baskı",
      }
    }
    const meta = uploadedMeta.logo
    const aspect = meta?.aspect || 1
    const widthMm = Math.min(140, Math.max(60, Math.round(120 * aspect)))
    return {
      url: meta?.url || logoDecal,
      fileName: meta?.fileName || "nizamlar-logo-decal.png",
      mime: meta?.mime || "image/png",
      aspect,
      widthMm,
      xMm: 0,
      yMm: -20,
      rotation: 0,
      positionId: "logo_on",
      positionName: "Ön Göğüs Logo Baskı",
    }
  }, [isFullTexture, uploadedMeta, fullDecal, logoDecal])

  const placementValid = useMemo(
    () =>
      (isLogoTexture || isFullTexture) &&
      printPlacement(activeArtworkSpec).valid,
    [isLogoTexture, isFullTexture, activeArtworkSpec],
  )

  const currencyCode =
    variant?.calculated_price?.currency_code || region.currency_code || "try"
  const fallbackPrice =
    product?.variants?.find((v) => v.calculated_price?.calculated_amount)?.calculated_price?.calculated_amount || 0
  const baseUnitPrice = variant?.calculated_price?.calculated_amount || fallbackPrice || 0
  const { printUnitCost, unitTotal, grandTotal, discountPct } =
    calculateClientPrintPricing({
      baseUnitPrice,
      technique,
      maxWidthMm: activeArtworkSpec.widthMm,
      surfaceCount: 1,
      quantity,
    })

  const handleSaveDesign = async (): Promise<SavedCustomDesign[]> => {
    if (!product || !variant || !placementValid || busy) {
      if (!product || !variant) {
        setStatusMessage("Eşleşen Medusa ürünü veya varyantı bulunamadı.")
      } else if (!placementValid) {
        setStatusMessage("Kaydetmek için en az bir baskı katmanı (Logo veya Full) aktif olmalıdır.")
      }
      return []
    }

    setBusy(true)
    setStatusMessage("Tasarım ve üretim ölçüleri kaydediliyor…")
    try {
      const saved = await saveCustomDesignSurface({
        product,
        variant,
        side: "front",
        artwork: activeArtworkSpec,
        colorHex: shirtColor,
        colorName: colorOption ? options[colorOption.id] || "Özel" : "Özel",
        sizeName: sizeOption ? options[sizeOption.id] || "M" : "M",
        quantity,
        technique,
      })
      const next = [saved]
      setSavedDesigns(next)
      setStatusMessage("Tasarım kalıcı olarak kaydedildi. Sepete ekleyebilirsiniz.")
      return next
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Tasarım kaydedilirken bir hata oluştu.",
      )
      return []
    } finally {
      setBusy(false)
    }
  }

  const handleAddToCart = async () => {
    if (!product || !variant || !placementValid || busy) return
    let currentSaved = savedDesigns
    if (!currentSaved.length) {
      currentSaved = await handleSaveDesign()
      if (!currentSaved.length) return
    }
    if (currentSaved.some((d) => !d.checkoutEnabled)) {
      setStatusMessage("Doğrulanmamış fiyata sahip tasarım sepete eklenemez.")
      return
    }

    setBusy(true)
    setStatusMessage("Özel baskılı tişört Medusa sepetinize ekleniyor…")
    try {
      await addSavedDesignsToMedusaCart({
        designIds: currentSaved.map((d) => d.id),
        quantity,
        technique,
        countryCode,
      })
      setStatusMessage("Tasarım kaydedildi ve baskılı ürün sepetinize eklendi!")
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Baskılı ürün sepete eklenemedi.",
      )
    } finally {
      setBusy(false)
    }
  }

  const handleDownloadPng = () => {
    const dataUrl = downloadCanvasElementToPng(
      canvasRef.current,
      "nizamlar-3d-tasarim.png",
    )
    if (dataUrl) {
      setDownloadedCount((c) => c + 1)
      setStatusMessage("3D tişört tasarımınız PNG olarak indirildi.")
    }
  }

  const buttonTextColor = getContrastingColor(shirtColor)

  return (
    <section
      ref={sectionRef}
      id="tshirt3d-experience"
      data-testid="tshirt3d-section"
      data-mode={intro ? "intro" : "customizer"}
      className="relative w-full min-h-[780px] h-[90vh] max-h-[940px] tshirt3d-stage-bg border-b border-brand-stone overflow-hidden select-none"
      style={{ touchAction: "pan-y" }}
    >
      {/* Subtle Editorial Top Border Accent */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-20 transition-colors duration-500"
        style={{ backgroundColor: shirtColor }}
      />

      {/* 3D Canvas Layer — Mounted lazily when approaching viewport, NEVER unmounted on Intro <-> Customizer toggle */}
      <div
        data-testid="tshirt3d-canvas-stage"
        className="absolute inset-0 w-full h-full z-[1] tshirt3d-stage-bg"
      >
        {hasEnteredViewport ? (
          <Tshirt3dCanvas
            intro={intro}
            color={shirtColor}
            isLogoTexture={isLogoTexture}
            isFullTexture={isFullTexture}
            logoDecal={logoDecal}
            fullDecal={fullDecal}
            autoRotate={autoRotate}
            zoom={zoom}
            rotationYOffsetRef={rotationYOffset}
            isVisible={isVisible}
            onCanvasReady={(canvas) => {
              canvasRef.current = canvas
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-end pr-16">
            <div className="w-72 h-72 rounded-full bg-brand-cream border border-brand-gold/30 flex items-center justify-center text-xs font-bold uppercase tracking-widest text-brand-brown">
              3D Sahne Yükleniyor…
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          1. INTRO VIEW (Referans Home.jsx Birebir Kompozisyonu)
         ===================================================================== */}
      <AnimatePresence>
        {intro && (
          <motion.div
            key="tshirt3d-home"
            data-testid="tshirt3d-intro"
            className="w-fit xl:h-full flex xl:justify-between justify-start items-start flex-col xl:py-10 xl:px-28 sm:p-10 p-6 max-xl:gap-5 absolute top-0 left-0 z-10 pointer-events-none"
            {...slideAnimation("left")}
          >
            {/* Header — Kurumsal Nizamlar Baskı Logosu (Yabancı threejs.png kaldırıldı) */}
            <motion.header
              className="flex items-center gap-3 pointer-events-auto"
              {...slideAnimation("down")}
            >
              <img
                src="/brand/logo.svg"
                alt="Nizamlar Baskı"
                className="h-9 w-auto object-contain"
              />
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-anthracite text-brand-cream-light text-[10px] font-bold tracking-widest uppercase border border-brand-gold/50">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                3D T-SHIRT STUDIO
              </span>
            </motion.header>

            {/* Editorial Başlık, Açıklama ve CTA */}
            <motion.div
              className="flex-1 xl:justify-center justify-start flex flex-col gap-6 sm:gap-8"
              {...headContainerAnimation}
            >
              <motion.div {...headTextAnimation}>
                <h2 className="tshirt3d-head-text text-[3.8rem] leading-[4rem] sm:text-[6.2rem] sm:leading-[6.4rem] xl:text-[8.5rem] xl:leading-[8.6rem]">
                  HAYDİ <br className="xl:block hidden" />{" "}
                  <span>TASARLA.</span>
                </h2>
              </motion.div>

              <motion.div
                {...headContentAnimation}
                className="flex flex-col gap-6 pointer-events-auto"
              >
                <p className="max-w-md font-normal text-brand-brown-dark text-sm sm:text-base leading-relaxed bg-brand-cream-light/80 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none p-2.5 sm:p-0 rounded-lg">
                  Hayalindeki tişörtü tasarla. Rengini seç, logonu yükle ve{" "}
                  <strong className="text-brand-anthracite font-bold">
                    Nizamlar Baskı
                  </strong>{" "}
                  kalitesiyle gerçeğe dönüştür.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    data-testid="tshirt3d-customize-btn"
                    onClick={() => setIntro(false)}
                    className="w-fit flex-none px-7 py-3.5 rounded-lg font-bold text-sm tracking-wide shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border border-brand-anthracite/15"
                    style={{
                      backgroundColor: shirtColor,
                      color: buttonTextColor,
                    }}
                  >
                    Tasarımını Oluştur
                  </button>

                  {product && (
                    <span className="text-xs font-semibold text-brand-brown px-3 py-2 rounded-md bg-brand-white/80 border border-brand-stone/60">
                      {product.title} ·{" "}
                      {convertToLocale({
                        amount: baseUnitPrice,
                        currency_code: currencyCode,
                      })}
                    </span>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =====================================================================
          2. CUSTOMIZER VIEW (Referans Customizer.jsx + Medusa Sipariş Paneli)
         ===================================================================== */}
      <AnimatePresence>
        {!intro && (
          <>
            {/* Sol Editör Sekmeleri (Renk, Dosya, Desen/AI) */}
            <motion.div
              key="tshirt3d-editor-left"
              data-testid="tshirt3d-editor-tabs"
              className="absolute top-0 left-0 z-20 h-full flex items-center pl-2 sm:pl-4 pointer-events-none"
              {...slideAnimation("left")}
            >
              <div className="tshirt3d-editortabs tshirt3d-glassmorphism relative pointer-events-auto">
                {EDITOR_TABS.map((tab) => {
                  const isActive = activeEditorTab === tab.name
                  return (
                    <button
                      key={tab.name}
                      type="button"
                      data-testid={`tshirt3d-tab-${tab.name}`}
                      aria-label={tab.label}
                      aria-pressed={isActive}
                      onClick={() =>
                        setActiveEditorTab((prev) =>
                          prev === tab.name ? "" : tab.name,
                        )
                      }
                      className={`tshirt3d-tab-btn rounded-lg ${
                        isActive
                          ? "ring-2 ring-brand-gold bg-brand-anthracite/10"
                          : ""
                      }`}
                    >
                      <img
                        src={tab.icon}
                        alt={tab.label}
                        className="w-8 h-8 object-contain"
                      />
                    </button>
                  )
                })}

                {/* Tab 1: Renk Seçici Popover */}
                {activeEditorTab === "colorpicker" && (
                  <div
                    data-testid="tshirt3d-colorpicker-popover"
                    className="absolute left-full ml-3 top-0 tshirt3d-glassmorphism p-3.5 w-[225px] rounded-xl flex flex-col gap-3 z-30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-brand-anthracite">
                        Kumaş Rengi
                      </span>
                      <span className="text-[11px] font-mono font-bold text-brand-brown">
                        {shirtColor.toUpperCase()}
                      </span>
                    </div>

                    {/* Kurumsal Nizamlar & Medusa Renk Swatchları */}
                    <div className="grid grid-cols-5 gap-2">
                      {NIZAMLAR_TSHIRT_PALETTE.map((swatch) => {
                        const selected =
                          shirtColor.toLowerCase() === swatch.hex.toLowerCase()
                        return (
                          <button
                            key={swatch.name}
                            type="button"
                            data-testid={`tshirt3d-swatch-${swatch.name
                              .toLocaleLowerCase("tr-TR")
                              .replace(/\s+/g, "-")}`}
                            title={swatch.name}
                            aria-label={`Renk ${swatch.name}`}
                            onClick={() =>
                              handleSelectColor(swatch.hex, swatch.variantMatch)
                            }
                            className={`w-8 h-8 rounded-full border transition-transform ${
                              selected
                                ? "scale-110 ring-2 ring-brand-gold border-brand-anthracite"
                                : "border-brand-stone hover:scale-105"
                            }`}
                            style={{ backgroundColor: swatch.hex }}
                          />
                        )
                      })}
                    </div>

                    {/* Serbest Renk Seçici (SketchPicker Muadili) */}
                    <div className="flex items-center gap-2 pt-2 border-t border-brand-stone/50">
                      <input
                        type="color"
                        data-testid="tshirt3d-color-input"
                        aria-label="Özel renk seçici"
                        value={shirtColor}
                        onChange={(e) => handleSelectColor(e.target.value)}
                        className="w-9 h-8 rounded cursor-pointer border border-brand-stone bg-transparent"
                      />
                      <input
                        type="text"
                        aria-label="Hex renk kodu"
                        value={shirtColor}
                        onChange={(e) => {
                          const v = e.target.value
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                            setShirtColor(v)
                          }
                        }}
                        className="flex-1 px-2 py-1 text-xs font-mono font-bold rounded border border-brand-stone bg-brand-white text-brand-anthracite"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 2: Dosya Yükleyici Popover (Referans FilePicker.jsx) */}
                {activeEditorTab === "filepicker" && (
                  <div
                    data-testid="tshirt3d-filepicker-popover"
                    className="absolute left-full ml-3 top-0 tshirt3d-glassmorphism p-3.5 w-[225px] min-h-[215px] rounded-xl flex flex-col justify-between z-30"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-brand-anthracite">
                        Görsel Yükle
                      </span>
                      <input
                        id="tshirt3d-file-upload"
                        data-testid="tshirt3d-file-input"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null
                          setSelectedFile(f)
                        }}
                        className="sr-only"
                      />
                      <label
                        htmlFor="tshirt3d-file-upload"
                        className="border border-brand-brown py-2 px-3 rounded-md shadow-xs text-xs font-bold text-brand-anthracite bg-brand-white hover:bg-brand-cream cursor-pointer w-fit transition-colors"
                      >
                        Dosya Seç
                      </label>
                      <p
                        data-testid="tshirt3d-file-name"
                        className="mt-1 text-brand-brown-dark text-xs truncate font-medium"
                      >
                        {selectedFile
                          ? selectedFile.name
                          : "Henüz dosya seçilmedi"}
                      </p>
                      <p className="text-[10px] text-brand-stone-muted leading-snug">
                        PNG, JPG veya WebP · Maks. 25 MB. Orijinal dosyanız
                        üretim için saklanır.
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        data-testid="tshirt3d-apply-logo"
                        onClick={() => void readFileAndApply("logo")}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-bold border border-brand-anthracite text-brand-anthracite bg-brand-white hover:bg-brand-cream transition-colors"
                      >
                        Logo
                      </button>
                      <button
                        type="button"
                        data-testid="tshirt3d-apply-full"
                        onClick={() => void readFileAndApply("full")}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-bold shadow-md transition-transform hover:scale-105"
                        style={{
                          backgroundColor: shirtColor,
                          color: buttonTextColor,
                        }}
                      >
                        Full
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 3: Kurumsal Hazır Şablon & AI Bilgi Sekmesi (Güvenli Mod) */}
                {activeEditorTab === "aipicker" && (
                  <div
                    data-testid="tshirt3d-aipicker-popover"
                    className="absolute left-full ml-3 top-0 tshirt3d-glassmorphism p-3.5 w-[235px] rounded-xl flex flex-col gap-3 z-30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-brand-anthracite">
                        Nizamlar Hazır Baskılar
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-anthracite text-brand-gold font-bold">
                        ATELIER
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-brown-dark leading-relaxed">
                      Harici demo AI servisi güvenlik nedeniyle devre dışıdır.
                      Hazır kurumsal Nizamlar baskılarını tek tıkla
                      uygulayabilir veya Dosya sekmesinden kendi tasarımınızı
                      yükleyebilirsiniz.
                    </p>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLogoDecal(DEFAULT_LOGO_DECAL)
                          setIsLogoTexture(true)
                          setUploadedMeta((p) => ({ ...p, logo: undefined }))
                          setSavedDesigns([])
                          setActiveEditorTab("")
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-bold bg-brand-white border border-brand-stone hover:border-brand-brown text-brand-anthracite"
                      >
                        Nizamlar Atelier Arma (Logo)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLogoDecal(MONOGRAM_DECAL)
                          setIsLogoTexture(true)
                          setUploadedMeta((p) => ({ ...p, logo: undefined }))
                          setSavedDesigns([])
                          setActiveEditorTab("")
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-bold bg-brand-white border border-brand-stone hover:border-brand-brown text-brand-anthracite"
                      >
                        NB 1994 Monogram (Logo)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFullDecal(DEFAULT_FULL_DECAL)
                          setIsFullTexture(true)
                          setUploadedMeta((p) => ({ ...p, full: undefined }))
                          setSavedDesigns([])
                          setActiveEditorTab("")
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-md text-xs font-bold bg-brand-anthracite text-brand-cream-light border border-brand-gold"
                      >
                        Nizamlar Monogram Desen (Full)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Sağ Üst "Geri Dön" ve Mobil Sipariş Paneli Aç/Kapat */}
            <motion.div
              key="tshirt3d-top-right"
              className="absolute z-20 top-5 right-5 flex items-center gap-2.5"
              {...fadeAnimation}
            >
              <button
                type="button"
                onClick={() => setMobileOrderOpen((prev) => !prev)}
                className="lg:hidden px-3.5 py-2.5 rounded-lg font-bold text-xs bg-brand-anthracite text-brand-cream-light border border-brand-gold shadow-md"
              >
                {mobileOrderOpen ? "Siparişi Gizle" : "Sipariş & Beden"}
              </button>
              <button
                type="button"
                data-testid="tshirt3d-goback-btn"
                onClick={() => {
                  setActiveEditorTab("")
                  setIntro(true)
                }}
                className="w-fit px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:scale-105 transition-transform border border-brand-anthracite/15"
                style={{
                  backgroundColor: shirtColor,
                  color: buttonTextColor,
                }}
              >
                Geri Dön
              </button>
            </motion.div>

            {/* Sağ Taraf: Kompakt Nizamlar Medusa Sipariş & Baskı Paneli */}
            <motion.aside
              key="tshirt3d-order-panel"
              data-testid="tshirt3d-order-panel"
              className={` absolute z-20 right-4 sm:right-6 top-20 w-[290px] sm:w-[310px] rounded-2xl tshirt3d-glassmorphism p-4 flex flex-col gap-3 shadow-2xl ${
                mobileOrderOpen ? "flex" : "hidden lg:flex"
              }`}
              {...slideAnimation("right")}
            >
              <div className="flex items-start justify-between gap-2 border-b border-brand-stone/60 pb-2.5">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-brown block">
                    MEDUSA CANLI SİPARİŞ
                  </span>
                  <h3 className="text-sm font-extrabold text-brand-anthracite leading-snug">
                    {product?.title || "Nizamlar Premium Oversize Tişört"}
                  </h3>
                </div>
                <span className="text-xs font-extrabold px-2 py-1 rounded bg-brand-anthracite text-brand-gold-hover shrink-0">
                  {convertToLocale({
                    amount: unitTotal,
                    currency_code: currencyCode,
                  })}
                </span>
              </div>

              {product ? (
                <>
                  {/* Varyant Seçiciler: Renk & Beden */}
                  <div className="grid grid-cols-2 gap-2">
                    {product.options?.map((opt) => (
                      <label
                        key={opt.id}
                        className="flex flex-col gap-1 text-[11px] font-bold text-brand-brown-dark"
                      >
                        <span>{opt.title}</span>
                        <select
                          aria-label={`Tshirt3D ${opt.title}`}
                          data-testid={`tshirt3d-option-${opt.title.toLocaleLowerCase("tr-TR")}`}
                          value={options[opt.id] || ""}
                          disabled={busy}
                          onChange={(e) => {
                            const val = e.target.value
                            setOptions((prev) => ({ ...prev, [opt.id]: val }))
                            setSavedDesigns([])
                            if (/^(renk|color|colour)$/i.test(opt.title)) {
                              setShirtColor(colorHex(val))
                            }
                          }}
                          className="px-2 py-1.5 rounded-md border border-brand-stone bg-brand-white text-xs font-bold text-brand-anthracite"
                        >
                          {opt.values?.map((v) => (
                            <option key={v.value} value={v.value}>
                              {v.value}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>

                  {/* Adet & Baskı Tekniği */}
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1 text-[11px] font-bold text-brand-brown-dark">
                      <span>Adet</span>
                      <input
                        type="number"
                        aria-label="Tshirt3D Adet"
                        data-testid="tshirt3d-quantity-input"
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
                          setSavedDesigns([])
                        }}
                        className="px-2 py-1.5 rounded-md border border-brand-stone bg-brand-white text-xs font-bold text-brand-anthracite"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-[11px] font-bold text-brand-brown-dark">
                      <span>Baskı Tekniği</span>
                      <select
                        aria-label="Tshirt3D Baskı Tekniği"
                        data-testid="tshirt3d-technique-select"
                        value={technique}
                        disabled={busy}
                        onChange={(e) => {
                          setTechnique(e.target.value as "dtf" | "serigrafi")
                          setSavedDesigns([])
                        }}
                        className="px-2 py-1.5 rounded-md border border-brand-stone bg-brand-white text-xs font-bold text-brand-anthracite"
                      >
                        <option value="dtf">DTF Dijital</option>
                        <option value="serigrafi">Serigrafi</option>
                      </select>
                    </label>
                  </div>

                  {/* Fiyat Özeti */}
                  <div className="p-2.5 rounded-lg bg-brand-cream/90 border border-brand-stone/80 text-[11px] flex flex-col gap-1">
                    <div className="flex justify-between text-brand-brown-dark">
                      <span>Birim Tişört:</span>
                      <span className="font-semibold">
                        {convertToLocale({
                          amount: baseUnitPrice,
                          currency_code: currencyCode,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-brand-brown-dark">
                      <span>
                        Baskı ({isFullTexture ? "Tam Yüzey" : "Göğüs Logo"}
                        {discountPct > 0 ? ` · -%${discountPct}` : ""}):
                      </span>
                      <span className="font-semibold">
                        +
                        {convertToLocale({
                          amount: printUnitCost,
                          currency_code: currencyCode,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between text-brand-anthracite font-extrabold text-xs pt-1 border-t border-brand-stone/60">
                      <span>Toplam ({quantity} Adet):</span>
                      <span data-testid="tshirt3d-total-price">
                        {convertToLocale({
                          amount: grandTotal,
                          currency_code: currencyCode,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Kaydet & Sepete Ekle Butonları */}
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      data-testid="tshirt3d-save-btn"
                      disabled={busy || !placementValid || !variant}
                      onClick={() => void handleSaveDesign()}
                      className="w-full py-2 px-3 rounded-lg text-xs font-bold border border-brand-anthracite text-brand-anthracite bg-brand-white hover:bg-brand-cream disabled:opacity-50 transition-colors"
                    >
                      {busy ? "Kaydediliyor…" : "Tasarımı Kaydet"}
                    </button>
                    <button
                      type="button"
                      data-testid="tshirt3d-cart-btn"
                      disabled={busy || !placementValid || !variant}
                      onClick={() => void handleAddToCart()}
                      className="w-full py-2.5 px-3 rounded-lg text-xs font-extrabold bg-brand-anthracite hover:bg-brand-brown text-brand-cream-light border border-brand-gold shadow-md disabled:opacity-50 transition-colors"
                    >
                      {busy
                        ? "İşleniyor…"
                        : `Sepete Ekle · ${convertToLocale({
                            amount: grandTotal,
                            currency_code: currencyCode,
                          })}`}
                    </button>
                  </div>

                  {savedDesigns.length > 0 && (
                    <div
                      data-testid="tshirt3d-saved-badge"
                      className="text-[11px] font-semibold text-brand-anthracite bg-brand-white/90 border border-brand-gold px-2.5 py-1.5 rounded-md"
                    >
                      Kayıt No: <span className="font-mono">{savedDesigns[0].id}</span>
                    </div>
                  )}

                  {statusMessage && (
                    <p
                      role="status"
                      data-testid="tshirt3d-status"
                      className="text-[11px] font-medium text-brand-brown-dark leading-snug"
                    >
                      {statusMessage}
                    </p>
                  )}
                </>
              ) : (
                <p role="alert" className="text-xs text-brand-brown-dark">
                  Mağaza kataloğunda uygun tişört ürünü bulunamadı.
                </p>
              )}
            </motion.aside>

            {/* Alt Filtre (Logo / Full) + PNG İndir + 3D Döndürme/Zoom Barı */}
            <motion.div
              key="tshirt3d-bottom-filters"
              data-testid="tshirt3d-filter-tabs"
              className="absolute z-20 bottom-5 right-0 left-0 w-full flex justify-center items-center flex-wrap gap-3 px-4 pointer-events-none"
              {...slideAnimation("up")}
            >
              <div className="flex items-center gap-3 pointer-events-auto">
                {FILTER_TABS.map((tab) => {
                  const isActive =
                    tab.name === "logoShirt" ? isLogoTexture : isFullTexture
                  return (
                    <button
                      key={tab.name}
                      type="button"
                      data-testid={`tshirt3d-filter-${tab.name}`}
                      aria-label={tab.label}
                      aria-pressed={isActive}
                      onClick={() => handleActiveFilterTab(tab.name)}
                      className="tshirt3d-tab-btn rounded-full tshirt3d-glassmorphism"
                      style={
                        isActive
                          ? {
                              backgroundColor: shirtColor,
                              borderColor: "#222325",
                            }
                          : undefined
                      }
                    >
                      <img
                        src={tab.icon}
                        alt={tab.label}
                        className="w-8 h-8 object-contain"
                      />
                    </button>
                  )
                })}

                {/* PNG İndirme Butonu (Sadece bu 3D tişört canvas'ını dışa aktarır) */}
                <button
                  type="button"
                  data-testid="tshirt3d-download-btn"
                  aria-label="Tasarımı PNG olarak indir"
                  data-downloaded-count={downloadedCount}
                  onClick={handleDownloadPng}
                  className="tshirt3d-tab-btn rounded-full tshirt3d-glassmorphism"
                >
                  <img
                    src="/tshirt3d/download.png"
                    alt="PNG İndir"
                    className="w-7 h-7 object-contain"
                  />
                </button>
              </div>

              {/* 3D Döndürme ve Yakınlaştırma Yardımcı Kontrolleri */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full tshirt3d-glassmorphism pointer-events-auto text-xs font-bold text-brand-anthracite">
                <button
                  type="button"
                  aria-label="Sola döndür"
                  onClick={() => {
                    setAutoRotate(false)
                    rotationYOffset.current -= 0.45
                  }}
                  className="px-2 py-1 rounded hover:bg-brand-anthracite/10"
                >
                  ↺
                </button>
                <button
                  type="button"
                  aria-label="Otomatik döndürme"
                  aria-pressed={autoRotate}
                  onClick={() => setAutoRotate((prev) => !prev)}
                  className={`px-2 py-1 rounded text-[11px] ${
                    autoRotate
                      ? "bg-brand-anthracite text-brand-cream-light"
                      : "hover:bg-brand-anthracite/10"
                  }`}
                >
                  360°
                </button>
                <button
                  type="button"
                  aria-label="Sağa döndür"
                  onClick={() => {
                    setAutoRotate(false)
                    rotationYOffset.current += 0.45
                  }}
                  className="px-2 py-1 rounded hover:bg-brand-anthracite/10"
                >
                  ↻
                </button>
                <span className="text-brand-stone">|</span>
                <button
                  type="button"
                  aria-label="Yakınlaştır"
                  onClick={() =>
                    setZoom((z) => Math.min(1.35, Number((z + 0.12).toFixed(2))))
                  }
                  className="px-2 py-1 rounded hover:bg-brand-anthracite/10"
                >
                  +
                </button>
                <button
                  type="button"
                  aria-label="Uzaklaştır"
                  onClick={() =>
                    setZoom((z) => Math.max(0.82, Number((z - 0.12).toFixed(2))))
                  }
                  className="px-2 py-1 rounded hover:bg-brand-anthracite/10"
                >
                  −
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  )
}
