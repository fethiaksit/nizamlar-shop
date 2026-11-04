import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles, Eye, DocumentText } from "@medusajs/icons"
import { Container, Heading, Text, Badge, Button } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch } from "../../lib/client"

type CustomDesign = {
  id: string
  product_id: string
  original_file_name: string
  original_file_path: string
  file_type: string
  file_size: number
  color_name: string
  color_hex: string
  size: string
  view: string
  position_name: string
  status: string
  quantity: number
  created_at: string
}

const PrintDesignsPage = () => {
  const [designs, setDesigns] = useState<CustomDesign[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const loadDesigns = async () => {
    setLoading(true)
    const res = await adminFetch(`/admin/site-management/designs?status=${statusFilter}`)
    if (res.data) {
      setDesigns(res.data.designs || [])
      setTotalCount(res.data.totalCount || 0)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDesigns()
  }, [statusFilter])

  const formatFileSize = (bytes: number) => {
    if (!bytes) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      <Container className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge color="orange">ÖZEL BASKI ARŞİVİ</Badge>
              <span className="text-xs text-ui-fg-subtle">Müşteri Tasarım Siparişleri</span>
            </div>
            <Heading level="h1" className="text-2xl font-bold text-ui-fg-base mt-1">
              Özel Tasarım Kayıtları
            </Heading>
            <Text className="text-xs text-ui-fg-subtle mt-1">
              Storefront 3D özelleştiriciden kaydedilen müşteri baskı dosyaları, renk/beden seçimleri ve
              yüksek çözünürlüklü vektör/raster orijinal dosyalar.
            </Text>
          </div>

          <div className="flex items-center gap-2">
            <Badge color="blue" size="large">
              Toplam {totalCount} Tasarım
            </Badge>
          </div>
        </div>
      </Container>

      {/* Tasarım Kartları */}
      {loading ? (
        <Container className="p-12 text-center text-ui-fg-muted">Tasarımlar yükleniyor...</Container>
      ) : designs.length === 0 ? (
        <Container className="p-12 text-center text-ui-fg-muted">
          Henüz oluşturulmuş özel tasarım kaydı bulunmuyor.
        </Container>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {designs.map((des) => (
            <Container key={des.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-ui-border-base pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-ui-border-base shrink-0"
                      style={{ backgroundColor: des.color_hex || "#202020" }}
                    />
                    <Heading level="h3" className="text-xs font-bold text-ui-fg-base line-clamp-1">
                      {des.position_name || "Ön Göğüs Baskısı"}
                    </Heading>
                  </div>
                  <Badge color={des.status === "carted" ? "green" : "grey"} size="small">
                    {des.status || "taslak"}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-ui-fg-subtle bg-ui-bg-subtle/80 p-3 rounded-lg border border-ui-border-base mb-3">
                  <div className="flex justify-between">
                    <span className="text-ui-fg-subtle font-medium">Tasarım ID:</span>
                    <span className="font-mono text-ui-fg-base text-[11px]">{des.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ui-fg-subtle font-medium">Renk / Beden:</span>
                    <span className="font-semibold text-ui-fg-base">
                      {des.color_name || "Antrasit"} / {des.size || "L"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ui-fg-subtle font-medium">Yüzey:</span>
                    <span className="font-medium text-ui-fg-base">
                      {des.view === "front" ? "Ön Yüz" : "Sırt"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ui-fg-subtle font-medium">Orijinal Dosya:</span>
                    <span className="font-mono text-ui-fg-base text-[11px] truncate max-w-[150px]">
                      {des.original_file_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ui-fg-subtle font-medium">Boyut:</span>
                    <span className="text-ui-fg-base">{formatFileSize(des.file_size)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-ui-border-base flex items-center justify-between">
                <span className="text-xs text-ui-fg-subtle font-medium">
                  {new Date(des.created_at).toLocaleDateString("tr-TR")}
                </span>
                <a
                  href={`/admin/custom-designs/${des.id}/original`}
                  download
                  className="px-3 py-1.5 rounded-lg bg-[#222325] hover:bg-[#49372E] text-white dark:bg-ui-bg-component dark:hover:bg-ui-bg-field dark:text-ui-fg-base dark:border dark:border-ui-border-base font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>📥 Orijinal Dosyayı İndir</span>
                </a>
              </div>
            </Container>
          ))}
        </div>
      )}
    </div>
  )
}

export default PrintDesignsPage
