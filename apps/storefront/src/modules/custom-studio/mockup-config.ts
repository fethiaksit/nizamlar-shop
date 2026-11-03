/**
 * NİZAMLAR BASKI — CANLI BASKI ÖNİZLEME & STÜDYO KONFİGÜRASYONU
 * nizamlar-web mockup-config.js referansı temel alınarak React/TypeScript için hazırlanmıştır.
 */

export interface PaletteColor {
  id: string
  name: string
  hex: string
}

export interface PrintPositionPreset {
  id: string
  name: string
  x: number
  y: number
  scale: number
  rotation: number
  desc: string
  physicalWidthMm: number
  physicalHeightMm: number
}

export interface PrintableArea {
  x: number
  y: number
  width: number
  height: number
  label: string
  maxPhysicalWidthMm: number
  maxPhysicalHeightMm: number
}

export interface ProductViewConfig {
  label: string
  printableArea: PrintableArea
  positions: Record<string, PrintPositionPreset>
  defaultPosition: string
}

export interface StudioProductConfig {
  id: string
  name: string
  category: string
  spec: string
  defaultView: "front" | "back"
  supportedViews: ("front" | "back")[]
  defaultColor: string
  supportedColors: PaletteColor[]
  views: {
    front: ProductViewConfig
    back?: ProductViewConfig
  }
}

export const NIZAMLAR_PALETTE: PaletteColor[] = [
  { id: "beyaz", name: "Beyaz", hex: "#F8F8F5" },
  { id: "siyah", name: "Siyah", hex: "#202020" },
  { id: "antrasit", name: "Antrasit", hex: "#48494B" },
  { id: "ekru", name: "Ekru", hex: "#E9DFCB" },
  { id: "bej", name: "Bej", hex: "#C6AD8F" },
  { id: "kahverengi", name: "Kahverengi", hex: "#674936" },
  { id: "haki", name: "Haki", hex: "#666D4F" },
  { id: "lacivert", name: "Lacivert", hex: "#242F4A" },
  { id: "bordo", name: "Bordo", hex: "#703443" },
  { id: "kirmizi", name: "Kırmızı", hex: "#BB343A" },
  { id: "mavi", name: "Mavi", hex: "#6B94B4" },
  { id: "pembe", name: "Pembe", hex: "#DFA8B6" },
]

