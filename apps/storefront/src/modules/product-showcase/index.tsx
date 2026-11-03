"use client"

import React, { useState, useMemo } from "react"
import { HttpTypes } from "@medusajs/types"
import ProductViewer3D from "./product-viewer-3d"
import ProductActions from "@modules/products/components/product-actions"
import ProductPrice from "@modules/products/components/product-price"

interface AuraProductShowcaseProps {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const COLOR_MAP: Record<string, string> = {
  siyah: "#202020",
  beyaz: "#F8F8F5",
  antrasit: "#48494B",
  ekru: "#E9DFCB",
  bej: "#C6AD8F",
  haki: "#666D4F",
  lacivert: "#242F4A",
  bordo: "#703443",
}

export default function AuraProductShowcase({
  product,
  region,
  countryCode,
}: AuraProductShowcaseProps) {
  const [activeTab, setActiveTab] = useState<"3d" | "gallery">("3d")
  const [selectedColorHex, setSelectedColorHex] = useState<string>("#202020")
  const [selectedImage, setSelectedImage] = useState<string | null>(
    product.images?.[0]?.url || product.thumbnail || null
  )

  // Ürün özelliklerini çıkar
  const colorOption = product.options?.find(
    (o) => o.title?.toLowerCase() === "renk" || o.title?.toLowerCase() === "color"
  )

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* 2 Kolonlu Aura Premium Sayfa Düzeni */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* SOL KOLON: 3D Ürün Görüntüleyici ve Galeri (7 Kolon) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Görünüm Geçiş Sekmeleri (3D Model / 2D Galeri) */}
          <div className="flex items-center gap-2 self-start bg-[#1C1E22] p-1 rounded-xl border border-[#2B2E34]">
            <button
              onClick={() => setActiveTab("3d")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "3d"
                  ? "bg-[#D4AF37] text-[#141517] shadow-md"
                  : "text-[#A0A2A6] hover:text-[#F8F8F5]"
              }`}
            >
              <span>🔮 3D İnteraktif Model</span>
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "gallery"
                  ? "bg-[#D4AF37] text-[#141517] shadow-md"
                  : "text-[#A0A2A6] hover:text-[#F8F8F5]"
              }`}
            >
              <span>🖼️ Ürün Fotoğrafları</span>
            </button>
          </div>

          {/* Ana Görsel / 3D Sahne */}
          {activeTab === "3d" ? (
            <ProductViewer3D colorHex={selectedColorHex} />
          ) : (
            <div className="relative w-full h-[450px] small:h-[550px] rounded-2xl bg-[#181A1D] border border-[#26282B] overflow-hidden flex items-center justify-center p-6 shadow-2xl">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="max-w-full max-h-full object-contain rounded-lg drop-shadow-2xl"
                />
              ) : (
                <span className="text-xs text-gray-500">Görsel bulunamadı</span>
              )}
            </div>
          )}

          {/* Küçük Resim Galerisi (Thumbnails) */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(img.url)
                    setActiveTab("gallery")
                  }}
                  className={`w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                    selectedImage === img.url
                      ? "border-[#D4AF37] scale-105"
                      : "border-[#2B2E34] opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* SAĞ KOLON: Ürün Detayları, Renk, Beden ve Satın Alma (5 Kolon) */}
        <div className="lg:col-span-5 flex flex-col gap-6 bg-[#161719] p-6 small:p-8 rounded-2xl border border-[#242629] text-[#F8F8F5]">
          <div>
            <span className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider block mb-1">
              Nizamlar Koleksiyonu
            </span>
            <h1 className="text-2xl small:text-3xl font-extrabold tracking-tight leading-tight">
              {product.title}
            </h1>
            <p className="text-xs text-[#A0A2A6] mt-2 leading-relaxed">
              {product.description || "240 GSM %100 Pamuklu yüksek kaliteli kumaş."}
            </p>
          </div>

          {/* Hızlı Renk Paleti (3D Modeli Boyar) */}
          {colorOption && (
            <div>
              <label className="text-xs font-semibold text-[#A0A2A6] uppercase tracking-wider block mb-2">
                Renk Önizleme (3D)
              </label>
              <div className="flex flex-wrap gap-2.5">
                {colorOption.values?.map((val, idx) => {
                  const lower = (val.value || "").toLowerCase()
                  const hex = COLOR_MAP[lower] || "#202020"
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedColorHex(hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        selectedColorHex === hex
                          ? "border-[#D4AF37] scale-110 shadow-lg"
                          : "border-[#3A3D44] opacity-80 hover:opacity-100"
                      }`}
                      title={val.value}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Standart Medusa Varyant ve Satın Alma Bileşeni */}
          <div className="pt-4 border-t border-[#26282B]">
            <ProductActions product={product} region={region} />
          </div>

          {/* Özellik Rozetleri */}
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-[#26282B] text-xs text-[#8E9094]">
            <div className="flex items-center gap-2">
              <span className="text-[#D4AF37]">✓</span>
              <span>%100 Organik Penye</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#D4AF37]">✓</span>
              <span>Çift İğne Güçlü Dikiş</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#D4AF37]">✓</span>
              <span>1440 DPI DTF Baskı</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#D4AF37]">✓</span>
              <span>Hızlı Kargo & ERP Takip</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
