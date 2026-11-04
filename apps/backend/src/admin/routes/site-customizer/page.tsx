import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Eye, Plus, Trash } from "@medusajs/icons"
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

type CustomizerConfig = {
  id: string
  section_title: string
  section_subtitle: string
  badge_text: string
  default_model_path: string
  default_shirt_color: string
  color_palette: string[]
  default_logo_url: string
  default_full_url: string
  logo_pos_x: number
  logo_pos_y: number
  logo_pos_z: number
  logo_scale: number
  max_file_size_mb: number
  allowed_formats: string[]
  cta_button_text: string
  secondary_button_text: string
  is_published: boolean
}

const SiteCustomizerPage = () => {
  const [configData, setConfigData] = useState<CustomizerConfig | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [newColor, setNewColor] = useState<string>("#1A2B3C")
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadData = async () => {
    setLoading(true)
    const res = await adminFetch("/admin/site-management/customizer")
    if (res.data?.customizer) {
      setConfigData(res.data.customizer)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configData) return
    setSaving(true)
    setFeedback(null)

    const payload = {
      sectionTitle: configData.section_title,
      sectionSubtitle: configData.section_subtitle,
      badgeText: configData.badge_text,
      defaultModelPath: configData.default_model_path,
      defaultShirtColor: configData.default_shirt_color,
      colorPalette: configData.color_palette,
      defaultLogoUrl: configData.default_logo_url,
      defaultFullUrl: configData.default_full_url,
      logoPosX: Number(configData.logo_pos_x),
      logoPosY: Number(configData.logo_pos_y),
      logoPosZ: Number(configData.logo_pos_z),
      logoScale: Number(configData.logo_scale),
      maxFileSizeMb: Number(configData.max_file_size_mb),
      allowedFormats: configData.allowed_formats,
      ctaButtonText: configData.cta_button_text,
      secondaryButtonText: configData.secondary_button_text,
      isPublished: true,
    }

    const res = await adminFetch("/admin/site-management/customizer", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    if (res.error) {
      setFeedback({ type: "error", text: res.error })
    } else {
      setFeedback({
        type: "success",
        text: "3D Tasarım Stüdyosu ayarları başarıyla güncellendi.",
      })
      await loadData()
    }
    setSaving(false)
  }

  const handleAddPaletteColor = () => {
    if (!configData || !newColor) return
    if (!configData.color_palette.includes(newColor)) {
      setConfigData({
        ...configData,
        color_palette: [...configData.color_palette, newColor],
      })
    }
  }

  const handleRemovePaletteColor = (colorHex: string) => {
    if (!configData) return
    setConfigData({
      ...configData,
      color_palette: configData.color_palette.filter((c) => c !== colorHex),
    })
  }

  if (loading) {
    return (
      <Container className="p-8 text-center text-ui-fg-subtle bg-ui-bg-base border border-ui-border-base max-w-7xl font-medium">
        3D Customizer konfigürasyonu yükleniyor...
      </Container>
    )
  }

  if (!configData) return null

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      <Container className="p-6 bg-ui-bg-base border border-ui-border-base shadow-xs">
        <div className="flex items-center gap-2">
          <Badge className="bg-[#B29460]/20 text-[#B29460] dark:text-[#F3EFE7] border border-[#B29460]/40 font-bold">
            TSHIRT3D
          </Badge>
          <span className="text-xs font-medium text-ui-fg-subtle">
            İnteraktif 3D Özel Tasarım Alanı
          </span>
        </div>
        <Heading level="h1" className="text-2xl font-bold text-ui-fg-base mt-1.5">
          3D Tasarım Alanı Yönetimi
        </Heading>
        <Text className="text-xs text-ui-fg-subtle mt-1 leading-relaxed">
          tshirt3d interaktif alanının varsayılan modelini, renk paletini, logo decal yerleşimini ve
          müşteri dosya yükleme kısıtlamalarını yönetin.
        </Text>

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

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Metin ve Başlık Ayarları */}
        <Container className="p-6 flex flex-col gap-4 bg-ui-bg-base border border-ui-border-base shadow-xs">
          <Heading level="h2" className="text-base font-bold text-ui-fg-base border-b border-ui-border-base pb-2">
            Vitrin Başlık ve Metinleri
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Rozet Metni (Badge)</Label>
              <Input
                value={configData.badge_text}
                onChange={(e) => setConfigData({ ...configData, badge_text: e.target.value })}
                className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs font-bold text-ui-fg-base">Ana Başlık</Label>
              <Input
                value={configData.section_title}
                onChange={(e) => setConfigData({ ...configData, section_title: e.target.value })}
                className="mt-1 font-bold border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold text-ui-fg-base">Alt Açıklama</Label>
            <textarea
              rows={2}
              value={configData.section_subtitle}
              onChange={(e) => setConfigData({ ...configData, section_subtitle: e.target.value })}
              className="mt-1 w-full p-2.5 rounded-md border border-ui-border-base bg-ui-bg-field text-ui-fg-base placeholder:text-ui-fg-muted text-xs focus:border-[#B29460] focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Sepete Ekle Buton Metni</Label>
              <Input
                value={configData.cta_button_text}
                onChange={(e) => setConfigData({ ...configData, cta_button_text: e.target.value })}
                className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">3D İncele Buton Metni</Label>
              <Input
                value={configData.secondary_button_text}
                onChange={(e) =>
                  setConfigData({ ...configData, secondary_button_text: e.target.value })
                }
                className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
          </div>
        </Container>

        {/* 3D Model ve Renk Skalası */}
        <Container className="p-6 flex flex-col gap-4 bg-ui-bg-base border border-ui-border-base shadow-xs">
          <Heading level="h2" className="text-base font-bold text-ui-fg-base border-b border-ui-border-base pb-2">
            3D Tişört ve Renk Skalası
          </Heading>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Varsayılan 3D Model (.glb)</Label>
              <Input
                value={configData.default_model_path}
                onChange={(e) =>
                  setConfigData({ ...configData, default_model_path: e.target.value })
                }
                className="mt-1 font-mono border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Varsayılan Kumaş Rengi</Label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="color"
                  value={configData.default_shirt_color}
                  onChange={(e) =>
                    setConfigData({ ...configData, default_shirt_color: e.target.value })
                  }
                  className="w-8 h-8 rounded border border-ui-border-base cursor-pointer"
                />
                <Input
                  value={configData.default_shirt_color}
                  onChange={(e) =>
                    setConfigData({ ...configData, default_shirt_color: e.target.value })
                  }
                  className="font-mono uppercase border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
                />
              </div>
            </div>
          </div>

          {/* Renk Paleti Yönetimi */}
          <div className="p-4 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-ui-fg-base">
                Seçilebilir Kumaş Renk Paleti ({configData.color_palette.length} Renk)
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-7 h-7 rounded border border-ui-border-base cursor-pointer"
                />
                <Button
                  variant="secondary"
                  size="small"
                  type="button"
                  onClick={handleAddPaletteColor}
                  className="bg-ui-bg-base border-[#B29460] text-ui-fg-base hover:bg-ui-bg-subtle font-bold"
                >
                  <Plus /> Renk Ekle
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {configData.color_palette.map((color) => (
                <div
                  key={color}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ui-border-base bg-ui-bg-base shadow-xs"
                >
                  <span
                    className="w-4 h-4 rounded-full border border-ui-border-base"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono text-xs font-bold text-ui-fg-base">{color}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePaletteColor(color)}
                    className="text-ui-fg-subtle hover:text-rose-600 font-extrabold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Container>

        {/* Decal ve Logo Pozisyon Sınırları */}
        <Container className="p-6 flex flex-col gap-4 bg-ui-bg-base border border-ui-border-base shadow-xs">
          <Heading level="h2" className="text-base font-bold text-ui-fg-base border-b border-ui-border-base pb-2">
            Varsayılan Decal Logoları ve 3D Koordinatları
          </Heading>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Varsayılan Logo Decal URL</Label>
              <Input
                value={configData.default_logo_url}
                onChange={(e) => setConfigData({ ...configData, default_logo_url: e.target.value })}
                className="mt-1 font-mono text-xs border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Tam Desen (Full Pattern) URL</Label>
              <Input
                value={configData.default_full_url}
                onChange={(e) => setConfigData({ ...configData, default_full_url: e.target.value })}
                className="mt-1 font-mono text-xs border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-3.5 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base">
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Ölçek (Scale)</Label>
              <Input
                type="number"
                step="0.01"
                value={configData.logo_scale}
                onChange={(e) =>
                  setConfigData({ ...configData, logo_scale: parseFloat(e.target.value) || 0.15 })
                }
                className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Pozisyon X</Label>
              <Input
                type="number"
                step="0.01"
                value={configData.logo_pos_x}
                onChange={(e) =>
                  setConfigData({ ...configData, logo_pos_x: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Pozisyon Y</Label>
              <Input
                type="number"
                step="0.01"
                value={configData.logo_pos_y}
                onChange={(e) =>
                  setConfigData({ ...configData, logo_pos_y: parseFloat(e.target.value) || 0.04 })
                }
                className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Pozisyon Z</Label>
              <Input
                type="number"
                step="0.01"
                value={configData.logo_pos_z}
                onChange={(e) =>
                  setConfigData({ ...configData, logo_pos_z: parseFloat(e.target.value) || 0.15 })
                }
                className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
          </div>
        </Container>

        {/* Dosya Yükleme Kuralları */}
        <Container className="p-6 flex flex-col gap-4 bg-ui-bg-base border border-ui-border-base shadow-xs">
          <Heading level="h2" className="text-base font-bold text-ui-fg-base border-b border-ui-border-base pb-2">
            Müşteri Dosya Yükleme Limitleri
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">Maksimum Dosya Boyutu (MB)</Label>
              <Input
                type="number"
                value={configData.max_file_size_mb}
                onChange={(e) =>
                  setConfigData({
                    ...configData,
                    max_file_size_mb: parseInt(e.target.value) || 50,
                  })
                }
                className="mt-1 border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-ui-fg-base">İzin Verilen Formatlar</Label>
              <Input
                value={configData.allowed_formats.join(", ")}
                onChange={(e) =>
                  setConfigData({
                    ...configData,
                    allowed_formats: e.target.value
                      .split(",")
                      .map((s) => s.trim().toLowerCase())
                      .filter(Boolean),
                  })
                }
                className="mt-1 font-mono uppercase border-ui-border-base bg-ui-bg-field text-ui-fg-base focus:border-[#B29460]"
              />
            </div>
          </div>
        </Container>

        {/* Kaydet */}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="large"
            type="submit"
            disabled={saving}
            className="bg-[#B29460] hover:bg-[#9E8250] text-[#222325] font-extrabold px-8 border border-[#9E8250] shadow-sm transition-colors cursor-pointer"
          >
            {saving ? "Kaydediliyor..." : "💾 Customizer Ayarlarını Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default SiteCustomizerPage
