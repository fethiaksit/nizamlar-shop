import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CubeSolid, Check, Plus } from "@medusajs/icons"
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

type ModelItem = {
  id: string
  title: string
  file_name: string
  file_url: string
  file_type: string
  is_default?: boolean
}

const PrintModelsPage = () => {
  const [models, setModels] = useState<ModelItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [newTitle, setNewTitle] = useState<string>("")
  const [newUrl, setNewUrl] = useState<string>("")
  const [saving, setSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadModels = async () => {
    setLoading(true)
    const res = await adminFetch("/admin/site-management/models-3d")
    if (res.data?.models) {
      setModels(res.data.models)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadModels()
  }, [])

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle || !newUrl) {
      alert("Lütfen başlık ve model GLB dosya yolunu girin.")
      return
    }

    setSaving(true)
    const res = await adminFetch("/admin/site-management/media", {
      method: "POST",
      body: JSON.stringify({
        title: newTitle,
        fileUrl: newUrl,
        fileType: "3d_model",
        category: "model3d",
      }),
    })

    if (res.error) {
      setFeedback({ type: "error", text: res.error })
    } else {
      setFeedback({ type: "success", text: "3D GLB modeli başarıyla kaydedildi." })
      setNewTitle("")
      setNewUrl("")
      await loadModels()
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      <Container className="p-6">
        <div className="flex items-center gap-2">
          <Badge color="blue">3D DİJİTAL İKİZLER</Badge>
          <span className="text-xs text-ui-fg-subtle">WebGL GLB / GLTF Varlık Yönetimi</span>
        </div>
        <Heading level="h1" className="text-2xl font-bold text-ui-fg-base mt-1">
          3D Ürün Modelleri
        </Heading>
        <Text className="text-xs text-ui-fg-subtle mt-1">
          Storefront 3D tişört özelleştirici ve vitrinde kullanılan 3D mesh dosyaları. Yeni modeller
          yükleyebilir veya mevcut GLB yollarını yapılandırabilirsiniz.
        </Text>

        {feedback && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs font-semibold ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
                : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800"
            }`}
          >
            {feedback.text}
          </div>
        )}
      </Container>

      {/* Model Ekleme Formu */}
      <Container className="p-6">
        <Heading level="h2" className="text-base font-bold text-ui-fg-base border-b border-ui-border-base pb-2 mb-4">
          Yeni 3D Model Tanımla
        </Heading>
        <form onSubmit={handleAddModel} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <Label className="text-xs font-semibold text-ui-fg-base">Model Başlığı</Label>
            <Input
              placeholder="Örn: 2026 Kadın Oversize Tişört Mesh"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-ui-fg-base">GLB/GLTF Dosya Yolu</Label>
            <Input
              placeholder="Örn: /models/kadin-oversize.glb"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <Button
              variant="primary"
              size="base"
              type="submit"
              disabled={saving}
              className="bg-[#B29460] hover:bg-[#9a7d4a] text-[#222325] font-bold"
            >
              {saving ? "Ekleniyor..." : "3D Modeli Kaydet"}
            </Button>
          </div>
        </form>
      </Container>

      {/* Model Listesi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <Container className="p-8 text-center text-ui-fg-muted col-span-3">
            3D Modeller yükleniyor...
          </Container>
        ) : (
          models.map((m) => (
            <Container key={m.id} className="p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  <CubeSolid className="w-8 h-8" />
                </div>
                {m.is_default && <Badge color="green">Varsayılan Model</Badge>}
              </div>

              <div>
                <Heading level="h3" className="text-sm font-bold text-ui-fg-base">
                  {m.title}
                </Heading>
                <code className="text-xs font-mono text-ui-fg-subtle block mt-1 bg-ui-bg-subtle p-1.5 rounded border border-ui-border-base">
                  {m.file_url}
                </code>
              </div>

              <div className="mt-4 pt-3 border-t border-ui-border-base flex items-center justify-between text-xs">
                <span className="text-ui-fg-subtle font-medium">Format: GLB (Binary GLTF)</span>
                <a
                  href={m.file_url}
                  download
                  className="text-[#B29460] font-bold hover:underline"
                >
                  Modeli İndir ↓
                </a>
              </div>
            </Container>
          ))
        )}
      </div>
    </div>
  )
}

export default PrintModelsPage
