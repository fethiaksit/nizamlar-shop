import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo, Trash, Plus, PencilSquareSolid, Check } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Switch,
  Select,
  Badge,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch } from "../../lib/client"

type Slide = {
  id: string
  rank: number
  theme: "light" | "dark" | "brown"
  eyebrow: string
  title_line1: string
  title_line2: string
  subtitle: string
  cta_label: string
  cta_href: string
  secondary_label: string
  secondary_href: string
  image_url: string
  image_alt: string
  badges: string[]
  garment_tag: string
  shirt_color: string
  shirt_rotation: number
  model_3d_path: string
  is_active: boolean
  is_published: boolean
  autoplay_duration_ms: number
}

const SiteHeroPage = () => {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedSlide, setSelectedSlide] = useState<Slide | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadSlides = async () => {
    setLoading(true)
    const res = await adminFetch("/admin/site-management/hero-slides")
    if (res.data?.slides) {
      setSlides(res.data.slides)
      if (res.data.slides.length > 0 && !selectedSlide) {
        setSelectedSlide(res.data.slides[0])
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSlides()
  }, [])

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlide) return
    setSaving(true)
    setFeedback(null)

    const endpoint = isCreating
      ? "/admin/site-management/hero-slides"
      : `/admin/site-management/hero-slides/${selectedSlide.id}`

    const method = isCreating ? "POST" : "PUT"

    const payload = {
      ...selectedSlide,
      titleLine1: selectedSlide.title_line1,
      titleLine2: selectedSlide.title_line2,
      ctaLabel: selectedSlide.cta_label,
      ctaHref: selectedSlide.cta_href,
      secondaryLabel: selectedSlide.secondary_label,
      secondaryHref: selectedSlide.secondary_href,
      imageUrl: selectedSlide.image_url,
      imageAlt: selectedSlide.image_alt,
      garmentTag: selectedSlide.garment_tag,
      shirtColor: selectedSlide.shirt_color,
      shirtRotation: Number(selectedSlide.shirt_rotation),
      model3dPath: selectedSlide.model_3d_path,
      isActive: selectedSlide.is_active,
      isPublished: selectedSlide.is_published,
      autoplayDurationMs: Number(selectedSlide.autoplay_duration_ms),
    }

    const res = await adminFetch(endpoint, {
      method,
      body: JSON.stringify(payload),
    })

    if (res.error) {
      setFeedback({ type: "error", text: res.error })
    } else {
      setFeedback({
        type: "success",
        text: isCreating
          ? "Yeni slayt başarıyla eklendi."
          : "Slayt düzenlemesi başarıyla kaydedildi.",
      })
      setIsEditing(false)
      setIsCreating(false)
      await loadSlides()
    }
    setSaving(false)
  }

  const handleDeleteSlide = async (id: string) => {
    if (!confirm("Bu slaytı silmek istediğinizden emin misiniz?")) return
    const res = await adminFetch(`/admin/site-management/hero-slides/${id}`, {
      method: "DELETE",
    })
    if (res.error) {
      alert(`Hata: ${res.error}`)
    } else {
      setFeedback({ type: "success", text: "Slayt silindi." })
      setSelectedSlide(null)
      await loadSlides()
    }
  }

  const handleCreateNew = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      rank: slides.length,
      theme: "light",
      eyebrow: "04 / YENİ SEZON KOLEKSİYONU",
      title_line1: "YENİ TASARIMLAR",
      title_line2: "KEŞFET.",
      subtitle: "Yeni sezon kurumsal ve oversize tekstil koleksiyonu.",
      cta_label: "Hemen İncele",
      cta_href: "/store",
      secondary_label: "3D Tasarla",
      secondary_href: "#tshirt3d-experience",
      image_url: "/hero/slide-1-tee.webp",
      image_alt: "Nizamlar Yeni Koleksiyon Tişört",
      badges: ["240 GSM Penye", "Özel Baskı"],
      garment_tag: "YENİ SEZON · NİZAMLAR",
      shirt_color: "#232528",
      shirt_rotation: 0,
      model_3d_path: "/models/nizamlar-tee.glb",
      is_active: true,
      is_published: false,
      autoplay_duration_ms: 4400,
    }
    setSelectedSlide(newSlide)
    setIsCreating(true)
    setIsEditing(true)
  }

  const handlePublishAll = async () => {
    const res = await adminFetch("/admin/site-management/publish", { method: "POST" })
    if (res.error) {
      alert(`Hata: ${res.error}`)
    } else {
      setFeedback({ type: "success", text: "Slaytlar canlı mağazada yayınlandı!" })
      await loadSlides()
    }
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      {/* Üst Bar */}
      <Container className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge color="orange">HERO SLIDER</Badge>
              <span className="text-xs text-ui-fg-muted font-medium">Dinamik Ön Yüz Görsel Vitrini</span>
            </div>
            <Heading level="h1" className="text-2xl font-bold text-ui-fg-base mt-1">
              Hero Slider Yönetimi
            </Heading>
            <Text className="text-xs text-ui-fg-subtle mt-1 leading-relaxed">
              Slayt sıralamasını, başlıkları, buton bağlantılarını, görselleri ve 3D renkleri
              düzenleyin. Kod değişikliği gerekmeksizin veritabanından okunur.
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="base" onClick={handleCreateNew}>
              <Plus /> Slayt Ekle
            </Button>
            <Button
              variant="primary"
              size="base"
              className="bg-[#B29460] hover:bg-[#9E8250] text-[#222325] font-bold"
              onClick={handlePublishAll}
            >
              🚀 Değişiklikleri Yayınla
            </Button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </Container>

      {/* Ana İçerik Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Kolon: Slayt Listesi */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <Container className="p-4 bg-ui-bg-base border border-ui-border-base text-ui-fg-base">
            <div className="flex items-center justify-between mb-3 border-b border-ui-border-base pb-2">
              <Text className="text-xs font-bold text-ui-fg-base uppercase">
                Slaytlar ({slides.length})
              </Text>
              <Text className="text-[11px] text-ui-fg-muted">Sıralı Görünüm</Text>
            </div>

            {loading ? (
              <p className="text-xs text-ui-fg-muted py-4 text-center">Slaytlar yükleniyor...</p>
            ) : slides.length === 0 ? (
              <p className="text-xs text-ui-fg-muted py-4 text-center">Henüz slayt eklenmemiş.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {slides.map((s, idx) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSelectedSlide(s)
                      setIsCreating(false)
                      setIsEditing(false)
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      selectedSlide?.id === s.id
                        ? "border-2 border-[#B29460] bg-[#B29460]/10 shadow-xs"
                        : "border-ui-border-base hover:border-[#B29460]/60 bg-ui-bg-base text-ui-fg-base"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-ui-bg-subtle overflow-hidden border border-ui-border-base shrink-0 flex items-center justify-center">
                        <img
                          src={s.image_url}
                          alt={s.image_alt}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = "none"
                          }}
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ui-fg-base line-clamp-1">
                          {idx + 1}. {s.title_line1} {s.title_line2}
                        </span>
                        <span className="text-[11px] text-ui-fg-subtle line-clamp-1">{s.eyebrow}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          s.is_active ? "bg-emerald-500" : "bg-zinc-400"
                        }`}
                        title={s.is_active ? "Aktif" : "Pasif"}
                      />
                      <Badge size="small" color={s.theme === "dark" ? "grey" : "orange"}>
                        {s.theme}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Container>
        </div>

        {/* Sağ Kolon: Slayt Detay ve Düzenleme Formu */}
        <div className="lg:col-span-8">
          {selectedSlide ? (
            <Container className="p-6 bg-ui-bg-base border border-ui-border-base text-ui-fg-base">
              <div className="flex items-center justify-between border-b border-ui-border-base pb-4 mb-5">
                <div>
                  <Heading level="h2" className="text-base font-bold text-ui-fg-base">
                    {isCreating ? "Yeni Slayt Ekle" : `Slayt Detayı: ${selectedSlide.title_line1}`}
                  </Heading>
                  <Text className="text-xs text-ui-fg-subtle">
                    ID: <code className="font-mono text-ui-fg-base bg-ui-bg-subtle px-1.5 py-0.5 rounded border border-ui-border-base font-semibold">{selectedSlide.id}</code>
                  </Text>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button variant="secondary" size="small" onClick={() => setIsEditing(true)}>
                      <PencilSquareSolid /> Düzenle
                    </Button>
                  )}
                  {!isCreating && (
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDeleteSlide(selectedSlide.id)}
                    >
                      <Trash /> Sil
                    </Button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveSlide} className="flex flex-col gap-4 text-xs">
                {/* Durum ve Tema */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base">
                  <div>
                    <Label className="text-[11px] font-semibold text-ui-fg-base">Durum (Aktif)</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <Switch
                        checked={selectedSlide.is_active}
                        disabled={!isEditing}
                        onCheckedChange={(val) =>
                          setSelectedSlide({ ...selectedSlide, is_active: val })
                        }
                      />
                      <span className="text-xs text-ui-fg-subtle font-medium">
                        {selectedSlide.is_active ? "Slayt Gösterimde" : "Gizli"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-ui-fg-base">Görsel Tema</Label>
                    <select
                      disabled={!isEditing}
                      value={selectedSlide.theme}
                      onChange={(e) =>
                        setSelectedSlide({
                          ...selectedSlide,
                          theme: e.target.value as "light" | "dark" | "brown",
                        })
                      }
                      className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-ui-border-base bg-ui-bg-field text-ui-fg-base text-xs focus:outline-none focus:border-[#B29460] focus:ring-1 focus:ring-[#B29460]"
                    >
                      <option value="light">Açık (Light Penye)</option>
                      <option value="dark">Koyu Antrasit (Dark Lab)</option>
                      <option value="brown">Kahve / Gold (Nizamlar Üretim)</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-ui-fg-base">
                      Geçiş Süresi (ms)
                    </Label>
                    <Input
                      type="number"
                      disabled={!isEditing}
                      value={selectedSlide.autoplay_duration_ms}
                      onChange={(e) =>
                        setSelectedSlide({
                          ...selectedSlide,
                          autoplay_duration_ms: parseInt(e.target.value) || 4400,
                        })
                      }
                      className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                    />
                  </div>
                </div>

                {/* Başlık ve Metinler */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[11px] font-semibold text-ui-fg-base">Üst Başlık (Eyebrow)</Label>
                    <Input
                      disabled={!isEditing}
                      value={selectedSlide.eyebrow}
                      onChange={(e) =>
                        setSelectedSlide({ ...selectedSlide, eyebrow: e.target.value })
                      }
                      className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-ui-fg-base">Kıyafet Etiketi</Label>
                    <Input
                      disabled={!isEditing}
                      value={selectedSlide.garment_tag}
                      onChange={(e) =>
                        setSelectedSlide({ ...selectedSlide, garment_tag: e.target.value })
                      }
                      className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-ui-fg-base">1. Satır Başlık</Label>
                    <Input
                      disabled={!isEditing}
                      value={selectedSlide.title_line1}
                      onChange={(e) =>
                        setSelectedSlide({ ...selectedSlide, title_line1: e.target.value })
                      }
                      className="mt-1 font-bold border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-ui-fg-base">2. Satır Başlık</Label>
                    <Input
                      disabled={!isEditing}
                      value={selectedSlide.title_line2}
                      onChange={(e) =>
                        setSelectedSlide({ ...selectedSlide, title_line2: e.target.value })
                      }
                      className="mt-1 font-bold border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold text-ui-fg-base">Açıklama Metni</Label>
                  <textarea
                    disabled={!isEditing}
                    rows={2}
                    value={selectedSlide.subtitle}
                    onChange={(e) =>
                      setSelectedSlide({ ...selectedSlide, subtitle: e.target.value })
                    }
                    className="mt-1 w-full p-2.5 rounded-md border border-ui-border-base bg-ui-bg-field text-ui-fg-base placeholder:text-ui-fg-muted text-xs focus:outline-none focus:border-[#B29460] focus:ring-1 focus:ring-[#B29460]"
                  />
                </div>

                {/* Butonlar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base flex flex-col gap-2">
                    <Text className="text-[11px] font-bold text-ui-fg-base">Ana Buton (Birincil)</Text>
                    <div>
                      <Label className="text-[10px] text-ui-fg-subtle">Buton Metni</Label>
                      <Input
                        disabled={!isEditing}
                        value={selectedSlide.cta_label}
                        onChange={(e) =>
                          setSelectedSlide({ ...selectedSlide, cta_label: e.target.value })
                        }
                        className="mt-0.5 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-ui-fg-subtle">Bağlantı URL</Label>
                      <Input
                        disabled={!isEditing}
                        value={selectedSlide.cta_href}
                        onChange={(e) =>
                          setSelectedSlide({ ...selectedSlide, cta_href: e.target.value })
                        }
                        className="mt-0.5 font-mono border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base flex flex-col gap-2">
                    <Text className="text-[11px] font-bold text-ui-fg-base">İkincil Buton</Text>
                    <div>
                      <Label className="text-[10px] text-ui-fg-subtle">Buton Metni</Label>
                      <Input
                        disabled={!isEditing}
                        value={selectedSlide.secondary_label || ""}
                        onChange={(e) =>
                          setSelectedSlide({ ...selectedSlide, secondary_label: e.target.value })
                        }
                        className="mt-0.5 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-ui-fg-subtle">Bağlantı URL</Label>
                      <Input
                        disabled={!isEditing}
                        value={selectedSlide.secondary_href || ""}
                        onChange={(e) =>
                          setSelectedSlide({ ...selectedSlide, secondary_href: e.target.value })
                        }
                        className="mt-0.5 font-mono border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                      />
                    </div>
                  </div>
                </div>

                {/* Görsel ve 3D Özellikleri */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[11px] font-semibold text-ui-fg-base">
                      Görsel Dosya Yolu (WebP / PNG)
                    </Label>
                    <Input
                      disabled={!isEditing}
                      value={selectedSlide.image_url}
                      onChange={(e) =>
                        setSelectedSlide({ ...selectedSlide, image_url: e.target.value })
                      }
                      className="mt-1 font-mono border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                    />
                  </div>

                  <div>
                    <Label className="text-[11px] font-semibold text-ui-fg-base">
                      3D Tişört Kumaş Rengi (Hex)
                    </Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        disabled={!isEditing}
                        value={selectedSlide.shirt_color}
                        onChange={(e) =>
                          setSelectedSlide({ ...selectedSlide, shirt_color: e.target.value })
                        }
                        className="w-8 h-8 rounded border border-ui-border-base cursor-pointer"
                      />
                      <Input
                        disabled={!isEditing}
                        value={selectedSlide.shirt_color}
                        onChange={(e) =>
                          setSelectedSlide({ ...selectedSlide, shirt_color: e.target.value })
                        }
                        className="font-mono uppercase border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                      />
                    </div>
                  </div>
                </div>

                {/* Aksiyon Butonları */}
                {isEditing && (
                  <div className="pt-4 border-t border-ui-border-base flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="base"
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        setIsCreating(false)
                      }}
                    >
                      İptal
                    </Button>
                    <Button
                      variant="primary"
                      size="base"
                      type="submit"
                      disabled={saving}
                      className="bg-[#B29460] hover:bg-[#9E8250] text-[#222325] font-bold"
                    >
                      {saving ? "Kaydediliyor..." : "💾 Değişiklikleri Kaydet"}
                    </Button>
                  </div>
                )}
              </form>
            </Container>
          ) : (
            <Container className="p-8 text-center text-ui-fg-muted bg-ui-bg-base border border-ui-border-base">
              Düzenlemek için soldaki slaytlardan birini seçin veya yeni slayt ekleyin.
            </Container>
          )}
        </div>
      </div>
    </div>
  )
}

export default SiteHeroPage