export const STUDIO_PRODUCTS: Record<string, StudioProductConfig> = {
  tisort: {
    id: "tisort",
    name: "Tişört",
    category: "Konfeksiyon & Parça",
    spec: "240 GSM Penye Pamuk",
    defaultView: "front",
    supportedViews: ["front", "back"],
    defaultColor: "siyah",
    supportedColors: NIZAMLAR_PALETTE,
    views: {
      front: {
        label: "Ön Görünüm",
        printableArea: {
          x: 185,
          y: 145,
          width: 230,
          height: 410,
          label: "Ön Baskı Alanı (Maks. 38x48 cm)",
          maxPhysicalWidthMm: 380,
          maxPhysicalHeightMm: 480,
        },
        positions: {
          sol_gogus: {
            id: "sol_gogus",
            name: "Sol Göğüs (Arma)",
            x: 245,
            y: 205,
            scale: 0.42,
            rotation: 0,
            desc: "10 x 10 cm Arma / Logo",
            physicalWidthMm: 100,
            physicalHeightMm: 100,
          },
          orta_gogus: {
            id: "orta_gogus",
            name: "Göğüs Orta",
            x: 300,
            y: 245,
            scale: 0.70,
            rotation: 0,
            desc: "20 x 20 cm Tipografik Şerit",
            physicalWidthMm: 200,
            physicalHeightMm: 200,
          },
          buyuk_on: {
            id: "buyuk_on",
            name: "Büyük Ön Baskı (A4/A3)",
            x: 300,
            y: 330,
            scale: 0.95,
            rotation: 0,
            desc: "Geniş A3+ Sanatsal Format",
            physicalWidthMm: 297,
            physicalHeightMm: 420,
          },
        },
        defaultPosition: "buyuk_on",
      },
      back: {
        label: "Sırt Görünümü",
        printableArea: {
          x: 185,
          y: 135,
          width: 230,
          height: 420,
          label: "Sırt Baskı Alanı (Maks. 40x50 cm)",
          maxPhysicalWidthMm: 400,
          maxPhysicalHeightMm: 500,
        },
        positions: {
          ense_logo: {
            id: "ense_logo",
            name: "Ense / Yaka Altı",
            x: 300,
            y: 165,
            scale: 0.35,
            rotation: 0,
            desc: "8 x 6 cm Ense Mikro Baskı",
            physicalWidthMm: 80,
            physicalHeightMm: 60,
          },
          sirt_orta: {
            id: "sirt_orta",
            name: "Sırt Standart (A4)",
            x: 300,
            y: 260,
            scale: 0.75,
            rotation: 0,
            desc: "Standart A4 Sırt Yerleşimi",
            physicalWidthMm: 210,
            physicalHeightMm: 297,
          },
          buyuk_sirt: {
            id: "buyuk_sirt",
            name: "Mega Sırt Baskısı (A3+)",
            x: 300,
            y: 320,
            scale: 1.10,
            rotation: 0,
            desc: "35 x 45 cm Mega Sırt Sanatı",
            physicalWidthMm: 350,
            physicalHeightMm: 450,
          },
        },
        defaultPosition: "buyuk_sirt",
      },
    },
  },
  hoodie: {
    id: "hoodie",
    name: "Kapüşonlu Sweatshirt (Hoodie)",
    category: "3 İplik Şardonlu",
    spec: "320 GSM Ağır Kumaş",
    defaultView: "front",
    supportedViews: ["front", "back"],
    defaultColor: "siyah",
    supportedColors: [
      { id: "siyah", name: "Siyah", hex: "#202020" },
      { id: "antrasit", name: "Antrasit", hex: "#48494B" },
      { id: "ekru", name: "Ekru", hex: "#E9DFCB" },
      { id: "bej", name: "Bej", hex: "#C6AD8F" },
      { id: "haki", name: "Haki", hex: "#666D4F" },
    ],
    views: {
      front: {
        label: "Ön Görünüm",
        printableArea: {
          x: 190,
          y: 190,
          width: 220,
          height: 310,
          label: "Ön Baskı Alanı (Kanguru Cep Üstü)",
          maxPhysicalWidthMm: 300,
          maxPhysicalHeightMm: 350,
        },
        positions: {
          sol_gogus: {
            id: "sol_gogus",
            name: "Sol Göğüs Logo",
            x: 245,
            y: 220,
            scale: 0.42,
            rotation: 0,
            desc: "10 x 10 cm Logo",
            physicalWidthMm: 100,
            physicalHeightMm: 100,
          },
          orta_gogus: {
            id: "orta_gogus",
            name: "Göğüs Orta",
            x: 300,
            y: 270,
            scale: 0.75,
            rotation: 0,
            desc: "25 x 20 cm Ön Göğüs",
            physicalWidthMm: 250,
            physicalHeightMm: 200,
          },
        },
        defaultPosition: "orta_gogus",
      },
      back: {
        label: "Sırt Görünümü",
        printableArea: {
          x: 185,
          y: 150,
          width: 230,
          height: 410,
          label: "Sırt Baskı Alanı",
          maxPhysicalWidthMm: 350,
          maxPhysicalHeightMm: 450,
        },
        positions: {
          buyuk_sirt: {
            id: "buyuk_sirt",
            name: "Mega Sırt Baskısı",
            x: 300,
            y: 330,
            scale: 1.05,
            rotation: 0,
            desc: "A3 Sırt Baskısı",
            physicalWidthMm: 300,
            physicalHeightMm: 420,
          },
        },
        defaultPosition: "buyuk_sirt",
      },
    },
  },
  canta: {
    id: "canta",
    name: "Kanvas Bez Çanta (Tote Bag)",
    category: "Promosyon & Aksesuar",
    spec: "320 GSM Ham Pamuk",
    defaultView: "front",
    supportedViews: ["front"],
    defaultColor: "ekru",
    supportedColors: [
      { id: "ekru", name: "Ham Ekru", hex: "#E9DFCB" },
      { id: "siyah", name: "Siyah", hex: "#202020" },
    ],
    views: {
      front: {
        label: "Ön Görünüm",
        printableArea: {
          x: 185,
          y: 230,
          width: 230,
          height: 320,
          label: "Çanta Ön Yüz Baskı Alanı",
          maxPhysicalWidthMm: 280,
          maxPhysicalHeightMm: 320,
        },
        positions: {
          tam_orta: {
            id: "tam_orta",
            name: "Merkezi Baskı",
            x: 300,
            y: 380,
            scale: 0.85,
            rotation: 0,
            desc: "25 x 25 cm Standart Baskı",
            physicalWidthMm: 250,
            physicalHeightMm: 250,
          },
        },
        defaultPosition: "tam_orta",
      },
    },
  },
}
