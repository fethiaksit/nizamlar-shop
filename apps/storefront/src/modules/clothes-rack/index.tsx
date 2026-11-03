"use client"

import React, { useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { ClothesRack, ClothesRackItem } from "./clothes-rack"
import { HttpTypes } from "@medusajs/types"

interface NizamlarClothesRackSectionProps {
  products?: HttpTypes.StoreProduct[]
}

export default function NizamlarClothesRackSection({
  products = [],
}: NizamlarClothesRackSectionProps) {
  const router = useRouter()
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "tr"

  // Medusa ürünlerini Dimaac 3D Kıyafet Askılığı formatına eşle
  const rackItems: ClothesRackItem[] = useMemo(() => {
    if (!products || products.length === 0) {
      // Fallback kurumsal ürünler
      return [
        {
          name: "Premium Oversize Tişört — Siyah",
          garment: "tee",
          color: "#202020",
          body: { style: "oversized" },
        },
        {
          name: "Kapüşonlu Sweatshirt (Hoodie) — Antrasit",
          garment: "crewneck",
          color: "#48494B",
          body: { style: "regular" },
        },
        {
          name: "Özel Baskılı Tişört — Ekru",
          garment: "tee",
          color: "#E9DFCB",
          body: { style: "oversized" },
        },
        {
          name: "Ağır Gramaj Hoodie — Haki",
          garment: "crewneck",
          color: "#666D4F",
          body: { style: "regular" },
        },
        {
          name: "Streetwear Oversize — Beyaz",
          garment: "tee",
          color: "#F8F8F5",
          body: { style: "oversized" },
        },
      ]
    }

    return products.slice(0, 8).map((p) => {
      const handle = p.handle || ""
      const isSweatshirt = handle.includes("hoodie") || handle.includes("sweatshirt")
      const color = handle.includes("beyaz")
        ? "#F8F8F5"
        : handle.includes("ekru")
        ? "#E9DFCB"
        : handle.includes("antrasit")
        ? "#48494B"
        : "#202020"

      return {
        name: `${p.title}`,
        garment: isSweatshirt ? "crewneck" : "tee",
        color,
        body: { style: "oversized" },
      }
    })
  }, [products])

  const handleSelectGarment = (_item: ClothesRackItem, index: number) => {
    const matchedProduct = products[index] || products[0]
    if (matchedProduct?.handle) {
      router.push(`/${countryCode}/products/${matchedProduct.handle}`)
    } else {
      router.push(`/${countryCode}/store`)
    }
  }

  return (
    <section className="relative w-full bg-[#141517] border-b border-[#242629] py-16 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Başlık ve Rozet */}
        <div className="text-center max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#E5C158] text-xs font-medium tracking-wide uppercase mb-3">
            <span className="w-2 h-2 rounded-full bg-[#E5C158] animate-pulse" />
            İnteraktif 3D Tekstil Vitrini
          </div>
          <h2 className="text-2xl small:text-4xl font-bold tracking-tight text-[#F8F8F5]">
            Askılıktan Seçin,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">
              Detayları İnceleyin
            </span>
          </h2>
          <p className="text-xs small:text-sm text-[#A0A2A6] mt-2">
            Kıyafetlerin üzerine gelerek kumaş hareketini hissedin, tıklayarak doğrudan gerçek ürün sayfasına geçin.
          </p>
        </div>

        {/* 3D Askılık Bileşeni */}
        <div className="w-full h-[520px] rounded-2xl bg-gradient-to-b from-[#181A1D] to-[#121315] border border-[#26282C] shadow-2xl overflow-hidden relative">
          <ClothesRack
            items={rackItems}
            breeze={0.4}
            flow={1.2}
            rail="chrome"
            hanger="wood"
            showCaption={true}
            onSelect={handleSelectGarment}
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  )
}
