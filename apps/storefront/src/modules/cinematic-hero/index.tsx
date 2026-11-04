"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type TouchEvent,
} from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import type { DynamicSlide } from "@lib/data/site-content"

type SlideTheme = "light" | "dark" | "brown"

type SlideSpec = {
  id: string
  indexLabel: string
  theme: SlideTheme
  eyebrow: string
  title: [string, string]
  subtitle: string
  ctaLabel: string
  ctaHref: string
  ctaIsAnchor?: boolean
  secondaryLabel: string
  secondaryHref: string
  secondaryIsAnchor?: boolean
  image: string
  imageAlt: string
  badges: [string, string]
  garmentTag: string
}

function buildSlides(designHandle?: string): SlideSpec[] {
  const studioHref = designHandle
    ? `/products/${designHandle}?studio=1`
    : "/store"

  return [
    {
      id: "collection",
      indexLabel: "01",
      theme: "light",
      eyebrow: "01 / PREMİUM KOLEKSİYON · 240 GSM PENYE",
      title: ["KENDİ TARZINI", "YANSIT."],
      subtitle:
        "Premium tekstil ürünlerini keşfet. Tarzını Nizamlar Baskı kalitesiyle tamamla.",
      ctaLabel: "Koleksiyonu Keşfet",
      ctaHref: "#collection-rack",
      ctaIsAnchor: true,
      secondaryLabel: "Tüm Koleksiyonu Gör",
      secondaryHref: "/store",
      image: "/hero/slide-1-tee.webp",
      imageAlt: "Siyah Antrasit 240 GSM Premium Oversize Penye Tişört",
      badges: ["240 GSM %100 Penye Pamuk", "Oversize Kalıp · Çift İğne Dikiş"],
      garmentTag: "PREMIUM OVERSIZE TEE · ANTRASİT SİYAH",
    },
    {
      id: "design",
      indexLabel: "02",
      theme: "dark",
      eyebrow: "02 / 3D DESIGN LAB · KENDİ TASARIMINI OLUŞTUR",
      title: ["TASARLA.", "BİZ BASALIM."],
      subtitle:
        "Kendi logonu yükle, ürününü özelleştir, baskını sipariş et.",
      ctaLabel: "Tasarımını Oluştur",
      ctaHref: studioHref,
      secondaryLabel: "3D Deneyimi Başlat",
      secondaryHref: "#tshirt3d-experience",
      secondaryIsAnchor: true,
      image: "/hero/slide-2-printed-tee.webp",
      imageAlt: "Krem Beyaz Tişört Üzerinde Renkli Özel DTF Baskı Örneği",
      badges: [
        "Yüksek Çözünürlüklü DTF & Serigrafi",
        "320 × 400 mm Ön & Arka Baskı Alanı",
      ],
      garmentTag: "CUSTOM PRINT LAB · KREM & RENKLİ DTF",
    },
    {
      id: "production",
      indexLabel: "03",
      theme: "brown",
      eyebrow: "03 / NİZAMLAR ÜRETİM · PERAKENDE & KURUMSAL",
      title: ["ÜRETİMDE", "NİZAMLAR KALİTESİ."],
      subtitle:
        "Tek üründen toplu üretime, tekstil baskıda profesyonel çözümler.",
      ctaLabel: "Ürünleri İncele",
      ctaHref: "/store",
      secondaryLabel: "Toplu Üretim & Kurumsal Sipariş",
      secondaryHref: "#bulk-production",
      secondaryIsAnchor: true,
      image: "/hero/slide-3-collection.webp",
      imageAlt:
        "Nizamlar Baskı Tişört, Sweatshirt ve Kurumsal Tekstil Koleksiyonu",
      badges: [
        "Tişört · Sweatshirt · Hoodie · Bez Çanta",
        "1 Adetten Toplu Üretime Kalite Garantisi",
      ],
      garmentTag: "NİZAMLAR ATÖLYE · ÇOKLU TEKSTİL SERİSİ",
    },
  ]
}

