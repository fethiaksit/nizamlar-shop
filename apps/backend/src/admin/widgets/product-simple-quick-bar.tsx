import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button } from "@medusajs/ui"
import { Tag, ArrowUpRightOnBox } from "@medusajs/icons"

const ProductSimpleQuickBar = () => {
  return (
    <Container className="p-0 mb-4 overflow-hidden border border-[#D1C9BE] bg-[#FFFFFF] shadow-sm rounded-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4 bg-gradient-to-r from-[#FAF8F5] to-[#FFFFFF]">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#222325] text-[#B29460] flex items-center justify-center shrink-0 shadow-sm">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#B29460]">
                Kullanıcı Dostu Mod
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#27AE60]" />
            </div>
            <Heading level="h2" className="text-base font-black text-[#222325]">
              Hızlı Ürün, Fiyat ve Stok Yönetimi
            </Heading>
            <p className="text-xs text-[#5A524C] font-medium mt-0.5">
              Karmaşık teknik detaylar olmadan ürün adı, fotoğraf, TRY fiyatı ve stok adedini tek ekranda güncelleyin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a href="/app/urunler">
            <Button
              size="base"
              className="bg-[#222325] hover:bg-[#49372E] text-[#FFFFFF] font-bold text-xs rounded-xl px-4 py-2 flex items-center gap-2 shadow-sm"
            >
              <span>Hızlı Yönetim Ekranını Aç</span>
              <ArrowUpRightOnBox className="w-4 h-4 text-[#B29460]" />
            </Button>
          </a>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default ProductSimpleQuickBar
