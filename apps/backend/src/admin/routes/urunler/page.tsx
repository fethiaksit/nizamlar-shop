import { useState, useEffect } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag, MagnifyingGlass, Plus, Eye, PencilSquare, CurrencyDollar, CheckCircle, XCircle } from "@medusajs/icons"
import { adminFetch } from "../../lib/client"

interface SimpleVariant {
  id: string
  title: string
  sku: string
  priceTRY: number | null
  stock: number
  manageInventory: boolean
}

interface SimpleProduct {
  id: string
  title: string
  description: string
  thumbnail: string
  handle: string
  status: "published" | "draft"
  priceTRY: number
  priceMinTRY: number
  priceMaxTRY: number
  hasVariablePrice: boolean
  totalStock: number
  variantsCount: number
  variants: SimpleVariant[]
  updatedAt: string
}

const SimpleProductsPage = () => {
  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Hızlı Fiyat Değiştirme Modal Durumu
  const [quickPriceProduct, setQuickPriceProduct] = useState<SimpleProduct | null>(null)
  const [quickPriceVal, setQuickPriceVal] = useState<string>("")
  const [quickPriceScope, setQuickPriceScope] = useState<"all" | "variant">("all")
  const [selectedVariantId, setSelectedVariantId] = useState<string>("")
  const [savingPrice, setSavingPrice] = useState<boolean>(false)

  // Sade Ürün Düzenleme / Ekleme Modal Durumu
  const [editProduct, setEditProduct] = useState<SimpleProduct | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnail: "",
    priceTRY: "",
    stockQuantity: "",
    status: "published" as "published" | "draft",
  })
  const [formDirty, setFormDirty] = useState<boolean>(false)
  const [savingProduct, setSavingProduct] = useState<boolean>(false)

  const loadProducts = async () => {
    setLoading(true)
    const res = await adminFetch("/admin/site-management/products-simple")
    if (res.data?.products) {
      setProducts(res.data.products)
    } else {
      setFeedback({ type: "error", text: res.error || "Ürünler yüklenemedi." })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Geri bildirim mesajını otomatik temizleme
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  // Hızlı Fiyat Modalını Aç
  const openQuickPrice = (prod: SimpleProduct) => {
    setQuickPriceProduct(prod)
    setQuickPriceVal(prod.priceTRY ? String(prod.priceTRY) : "")
    setQuickPriceScope("all")
    setSelectedVariantId(prod.variants?.[0]?.id || "")
  }

  // Hızlı Fiyatı Kaydet
  const handleSaveQuickPrice = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickPriceProduct) return

    const priceNum = parseFloat(quickPriceVal)
    if (isNaN(priceNum) || priceNum < 0) {
      setFeedback({ type: "error", text: "Lütfen geçerli bir fiyat girin." })
      return
    }

    setSavingPrice(true)
    const body: any = {
      action: "update_price",
      productId: quickPriceProduct.id,
      newPrice: priceNum,
    }
    if (quickPriceScope === "variant" && selectedVariantId) {
      body.variantId = selectedVariantId
    }

    const res = await adminFetch("/admin/site-management/products-simple", {
      method: "POST",
      body: JSON.stringify(body),
    })

    setSavingPrice(false)
    if (res.error) {
      setFeedback({ type: "error", text: res.error })
    } else {
      setFeedback({
        type: "success",
        text: `"${quickPriceProduct.title}" fiyatı ${priceNum.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ olarak güncellendi.`,
      })
      setQuickPriceProduct(null)
      loadProducts()
    }
  }

  // Sade Düzenleme Modalını Aç
  const openEditModal = (prod: SimpleProduct) => {
    setIsCreatingNew(false)
    setEditProduct(prod)
    setFormData({
      title: prod.title,
      description: prod.description,
      thumbnail: prod.thumbnail,
      priceTRY: String(prod.priceTRY || ""),
      stockQuantity: String(prod.totalStock || ""),
      status: prod.status,
    })
    setFormDirty(false)
  }

  // Yeni Ürün Modalını Aç
  const openCreateModal = () => {
    setIsCreatingNew(true)
    setEditProduct(null)
    setFormData({
      title: "",
      description: "",
      thumbnail: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1000&auto=format&fit=crop",
      priceTRY: "450",
      stockQuantity: "100",
      status: "published",
    })
    setFormDirty(false)
  }

  // Sade Ürün Kaydet
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setFeedback({ type: "error", text: "Ürün adı boş bırakılamaz." })
      return
    }

    const priceNum = parseFloat(formData.priceTRY)
    const stockNum = parseInt(formData.stockQuantity, 10)

    setSavingProduct(true)

    if (isCreatingNew) {
      // Yeni Ürün
      const res = await adminFetch("/admin/site-management/products-simple", {
        method: "POST",
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          thumbnail: formData.thumbnail.trim(),
          priceTRY: isNaN(priceNum) ? 0 : priceNum,
          stockQuantity: isNaN(stockNum) ? 0 : stockNum,
          status: formData.status,
        }),
      })

      setSavingProduct(false)
      if (res.error) {
        setFeedback({ type: "error", text: res.error })
      } else {
        setFeedback({ type: "success", text: "Yeni ürün başarıyla eklendi." })
        setEditProduct(null)
        setIsCreatingNew(false)
        loadProducts()
      }
    } else if (editProduct) {
      // Mevcut Ürün Güncelleme
      const res = await adminFetch(`/admin/site-management/products-simple/${editProduct.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          thumbnail: formData.thumbnail.trim(),
          priceTRY: isNaN(priceNum) ? 0 : priceNum,
          stockQuantity: isNaN(stockNum) ? 0 : stockNum,
          status: formData.status,
        }),
      })

      setSavingProduct(false)
      if (res.error) {
        setFeedback({ type: "error", text: res.error })
      } else {
        setFeedback({ type: "success", text: `"${formData.title}" başarıyla güncellendi.` })
        setEditProduct(null)
        loadProducts()
      }
    }
  }

  // Modal kapatma koruması (Kaydedilmemiş değişiklik kontrolü)
  const handleCloseEditModal = () => {
    if (formDirty) {
      if (!window.confirm("Kaydedilmemiş değişiklikler var. Çıkmak istediğinizden emin misiniz?")) {
        return
      }
    }
    setEditProduct(null)
    setIsCreatingNew(false)
  }

  // Filtrelenmiş ürün listesi
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      search.trim() === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.handle.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && p.status === "published") ||
      (filterStatus === "draft" && p.status === "draft")
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans text-[#161718] bg-[#F8F6F0] min-h-screen">
      {/* Üst Başlık & Eylemler */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#B29460] inline-block shadow-sm" />
            <h1 className="text-2xl font-black tracking-tight text-[#222325]">Hızlı Ürün Yönetimi</h1>
          </div>
          <p className="text-sm text-[#49372E] mt-1 font-medium">
            Ürün adı, fotoğraf, fiyat ve stok düzenlemelerini hiçbir teknik karmaşa olmadan kolayca yapın.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-[#B29460] hover:bg-[#9E8250] text-[#FFFFFF] shadow-sm transition-all"
          >
            <Plus />
            <span>Yeni Ürün Ekle</span>
          </button>
        </div>
      </div>

      {/* Bildirim Çubuğu */}
      {feedback && (
        <div
          className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-sm font-semibold border transition-all ${
            feedback.type === "success"
              ? "bg-[#EBF7EE] text-[#1E5D2F] border-[#A8E2B6]"
              : "bg-[#FDEDEC] text-[#922B21] border-[#F5B7B1]"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Arama ve Filtreleme */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FFFFFF] p-4 rounded-2xl border border-[#E5E0D8] shadow-sm">
        <div className="relative w-full sm:w-96">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A]" />
          <input
            type="text"
            placeholder="Ürün adı ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-[#D1C9BE] bg-[#FFFFFF] text-[#161718] placeholder-[#8C827A] focus:outline-none focus:ring-2 focus:ring-[#B29460]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-[#49372E] uppercase tracking-wider">Durum:</span>
          <div className="inline-flex rounded-xl bg-[#F8F6F0] p-1 border border-[#E5E0D8]">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === "all" ? "bg-[#222325] text-[#FFFFFF]" : "text-[#49372E] hover:text-[#222325]"
              }`}
            >
              Tümü ({products.length})
            </button>
            <button
              onClick={() => setFilterStatus("published")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === "published" ? "bg-[#222325] text-[#FFFFFF]" : "text-[#49372E] hover:text-[#222325]"
              }`}
            >
              Yayında ({products.filter((p) => p.status === "published").length})
            </button>
            <button
              onClick={() => setFilterStatus("draft")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterStatus === "draft" ? "bg-[#222325] text-[#FFFFFF]" : "text-[#49372E] hover:text-[#222325]"
              }`}
            >
              Gizli ({products.filter((p) => p.status === "draft").length})
            </button>
          </div>
        </div>
      </div>

      {/* Ürün Tablosu */}
      <div className="mt-6 bg-[#FFFFFF] rounded-2xl border border-[#E5E0D8] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#49372E] font-medium">Ürünler yükleniyor...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-[#49372E] font-medium">Arama kriterlerine uygun ürün bulunamadı.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E5E0D8] text-xs font-bold text-[#49372E] uppercase tracking-wider">
                  <th className="py-4 px-5">Ürün</th>
                  <th className="py-4 px-4">Durum</th>
                  <th className="py-4 px-4 text-right">Satış Fiyatı</th>
                  <th className="py-4 px-4 text-center">Toplam Stok</th>
                  <th className="py-4 px-5 text-right">Hızlı İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D8]">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#FAF8F5] transition-colors">
                    {/* Görsel ve İsim */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={prod.thumbnail || "https://placehold.co/120x120/222325/FFFFFF?text=Ürün"}
                          alt={prod.title}
                          className="w-14 h-14 object-cover rounded-xl border border-[#D1C9BE] bg-[#F8F6F0] shrink-0"
                        />
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-[#222325] text-base leading-snug truncate max-w-sm">
                            {prod.title}
                          </h3>
                          <p className="text-xs text-[#5A524C] line-clamp-1 mt-0.5">
                            {prod.description || "Açıklama girilmedi"}
                          </p>
                          <span className="text-[11px] font-mono text-[#8C827A] mt-0.5 inline-block">
                            /{prod.handle}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Durum */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {prod.status === "published" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EBF7EE] text-[#1E5D2F] border border-[#A8E2B6]">
                          <span className="w-2 h-2 rounded-full bg-[#27AE60]" />
                          Yayında
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4F1EA] text-[#5A524C] border border-[#D1C9BE]">
                          <span className="w-2 h-2 rounded-full bg-[#8C827A]" />
                          Gizli (Taslak)
                        </span>
                      )}
                    </td>

                    {/* Fiyat */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="font-black text-base text-[#222325]">
                        {prod.hasVariablePrice ? (
                          <>
                            {prod.priceMinTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ –{" "}
                            {prod.priceMaxTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                          </>
                        ) : (
                          `${prod.priceTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺`
                        )}
                      </div>
                      {prod.hasVariablePrice && (
                        <span className="text-[10px] font-extrabold text-[#B29460] uppercase tracking-wider block">
                          Varyantlı Fiyat
                        </span>
                      )}
                    </td>

                    {/* Stok */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-extrabold text-[#222325] px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#D1C9BE] text-xs">
                        {prod.totalStock.toLocaleString("tr-TR")} Adet
                      </span>
                    </td>

                    {/* Butonlar */}
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {/* Hızlı Fiyat Değiştir */}
                        <button
                          onClick={() => openQuickPrice(prod)}
                          title="Fiyatı Değiştir"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#FAF2E6] hover:bg-[#F3E2C7] text-[#8C6D32] border border-[#E5CE9F] transition-all shadow-sm"
                        >
                          <CurrencyDollar className="w-3.5 h-3.5" />
                          <span>Fiyatı Değiştir</span>
                        </button>

                        {/* Düzenle */}
                        <button
                          onClick={() => openEditModal(prod)}
                          title="Ürünü Düzenle"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#222325] hover:bg-[#49372E] text-[#FFFFFF] transition-all shadow-sm"
                        >
                          <PencilSquare className="w-3.5 h-3.5" />
                          <span>Düzenle</span>
                        </button>

                        {/* Mağazada Gör */}
                        <a
                          href={`http://localhost:8000/products/${prod.handle}`}
                          target="_blank"
                          rel="noreferrer"
                          title="Mağazada Önizle"
                          className="p-1.5 rounded-lg text-[#49372E] hover:text-[#222325] hover:bg-[#F4F1EA] border border-[#D1C9BE] transition-all inline-block"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. HIZLI FİYAT DEĞİŞTİRME POPUP MODAL                                    */}
      {/* ========================================================================= */}
      {quickPriceProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222325]/70 backdrop-blur-sm">
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#D1C9BE] shadow-2xl relative text-[#161718]">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E0D8]">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#B29460]">
                  Hızlı Fiyat Güncelleme
                </span>
                <h2 className="text-xl font-extrabold text-[#222325] mt-0.5">{quickPriceProduct.title}</h2>
              </div>
              <button
                onClick={() => setQuickPriceProduct(null)}
                className="text-[#8C827A] hover:text-[#222325] p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickPrice} className="mt-5 flex flex-col gap-4">
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E5E0D8] text-xs">
                <span className="text-[#5A524C] font-semibold block">Mevcut Fiyat:</span>
                <span className="text-lg font-black text-[#222325]">
                  {quickPriceProduct.priceTRY.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#222325] uppercase tracking-wider mb-1.5">
                  Yeni Satış Fiyatı (₺) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quickPriceVal}
                    onChange={(e) => setQuickPriceVal(e.target.value)}
                    placeholder="Örn: 550.00"
                    className="w-full px-4 py-3 rounded-xl text-lg font-black border border-[#D1C9BE] bg-[#FFFFFF] text-[#161718] focus:outline-none focus:ring-2 focus:ring-[#B29460]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-[#5A524C]">
                    TRY
                  </span>
                </div>
              </div>

              {quickPriceProduct.variants?.length > 1 && (
                <div className="mt-1">
                  <label className="block text-xs font-bold text-[#222325] uppercase tracking-wider mb-2">
                    Değişecek Varyantlar:
                  </label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer text-[#222325]">
                      <input
                        type="radio"
                        name="scope"
                        checked={quickPriceScope === "all"}
                        onChange={() => setQuickPriceScope("all")}
                        className="accent-[#B29460]"
                      />
                      <span>Tüm beden ve renklerin fiyatını güncelle ({quickPriceProduct.variants.length} varyant)</span>
                    </label>
                    <label className="flex items-center gap-2.5 text-xs font-semibold cursor-pointer text-[#222325]">
                      <input
                        type="radio"
                        name="scope"
                        checked={quickPriceScope === "variant"}
                        onChange={() => setQuickPriceScope("variant")}
                        className="accent-[#B29460]"
                      />
                      <span>Yalnızca belirli bir varyantı güncelle</span>
                    </label>
                  </div>

                  {quickPriceScope === "variant" && (
                    <select
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      className="mt-2 w-full p-2.5 rounded-xl text-xs font-semibold border border-[#D1C9BE] bg-[#FFFFFF] text-[#161718] focus:outline-none focus:ring-2 focus:ring-[#B29460]"
                    >
                      {quickPriceProduct.variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.title} (Mevcut: {v.priceTRY || 0} ₺)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-center justify-end gap-3 pt-4 border-t border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setQuickPriceProduct(null)}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#5A524C] hover:bg-[#F4F1EA] transition-all"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#B29460] hover:bg-[#9E8250] text-[#FFFFFF] shadow-sm transition-all disabled:opacity-50"
                >
                  {savingPrice ? "Kaydediliyor..." : "Fiyatı Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SADE ÜRÜN DÜZENLEME & EKLEME MODAL                                     */}
      {/* ========================================================================= */}
      {(editProduct || isCreatingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222325]/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-[#D1C9BE] shadow-2xl relative text-[#161718] my-8">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#E5E0D8]">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-extrabold text-[#B29460]">
                  {isCreatingNew ? "Yeni Ürün Oluştur" : "Sade Ürün Düzenleyici"}
                </span>
                <h2 className="text-xl font-black text-[#222325] mt-0.5">
                  {isCreatingNew ? "Yeni Ürün Bilgileri" : editProduct?.title}
                </h2>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="text-[#8C827A] hover:text-[#222325] p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-5 flex flex-col gap-5">
              {/* Bölüm 1: Ürün Bilgileri */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black text-[#49372E] uppercase tracking-wider pb-1 border-b border-[#F0ECE1]">
                  1. Ürün Bilgileri
                </h3>

                <div>
                  <label className="block text-xs font-bold text-[#222325] mb-1">Ürün Adı *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                      setFormDirty(true)
                    }}
                    placeholder="Örn: 240 GSM Premium Oversize Tişört"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold border border-[#D1C9BE] bg-[#FFFFFF] text-[#161718] focus:outline-none focus:ring-2 focus:ring-[#B29460]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222325] mb-1">Ürün Açıklaması</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value })
                      setFormDirty(true)
                    }}
                    placeholder="Kumaş kalitesi, kalıp ve ürün özellikleri hakkında müşteriye gösterilecek açıklama..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#D1C9BE] bg-[#FFFFFF] text-[#161718] focus:outline-none focus:ring-2 focus:ring-[#B29460] leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#222325] mb-1">Ürün Fotoğrafı (URL)</label>
                  <div className="flex gap-3 items-center">
                    <img
                      src={formData.thumbnail || "https://placehold.co/120x120/222325/FFFFFF?text=Görsel"}
                      alt="Önizleme"
                      className="w-16 h-16 rounded-xl border border-[#D1C9BE] object-cover bg-[#FAF8F5] shrink-0"
                    />
                    <div className="flex-1">
                      <input
                        type="url"
                        value={formData.thumbnail}
                        onChange={(e) => {
                          setFormData({ ...formData, thumbnail: e.target.value })
                          setFormDirty(true)
                        }}
                        placeholder="https://... görsel adresi"
                        className="w-full px-3.5 py-2 rounded-xl text-xs border border-[#D1C9BE] bg-[#FFFFFF] text-[#161718] focus:outline-none focus:ring-2 focus:ring-[#B29460]"
                      />
                      <span className="text-[11px] text-[#8C827A] mt-1 block">
                        Görsel Kütüphanesindeki veya web üzerindeki fotoğraf bağlantısını yapıştırın.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bölüm 2: Satış Bilgileri */}
              <div className="flex flex-col gap-4">
                <h3 className="text-xs font-black text-[#49372E] uppercase tracking-wider pb-1 border-b border-[#F0ECE1]">
                  2. Satış ve Stok Bilgileri
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#222325] mb-1">Satış Fiyatı (₺) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.priceTRY}
                      onChange={(e) => {
                        setFormData({ ...formData, priceTRY: e.target.value })
                        setFormDirty(true)
                      }}
                      placeholder="Örn: 450.00"
                      className="w-full px-3.5 py-2.5 rounded-xl text-base font-black border border-[#D1C9BE] bg-[#FFFFFF] text-[#161718] focus:outline-none focus:ring-2 focus:ring-[#B29460]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#222325] mb-1">Toplam Stok Adedi</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => {
                        setFormData({ ...formData, stockQuantity: e.target.value })
                        setFormDirty(true)
                      }}
                      placeholder="Örn: 500"
                      className="w-full px-3.5 py-2.5 rounded-xl text-base font-black border border-[#D1C9BE] bg-[#FFFFFF] text-[#161718] focus:outline-none focus:ring-2 focus:ring-[#B29460]"
                    />
                  </div>
                </div>
              </div>

              {/* Bölüm 3: Görünürlük Durumu */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-black text-[#49372E] uppercase tracking-wider pb-1 border-b border-[#F0ECE1]">
                  3. Mağaza Yayını
                </h3>

                <div className="flex items-center gap-6 mt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-sm text-[#222325]">
                    <input
                      type="radio"
                      name="status"
                      value="published"
                      checked={formData.status === "published"}
                      onChange={() => {
                        setFormData({ ...formData, status: "published" })
                        setFormDirty(true)
                      }}
                      className="accent-[#B29460] w-4 h-4"
                    />
                    <span>✅ Mağazada Yayında</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer font-bold text-sm text-[#5A524C]">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formData.status === "draft"}
                      onChange={() => {
                        setFormData({ ...formData, status: "draft" })
                        setFormDirty(true)
                      }}
                      className="accent-[#B29460] w-4 h-4"
                    />
                    <span>🔒 Gizli (Taslak)</span>
                  </label>
                </div>
              </div>

              {/* Alt Butonlar */}
              <div className="mt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E5E0D8]">
                {editProduct && (
                  <a
                    href={`http://localhost:8000/products/${editProduct.handle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8C6D32] hover:underline"
                  >
                    <span>Mağazada Önizle</span>
                    <Eye className="w-3.5 h-3.5" />
                  </a>
                )}
                {!editProduct && <div />}

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#5A524C] hover:bg-[#F4F1EA] transition-all"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#222325] hover:bg-[#49372E] text-[#FFFFFF] shadow-sm transition-all disabled:opacity-50"
                  >
                    {savingProduct ? "Kaydediliyor..." : isCreatingNew ? "Ürünü Oluştur" : "Değişiklikleri Kaydet"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Hızlı Ürün Yönetimi",
  icon: Tag,
  rank: 1,
})

export default SimpleProductsPage