function mapDynamicSlides(dyn: DynamicSlide[], designHandle?: string): SlideSpec[] {
  const studioHref = designHandle
    ? `/products/${designHandle}?studio=1`
    : "/store"

  return dyn.map((s, idx) => {
    const isAnchor1 = s.cta_href.startsWith("#")
    const isAnchor2 = s.secondary_href ? s.secondary_href.startsWith("#") : false
    const href1 = s.cta_href === "/products/premium-oversize-penye-t-shirt?studio=1" && studioHref
      ? studioHref
      : s.cta_href

    return {
      id: s.id,
      indexLabel: String(idx + 1).padStart(2, "0"),
      theme: s.theme,
      eyebrow: s.eyebrow,
      title: [s.title_line1, s.title_line2],
      subtitle: s.subtitle,
      ctaLabel: s.cta_label,
      ctaHref: href1,
      ctaIsAnchor: isAnchor1,
      secondaryLabel: s.secondary_label || "",
      secondaryHref: s.secondary_href || "",
      secondaryIsAnchor: isAnchor2,
      image: s.image_url,
      imageAlt: s.image_alt,
      badges: (Array.isArray(s.badges) && s.badges.length >= 2
        ? s.badges.slice(0, 2)
        : ["240 GSM Pamuk", "Yüksek Kalite"]) as [string, string],
      garmentTag: s.garment_tag,
    }
  })
}

