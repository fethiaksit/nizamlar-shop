import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Container, Heading, Text, Badge } from "@medusajs/ui"

const PrintPlacementsPage = () => {
  const placements = [
    {
      id: "pocket",
      name: "Sol / Sağ Göğüs (Pocket)",
      dimensions: "100 × 100 mm",
      maxPrintArea: "120 × 120 mm",
      description: "Küçük amblem, şirket logosu veya minimalist tipografi için ideal.",
      allowedSurfaces: "Ön Yüz (Sol veya Sağ)",
      recommendedTechnique: "DTF, Serigrafi, İnce Nakış",
      sizeMultiplier: "0.75x",
    },
    {
      id: "a5",
      name: "A5 Orta Göğüs",
      dimensions: "148 × 210 mm",
      maxPrintArea: "160 × 220 mm",
      description: "Yatay veya dikey orta boy kurumsal baskılar.",
      allowedSurfaces: "Ön Yüz / Sırt Üst",
      recommendedTechnique: "DTF, Serigrafi",
      sizeMultiplier: "0.85x",
    },
    {
      id: "a4",
      name: "A4 Standart Göğüs / Sırt",
      dimensions: "210 × 297 mm",
      maxPrintArea: "230 × 320 mm",
      description: "En popüler tişört ön baskı ve orta sırt grafik alanı.",
      allowedSurfaces: "Ön Yüz / Sırt",
      recommendedTechnique: "DTF, Serigrafi, Kabartma",
      sizeMultiplier: "1.00x (Temel Ölçü)",
    },
    {
      id: "a3",
      name: "A3 Geniş Sırt / Poster",
      dimensions: "297 × 420 mm",
      maxPrintArea: "320 × 450 mm",
      description: "Büyük oversize sırt grafikleri ve festival/etkinlik tasarımları.",
      allowedSurfaces: "Sırt / Ön Büyük",
      recommendedTechnique: "DTF, Geniş Format Serigrafi",
      sizeMultiplier: "1.30x",
    },
    {
      id: "a3_plus",
      name: "A3+ Jumbo Sırt",
      dimensions: "350 × 500 mm",
      maxPrintArea: "380 × 520 mm",
      description: "Dikişten dikişe maksimum kaplama alanı.",
      allowedSurfaces: "Yalnızca Sırt",
      recommendedTechnique: "Endüstriyel Serigrafi",
      sizeMultiplier: "1.60x",
    },
    {
      id: "sleeve",
      name: "Kol Baskısı (Sleeve)",
      dimensions: "80 × 300 mm",
      maxPrintArea: "90 × 320 mm",
      description: "Dikey kurumsal marka yazısı veya kol ucu amblemi.",
      allowedSurfaces: "Sol Kol / Sağ Kol",
      recommendedTechnique: "DTF, Tek Renk Serigrafi",
      sizeMultiplier: "0.80x",
    },
  ]

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      <Container className="p-6">
        <div className="flex items-center gap-2">
          <Badge color="blue">MİLİMETRİK KALIP STANDARTLARI</Badge>
          <span className="text-xs text-gray-500">Baskı Alanı ve Yüzey Sınırları</span>
        </div>
        <Heading level="h1" className="text-2xl font-bold text-gray-900 mt-1">
          Baskı Alanları ve Ölçü Sınırları
        </Heading>
        <Text className="text-xs text-gray-600 mt-1">
          T-Designer 3D stüdyosunda ve atölye üretim hattında geçerli milimetrik baskı alanları,
          fiyatlandırma çarpanları ve teknik sınırlar.
        </Text>
      </Container>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {placements.map((p) => (
          <Container key={p.id} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b pb-2 mb-3">
                <Heading level="h2" className="text-sm font-bold text-gray-900">
                  {p.name}
                </Heading>
                <Badge color="orange">{p.dimensions}</Badge>
              </div>

              <Text className="text-xs text-gray-600 mb-3">{p.description}</Text>

              <div className="space-y-1.5 text-xs text-gray-700 bg-gray-50 p-3 rounded-lg border">
                <div className="flex justify-between">
                  <span className="text-gray-500">Maksimum Alan:</span>
                  <span className="font-semibold">{p.maxPrintArea}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uygulanabilir Yüzey:</span>
                  <span className="font-medium text-gray-900">{p.allowedSurfaces}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fiyat Çarpanı:</span>
                  <span className="font-bold text-amber-700">{p.sizeMultiplier}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t text-[11px] text-gray-500">
              Uygun Teknik: <span className="font-semibold text-gray-800">{p.recommendedTechnique}</span>
            </div>
          </Container>
        ))}
      </div>
    </div>
  )
}

export default PrintPlacementsPage
