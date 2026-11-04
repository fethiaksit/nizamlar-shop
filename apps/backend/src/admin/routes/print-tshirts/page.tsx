import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Swatch, Check } from "@medusajs/icons"
import { Container, Heading, Text, Badge } from "@medusajs/ui"

const PrintTshirtsPage = () => {
  const fabricSpecs = [
    {
      id: "spec-1",
      name: "240 GSM %100 Penye Pamuk",
      category: "Tişört (Oversize)",
      weight: "240 GSM",
      yarn: "20/1 Kompakt Penye",
      colors: ["#232528", "#F4F1EA", "#DED9CF", "#3B2820", "#2E382E"],
      features: "Çift iğne omuz dikişi, lycralı ribana yaka, ön çektirme yapılmış çekmez kumaş",
      printSuitability: "DTF, Endüstriyel Serigrafi, Yüksek Yoğunluklu Baskı",
    },
    {
      id: "spec-2",
      name: "340 GSM 3 İplik Şardonlu",
      category: "Sweatshirt & Hoodie",
      weight: "340 GSM",
      yarn: "30/70/10 Üç İplik",
      colors: ["#232528", "#DED9CF", "#3B2820", "#1E2A38"],
      features: "Yaka altı V-dikiş ribana, içi polar şardonlu yumuşak tuşe, geniş oversize fit",
      printSuitability: "Kabartma (Puff), Serigrafi, Armürlü Nakış",
    },
    {
      id: "spec-3",
      name: "Özel Triko Örgü Doku",
      category: "Essential Kazak",
      weight: "280 GSM",
      yarn: "%80 Pamuk %20 Yün Karışım",
      colors: ["#DED9CF", "#232528", "#5A4D41"],
      features: "Hafif esnek nefes alan petek örgü, ribana manşet ve bel bandı",
      printSuitability: "Lazer Kazıma Arma, İnce Nakış Logo",
    },
    {
      id: "spec-4",
      name: "320 GSM Ağır Kanvas",
      category: "Bez Çanta (Tote Bag)",
      weight: "320 GSM",
      yarn: "%100 Ham Doğal Pamuk",
      colors: ["#F4F1EA", "#232528"],
      features: "Takviyeli çift kulp dikişi, 15 kg taşıma kapasitesi, 40×42 cm ebat",
      printSuitability: "Tam Yüzey Serigrafi, Çok Renkli DTF",
    },
  ]

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      <Container className="p-6">
        <div className="flex items-center gap-2">
          <Badge color="orange">KUMAŞ VE TEKSTİL ARŞİVİ</Badge>
          <span className="text-xs text-gray-500">Nizamlar Atölye Standartları</span>
        </div>
        <Heading level="h1" className="text-2xl font-bold text-gray-900 mt-1">
          Varsayılan Tişörtler ve Kumaş Standartları
        </Heading>
        <Text className="text-xs text-gray-600 mt-1">
          Baskı atölyemizde kullanılan kumaş kaliteleri, gramajları, iplik yapıları ve uygun baskı
          teknolojisi eşleşmeleri.
        </Text>
      </Container>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fabricSpecs.map((spec) => (
          <Container key={spec.id} className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <div>
                  <Heading level="h2" className="text-base font-bold text-gray-900">
                    {spec.name}
                  </Heading>
                  <Text className="text-xs text-gray-500">{spec.category}</Text>
                </div>
                <Badge color="orange">{spec.weight}</Badge>
              </div>

              <div className="space-y-2 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500">İplik Türü:</span>
                  <span className="font-semibold">{spec.yarn}</span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-1">Stok Renk Skalası:</span>
                  <div className="flex items-center gap-1.5">
                    {spec.colors.map((c) => (
                      <span
                        key={c}
                        className="w-5 h-5 rounded-full border border-gray-300 shadow-inner"
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <span className="text-gray-500 block">Kalıp & Dikiş:</span>
                  <span className="text-gray-900 font-medium">{spec.features}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t bg-gray-50 p-2.5 rounded-lg border">
              <span className="text-[11px] text-gray-500 block font-semibold">
                Önerilen Baskı Teknolojisi:
              </span>
              <span className="text-xs font-bold text-[#D4AF37]">{spec.printSuitability}</span>
            </div>
          </Container>
        ))}
      </div>
    </div>
  )
}

export default PrintTshirtsPage
