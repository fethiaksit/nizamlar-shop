import { Button, Heading } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = () => {
  return (
    <div className="relative w-full border-b border-[#2A2B2D] bg-[#141517] text-[#F8F8F5] py-20 px-6 small:py-32">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
        {/* Rozet */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#E5C158] text-xs font-medium tracking-wide uppercase">
          <span className="w-2 h-2 rounded-full bg-[#E5C158] animate-pulse" />
          Endüstriyel & Butik Tekstil Baskı Çözümleri
        </div>

        {/* Başlık */}
        <Heading
          level="h1"
          className="text-3xl small:text-5xl font-semibold tracking-tight text-[#F8F8F5] leading-tight max-w-3xl"
        >
          Nizamlar Baskı ile Fikrinizi{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB]">
            Kumaşa İşleyin
          </span>
        </Heading>

        {/* Açıklama */}
        <p className="text-base small:text-lg text-[#A0A2A6] max-w-2xl leading-relaxed">
          Oversize t-shirt, hoodie ve bez çantalarda hazır koleksiyonlar veya kendi tasarımınızı yükleyebileceğiniz yüksek kaliteli DTF ve serigrafi baskı siparişi verin.
        </p>

        {/* CTA Butonları */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
          <LocalizedClientLink href="/store">
            <Button className="bg-[#D4AF37] hover:bg-[#C49F27] text-[#141517] font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
              Koleksiyonu Keşfet
            </Button>
          </LocalizedClientLink>
          
          <LocalizedClientLink href="/products/ozel-baskili-kapusonlu-sweatshirt-hoodie">
            <Button variant="secondary" className="border-[#383A3E] bg-[#1E2023] hover:bg-[#282A2E] text-[#F8F8F5] px-6 py-3 rounded-lg transition-all">
              🎨 Özel Tasarım Baskı Siparişi
            </Button>
          </LocalizedClientLink>
        </div>

        {/* Güven ve Özellik Rozetleri */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full pt-10 border-t border-[#26282B] text-xs text-[#8E9094]">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#D4AF37]">✦</span>
            <span>%100 Penye & Pamuk Kumaş</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#D4AF37]">✦</span>
            <span>Yüksek Çözünürlüklü DTF & Serigrafi</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#D4AF37]">✦</span>
            <span>ERP Entegre Üretim Takibi</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#D4AF37]">✦</span>
            <span>Hızlı & Güvenli Teslimat</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Hero
