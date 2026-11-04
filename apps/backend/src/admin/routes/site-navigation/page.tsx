import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EllipsisHorizontal, Plus, Trash } from "@medusajs/icons"
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

type NavItem = {
  title: string
  href: string
}

type FooterCol = {
  title: string
  links: NavItem[]
}

const SiteNavigationPage = () => {
  const [navItems, setNavItems] = useState<NavItem[]>([])
  const [footerCols, setFooterCols] = useState<FooterCol[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadSettings = async () => {
    setLoading(true)
    const res = await adminFetch("/admin/site-management/settings")
    if (res.data?.settings) {
      setNavItems(res.data.settings.navigation_items || [])
      setFooterCols(res.data.settings.footer_columns || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleAddNavItem = () => {
    setNavItems([...navItems, { title: "Yeni Menü", href: "/store" }])
  }

  const handleRemoveNavItem = (idx: number) => {
    setNavItems(navItems.filter((_, i) => i !== idx))
  }

  const handleUpdateNavItem = (idx: number, field: keyof NavItem, val: string) => {
    setNavItems(
      navItems.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    const res = await adminFetch("/admin/site-management/settings", {
      method: "POST",
      body: JSON.stringify({
        navigationItems: navItems,
        footerColumns: footerCols,
      }),
    })

    if (res.error) {
      setFeedback({ type: "error", text: res.error })
    } else {
      setFeedback({
        type: "success",
        text: "Menü ve footer bağlantıları başarıyla güncellendi.",
      })
      await loadSettings()
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      <Container className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge color="blue">NAVİGASYON & FOOTER</Badge>
              <span className="text-xs text-ui-fg-muted font-medium">Site Bağlantı Mimarisi</span>
            </div>
            <Heading level="h1" className="text-2xl font-bold text-ui-fg-base mt-1">
              Menü ve Footer Yönetimi
            </Heading>
            <Text className="text-xs text-ui-fg-subtle mt-1 leading-relaxed">
              Header navigasyon menüsü öğelerini ve footer bağlantı sütunlarını dinamik olarak
              düzenleyin.
            </Text>
          </div>

          <Button
            variant="primary"
            size="base"
            disabled={saving || loading}
            onClick={handleSave}
            className="bg-[#B29460] hover:bg-[#9E8250] text-[#222325] font-bold"
          >
            {saving ? "Kaydediliyor..." : "💾 Menü Ayarlarını Kaydet"}
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

      {/* Header Menü Öğeleri */}
      <Container className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-ui-border-base pb-3">
          <Heading level="h2" className="text-base font-bold text-ui-fg-base">
            Header Üst Menü Bağlantıları ({navItems.length})
          </Heading>
          <Button variant="secondary" size="small" onClick={handleAddNavItem}>
            <Plus /> Yeni Bağlantı Ekle
          </Button>
        </div>

        {loading ? (
          <p className="text-xs text-ui-fg-muted py-4">Menü yükleniyor...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {navItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base text-xs"
              >
                <span className="w-6 h-6 rounded-full bg-ui-bg-component text-ui-fg-base font-bold flex items-center justify-center shrink-0 border border-ui-border-base">
                  {idx + 1}
                </span>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-ui-fg-subtle font-semibold">Menü Başlığı</Label>
                    <Input
                      value={item.title}
                      onChange={(e) => handleUpdateNavItem(idx, "title", e.target.value)}
                      className="mt-0.5 font-semibold border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-ui-fg-subtle font-semibold">Hedef Bağlantı (URL)</Label>
                    <Input
                      value={item.href}
                      onChange={(e) => handleUpdateNavItem(idx, "href", e.target.value)}
                      className="mt-0.5 font-mono border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveNavItem(idx)}
                  className="text-ui-fg-muted hover:text-rose-600 transition-colors shrink-0 p-1"
                >
                  <Trash />
                </button>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Footer Sütunları */}
      <Container className="p-6 flex flex-col gap-4">
        <div className="border-b border-ui-border-base pb-3">
          <Heading level="h2" className="text-base font-bold text-ui-fg-base">
            Footer Sütunları & Alt Bağlantılar
          </Heading>
          <Text className="text-xs text-ui-fg-subtle mt-0.5">
            Müşterilerin sayfa altında gördüğü kurumsal ve ürün bağlantı blokları
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {footerCols.map((col, cIdx) => (
            <div key={cIdx} className="p-4 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base flex flex-col gap-3">
              <div>
                <Label className="text-xs font-bold text-ui-fg-base">Sütun Başlığı</Label>
                <Input
                  value={col.title}
                  onChange={(e) => {
                    const newCols = [...footerCols]
                    newCols[cIdx].title = e.target.value
                    setFooterCols(newCols)
                  }}
                  className="mt-1 font-bold text-xs border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                />
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <Text className="text-[11px] font-semibold text-ui-fg-subtle">Bağlantılar:</Text>
                {col.links.map((link, lIdx) => (
                  <div key={lIdx} className="flex items-center gap-1">
                    <Input
                      value={link.title}
                      onChange={(e) => {
                        const newCols = [...footerCols]
                        newCols[cIdx].links[lIdx].title = e.target.value
                        setFooterCols(newCols)
                      }}
                      className="text-xs font-medium border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                    />
                    <Input
                      value={link.href}
                      onChange={(e) => {
                        const newCols = [...footerCols]
                        newCols[cIdx].links[lIdx].href = e.target.value
                        setFooterCols(newCols)
                      }}
                      className="text-xs font-mono border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}

export default SiteNavigationPage
