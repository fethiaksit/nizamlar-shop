import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  SquaresPlus,
  Sparkles,
  Photo,
  Eye,
  Folder,
  CogSixTooth,
  CubeSolid,
  Swatch,
  DocumentText,
  CurrencyDollar,
  ListBullet,
  EllipsisHorizontal,
} from "@medusajs/icons"
import { Container, Heading, Text, Button, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch } from "../../lib/client"

const SiteHubPage = () => {
  const [loading, setLoading] = useState<boolean>(true)
  const [publishing, setPublishing] = useState<boolean>(false)
  const [stats, setStats] = useState<{
    slideCount: number
    rackCount: number
    sectionCount: number
    mediaCount: number
    lastPublished?: string
  }>({
    slideCount: 0,
    rackCount: 0,
    sectionCount: 0,
    mediaCount: 0,
  })
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadData = async () => {
    setLoading(true)
    const [slidesRes, rackRes, secRes, mediaRes, settingsRes] = await Promise.all([
      adminFetch("/admin/site-management/hero-slides"),
      adminFetch("/admin/site-management/garments"),
      adminFetch("/admin/site-management/homepage-sections"),
      adminFetch("/admin/site-management/media"),
      adminFetch("/admin/site-management/settings"),
    ])

    setStats({
      slideCount: slidesRes.data?.slides?.length || 0,
      rackCount: rackRes.data?.garments?.length || 0,
      sectionCount: secRes.data?.sections?.length || 0,
      mediaCount: mediaRes.data?.media?.length || 0,
      lastPublished: settingsRes.data?.settings?.updated_at,
    })
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handlePublishAll = async () => {
    setPublishing(true)
    setStatusMsg(null)
    const res = await adminFetch("/admin/site-management/publish", { method: "POST" })
    if (res.error) {
      setStatusMsg({ type: "error", text: res.error })
    } else {
      setStatusMsg({
        type: "success",
        text: "Tüm değişiklikler başarıyla mağaza arayüzüne yayınlandı!",
      })
      await loadData()
    }
    setPublishing(false)
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl font-sans text-[#161718]">
      {/* Üst Banner */}
      <Container className="bg-[#222325] text-[#FFFFFF] p-8 rounded-2xl border border-[#49372E] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#B29460] text-[#FFFFFF] font-black tracking-wider text-[11px] uppercase border-0">
                NİZAMLAR MERKEZİ YÖNETİM
              </Badge>
              <span className="text-xs text-[#F3EFE7] font-semibold">Medusa v2 Yönetim Paneli</span>
            </div>
            <Heading level="h1" className="text-2xl md:text-3xl font-black text-[#FFFFFF]">
              Site & Vitrin Yönetimi
            </Heading>
            <Text className="text-sm text-[#F3EFE7] max-w-2xl leading-relaxed">
              Hero Slider, Dimaac 3D Ürün Vitrini, 3D Tasarım Stüdyosu, Medya Kütüphanesi ve Site Ayarlarını
              aşağıdaki modüllerden kolayca yönetin.
            </Text>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href="http://localhost:8000"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#49372E] bg-[#32251E] hover:bg-[#49372E] text-xs font-bold text-[#FFFFFF] text-center transition-all"
            >
              🌐 Mağazayı Önizle
            </a>
            <Button
              variant="primary"
              size="large"
              className="w-full sm:w-auto bg-[#B29460] hover:bg-[#9E8250] text-[#FFFFFF] font-black text-xs rounded-xl px-6 py-2.5 shadow-sm"
              disabled={publishing || loading}
              onClick={handlePublishAll}
            >
              {publishing ? "Yayınlanıyor..." : "🚀 Değişiklikleri Canlıya Al"}
            </Button>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`mt-4 p-3.5 rounded-xl text-xs font-bold ${
              statusMsg.type === "success"
                ? "bg-[#EBF7EE] text-[#1E5D2F] border border-[#A8E2B6]"
                : "bg-[#FDEDEC] text-[#922B21] border border-[#F5B7B1]"
            }`}
          >
            {statusMsg.text}
          </div>
        )}
      </Container>

      {/* İstatistik Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Container className="p-5 flex items-center justify-between bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl shadow-sm">
          <div>
            <Text className="text-xs text-[#49372E] font-bold uppercase tracking-wider">Hero Slider</Text>
            <Heading level="h2" className="text-2xl font-black mt-1 text-[#222325]">
              {loading ? "..." : stats.slideCount} Slayt
            </Heading>
            <Text className="text-xs text-[#27AE60] font-bold mt-1">Aktif & Yayında</Text>
          </div>
          <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-[#B29460]">
            <Photo />
          </div>
        </Container>

        <Container className="p-5 flex items-center justify-between bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl shadow-sm">
          <div>
            <Text className="text-xs text-[#49372E] font-bold uppercase tracking-wider">Dimaac Vitrin</Text>
            <Heading level="h2" className="text-2xl font-black mt-1 text-[#222325]">
              {loading ? "..." : stats.rackCount} Model
            </Heading>
            <Text className="text-xs text-[#27AE60] font-bold mt-1">Askılıkta Gösterimde</Text>
          </div>
          <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-[#B29460]">
            <Sparkles />
          </div>
        </Container>

        <Container className="p-5 flex items-center justify-between bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl shadow-sm">
          <div>
            <Text className="text-xs text-[#49372E] font-bold uppercase tracking-wider">Bölümler</Text>
            <Heading level="h2" className="text-2xl font-black mt-1 text-[#222325]">
              {loading ? "..." : stats.sectionCount} Blok
            </Heading>
            <Text className="text-xs text-[#27AE60] font-bold mt-1">Ana Sayfa Düzeni</Text>
          </div>
          <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-[#B29460]">
            <SquaresPlus />
          </div>
        </Container>

        <Container className="p-5 flex items-center justify-between bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl shadow-sm">
          <div>
            <Text className="text-xs text-[#49372E] font-bold uppercase tracking-wider">Görsel Kütüphanesi</Text>
            <Heading level="h2" className="text-2xl font-black mt-1 text-[#222325]">
              {loading ? "..." : stats.mediaCount} Öğe
            </Heading>
            <Text className="text-xs text-[#49372E] font-bold mt-1">Logo, Model & Doku</Text>
          </div>
          <div className="p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-[#B29460]">
            <Folder />
          </div>
        </Container>
      </div>

      {/* Modül Seçim Alanı 1: Vitrin ve İçerik Yönetimi */}
      <Container className="p-6 bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8] mb-5">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#B29460]">Bölüm 1</span>
            <Heading level="h2" className="text-lg font-black text-[#222325]">
              Vitrin, Slider ve Tasarım Alanları
            </Heading>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/app/site-hero"
            className="p-5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <Photo />
              <span>Hero Slider</span>
            </div>
            <Text className="text-xs text-[#49372E] leading-relaxed">
              Ana sayfa 3D tişörtlü açılış slaytlarını, başlıkları, renkleri ve sıralamayı düzenleyin.
            </Text>
          </a>

          <a
            href="/app/site-rack"
            className="p-5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <Sparkles />
              <span>Dimaac Askılık Vitrini</span>
            </div>
            <Text className="text-xs text-[#49372E] leading-relaxed">
              Askılıktaki giysi modellerini, 240 GSM kumaş rozetlerini ve askılık ürün sırasını yönetin.
            </Text>
          </a>

          <a
            href="/app/site-customizer"
            className="p-5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <Eye />
              <span>3D Tasarım Stüdyosu</span>
            </div>
            <Text className="text-xs text-[#49372E] leading-relaxed">
              tshirt3d varsayılan kumaş rengi, renk seçici paleti ve milimetre baskı sınırlarını belirleyin.
            </Text>
          </a>

          <a
            href="/app/site-sections"
            className="p-5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <ListBullet />
              <span>Bölümler & Kampanyalar</span>
            </div>
            <Text className="text-xs text-[#49372E] leading-relaxed">
              Ana sayfadaki blokların (Hero, Askılık, Tasarım Stüdyosu vb.) görünürlük ve sırasını kontrol edin.
            </Text>
          </a>
        </div>
      </Container>

      {/* Modül Seçim Alanı 2: Medya, Menü ve Site Ayarları */}
      <Container className="p-6 bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8] mb-5">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#B29460]">Bölüm 2</span>
            <Heading level="h2" className="text-lg font-black text-[#222325]">
              Medya, Navigasyon ve Genel İletişim
            </Heading>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/app/site-media"
            className="p-5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <Folder />
              <span>Görsel Kütüphanesi</span>
            </div>
            <Text className="text-xs text-[#49372E] leading-relaxed">
              Logo, desen, mockup ve 3D GLB modelleri için medya dosyalarını yükleyin ve yönetin.
            </Text>
          </a>

          <a
            href="/app/site-navigation"
            className="p-5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <EllipsisHorizontal />
              <span>Menü ve Footer</span>
            </div>
            <Text className="text-xs text-[#49372E] leading-relaxed">
              Header navigasyon bağlantılarını, sosyal medya linklerini ve footer metinlerini düzenleyin.
            </Text>
          </a>

          <a
            href="/app/site-settings"
            className="p-5 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <CogSixTooth />
              <span>Site Ayarları</span>
            </div>
            <Text className="text-xs text-[#49372E] leading-relaxed">
              Mağaza başlığı, slogan, duyuru barı metni, WhatsApp hattı ve iletişim e-postasını belirleyin.
            </Text>
          </a>
        </div>
      </Container>

      {/* Modül Seçim Alanı 3: 3D ve Baskı Yönetimi */}
      <Container className="p-6 bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8] mb-5">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#B29460]">Bölüm 3</span>
            <Heading level="h2" className="text-lg font-black text-[#222325]">
              3D & Baskı Stüdyosu Yönetimi
            </Heading>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <a
            href="/app/print-models"
            className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <CubeSolid />
              <span>3D Modeller</span>
            </div>
            <Text className="text-xs text-[#49372E]">
              GLB 3D giysi modellerinin dosya yolu ve poligon ayarları.
            </Text>
          </a>

          <a
            href="/app/print-tshirts"
            className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <Swatch />
              <span>Kalıplar & Renkler</span>
            </div>
            <Text className="text-xs text-[#49372E]">
              Oversize ve standart tişört kalıpları ile kumaş renk kartelası.
            </Text>
          </a>

          <a
            href="/app/print-placements"
            className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <DocumentText />
              <span>Baskı Alanları</span>
            </div>
            <Text className="text-xs text-[#49372E]">
              Göğüs, sırt ve cep milimetre baskı sınır ölçüleri.
            </Text>
          </a>

          <a
            href="/app/print-designs"
            className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <Sparkles />
              <span>Tasarım Kayıtları</span>
            </div>
            <Text className="text-xs text-[#49372E]">
              Müşterilerin oluşturduğu sipariş baskı dosyalarını indirin.
            </Text>
          </a>

          <a
            href="/app/print-pricing"
            className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] hover:border-[#B29460] hover:bg-[#FFFFFF] hover:shadow-md transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-[#222325] font-black text-sm group-hover:text-[#B29460]">
              <CurrencyDollar />
              <span>Baskı Fiyatları</span>
            </div>
            <Text className="text-xs text-[#49372E]">
              DTF ve Serigrafi baskı maliyetleri ve adet indirim baremleri.
            </Text>
          </a>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Site Yönetimi",
  icon: SquaresPlus,
  rank: 6,
})

export default SiteHubPage
