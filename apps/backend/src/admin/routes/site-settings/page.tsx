import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CogSixTooth } from "@medusajs/icons"
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

type SiteSettings = {
  id: string
  site_title: string
  tagline: string
  announcement_text: string
  announcement_link: string
  contact_email: string
  contact_phone: string
  whatsapp_number: string
  address: string
  social_instagram: string
  social_linkedin: string
  footer_copyright: string
  is_published: boolean
}

const SiteSettingsPage = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadSettings = async () => {
    setLoading(true)
    const res = await adminFetch("/admin/site-management/settings")
    if (res.data?.settings) {
      setSettings(res.data.settings)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setSaving(true)
    setFeedback(null)

    const payload = {
      siteTitle: settings.site_title,
      tagline: settings.tagline,
      announcementText: settings.announcement_text,
      announcementLink: settings.announcement_link,
      contactEmail: settings.contact_email,
      contactPhone: settings.contact_phone,
      whatsappNumber: settings.whatsapp_number,
      address: settings.address,
      socialInstagram: settings.social_instagram,
      socialLinkedin: settings.social_linkedin,
      footerCopyright: settings.footer_copyright,
      isPublished: true,
    }

    const res = await adminFetch("/admin/site-management/settings", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    if (res.error) {
      setFeedback({ type: "error", text: res.error })
    } else {
      setFeedback({ type: "success", text: "Site ayarları başarıyla kaydedildi." })
      await loadSettings()
    }
    setSaving(false)
  }

  if (loading) {
    return <Container className="p-8 text-center text-gray-500 max-w-7xl">Ayarlar yükleniyor...</Container>
  }

  if (!settings) return null

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      <Container className="p-6">
        <div className="flex items-center gap-2">
          <Badge color="orange">GENEL AYARLAR</Badge>
          <span className="text-xs text-gray-500">Kurumsal Marka ve İletişim</span>
        </div>
        <Heading level="h1" className="text-2xl font-bold text-gray-900 mt-1">
          Site Ayarları
        </Heading>
        <Text className="text-xs text-gray-600 mt-1">
          Site başlığı, duyuru çubuğu, müşteri iletişim bilgileri ve sosyal medya bağlantılarını
          yönetin.
        </Text>

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

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Marka & Duyuru */}
        <Container className="p-6 flex flex-col gap-4">
          <Heading level="h2" className="text-base font-bold text-gray-900 border-b pb-2">
            Marka Kimliği ve Duyuru Barı
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Site Başlığı</Label>
              <Input
                value={settings.site_title}
                onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                className="mt-1 font-bold"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Slogan (Tagline)</Label>
              <Input
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Üst Duyuru Çubuğu Metni</Label>
              <Input
                value={settings.announcement_text}
                onChange={(e) =>
                  setSettings({ ...settings, announcement_text: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Duyuru Bağlantı Linki</Label>
              <Input
                value={settings.announcement_link}
                onChange={(e) =>
                  setSettings({ ...settings, announcement_link: e.target.value })
                }
                className="mt-1 font-mono"
              />
            </div>
          </div>
        </Container>

        {/* İletişim Bilgileri */}
        <Container className="p-6 flex flex-col gap-4">
          <Heading level="h2" className="text-base font-bold text-gray-900 border-b pb-2">
            İletişim & Konum
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">E-Posta</Label>
              <Input
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Telefon</Label>
              <Input
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">WhatsApp Hattı</Label>
              <Input
                value={settings.whatsapp_number}
                onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700">Fiziksel Atölye / Fabrika Adresi</Label>
            <Input
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="mt-1"
            />
          </div>
        </Container>

        {/* Sosyal Medya ve Telif */}
        <Container className="p-6 flex flex-col gap-4">
          <Heading level="h2" className="text-base font-bold text-gray-900 border-b pb-2">
            Sosyal Medya & Telif Hakları
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Instagram Profili</Label>
              <Input
                value={settings.social_instagram}
                onChange={(e) => setSettings({ ...settings, social_instagram: e.target.value })}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">LinkedIn Sayfası</Label>
              <Input
                value={settings.social_linkedin}
                onChange={(e) => setSettings({ ...settings, social_linkedin: e.target.value })}
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700">Footer Telif Metni</Label>
            <Input
              value={settings.footer_copyright}
              onChange={(e) => setSettings({ ...settings, footer_copyright: e.target.value })}
              className="mt-1 text-xs"
            />
          </div>
        </Container>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="large"
            type="submit"
            disabled={saving}
            className="bg-[#D4AF37] hover:bg-[#c19d29] text-gray-950 font-bold px-8"
          >
            {saving ? "Kaydediliyor..." : "💾 Site Ayarlarını Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default SiteSettingsPage
