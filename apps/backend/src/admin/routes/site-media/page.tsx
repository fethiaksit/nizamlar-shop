import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Folder, Trash, Plus, Photo, CubeSolid, DocumentText } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Badge,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch } from "../../lib/client"

type MediaItem = {
  id: string
  title: string
  file_name: string
  file_url: string
  file_type: "image" | "3d_model" | "texture" | "logo" | "document"
  mime_type: string
  file_size: number
  category: "product" | "slider" | "logo" | "model3d" | "fabric" | "other"
  created_at: string
}

const SiteMediaPage = () => {
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false)
  const [newTitle, setNewTitle] = useState<string>("")
  const [newCategory, setNewCategory] = useState<string>("product")
  const [newFileUrl, setNewFileUrl] = useState<string>("")
  const [newFileType, setNewFileType] = useState<string>("image")
  const [uploading, setUploading] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadMedia = async () => {
    setLoading(true)
    let url = `/admin/site-management/media?category=${categoryFilter}`
    if (searchQuery.trim()) {
      url += `&q=${encodeURIComponent(searchQuery.trim())}`
    }
    const res = await adminFetch(url)
    if (res.data?.media) {
      setMediaList(res.data.media)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadMedia()
  }, [categoryFilter, searchQuery])

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Bu medya dosyasını kütüphaneden kaldırmak istediğinize emin misiniz?")) return
    const res = await adminFetch(`/admin/site-management/media/${id}`, {
      method: "DELETE",
    })
    if (res.error) {
      alert(`Hata: ${res.error}`)
    } else {
      setFeedback({ type: "success", text: "Medya dosyası başarıyla silindi." })
      await loadMedia()
    }
  }

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newFileUrl) {
      alert("Lütfen başlık ve dosya yolunu girin.")
      return
    }

    setUploading(true)
    const res = await adminFetch("/admin/site-management/media", {
      method: "POST",
      body: JSON.stringify({
        title: newTitle,
        fileUrl: newFileUrl,
        fileType: newFileType,
        category: newCategory,
      }),
    })

    if (res.error) {
      setFeedback({ type: "error", text: res.error })
    } else {
      setFeedback({ type: "success", text: "Yeni dosya medya kütüphanesine eklendi." })
      setShowUploadModal(false)
      setNewTitle("")
      setNewFileUrl("")
      await loadMedia()
    }
    setUploading(false)
  }

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
              <Badge color="orange">MERKEZİ MEDYA</Badge>
              <span className="text-xs text-ui-fg-muted font-medium">Görseller, 3D Modeller & Dokular</span>
            </div>
            <Heading level="h1" className="text-2xl font-bold text-ui-fg-base mt-1">
              Medya Kütüphanesi
            </Heading>
            <Text className="text-xs text-ui-fg-subtle mt-1 leading-relaxed">
              Tüm ürün görselleri, slider arka planları, kurumsal logolar ve 3D GLB modelleri.
              (Müşterilerin özel sipariş tasarımları bu genel kütüphanede gösterilmez).
            </Text>
          </div>

          <Button variant="secondary" size="base" onClick={() => setShowUploadModal(true)}>
            <Plus /> Yeni Medya Ekle
          </Button>
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

      {/* Filtre ve Arama Barı */}
      <Container className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {["all", "slider", "product", "logo", "model3d", "fabric"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                categoryFilter === cat
                  ? "bg-[#B29460] text-[#222325] shadow-xs"
                  : "bg-ui-bg-subtle text-ui-fg-subtle hover:bg-ui-bg-component hover:text-ui-fg-base border border-ui-border-base"
              }`}
            >
              {cat === "all"
                ? "Tümü"
                : cat === "slider"
                  ? "Slider"
                  : cat === "product"
                    ? "Ürünler"
                    : cat === "logo"
                      ? "Logolar"
                      : cat === "model3d"
                        ? "3D Modeller"
                        : "Kumaş Dokuları"}
            </button>
          ))}
        </div>

        <Input
          placeholder="Dosya adı veya başlıkla ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 text-xs border-ui-border-base bg-ui-bg-field text-ui-fg-base placeholder:text-ui-fg-muted focus:border-[#B29460]"
        />
      </Container>

      {/* Yükleme Modalı */}
      {showUploadModal && (
        <Container className="p-6 border-2 border-[#B29460] bg-amber-50/20 dark:bg-amber-950/20">
          <Heading level="h2" className="text-base font-bold text-ui-fg-base border-b border-ui-border-base pb-2 mb-4">
            Yeni Medya Dosyası Kaydet
          </Heading>
          <form onSubmit={handleAddMedia} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <Label className="text-xs font-semibold text-ui-fg-base">Medya Başlığı</Label>
              <Input
                placeholder="Örn: 2026 Yeni Sezon Tişört Görseli"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base placeholder:text-ui-fg-muted focus:border-[#B29460]"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-ui-fg-base">Kategori</Label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-ui-border-base bg-ui-bg-field text-ui-fg-base text-xs font-semibold focus:outline-none focus:border-[#B29460] focus:ring-1 focus:ring-[#B29460]"
              >
                <option value="slider">Slider Arka Planı</option>
                <option value="product">Ürün Fotoğrafı</option>
                <option value="logo">Amblem & Logo</option>
                <option value="model3d">3D GLB/GLTF Modeli</option>
                <option value="fabric">Kumaş Dokusu (Texture)</option>
                <option value="other">Diğer</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-ui-fg-base">Dosya Türü</Label>
              <select
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value)}
                className="mt-1 w-full px-2.5 py-1.5 rounded-md border border-ui-border-base bg-ui-bg-field text-ui-fg-base text-xs font-semibold focus:outline-none focus:border-[#B29460] focus:ring-1 focus:ring-[#B29460]"
              >
                <option value="image">Görsel (WebP, PNG, JPG)</option>
                <option value="3d_model">3D Model (.glb, .gltf)</option>
                <option value="logo">Logo (.svg, .png)</option>
                <option value="texture">Texture Dokusu (.png, .jpg)</option>
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-ui-fg-base">Dosya URL / Yolu</Label>
              <Input
                placeholder="Örn: /hero/slide-1-tee.webp veya /models/nizamlar-tee.glb"
                value={newFileUrl}
                onChange={(e) => setNewFileUrl(e.target.value)}
                className="mt-1 font-mono border-ui-border-base bg-ui-bg-field text-ui-fg-base placeholder:text-ui-fg-muted focus:border-[#B29460]"
              />
            </div>

            <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-ui-border-base">
              <Button
                variant="secondary"
                size="base"
                type="button"
                onClick={() => setShowUploadModal(false)}
              >
                İptal
              </Button>
              <Button
                variant="primary"
                size="base"
                type="submit"
                disabled={uploading}
                className="bg-[#B29460] hover:bg-[#9E8250] text-[#222325] font-bold"
              >
                {uploading ? "Kaydediliyor..." : "Dosyayı Kaydet"}
              </Button>
            </div>
          </form>
        </Container>
      )}

      {/* Medya Grid */}
      {loading ? (
        <Container className="p-12 text-center text-ui-fg-muted">Medya dosyaları yükleniyor...</Container>
      ) : mediaList.length === 0 ? (
        <Container className="p-12 text-center text-ui-fg-muted">
          Bu kategoride medya dosyası bulunamadı.
        </Container>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaList.map((m) => (
            <Container key={m.id} className="p-4 flex flex-col justify-between overflow-hidden group">
              <div className="w-full h-40 rounded-lg bg-ui-bg-subtle border border-ui-border-base overflow-hidden flex items-center justify-center relative mb-3">
                {m.file_type === "3d_model" ? (
                  <div className="flex flex-col items-center justify-center text-indigo-600 gap-2">
                    <CubeSolid className="w-10 h-10" />
                    <span className="text-[11px] font-bold">3D GLB Modeli</span>
                  </div>
                ) : m.file_url.endsWith(".svg") ? (
                  <img
                    src={m.file_url}
                    alt={m.title}
                    className="max-h-28 max-w-full object-contain p-2"
                  />
                ) : (
                  <img
                    src={m.file_url}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      ;(e.target as HTMLElement).style.display = "none"
                    }}
                  />
                )}
                <Badge
                  size="small"
                  color="orange"
                  className="absolute top-2 right-2 text-[10px] uppercase font-bold"
                >
                  {m.category}
                </Badge>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-ui-fg-base line-clamp-1">{m.title}</span>
                <span className="text-[11px] font-mono text-ui-fg-subtle line-clamp-1">
                  {m.file_name}
                </span>
                <span className="text-[11px] text-ui-fg-subtle font-medium">
                  {formatFileSize(m.file_size)} · {new Date(m.created_at).toLocaleDateString("tr-TR")}
                </span>
              </div>

              <div className="pt-3 mt-3 border-t border-ui-border-base flex items-center justify-between">
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#B29460] hover:underline font-bold"
                >
                  Görüntüle ↗
                </a>
                <button
                  type="button"
                  onClick={() => handleDeleteMedia(m.id)}
                  className="text-ui-fg-muted hover:text-rose-600 transition-colors"
                  title="Sil"
                >
                  <Trash />
                </button>
              </div>
            </Container>
          ))}
        </div>
      )}
    </div>
  )
}

export default SiteMediaPage
