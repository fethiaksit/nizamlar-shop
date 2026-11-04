"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import { useRouter, useParams } from "next/navigation"
import type { ClothesRackItem } from "./clothes-rack"
import {
  buildRackProducts,
  getLogoPrintForGarment,
  type RackProductItem,
} from "@lib/3d/product"
import { HttpTypes } from "@medusajs/types"
import type { DynamicRackGarment } from "@lib/data/site-content"

const ClothesRack = dynamic(
  () => import("./clothes-rack").then((mod) => mod.ClothesRack),
  {
    ssr: false,
  },
)

interface NizamlarClothesRackSectionProps {
  products?: HttpTypes.StoreProduct[]
  initialRackItems?: DynamicRackGarment[]
}

export default function NizamlarClothesRackSection({
  products = [],
  initialRackItems,
}: NizamlarClothesRackSectionProps) {
  const router = useRouter()
  const params = useParams()
  const countryCode = (params?.countryCode as string) || "tr"
  const sectionRef = useRef<HTMLElement>(null)
  const [shouldLoad3D, setShouldLoad3D] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoad3D(true)
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.05 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const rackItems: RackProductItem[] = useMemo(() => {
    if (initialRackItems && initialRackItems.length > 0) {
      return initialRackItems.map((g) => {
        const matched = products.find(
          (p) => p.id === g.product_id || p.handle === g.product_handle
        )
        const kind = g.garment_kind
        const categoryLabel =
          kind === "tee"
            ? "Tişört"
            : kind === "crewneck"
              ? "Sweatshirt"
              : kind === "sweater"
                ? "Kazak"
                : "Özel Tekstil"

        const fabricBadge =
          kind === "tee"
            ? "240 GSM Penye"
            : kind === "crewneck"
              ? "340 GSM 3 İplik"
              : kind === "sweater"
                ? "Triko Örgü"
                : "Kanvas"

        return {
          productId: matched?.id || g.product_id || g.id,
          variantId: matched?.variants?.[0]?.id,
          handle: matched?.handle || g.product_handle || "store",
          name: g.name,
          categoryLabel,
          fabricBadge,
          kind,
          colour: g.colour,
          print: g.show_nizamlar_logo
            ? getLogoPrintForGarment(kind, g.colour)
            : { kind: "pocket" as const },
        }
      })
    }
    return buildRackProducts(products)
  }, [initialRackItems, products])

  const handleSelectGarment = (item: ClothesRackItem | RackProductItem) => {
    const matchedProduct = rackItems.find(
      (p) => p === item || p.name === item.name,
    )
    if (matchedProduct?.handle) {
      router.push(
        `/${countryCode}/products/${matchedProduct.handle}${matchedProduct.variantId ? `?v_id=${matchedProduct.variantId}` : ""}`,
      )
    }
  }

  const activeProduct =
    activeIndex >= 0 && activeIndex < rackItems.length
      ? rackItems[activeIndex]
      : rackItems[0]

  return (
    <section
      ref={sectionRef}
      id="collection-rack"
      data-testid="clothes-rack-section"
      className="relative w-full bg-brand-cream border-b border-brand-stone py-20 px-4 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        {/* Başlık ve Kurumsal Rozet */}
        <div className="text-center max-w-3xl mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-brown bg-brand-anthracite text-brand-cream-light text-xs font-bold tracking-wider uppercase mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-gold" />
            <span>Nizamlar Baskı · 3D Kurumsal Tekstil Vitrini</span>
          </div>
          <h2 className="text-3xl small:text-5xl font-extrabold tracking-tight text-brand-anthracite">
            Tişört, Sweatshirt ve Kazak{" "}
            <span className="text-brand-brown">Askılık Koleksiyonu</span>
          </h2>
          <p className="text-sm small:text-base text-brand-brown-dark mt-3 leading-relaxed">
            Nizamlar Baskı logolu 240 GSM penye tişört, 340 GSM 3 iplik şardonlu
            sweatshirt ve 12 gauge triko kazak modellerini askılık üzerinde
            inceleyin; kumaş dokusunu hissedip doğrudan ürün sayfasına geçin.
          </p>
        </div>

        {/* 3D Askılık Bileşeni (Görünür olduğunda yüklenir, hareketsizken 0 FPS çalışır) */}
        <div
          data-testid="clothes-rack-stage"
          className="w-full h-[540px] small:h-[640px] rounded-2xl bg-[radial-gradient(ellipse_at_50%_46%,rgba(196,167,116,0.34)_0%,rgba(73,55,46,0.62)_48%,rgba(34,35,37,0.92)_100%),linear-gradient(135deg,#2B2C2F_0%,#49372E_52%,#32251E_100%)] border border-brand-gold/50 shadow-2xl overflow-hidden relative"
        >
          {rackItems.length ? (
            shouldLoad3D ? (
              <ClothesRack
                items={rackItems}
                theme="dark"
                restAngle={52}
                gap={10}
                activeScale={1.08}
                size={0.42}
                breeze={0}
                flow={1.0}
                rail="chrome"
                hanger="wood"
                showCaption={true}
                activeIndex={activeIndex}
                onActiveChange={setActiveIndex}
                onSelect={handleSelectGarment}
                className="w-full h-full"
              />
            ) : (
              <div
                data-garments
                className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center text-brand-cream-light"
              >
                <p className="text-xs uppercase tracking-widest font-bold text-brand-gold-hover">
                  3D Askılık Vitrini Hazırlanıyor
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-xl">
                  {rackItems.map((item, idx) => (
                    <button
                      key={`${item.handle}-${idx}`}
                      type="button"
                      onClick={() => handleSelectGarment(item)}
                      className="px-3.5 py-2 rounded-md bg-brand-surface border border-brand-gold/40 hover:border-brand-gold text-xs font-semibold text-brand-cream-light transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          ) : (
            <p className="p-12 text-center text-brand-cream-light">
              Koleksiyon şu anda kullanılamıyor. Lütfen daha sonra tekrar
              deneyin.
            </p>
          )}
        </div>

        {/* Seçili Ürün Alt Bilgi ve Doğrudan Geçiş Çubuğu */}
        {activeProduct && (
          <div className="w-full mt-4 px-5 py-3.5 rounded-xl bg-brand-anthracite border border-brand-gold/40 text-brand-cream-light flex flex-col small:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded bg-brand-gold text-brand-dark font-extrabold uppercase tracking-wider">
                {activeProduct.categoryLabel}
              </span>
              <strong className="text-sm font-bold text-brand-cream-light">
                {activeProduct.name}
              </strong>
              <span className="text-brand-stone-light">
                · {activeProduct.fabricBadge}
              </span>
            </div>
            <button
              type="button"
              data-testid="rack-direct-product-link"
              onClick={() => handleSelectGarment(activeProduct)}
              className="px-4 py-2 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-brand-dark text-xs font-extrabold uppercase tracking-wider transition-colors shrink-0"
            >
              Ürün Detayına Git →
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