export default function CinematicHero({
  designHandle,
  initialSlides,
}: {
  designHandle?: string
  initialSlides?: DynamicSlide[]
}) {
  const slides = useMemo(() => {
    if (initialSlides && initialSlides.length > 0) {
      return mapDynamicSlides(initialSlides, designHandle)
    }
    return buildSlides(designHandle)
  }, [initialSlides, designHandle])

  const autoplaySpeed = useMemo(() => {
    return initialSlides?.[0]?.autoplay_duration_ms || 4400
  }, [initialSlides])
  const [activeIndex, setActiveIndex] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReducedMotion(media.matches)
    sync()
    media.addEventListener("change", sync)
    return () => media.removeEventListener("change", sync)
  }, [])

  const isPlaying = !userPaused && !hoverPaused && !reducedMotion

  const goToSlide = useCallback(
    (nextIndex: number, pauseAutoplay = false) => {
      const normalized = (nextIndex + slides.length) % slides.length
      setActiveIndex(normalized)
      if (pauseAutoplay) {
        setUserPaused(true)
      }
    },
    [slides.length]
  )

  const handleNext = useCallback(
    (pauseAutoplay = true) => {
      goToSlide(activeIndex + 1, pauseAutoplay)
    },
    [activeIndex, goToSlide]
  )

  const handlePrev = useCallback(
    (pauseAutoplay = true) => {
      goToSlide(activeIndex - 1, pauseAutoplay)
    },
    [activeIndex, goToSlide]
  )

  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length)
    }, autoplaySpeed)
    return () => window.clearInterval(timer)
  }, [isPlaying, slides.length])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault()
      handleNext(true)
    } else if (event.key === "ArrowLeft") {
      event.preventDefault()
      handlePrev(true)
    }
  }

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0]
    if (!touch) return
    touchStartX.current = touch.clientX
    touchStartY.current = touch.clientY
  }

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const touch = event.changedTouches[0]
    if (!touch) return
    const deltaX = touch.clientX - touchStartX.current
    const deltaY = touch.clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null

    if (Math.abs(deltaX) >= 42 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        handleNext(true)
      } else {
        handlePrev(true)
      }
    }
  }

  const current = slides[activeIndex]

  return (
    <section
      className="hero-slider"
      data-testid="cinematic-hero"
      data-slide={activeIndex}
      data-chapter={activeIndex}
      data-theme={current.theme}
      aria-roledescription="carousel"
      aria-label="Nizamlar Baskı Kampanya Vitrini"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={() => setHoverPaused(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Arka Plan Editorial Su İzi ve Kurumsal Işık Katmanı */}
      <div className="hero-slider__ambient" aria-hidden="true" />
      <div className="hero-slider__wordmark" aria-hidden="true">
        NİZAMLAR
      </div>

      <div className="content-container hero-slider__inner">
        {/* Yatay Track */}
        <div className="hero-slider__viewport">
          <div
            className="hero-slider__track"
            style={{
              transform: `translate3d(-${activeIndex * 100}%, 0, 0)`,
              transitionDuration: reducedMotion ? "0ms" : "440ms",
            }}
          >
            {slides.map((slide, idx) => {
              const isActive = idx === activeIndex
              return (
                <article
                  key={slide.id}
                  className="hero-slide"
                  data-slide-theme={slide.theme}
                  aria-hidden={!isActive}
                  data-testid={`hero-slide-${idx}`}
                >
                  {/* Sol: Büyük Editorial Tipografi ve Aksiyonlar */}
                  <div className="hero-slide__copy">
                    <div className="hero-slide__eyebrow-pill">
                      <span className="hero-slide__eyebrow-dot" />
                      <span>{slide.eyebrow}</span>
                    </div>

                    <h1 className="hero-slide__title">
                      <span>{slide.title[0]}</span>
                      <span className="hero-slide__title-accent">
                        {slide.title[1]}
                      </span>
                    </h1>

                    <div className="hero-slide__gold-rule" aria-hidden="true" />

                    <p className="hero-slide__subtitle">{slide.subtitle}</p>

                    <div className="hero-slide__actions">
                      {slide.ctaIsAnchor ? (
                        <a
                          href={slide.ctaHref}
                          className="hero-slide__primary-btn"
                          tabIndex={isActive ? 0 : -1}
                        >
                          <span>{slide.ctaLabel}</span>
                          <span aria-hidden="true">↗</span>
                        </a>
                      ) : (
                        <LocalizedClientLink
                          href={slide.ctaHref}
                          className="hero-slide__primary-btn"
                          tabIndex={isActive ? 0 : -1}
                        >
                          <span>{slide.ctaLabel}</span>
                          <span aria-hidden="true">↗</span>
                        </LocalizedClientLink>
                      )}

                      {slide.secondaryIsAnchor ? (
                        <a
                          href={slide.secondaryHref}
                          className="hero-slide__secondary-btn"
                          tabIndex={isActive ? 0 : -1}
                        >
                          <span>{slide.secondaryLabel}</span>
                          <span aria-hidden="true">→</span>
                        </a>
                      ) : (
                        <LocalizedClientLink
                          href={slide.secondaryHref}
                          className="hero-slide__secondary-btn"
                          tabIndex={isActive ? 0 : -1}
                        >
                          <span>{slide.secondaryLabel}</span>
                          <span aria-hidden="true">→</span>
                        </LocalizedClientLink>
                      )}
                    </div>

                    <div className="hero-slide__badges">
                      {slide.badges.map((badge) => (
                        <span key={badge} className="hero-slide__badge">
                          ✓ {badge}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sağ: Kusursuz Hizalı Dairesel Podyum ve Orijinal Stüdyo Tişörtü */}
                  <div className="hero-slide__visual">
                    <div className="hero-slide__pedestal" aria-hidden="true" />
                    <div
                      className={`hero-slide__image-wrap ${!reducedMotion ? "hero-slide__image-wrap--float" : ""}`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.imageAlt}
                        width={720}
                        height={720}
                        fetchPriority={idx === 0 ? "high" : "auto"}
                        loading={idx === 0 ? "eager" : "lazy"}
                        decoding="async"
                        className="hero-slide__image"
                      />
                    </div>
                    <div className="hero-slide__visual-tag">
                      <span className="hero-slide__visual-tag-dot" />
                      <span>{slide.garmentTag}</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        {/* Alt Kontrol Barı: Slide Göstergeleri, Oynat/Duraklat ve Sağ/Sol Oklar */}
        <div className="hero-slider__controls">
          <div
            className="hero-slider__dots"
            role="tablist"
            aria-label="Slayt seçimi"
          >
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={activeIndex === idx}
                aria-label={`Slayt ${idx + 1}: ${slide.title.join(" ")}`}
                data-testid={`hero-dot-${idx}`}
                className="hero-slider__dot"
                data-active={activeIndex === idx}
                onClick={() => goToSlide(idx, true)}
              >
                <span className="hero-slider__dot-num">{slide.indexLabel}</span>
                <span className="hero-slider__dot-bar" />
              </button>
            ))}
          </div>

          <div className="hero-slider__nav">
            <button
              type="button"
              className="hero-slider__play-btn"
              data-testid="hero-autoplay-toggle"
              aria-label={
                userPaused
                  ? "Otomatik geçişi başlat"
                  : "Otomatik geçişi durdur"
              }
              aria-pressed={!userPaused}
              onClick={() => setUserPaused((p) => !p)}
            >
              {userPaused ? "▶ Oynat" : "❚❚ Duraklat"}
            </button>

            <div className="hero-slider__arrows">
              <button
                type="button"
                className="hero-slider__arrow"
                data-testid="hero-prev"
                aria-label="Önceki slayt"
                onClick={() => handlePrev(true)}
              >
                ←
              </button>
              <button
                type="button"
                className="hero-slider__arrow"
                data-testid="hero-next"
                aria-label="Sonraki slayt"
                onClick={() => handleNext(true)}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

