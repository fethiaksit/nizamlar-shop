export type DynamicSlide = {
  id: string
  rank: number
  theme: "light" | "dark" | "brown"
  eyebrow: string
  title_line1: string
  title_line2: string
  subtitle: string
  cta_label: string
  cta_href: string
  secondary_label?: string
  secondary_href?: string
  image_url: string
  image_alt: string
  badges: string[]
  garment_tag: string
  shirt_color?: string
  is_active: boolean
  is_published: boolean
  autoplay_duration_ms?: number
}

export type DynamicRackGarment = {
  id: string
  product_id?: string
  product_handle?: string
  name: string
  garment_kind: "tee" | "crewneck" | "sweater" | "shirt"
  colour: string
  show_nizamlar_logo: boolean
  logo_scale: number
  logo_pos_x: number
  logo_pos_y: number
  logo_style: string
  model_3d_file: string
  rank: number
  is_active: boolean
}

export type DynamicSection = {
  id: string
  name: string
  badge_text?: string
  title: string
  subtitle?: string
  rank: number
  is_active: boolean
  config?: Record<string, unknown>
}

export type DynamicCustomizerSettings = {
  id: string
  section_title: string
  section_subtitle: string
  badge_text: string
  default_model_path: string
  default_shirt_color: string
  color_palette: string[]
  default_logo_url: string
  default_full_url: string
  max_file_size_mb: number
  allowed_formats: string[]
  cta_button_text: string
  secondary_button_text: string
}

export type SiteContentResponse = {
  settings: Record<string, unknown> | null
  slides: DynamicSlide[]
  sections: DynamicSection[]
  rackItems: DynamicRackGarment[]
  customizer: DynamicCustomizerSettings | null
}

const DEFAULT_SLIDES: DynamicSlide[] = [
  {
    id: "slide-1",
    rank: 0,
    theme: "light",
    eyebrow: "01 / PREMİUM KOLEKSİYON · 240 GSM PENYE",
    title_line1: "KENDİ TARZINI",
    title_line2: "YANSIT.",
    subtitle: "Premium tekstil ürünlerini keşfet. Tarzını Nizamlar Baskı kalitesiyle tamamla.",
    cta_label: "Koleksiyonu Keşfet",
    cta_href: "#collection-rack",
    secondary_label: "Tüm Koleksiyonu Gör",
    secondary_href: "/store",
    image_url: "/hero/slide-1-tee.webp",
    image_alt: "Siyah Antrasit 240 GSM Premium Oversize Penye Tişört",
    badges: ["240 GSM %100 Penye Pamuk", "Oversize Kalıp · Çift İğne Dikiş"],
    garment_tag: "PREMIUM OVERSIZE TEE · ANTRASİT SİYAH",
    shirt_color: "#232528",
    is_active: true,
    is_published: true,
    autoplay_duration_ms: 4400,
  },
  {
    id: "slide-2",
    rank: 1,
    theme: "dark",
    eyebrow: "02 / 3D DESIGN LAB · KENDİ TASARIMINI OLUŞTUR",
    title_line1: "TASARLA.",
    title_line2: "BİZ BASALIM.",
    subtitle: "Kendi logonu yükle, ürününü özelleştir, baskını sipariş et.",
    cta_label: "Tasarımını Oluştur",
    cta_href: "/products/premium-oversize-penye-t-shirt?studio=1",
    secondary_label: "3D Deneyimi Başlat",
    secondary_href: "#tshirt3d-experience",
    image_url: "/hero/slide-2-printed-tee.webp",
    image_alt: "Krem Beyaz Tişört Üzerinde Renkli Özel DTF Baskı Örneği",
    badges: [
      "Yüksek Çözünürlüklü DTF & Serigrafi",
      "320 × 400 mm Ön & Arka Baskı Alanı",
    ],
    garment_tag: "CUSTOM PRINT LAB · KREM & RENKLİ DTF",
    shirt_color: "#F4F1EA",
    is_active: true,
    is_published: true,
    autoplay_duration_ms: 4400,
  },
  {
    id: "slide-3",
    rank: 2,
    theme: "brown",
    eyebrow: "03 / NİZAMLAR ÜRETİM · PERAKENDE & KURUMSAL",
    title_line1: "ÜRETİMDE",
    title_line2: "NİZAMLAR KALİTESİ.",
    subtitle: "Tek üründen toplu üretime, tekstil baskıda profesyonel çözümler.",
    cta_label: "Ürünleri İncele",
    cta_href: "/store",
    secondary_label: "Toplu Üretim & Kurumsal Sipariş",
    secondary_href: "#bulk-production",
    image_url: "/hero/slide-3-collection.webp",
    image_alt: "Nizamlar Baskı Tişört, Sweatshirt ve Kurumsal Tekstil Koleksiyonu",
    badges: [
      "Tişört · Sweatshirt · Hoodie · Bez Çanta",
      "1 Adetten Toplu Üretime Kalite Garantisi",
    ],
    garment_tag: "NİZAMLAR ATÖLYE · ÇOKLU TEKSTİL SERİSİ",
    shirt_color: "#32251E",
    is_active: true,
    is_published: true,
    autoplay_duration_ms: 4400,
  },
]

export async function getSiteContent(): Promise<SiteContentResponse> {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey =
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
    "pk_0a79f3d5cf6d94e1b78d382788f4c59ead1824c818ff9c8542d80c8dab0462cc"

  try {
    const res = await fetch(`${backendUrl}/store/site-content`, {
      headers: {
        "x-publishable-api-key": publishableKey,
      },
      next: {
        revalidate: 30,
        tags: ["site-content"],
      },
    })

    if (!res.ok) {
      return {
        settings: null,
        slides: DEFAULT_SLIDES,
        sections: [],
        rackItems: [],
        customizer: null,
      }
    }

    const data = await res.json()
    return {
      settings: data.settings || null,
      slides: data.slides?.length ? data.slides : DEFAULT_SLIDES,
      sections: data.sections || [],
      rackItems: data.rackItems || [],
      customizer: data.customizer || null,
    }
  } catch (_error) {
    return {
      settings: null,
      slides: DEFAULT_SLIDES,
      sections: [],
      rackItems: [],
      customizer: null,
    }
  }
}
