import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ListBullet, Check } from "@medusajs/icons"
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

type SectionItem = {
  id: string
  name: string
  badge_text: string
  title: string
  subtitle: string
  rank: number
  is_active: boolean
  is_published: boolean
}

const SiteSectionsPage = () => {
  const [sections, setSections] = useState<SectionItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadSections = async () => {
    setLoading(true)
    const res = await adminFetch("/admin/site-management/homepage-sections")
    if (res.data?.sections) {
      setSections(res.data.sections)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSections()
  }, [])

  const handleUpdateField = (id: string, field: keyof SectionItem, value: any) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    )
  }

  const handleSaveAll = async () => {
    setSaving(true)
    setFeedback(null)
    const res = await adminFetch("/admin/site-management/homepage-sections", {
      method: "POST",
      body: JSON.stringify({ sections }),
    })

    if (res.error) {
      setFeedback({ type: "error", text: res.error })
    } else {
      setFeedback({
        type: "success",
        text: "Ana sayfa bölüm ayarları ve sıralaması kaydedildi.",
      })
      await loadSections()
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      <Container className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge color="purple">BÖLÜMLER & KAMPANYALAR</Badge>
              <span className="text-xs text-gray-500">Ana Sayfa Mimari Düzeni</span>
            </div>
            <Heading level="h1" className="text-2xl font-bold text-gray-900 mt-1">
              Bölüm ve Kampanya Sıralaması
            </Heading>
            <Text className="text-xs text-gray-600 mt-1">
              Ana sayfadaki vitrin bloklarının (Hero, Dimaac Askılık, 3D Stüdyo, Popüler Ürünler,
              Hizmetler) başlıklarını ve görünürlüğünü yönetin.
            </Text>
          </div>

          <Button
            variant="primary"
            size="base"
            disabled={saving || loading}
            onClick={handleSaveAll}
            className="bg-[#D4AF37] hover:bg-[#c19d29] text-gray-950 font-bold"
          >
            {saving ? "Kaydediliyor..." : "💾 Sıralamayı ve Değişiklikleri Kaydet"}
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

      {/* Bölüm Listesi */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <Container className="p-8 text-center text-gray-500">
            Bölümler yükleniyor...
          </Container>
        ) : (
          sections.map((sec, idx) => (
            <Container key={sec.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 border text-gray-700 font-bold flex items-center justify-center text-xs shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Heading level="h3" className="text-sm font-bold text-gray-900">
                      {sec.name}
                    </Heading>
                    <code className="text-[10px] text-gray-500 font-mono">#{sec.id}</code>
                  </div>
                  <Text className="text-xs text-gray-600 mt-0.5">{sec.subtitle}</Text>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                <div className="flex flex-col">
                  <Label className="text-[10px] text-gray-500">Bölüm Başlığı</Label>
                  <Input
                    value={sec.title}
                    onChange={(e) => handleUpdateField(sec.id, "title", e.target.value)}
                    className="w-full sm:w-64 text-xs font-semibold"
                  />
                </div>

                <div className="flex flex-col">
                  <Label className="text-[10px] text-gray-500">Rozet Metni</Label>
                  <Input
                    value={sec.badge_text || ""}
                    onChange={(e) => handleUpdateField(sec.id, "badge_text", e.target.value)}
                    className="w-full sm:w-44 text-xs"
                  />
                </div>

                <div className="flex flex-col items-center justify-center shrink-0">
                  <Label className="text-[10px] text-gray-500">Görünürlük</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Switch
                      checked={sec.is_active}
                      onCheckedChange={(val) => handleUpdateField(sec.id, "is_active", val)}
                    />
                    <span className="text-xs font-semibold text-gray-700">
                      {sec.is_active ? "Açık" : "Kapalı"}
                    </span>
                  </div>
                </div>
              </div>
            </Container>
          ))
        )}
      </div>
    </div>
  )
}

export default SiteSectionsPage
