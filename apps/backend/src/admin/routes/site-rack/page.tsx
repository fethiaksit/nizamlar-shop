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
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadData = async () => {
    setLoading(true)
    const res = await adminFetch("/admin/site-management/garments")
    if (res.data) {
      setGarments(res.data.garments || [])
      setProducts(res.data.availableProducts || [])
      if (res.data.garments?.length > 0 && !selectedGarment) {
        setSelectedGarment(res.data.garments[0])
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSaveGarment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGarment) return
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
      setFeedback({
        type: "success",
        text: isCreating
          ? "Yeni askılık ürünü başarıyla eklendi."
          : "Askılık ürünü düzenlemesi başarıyla kaydedildi.",
      })
      setIsEditing(false)
      setIsCreating(false)
      await loadData()
    }
    setSaving(false)
  }

  const handleDeleteGarment = async (id: string) => {
    if (!confirm("Bu askılık ürününü silmek istediğinizden emin misiniz?")) return
    const res = await adminFetch(`/admin/site-management/garments/${id}`, {
      method: "DELETE",
    })
    if (res.error) {
      alert(`Hata: ${res.error}`)
    } else {
      setFeedback({ type: "success", text: "Askılık ürünü silindi." })
      setSelectedGarment(null)
      await loadData()
    }
  }

  const handleCreateNew = () => {
    const firstProd = products[0]
    const newGarment: RackGarment = {
      id: `rack-${Date.now()}`,
      product_id: firstProd?.id || "",
      product_handle: firstProd?.handle || "",
      name: firstProd?.title || "Yeni Tekstil Ürünü",
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
      is_published: false,
    }
    setSelectedGarment(newGarment)
    setIsCreating(true)
    setIsEditing(true)
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
      <Container className="p-6 bg-white border border-[#E5E0D8] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-[#B29460]/20 text-[#222325] border border-[#B29460]/40 font-bold">
                DIMAAC CLOTHES RACK
              </Badge>
              <span className="text-xs font-medium text-[#49372E]/80">
                3D İnteraktif Kıyafet Askılığı
              </span>
            </div>
            <Heading level="h1" className="text-2xl font-bold text-[#222325] mt-1.5">
              Dimaac Ürün Vitrini Yönetimi
            </Heading>
            <Text className="text-xs text-[#49372E] mt-1 leading-relaxed">
              Askılıkta sergilenen ürünleri Medusa kataloğundan seçin, kumaş türünü (Tişört,
              Sweatshirt, Kazak), logo baskı konumu ve ölçeğini ayarlayın.
            </Text>
          </div>

          <Button
            variant="secondary"
            size="base"
            onClick={handleCreateNew}
            className="bg-[#B29460] hover:bg-[#9d814f] text-[#222325] font-bold border border-[#9d814f] cursor-pointer shadow-xs"
          >
            <Plus /> Yeni Model Ekle
          </Button>
        </div>

        {feedback && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
                : "bg-red-50 text-red-900 border border-red-300"
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
          <Container className="p-4 bg-white border border-[#E5E0D8] shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-[#E5E0D8] pb-2">
              <Text className="text-xs font-bold text-[#222325] uppercase tracking-wide">
                Askılıktaki Modeller ({garments.length})
              </Text>
              <Text className="text-[11px] font-semibold text-[#49372E]">Ray Sırası</Text>
            </div>

            {loading ? (
              <p className="text-xs text-[#49372E] py-4 text-center font-medium">Modeller yükleniyor...</p>
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
                        ? "border-2 border-[#B29460] bg-[#FAF8F5] shadow-sm"
                        : "border-[#E5E0D8] hover:border-[#B29460]/70 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full border border-[#D8D3CA] shrink-0 shadow-inner"
                        style={{ backgroundColor: g.colour }}
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#222325] line-clamp-1">
                          {idx + 1}. {g.name}
                        </span>
                        <span className="text-[11px] font-semibold text-[#49372E] uppercase">
                          Tür: {g.garment_kind} · Logo: {g.logo_style}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          g.is_active ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      <Badge size="small" className="bg-[#F3EFE7] text-[#222325] border border-[#D8D3CA] font-bold">
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
            <Container className="p-6 bg-white border border-[#E5E0D8] shadow-xs">
              <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-4 mb-5">
                <div>
                  <Heading level="h2" className="text-base font-bold text-[#222325]">
                    {isCreating ? "Yeni Askılık Modeli" : `Model: ${selectedGarment.name}`}
                  </Heading>
                  <Text className="text-xs text-[#49372E] mt-0.5">
                    ID: <code className="font-mono text-[#222325] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#D8D3CA] font-semibold">{selectedGarment.id}</code>
                  </Text>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => setIsEditing(true)}
                      className="border-[#B29460] text-[#222325] hover:bg-[#FAF8F5] font-bold cursor-pointer"
                    >
                      <PencilSquareSolid /> Düzenle
                    </Button>
                  )}
                  {!isCreating && (
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => handleDeleteGarment(selectedGarment.id)}
                      className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold cursor-pointer"
                    >
                      <Trash /> Sil
                    </Button>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveGarment} className="flex flex-col gap-4 text-xs">
                {/* Medusa Ürün Eşleme */}
                <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#B29460]/40">
                  <Label className="text-xs font-bold text-[#222325]">
                    Medusa Ürün Bağlantısı
                  </Label>
                  <Text className="text-xs text-[#49372E] mb-2 font-medium">
                    Bu 3D model tıklandığında açılacak Medusa katalog ürünü:
                  </Text>
                  <select
                    disabled={!isEditing}
                    value={selectedGarment.product_id}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-md border border-[#D8D3CA] bg-white text-[#222325] text-xs font-bold focus:border-[#B29460] focus:outline-none disabled:bg-[#F3EFE7]/60 disabled:text-[#49372E]"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id} className="text-[#222325]">
                        {p.title} ({p.handle})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-[#222325]">Görünen Ad</Label>
                    <Input
                      disabled={!isEditing}
                      value={selectedGarment.name}
                      onChange={(e) =>
                        setSelectedGarment({ ...selectedGarment, name: e.target.value })
                      }
                      className="mt-1 font-bold bg-white text-[#222325] border-[#D8D3CA] focus:border-[#B29460] disabled:bg-[#F3EFE7]/60 disabled:text-[#49372E]"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-[#222325]">Kıyafet Tipi</Label>
                    <select
                      disabled={!isEditing}
                      value={selectedGarment.garment_kind}
                      onChange={(e) =>
                        setSelectedGarment({
                          ...selectedGarment,
                          garment_kind: e.target.value as any,
                        })
                      }
                      className="mt-1 w-full px-2.5 py-2 rounded-md border border-[#D8D3CA] bg-white text-[#222325] text-xs font-bold focus:border-[#B29460] focus:outline-none disabled:bg-[#F3EFE7]/60 disabled:text-[#49372E]"
                    >
                      <option value="tee">Tişört (Tee)</option>
                      <option value="crewneck">Sweatshirt (Crewneck / Hoodie)</option>
                      <option value="sweater">Kazak (Örgü Doku Sweater)</option>
                      <option value="shirt">Gömlek / Bez Çanta (Shirt)</option>
                    </select>
                  </div>
                </div>

                {/* Kumaş Rengi ve Logo Ayarları */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-[#FAF8F5] rounded-lg border border-[#E5E0D8]">
                  <div>
                    <Label className="text-xs font-bold text-[#222325]">Kumaş Rengi (Hex)</Label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        disabled={!isEditing}
                        value={selectedGarment.colour}
                        onChange={(e) =>
                          setSelectedGarment({ ...selectedGarment, colour: e.target.value })
                        }
                        className="w-8 h-8 rounded border border-[#D8D3CA] cursor-pointer"
                      />
                      <Input
                        disabled={!isEditing}
                        value={selectedGarment.colour}
                        onChange={(e) =>
                          setSelectedGarment({ ...selectedGarment, colour: e.target.value })
                        }
                        className="font-mono uppercase bg-white text-[#222325] border-[#D8D3CA] focus:border-[#B29460] disabled:bg-[#F3EFE7]/60 disabled:text-[#49372E]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-[#222325]">
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
                      <span className="text-xs font-semibold text-[#222325]">
                        {selectedGarment.show_nizamlar_logo
                          ? "Logo Kıyafet Üzerinde Aktif"
                          : "Logosuz Düz Kumaş"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Logo Yerleşim ve Ölçek Koordinatları */}
                <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#E5E0D8] flex flex-col gap-3">
                  <Text className="text-xs font-bold text-[#222325]">
                    Logo Konumu ve Baskı Tekniği
                  </Text>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-[11px] font-bold text-[#49372E]">Ölçek (Scale)</Label>
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
                        className="mt-0.5 bg-white text-[#222325] border-[#D8D3CA] focus:border-[#B29460] disabled:bg-[#F3EFE7]/60 disabled:text-[#49372E]"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold text-[#49372E]">Yatay Konum (X)</Label>
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
                        className="mt-0.5 bg-white text-[#222325] border-[#D8D3CA] focus:border-[#B29460] disabled:bg-[#F3EFE7]/60 disabled:text-[#49372E]"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold text-[#49372E]">Dikey Konum (Y)</Label>
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
                        className="mt-0.5 bg-white text-[#222325] border-[#D8D3CA] focus:border-[#B29460] disabled:bg-[#F3EFE7]/60 disabled:text-[#49372E]"
                      />
                    </div>

                    <div>
                      <Label className="text-[11px] font-bold text-[#49372E]">Baskı Türü</Label>
                      <select
                        disabled={!isEditing}
                        value={selectedGarment.logo_style}
                        onChange={(e) =>
                          setSelectedGarment({
                            ...selectedGarment,
                            logo_style: e.target.value,
                          })
                        }
                        className="mt-0.5 w-full px-2 py-1.5 rounded border border-[#D8D3CA] bg-white text-[#222325] text-xs font-bold focus:border-[#B29460] focus:outline-none disabled:bg-[#F3EFE7]/60 disabled:text-[#49372E]"
                      >
                        <option value="screenprint">Serigrafi / DTF</option>
                        <option value="puff">Kabartma (Puff Print)</option>
                        <option value="embroidery">Nakış (Embroidery)</option>
                        <option value="script">Kaligrafi Yazı</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3D Model Dosyası ve Aktiflik */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold text-[#222325]">
                      3D Mesh Modeli (.glb)
                    </Label>
                    <Input
                      disabled={!isEditing}
                      value={selectedGarment.model_3d_file}
                      onChange={(e) =>
                        setSelectedGarment({ ...selectedGarment, model_3d_file: e.target.value })
                      }
                      className="mt-1 font-mono bg-white text-[#222325] border-[#D8D3CA] focus:border-[#B29460] disabled:bg-[#F3EFE7]/60 disabled:text-[#49372E]"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-[#222325]">Durum</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Switch
                        checked={selectedGarment.is_active}
                        disabled={!isEditing}
                        onCheckedChange={(val) =>
                          setSelectedGarment({ ...selectedGarment, is_active: val })
                        }
                      />
                      <span className="text-xs font-semibold text-[#222325]">
                        {selectedGarment.is_active ? "Askılıkta Göster" : "Askılıkta Gizli"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kaydet Butonları */}
                {isEditing && (
                  <div className="pt-4 border-t border-[#E5E0D8] flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="base"
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        setIsCreating(false)
                      }}
                      className="border-[#D8D3CA] text-[#49372E] hover:bg-[#FAF8F5] font-bold cursor-pointer"
                    >
                      İptal
                    </Button>
                    <Button
                      variant="primary"
                      size="base"
                      type="submit"
                      disabled={saving}
                      className="bg-[#B29460] hover:bg-[#9d814f] text-[#222325] font-extrabold px-6 border border-[#9d814f] shadow-sm cursor-pointer"
                    >
                      {saving ? "Kaydediliyor..." : "💾 Modeli Kaydet"}
                    </Button>
                  </div>
                )}
              </form>
            </Container>
          ) : (
            <Container className="p-8 text-center text-[#49372E] bg-white border border-[#E5E0D8] font-medium">
              Düzenlemek için soldaki askılık modellerinden birini seçin veya yeni model ekleyin.
            </Container>
          )}
        </div>
      </div>
    </div>
  )
}

export default SiteRackPage
