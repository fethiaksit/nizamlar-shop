import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles, Trash, Plus, PencilSquareSolid, SquaresPlus } from "@medusajs/icons"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Switch,
  Badge,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch } from "../../lib/client"

type RackGarment = {
  id: string
  product_id: string
  product_handle: string
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
  is_published: boolean
}

type AvailableProduct = {
  id: string
  title: string
  handle: string
  thumbnail?: string
}

const SiteRackPage = () => {
  const [garments, setGarments] = useState<RackGarment[]>([])
  const [products, setProducts] = useState<AvailableProduct[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedGarment, setSelectedGarment] = useState<RackGarment | null>(null)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)
  const [publishing, setPublishing] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadData = async (preferredId?: string) => {
    setLoading(true)
    const res = await adminFetch("/admin/site-management/garments")
    if (res.data) {
      const freshGarments: RackGarment[] = res.data.garments || []
      const freshProducts: AvailableProduct[] = res.data.availableProducts || []
      setGarments(freshGarments)
      setProducts(freshProducts)

      if (preferredId) {
        const match = freshGarments.find((g) => g.id === preferredId)
        setSelectedGarment(match || freshGarments[0] || null)
      } else {
        setSelectedGarment((prev) => {
          if (!prev) return freshGarments[0] || null
          const match = freshGarments.find((g) => g.id === prev.id)
          return match || freshGarments[0] || null
        })
      }
    } else if (res.error) {
      setFeedback({ type: "error", text: res.error })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveGarment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGarment) return

    if (!selectedGarment.product_id || selectedGarment.product_id.trim() === "") {
      setFeedback({
        type: "error",
        text: "Lütfen askılık modeli için geçerli bir Medusa katalog ürünü seçin.",
      })
      return
    }

    setSaving(true)
    setFeedback(null)

    const endpoint = isCreating
      ? "/admin/site-management/garments"
      : `/admin/site-management/garments/${selectedGarment.id}`

    const method = isCreating ? "POST" : "PUT"

    const payload = {
      ...selectedGarment,
      productId: selectedGarment.product_id,
      productHandle: selectedGarment.product_handle,
      garmentKind: selectedGarment.garment_kind,
      showNizamlarLogo: selectedGarment.show_nizamlar_logo,
      logoScale: Number(selectedGarment.logo_scale),
      logoPosX: Number(selectedGarment.logo_pos_x),
      logoPosY: Number(selectedGarment.logo_pos_y),
      logoStyle: selectedGarment.logo_style,
      model3dFile: selectedGarment.model_3d_file,
      isActive: selectedGarment.is_active,
      isPublished: selectedGarment.is_published,
      rank: Number(selectedGarment.rank),
    }

    const res = await adminFetch(endpoint, {
      method,
      body: JSON.stringify(payload),
    })

    if (res.error) {
      setFeedback({ type: "error", text: res.error })
    } else {
      const savedGarment = res.data?.garment
      const isPub = savedGarment?.is_published ?? selectedGarment.is_published
      const name = savedGarment?.name || selectedGarment.name

      setFeedback({
        type: "success",
        text: isCreating
          ? (isPub
              ? `"${name}" askılık modeli başarıyla eklendi ve mağazada yayına alındı.`
              : `"${name}" askılık modeli taslak olarak kaydedildi. Mağazada göstermek için yayına alın.`)
          : (isPub
              ? `"${name}" askılık modeli başarıyla güncellendi ve mağazada yayında.`
              : `"${name}" askılık modeli güncellendi (Taslak modunda).`),
      })
      setIsEditing(false)
      setIsCreating(false)
      await loadData(savedGarment?.id || selectedGarment.id)
    }
    setSaving(false)
  }

  const handleDeleteGarment = async (id: string) => {
    if (!confirm("Bu askılık ürününü silmek istediğinizden emin misiniz?")) return
    const res = await adminFetch(`/admin/site-management/garments/${id}`, {
      method: "DELETE",
    })
    if (res.error) {
      setFeedback({ type: "error", text: `Silme hatası: ${res.error}` })
    } else {
      setFeedback({ type: "success", text: "Askılık ürünü silindi." })
      setSelectedGarment(null)
      await loadData()
    }
  }

  const handleCreateNew = () => {
    if (products.length === 0) {
      setFeedback({
        type: "error",
        text: "Katalogda askılıkla eşleştirilebilecek ürün bulunamadı. Lütfen önce bir ürün ekleyin.",
      })
      return
    }

    const firstProd = products[0]
    const newGarment: RackGarment = {
      id: `rack-${Date.now()}`,
      product_id: firstProd.id,
      product_handle: firstProd.handle,
      name: firstProd.title,
      garment_kind: "tee",
      colour: "#232528",
      show_nizamlar_logo: true,
      logo_scale: 0.22,
      logo_pos_x: 0.35,
      logo_pos_y: 0.58,
      logo_style: "screenprint",
      model_3d_file: "/models/nizamlar-tee.glb",
      rank: garments.length,
      is_active: true,
      is_published: true, // Mağazada hemen gösterilsin
    }

    setFeedback(null)
    setSelectedGarment(newGarment)
    setIsCreating(true)
    setIsEditing(true)
  }

  const handlePublishAll = async () => {
    setPublishing(true)
    setFeedback(null)
    const res = await adminFetch("/admin/site-management/publish", { method: "POST" })
    if (res.error) {
      setFeedback({ type: "error", text: `Yayınlama hatası: ${res.error}` })
    } else {
      setFeedback({
        type: "success",
        text: "Tüm askılık modelleri ve vitrin içerikleri mağazada başarıyla canlıya yayınlandı!",
      })
      await loadData(selectedGarment?.id)
    }
    setPublishing(false)
  }

  const handleProductSelect = (productId: string) => {
    const found = products.find((p) => p.id === productId)
    if (found && selectedGarment) {
      setSelectedGarment({
        ...selectedGarment,
        product_id: found.id,
        product_handle: found.handle,
        name: found.title,
      })
    }
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      <Container className="p-6 bg-ui-bg-base border border-ui-border-base shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#B29460]/20 text-[#B29460] dark:text-[#F3EFE7] border border-[#B29460]/40 font-bold">
                DIMAAC CLOTHES RACK
              </Badge>
              <span className="text-xs font-medium text-ui-fg-subtle">
                3D İnteraktif Kıyafet Askılığı
              </span>
            </div>
            <Heading level="h1" className="text-2xl font-bold text-ui-fg-base mt-1.5">
              Dimaac Ürün Vitrini Yönetimi
            </Heading>
            <Text className="text-xs text-ui-fg-subtle mt-1 leading-relaxed">
              Askılıkta sergilenen ürünleri Medusa kataloğundan seçin, kumaş türünü (Tişört,
              Sweatshirt, Kazak), logo baskı konumu ve ölçeğini ayarlayın.
            </Text>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="base"
              disabled={publishing}
              onClick={handlePublishAll}
              className="bg-ui-bg-component hover:bg-ui-bg-subtle text-ui-fg-base font-bold border border-ui-border-base cursor-pointer shadow-xs"
            >
              {publishing ? "Yayınlanıyor..." : "🚀 Tüm Askılığı Canlıya Yayınla"}
            </Button>
            <Button
              variant="secondary"
              size="base"
              onClick={handleCreateNew}
              className="bg-[#B29460] hover:bg-[#9E8250] text-[#222325] font-bold border border-[#9E8250] cursor-pointer shadow-xs"
            >
              <Plus /> Yeni Model Ekle
            </Button>
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-red-50 text-red-900 border border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </Container>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Kolon: Askılık Ürün Listesi */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <Container className="p-4 bg-ui-bg-base border border-ui-border-base shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-ui-border-base pb-2">
              <Text className="text-xs font-bold text-ui-fg-base uppercase tracking-wide">
                Askılıktaki Modeller ({garments.length})
              </Text>
              <Text className="text-[11px] font-semibold text-ui-fg-muted">Ray Sırası</Text>
            </div>

            {loading ? (
              <p className="text-xs text-ui-fg-muted py-4 text-center font-medium">Modeller yükleniyor...</p>
            ) : (
              <div className="flex flex-col gap-2">
                {garments.map((g, idx) => (
                  <div
                    key={g.id}
                    onClick={() => {
                      setSelectedGarment(g)
                      setIsCreating(false)
                      setIsEditing(false)
                    }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      selectedGarment?.id === g.id
                        ? "border-2 border-[#B29460] bg-[#B29460]/10 shadow-xs"
                        : "border-ui-border-base hover:border-[#B29460]/70 bg-ui-bg-base"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full border border-ui-border-base shrink-0 shadow-inner"
                        style={{ backgroundColor: g.colour }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-ui-fg-base line-clamp-1">
                          {idx + 1}. {g.name}
                        </span>
                        <span className="text-[11px] font-semibold text-ui-fg-subtle uppercase">
                          Tür: {g.garment_kind} · Logo: {g.logo_style}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        size="small"
                        className={`font-bold ${
                          g.is_published
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        }`}
                      >
                        {g.is_published ? "Yayında" : "Taslak"}
                      </Badge>
                      <Badge size="small" className="bg-ui-bg-subtle text-ui-fg-subtle border border-ui-border-base font-semibold">
                        {g.garment_kind}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Container>
        </div>

        {/* Sağ Kolon: Model Detay ve Düzenleme Formu */}
        <div className="lg:col-span-8">
          {selectedGarment ? (
            <Container className="p-6 bg-ui-bg-base border border-ui-border-base shadow-xs">
              <div className="flex items-center justify-between border-b border-ui-border-base pb-4 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Heading level="h2" className="text-base font-bold text-ui-fg-base">
                      {isCreating ? "Yeni Askılık Modeli" : `Model: ${selectedGarment.name}`}
                    </Heading>
                    <Badge
                      size="small"
                      className={`font-bold ${
                        selectedGarment.is_published
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {selectedGarment.is_published ? "● Mağazada Yayında" : "○ Taslak (Mağazada Gizli)"}
                    </Badge>
                  </div>
                  <Text className="text-xs text-ui-fg-subtle mt-0.5">
                    ID: <code className="font-mono text-ui-fg-base bg-ui-bg-subtle px-1.5 py-0.5 rounded border border-ui-border-base font-semibold">{selectedGarment.id}</code>
                  </Text>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => setIsEditing(true)}
                      className="border-[#B29460] text-ui-fg-base hover:bg-ui-bg-subtle font-bold cursor-pointer"
                    >
                      <PencilSquareSolid /> Düzenle
                    </Button>
                  )}
                  {!isCreating && (
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDeleteGarment(selectedGarment.id)}
                      className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-bold cursor-pointer"
                    >
                      <Trash /> Sil
                    </Button>
                  )}
                </div>
              </div>

              {!selectedGarment.is_published && !isEditing && (
                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <span className="text-base leading-none">⚠️</span>
                  <div>
                    <span className="font-bold block">Bu model şu anda Taslak durumundadır ve mağaza vitrininde ziyaretçilere gösterilmez.</span>
                    <span>Ziyaretçilere göstermek için <strong>Düzenle</strong> butonuna tıklayıp <strong>Mağaza Yayın Durumu</strong> anahtarını açın ve kaydedin; veya üstteki <strong>Tüm Askılığı Canlıya Yayınla</strong> butonuna tıklayın.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveGarment} className="flex flex-col gap-4 text-xs">
                {/* Medusa Ürün Eşleme */}
                <div className="p-3.5 bg-ui-bg-subtle/80 rounded-lg border border-[#B29460]/40">
                  <Label className="text-xs font-bold text-ui-fg-base">
                    Medusa Ürün Bağlantısı *
                  </Label>
                  <Text className="text-xs text-ui-fg-subtle mb-2 font-medium">
                    Bu 3D model tıklandığında açılacak Medusa katalog ürünü:
                  </Text>
                  {products.length === 0 ? (
                    <div className="p-2.5 rounded-md border border-red-300 bg-red-50 text-red-800 text-xs font-semibold">
                      Katalogda kayıtlı ürün bulunamadı. Lütfen önce ürün oluşturun.
                    </div>
                  ) : (
                    <select
                      disabled={!isEditing}
                      value={selectedGarment.product_id}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-md border border-ui-border-base bg-ui-bg-field text-ui-fg-base text-xs font-bold focus:border-[#B29460] focus:outline-none disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id} className="text-ui-fg-base">
                          {p.title} ({p.handle})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-ui-fg-base">Görünen Ad</Label>
                    <Input
                      disabled={!isEditing}
                      value={selectedGarment.name}
                      onChange={(e) =>
                        setSelectedGarment({ ...selectedGarment, name: e.target.value })
                      }
                      className="mt-1 font-bold border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460] disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-ui-fg-base">Kıyafet Tipi</Label>
                    <select
                      disabled={!isEditing}
                      value={selectedGarment.garment_kind}
                      onChange={(e) =>
                        setSelectedGarment({
                          ...selectedGarment,
                          garment_kind: e.target.value as any,
                        })
                      }
                      className="mt-1 w-full px-2.5 py-2 rounded-md border border-ui-border-base bg-ui-bg-field text-ui-fg-base text-xs font-bold focus:border-[#B29460] focus:outline-none disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled"
                    >
                      <option value="tee">Tişört (Tee)</option>
                      <option value="crewneck">Sweatshirt (Crewneck / Hoodie)</option>
                      <option value="sweater">Kazak (Örgü Doku Sweater)</option>
                      <option value="shirt">Gömlek / Bez Çanta (Shirt)</option>
                    </select>
                  </div>
                </div>

                {/* Kumaş Rengi ve Logo Ayarları */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base">
                  <div>
                    <Label className="text-xs font-bold text-ui-fg-base">Kumaş Rengi (Hex)</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        disabled={!isEditing}
                        value={selectedGarment.colour}
                        onChange={(e) =>
                          setSelectedGarment({ ...selectedGarment, colour: e.target.value })
                        }
                        className="w-8 h-8 rounded border border-ui-border-base cursor-pointer"
                      />
                      <Input
                        disabled={!isEditing}
                        value={selectedGarment.colour}
                        onChange={(e) =>
                          setSelectedGarment({ ...selectedGarment, colour: e.target.value })
                        }
                        className="font-mono uppercase border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460] disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-ui-fg-base">
                      Nizamlar Logosu Gösterilsin
                    </Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Switch
                        checked={selectedGarment.show_nizamlar_logo}
                        disabled={!isEditing}
                        onCheckedChange={(val) =>
                          setSelectedGarment({ ...selectedGarment, show_nizamlar_logo: val })
                        }
                      />
                      <span className="text-xs font-semibold text-ui-fg-base">
                        {selectedGarment.show_nizamlar_logo
                          ? "Logo Kıyafet Üzerinde Aktif"
                          : "Logosuz Düz Kumaş"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logo Yerleşim ve Ölçek Koordinatları */}
                <div className="p-3.5 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base flex flex-col gap-3">
                  <Text className="text-xs font-bold text-ui-fg-base">
                    Logo Konumu ve Baskı Tekniği
                  </Text>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-[11px] font-bold text-ui-fg-subtle">Ölçek (Scale)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        disabled={!isEditing}
                        value={selectedGarment.logo_scale}
                        onChange={(e) =>
                          setSelectedGarment({
                            ...selectedGarment,
                            logo_scale: parseFloat(e.target.value) || 0.22,
                          })
                        }
                        className="mt-0.5 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460] disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold text-ui-fg-subtle">Yatay Konum (X)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        disabled={!isEditing}
                        value={selectedGarment.logo_pos_x}
                        onChange={(e) =>
                          setSelectedGarment({
                            ...selectedGarment,
                            logo_pos_x: parseFloat(e.target.value) || 0.35,
                          })
                        }
                        className="mt-0.5 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460] disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold text-ui-fg-subtle">Dikey Konum (Y)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        disabled={!isEditing}
                        value={selectedGarment.logo_pos_y}
                        onChange={(e) =>
                          setSelectedGarment({
                            ...selectedGarment,
                            logo_pos_y: parseFloat(e.target.value) || 0.58,
                          })
                        }
                        className="mt-0.5 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460] disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold text-ui-fg-subtle">Baskı Türü</Label>
                      <select
                        disabled={!isEditing}
                        value={selectedGarment.logo_style}
                        onChange={(e) =>
                          setSelectedGarment({
                            ...selectedGarment,
                            logo_style: e.target.value,
                          })
                        }
                        className="mt-0.5 w-full px-2 py-1.5 rounded border border-ui-border-base bg-ui-bg-field text-ui-fg-base text-xs font-bold focus:border-[#B29460] focus:outline-none disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled"
                      >
                        <option value="screenprint">Serigrafi / DTF</option>
                        <option value="puff">Kabartma (Puff Print)</option>
                        <option value="embroidery">Nakış (Embroidery)</option>
                        <option value="script">Kaligrafi Yazı</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3D Model Dosyası */}
                <div>
                  <Label className="text-xs font-bold text-ui-fg-base">
                    3D Mesh Modeli (.glb)
                  </Label>
                  <Input
                    disabled={!isEditing}
                    value={selectedGarment.model_3d_file}
                    onChange={(e) =>
                      setSelectedGarment({ ...selectedGarment, model_3d_file: e.target.value })
                    }
                    className="mt-1 font-mono border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460] disabled:bg-ui-bg-disabled disabled:text-ui-fg-disabled"
                  />
                </div>

                {/* Yayın ve Görünürlük Durumu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base">
                  <div>
                    <Label className="text-xs font-bold text-ui-fg-base">
                      Mağaza Yayın Durumu
                    </Label>
                    <Text className="text-[11px] text-ui-fg-subtle mb-1.5 font-medium">
                      Açık olduğunda Storefront 3D askılığında anında görüntülenir.
                    </Text>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedGarment.is_published}
                        disabled={!isEditing}
                        onCheckedChange={(val) =>
                          setSelectedGarment({ ...selectedGarment, is_published: val })
                        }
                      />
                      <span className={`text-xs font-bold ${selectedGarment.is_published ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                        {selectedGarment.is_published ? "Yayında (Canlı)" : "Taslak (Gizli)"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-ui-fg-base">
                      Askılık Aktiflik Durumu
                    </Label>
                    <Text className="text-[11px] text-ui-fg-subtle mb-1.5 font-medium">
                      Modelin askılık rayında aktif olarak sıralanmasını belirler.
                    </Text>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedGarment.is_active}
                        disabled={!isEditing}
                        onCheckedChange={(val) =>
                          setSelectedGarment({ ...selectedGarment, is_active: val })
                        }
                      />
                      <span className="text-xs font-semibold text-ui-fg-base">
                        {selectedGarment.is_active ? "Askılıkta Aktif" : "Pasif"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kaydet Butonları */}
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
                      className="border border-ui-border-base text-ui-fg-subtle hover:bg-ui-bg-subtle font-bold cursor-pointer"
                    >
                      İptal
                    </Button>
                    <Button
                      variant="primary"
                      size="base"
                      type="submit"
                      disabled={saving}
                      className="bg-[#B29460] hover:bg-[#9E8250] text-[#222325] font-extrabold px-6 border border-[#9E8250] shadow-sm cursor-pointer"
                    >
                      {saving ? "Kaydediliyor..." : "💾 Modeli Kaydet"}
                    </Button>
                  </div>
                )}
              </form>
            </Container>
          ) : (
            <Container className="p-8 text-center text-ui-fg-muted bg-ui-bg-base border border-ui-border-base font-medium">
              Düzenlemek için soldaki askılık modellerinden birini seçin veya yeni model ekleyin.
            </Container>
          )}
        </div>
      </div>
    </div>
  )
}

export default SiteRackPage
