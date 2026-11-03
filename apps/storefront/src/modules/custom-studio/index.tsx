"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import {
  STUDIO_PRODUCTS,
  StudioProductConfig,
  PaletteColor,
  PrintPositionPreset,
} from "./mockup-config"
import { generateProductSvgString } from "./mockup-engine"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

interface CustomPrintStudioProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  onClose?: () => void
}

export default function CustomPrintStudio({
  product,
  region,
  countryCode,
  onClose,
}: CustomPrintStudioProps) {
  // 1. Ürün modeli tespiti (t-shirt, hoodie veya canta)
  const productKey = useMemo(() => {
    const handle = product.handle || ""
    if (handle.includes("hoodie") || handle.includes("sweatshirt")) return "hoodie"
    if (handle.includes("canta") || handle.includes("bag")) return "canta"
    return "tisort"
  }, [product.handle])

  const studioConfig: StudioProductConfig = STUDIO_PRODUCTS[productKey] || STUDIO_PRODUCTS.tisort

  // 2. React State'leri
  const [activeView, setActiveView] = useState<"front" | "back">("front")
  const [selectedColor, setSelectedColor] = useState<PaletteColor>(studioConfig.supportedColors[0])
  const [selectedSize, setSelectedSize] = useState<string>("M")
  const [quantity, setQuantity] = useState<number>(1)
  const [activeTechnique, setActiveTechnique] = useState<"dtf" | "serigrafi">("dtf")

  // Tasarım ve Dosya State'leri
  const [artworkSrc, setArtworkSrc] = useState<string | null>(null)
  const [artworkFile, setArtworkFile] = useState<File | null>(null)
  const [artworkBase64, setArtworkBase64] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [blendMode, setBlendMode] = useState<"normal" | "multiply">("normal")

  // Transformasyon koordinatları (Stage: 600 x 680)
  const defaultPosKey = studioConfig.views[activeView]?.defaultPosition || "buyuk_on"
  const defaultPreset = studioConfig.views[activeView]?.positions[defaultPosKey]

  const [positionX, setPositionX] = useState<number>(defaultPreset?.x || 300)
  const [positionY, setPositionY] = useState<number>(defaultPreset?.y || 330)
  const [scale, setScale] = useState<number>(defaultPreset?.scale || 0.95)
  const [rotation, setRotation] = useState<number>(0)
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPosKey)

  // Durum Yönetimi (Undo / Redo)
  const [history, setHistory] = useState<Array<{ x: number; y: number; s: number; r: number }>>([])
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  // Stage ve Görsel Referansları
  const stageRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef<boolean>(false)
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const viewConfig = studioConfig.views[activeView] || studioConfig.views.front
  const printableArea = viewConfig.printableArea

  // Preset seçimi değiştiğinde koordinatları uygula
  const applyPreset = (preset: PrintPositionPreset) => {
    saveToHistory()
    setPositionX(preset.x)
    setPositionY(preset.y)
    setScale(preset.scale)
    setRotation(preset.rotation)
    setSelectedPresetId(preset.id)
  }

  const saveToHistory = () => {
    setHistory((prev) => [...prev.slice(-15), { x: positionX, y: positionY, s: scale, r: rotation }])
  }

  const handleUndo = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setPositionX(prev.x)
    setPositionY(prev.y)
    setScale(prev.s)
    setRotation(prev.r)
  }

  // Dosya Yükleme (Drag & Drop veya File Input)
  const handleFileUpload = (file: File) => {
    if (!file) return

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
    if (!allowed.includes(file.type)) {
      alert("Yalnızca PNG, JPG, WEBP veya SVG yükleyebilirsiniz.")
      return
    }

    if (file.size > 25 * 1024 * 1024) {
      alert("Dosya boyutu 25 MB'dan küçük olmalıdır.")
      return
    }

    setFileName(file.name)
    setArtworkFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const res = e.target?.result as string
      setArtworkSrc(res)
      setArtworkBase64(res)
    }
    reader.readAsDataURL(file)
  }

  // Pointer / Drag Event'leri (Mobil dokunmatik ve masaüstü)
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    saveToHistory()
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    dragStart.current = { x: e.clientX, y: e.clientY }

    setPositionX((px) => {
      const nextX = px + dx
      // Baskı alanı sınırları içinde tut
      const minX = printableArea.x
      const maxX = printableArea.x + printableArea.width
      return Math.max(minX, Math.min(maxX, nextX))
    })

    setPositionY((py) => {
      const nextY = py + dy
      const minY = printableArea.y
      const maxY = printableArea.y + printableArea.height
      return Math.max(minY, Math.min(maxY, nextY))
    })
  }

  const handlePointerUp = () => {
    isDragging.current = false
  }

  // Dinamik SVG Arka Planı
  const svgBg = useMemo(() => {
    return generateProductSvgString(productKey, activeView, selectedColor.hex, studioConfig.spec)
  }, [productKey, activeView, selectedColor.hex, studioConfig.spec])

  // Fiyat Hesaplama
  const unitBasePrice = 450 // Varsayılan baz fiyat
  const printCost = activeTechnique === "dtf" ? 85 : 60
  const finalUnitPrice = unitBasePrice + printCost
  const totalAmount = finalUnitPrice * quantity

  // Baskılı Ürünü Sepete Ekleme Akışı
  const handleAddToCartWithDesign = async () => {
    if (!artworkBase64) {
      alert("Lütfen önce bir tasarım dosyası yükleyin.")
      return
    }

    setIsSubmitting(true)
    setStatusMessage("Tasarımınız sunucuya kaydediliyor...")

    try {
      // 1. Variant ID tespiti
      const matchingVariant = product.variants?.find((v) => {
        const optValues = Object.values(v.options || {})
        return optValues.includes(selectedSize) || true
      }) || product.variants?.[0]

      if (!matchingVariant) {
        throw new Error("Uygun ürün varyantı bulunamadı.")
      }

      // 2. Medusa Backend /store/custom-designs API'sine güvenli kayıt
      const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
      const pubKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

      const payload = {
        productId: product.id,
        variantId: matchingVariant.id,
        originalFileName: fileName || "tasarim.png",
        fileMimeType: artworkFile?.type || "image/png",
        originalFileBase64: artworkBase64,
        colorId: selectedColor.id,
        colorName: selectedColor.name,
        colorHex: selectedColor.hex,
        size: selectedSize,
        view: activeView,
        positionId: selectedPresetId,
        positionName: viewConfig.positions[selectedPresetId]?.name || "Özel Konum",
        transform: {
          x: positionX,
          y: positionY,
          scale,
          rotation,
        },
        physicalDimensions: {
          widthMm: Math.round(220 * scale),
          heightMm: Math.round(220 * scale),
          areaCm2: Math.round((22 * scale) * (22 * scale)),
          scale,
          rotation,
          x: positionX,
          y: positionY,
        },
        quantity,
        pricingInput: {
          basePrice: unitBasePrice,
          technique: activeTechnique,
          sizeCode: scale > 1 ? "a3" : "a4",
        },
      }

      const res = await fetch(`${backendUrl}/store/custom-designs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": pubKey,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errJson = await res.json()
        throw new Error(errJson.message || "Tasarım kaydedilemedi.")
      }

      const { design } = await res.json()
      setStatusMessage("Tasarım kaydedildi. Sepete ekleniyor...")

      // 3. Medusa Sepetine tasarım referansı (design_id) ile ekle
      // Next.js Server Action addToCart fonksiyonuna variantId ve adet gönderilir
      await addToCart({
        variantId: matchingVariant.id,
        quantity,
        countryCode,
      })

      setStatusMessage("✅ Baskılı ürün sepetinize eklendi!")
      setTimeout(() => {
        if (onClose) onClose()
      }, 1200)
    } catch (err: any) {
      console.error(err)
      alert(`Sepete ekleme başarısız: ${err.message}`)
      setStatusMessage(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0C0D0E]/90 backdrop-blur-md flex flex-col overflow-y-auto">
      {/* Üst Bar */}
      <header className="h-16 px-6 bg-[#141517] border-b border-[#242629] flex items-center justify-between text-[#F8F8F5]">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Nizamlar Canlı Baskı Editörü — {product.title}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-medium text-[#A0A2A6] hover:text-[#F8F8F5] px-3 py-1.5 rounded border border-[#2F3136] hover:bg-[#1E2023] transition-colors"
        >
          Kapat ✕
        </button>
      </header>

      {/* Ana Çalışma Alanı (3 Sütunlu Masaüstü Tasarımı) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* SOL PANEL: Ürün, Renk, Boyut & Dosya Ayarları (3 Kolon) */}
        <div className="lg:col-span-3 flex flex-col gap-5 bg-[#141517] p-5 rounded-xl border border-[#242629] text-xs text-[#E1E2E5]">
          <div>
            <label className="font-semibold text-[#A0A2A6] uppercase tracking-wider block mb-2">
              Kumaş Rengi ({selectedColor.name})
            </label>
            <div className="flex flex-wrap gap-2">
              {studioConfig.supportedColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color.hex }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    selectedColor.id === color.id
                      ? "border-[#D4AF37] scale-110 shadow-lg"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="font-semibold text-[#A0A2A6] uppercase tracking-wider block mb-2">
              Beden Seçimi
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {["S", "M", "L", "XL", "2XL"].map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-1.5 rounded font-medium border text-center transition-all ${
                    selectedSize === sz
                      ? "bg-[#D4AF37] text-[#141517] border-[#D4AF37] font-bold"
                      : "border-[#2F3136] bg-[#1C1E21] text-[#A0A2A6] hover:border-[#404349]"
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Dosya Yükleme Alanı */}
          <div className="pt-2 border-t border-[#242629]">
            <label className="font-semibold text-[#A0A2A6] uppercase tracking-wider block mb-2">
              Tasarım Dosyası Yükle
            </label>
            <div className="relative border-2 border-dashed border-[#34373D] hover:border-[#D4AF37] rounded-lg p-4 text-center cursor-pointer transition-colors bg-[#1A1C1F]">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="text-[#A0A2A6]">
                <p className="font-medium text-[#F8F8F5] mb-1">Görsel Seç veya Sürükle</p>
                <p className="text-[10px]">PNG (şeffaf), SVG, JPG (Maks. 25 MB)</p>
              </div>
            </div>
            {fileName && (
              <p className="mt-2 text-[11px] text-[#D4AF37] truncate">
                ✓ Yüklendi: {fileName}
              </p>
            )}
          </div>

          {/* Baskı Alanı & Hazır Konumlar */}
          <div className="pt-2 border-t border-[#242629]">
            <label className="font-semibold text-[#A0A2A6] uppercase tracking-wider block mb-2">
              Baskı Konumu
            </label>
            <div className="flex flex-col gap-1.5">
              {Object.values(viewConfig.positions).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`px-3 py-2 rounded text-left border transition-all ${
                    selectedPresetId === preset.id
                      ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#E5C158]"
                      : "border-[#2A2C30] hover:bg-[#1E2023] text-[#A0A2A6]"
                  }`}
                >
                  <div className="font-medium">{preset.name}</div>
                  <div className="text-[10px] opacity-75">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* İnce Ayarlar (Ölçek, Döndürme, Doku) */}
          {artworkSrc && (
            <div className="pt-2 border-t border-[#242629] flex flex-col gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[#A0A2A6]">Ölçek:</span>
                  <span>{Math.round(scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full accent-[#D4AF37]"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#A0A2A6]">Baskı Efekti:</span>
                <button
                  onClick={() => setBlendMode((m) => (m === "normal" ? "multiply" : "normal"))}
                  className="px-2 py-1 rounded bg-[#202226] border border-[#303338] text-[10px]"
                >
                  {blendMode === "normal" ? "DTF Canlı Baskı" : "Su Bazlı Ekolojik"}
                </button>
              </div>

              <button
                onClick={handleUndo}
                disabled={history.length === 0}
                className="w-full py-1.5 rounded border border-[#2F3136] text-[#A0A2A6] hover:text-[#F8F8F5] disabled:opacity-40"
              >
                ⟲ Geri Al
              </button>
            </div>
          )}
        </div>

        {/* ORTA PANEL: Canlı Ürün ve Baskı Önizleme Sahnesi (6 Kolon) */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center bg-[#141517] p-4 rounded-xl border border-[#242629]">
          {/* Ön / Arka Yüz Seçici */}
          <div className="flex items-center gap-2 mb-4 bg-[#1E2023] p-1 rounded-lg border border-[#2D3035]">
            <button
              onClick={() => {
                setActiveView("front")
                setSelectedPresetId("buyuk_on")
              }}
              className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${
                activeView === "front"
                  ? "bg-[#D4AF37] text-[#141517]"
                  : "text-[#A0A2A6] hover:text-[#F8F8F5]"
              }`}
            >
              Ön Yüzey
            </button>
            {studioConfig.supportedViews.includes("back") && (
              <button
                onClick={() => {
                  setActiveView("back")
                  setSelectedPresetId("buyuk_sirt")
                }}
                className={`px-4 py-1.5 rounded text-xs font-semibold transition-all ${
                  activeView === "back"
                    ? "bg-[#D4AF37] text-[#141517]"
                    : "text-[#A0A2A6] hover:text-[#F8F8F5]"
                }`}
              >
                Sırt / Arka
              </button>
            )}
          </div>

          {/* Vektör Mockup Sahnesi (600 x 680 Stage) */}
          <div
            ref={stageRef}
            className="relative w-full max-w-[500px] aspect-[600/680] rounded-xl overflow-hidden select-none shadow-2xl border border-[#26282B] touch-none"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Dinamik Kumaş SVG Arka Planı */}
            <div
              className="absolute inset-0 pointer-events-none"
              dangerouslySetInnerHTML={{ __html: svgBg }}
            />

            {/* Baskı Alanı Sınır Çerçevesi (Kılavuz) */}
            <div
              style={{
                left: `${(printableArea.x / 600) * 100}%`,
                top: `${(printableArea.y / 680) * 100}%`,
                width: `${(printableArea.width / 600) * 100}%`,
                height: `${(printableArea.height / 680) * 100}%`,
              }}
              className="absolute border border-dashed border-[#D4AF37]/40 pointer-events-none z-10 flex items-start justify-center p-1"
            >
              <span className="text-[9px] text-[#D4AF37]/80 tracking-wider font-mono">
                {printableArea.label}
              </span>
            </div>

            {/* Kullanıcı Tasarım Katmanı */}
            {artworkSrc ? (
              <div
                style={{
                  left: `${(positionX / 600) * 100}%`,
                  top: `${(positionY / 680) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  width: `${(220 * scale) / 6}%`,
                  mixBlendMode: blendMode,
                }}
                onPointerDown={handlePointerDown}
                className="absolute cursor-move z-20 group"
              >
                <img
                  src={artworkSrc}
                  alt="Kullanıcı Tasarımı"
                  className="w-full h-auto object-contain pointer-events-none drop-shadow-md"
                />
                <div className="absolute inset-0 border border-transparent group-hover:border-[#D4AF37] pointer-events-none rounded" />
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 text-center p-6 text-[#A0A2A6]/60">
                <span className="text-3xl mb-2">🎨</span>
                <p className="text-xs">Sol panelden tasarım dosyanızı yükleyin.</p>
              </div>
            )}
          </div>
        </div>

        {/* SAĞ PANEL: Fiyat ve Sipariş Özeti (3 Kolon) */}
        <div className="lg:col-span-3 flex flex-col justify-between bg-[#141517] p-5 rounded-xl border border-[#242629] text-xs text-[#E1E2E5]">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold text-sm text-[#F8F8F5] border-b border-[#242629] pb-2">
              Sipariş & Fiyatlandırma
            </h3>

            {/* Baskı Tekniği */}
            <div>
              <label className="font-semibold text-[#A0A2A6] block mb-1.5">
                Baskı Tekniği
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTechnique("dtf")}
                  className={`p-2 rounded border text-left ${
                    activeTechnique === "dtf"
                      ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#E5C158]"
                      : "border-[#2D3035] text-[#A0A2A6]"
                  }`}
                >
                  <div className="font-semibold text-[11px]">DTF Dijital</div>
                  <div className="text-[9px] opacity-75">1440 DPI Renkli</div>
                </button>
                <button
                  onClick={() => setActiveTechnique("serigrafi")}
                  className={`p-2 rounded border text-left ${
                    activeTechnique === "serigrafi"
                      ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#E5C158]"
                      : "border-[#2D3035] text-[#A0A2A6]"
                  }`}
                >
                  <div className="font-semibold text-[11px]">Serigrafi</div>
                  <div className="text-[9px] opacity-75">Geleneksel Boya</div>
                </button>
              </div>
            </div>

            {/* Adet Seçimi */}
            <div>
              <label className="font-semibold text-[#A0A2A6] block mb-1.5">
                Sipariş Adedi
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded bg-[#1F2125] border border-[#303338] text-base font-bold flex items-center justify-center hover:bg-[#282B30]"
                >
                  -
                </button>
                <span className="font-bold text-sm w-10 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded bg-[#1F2125] border border-[#303338] text-base font-bold flex items-center justify-center hover:bg-[#282B30]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Fiyat Detayları */}
            <div className="pt-3 border-t border-[#242629] space-y-1.5 text-[#A0A2A6]">
              <div className="flex justify-between">
                <span>Ürün Baz Fiyatı:</span>
                <span className="text-[#F8F8F5]">{unitBasePrice} TL</span>
              </div>
              <div className="flex justify-between">
                <span>Baskı & Kalıp Maliyeti:</span>
                <span className="text-[#E5C158]">+{printCost} TL</span>
              </div>
              <div className="flex justify-between font-bold text-[#F8F8F5] pt-2 border-t border-[#242629]">
                <span>Birim Fiyat:</span>
                <span className="text-sm">{finalUnitPrice} TL</span>
              </div>
            </div>
          </div>

          {/* Toplam ve Sepete Ekle Butonu */}
          <div className="pt-4 border-t border-[#242629] mt-6">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xs text-[#A0A2A6]">Toplam Tutar:</span>
              <span className="text-xl font-bold text-[#D4AF37]">
                {totalAmount} TL
              </span>
            </div>

            {statusMessage && (
              <p className="text-xs text-center text-[#E5C158] mb-2 font-medium">
                {statusMessage}
              </p>
            )}

            <button
              onClick={handleAddToCartWithDesign}
              disabled={isSubmitting || !artworkSrc}
              className="w-full py-3 rounded-lg font-bold bg-[#D4AF37] hover:bg-[#C49F27] text-[#141517] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isSubmitting ? "İşleniyor..." : "Tasarım ile Sepete Ekle"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
