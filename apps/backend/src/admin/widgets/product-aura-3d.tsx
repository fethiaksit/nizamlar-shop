import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { Container, Heading, Text, Button, Input, Label, Switch, Badge } from "@medusajs/ui"
import { CubeSolid, Sparkles } from "@medusajs/icons"
import { useState, useEffect } from "react"
import { adminFetch } from "../lib/client"

const ProductAura3dWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const product = data
  const metadata = (product?.metadata || {}) as Record<string, any>

  const [model3dPath, setModel3dPath] = useState<string>(
    metadata.model_3d_file || "/models/nizamlar-tee.glb"
  )
  const [auraBadge, setAuraBadge] = useState<string>(
    metadata.aura_badge || "3D İNTERAKTİF SUNUM"
  )
  const [is3dFeatured, setIs3dFeatured] = useState<boolean>(
    Boolean(metadata.is_3d_featured ?? true)
  )
  const [fabricSpec, setFabricSpec] = useState<string>(
    metadata.fabric_spec || "240 GSM %100 Penye Pamuk"
  )
  const [saving, setSaving] = useState<boolean>(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  useEffect(() => {
    if (product?.metadata) {
      const meta = product.metadata as Record<string, any>
      if (meta.model_3d_file) setModel3dPath(meta.model_3d_file)
      if (meta.aura_badge) setAuraBadge(meta.aura_badge)
      if (meta.is_3d_featured !== undefined) setIs3dFeatured(Boolean(meta.is_3d_featured))
      if (meta.fabric_spec) setFabricSpec(meta.fabric_spec)
    }
  }, [product])

  const handleSave3dConfig = async () => {
    setSaving(true)
    setSavedMsg(null)

    const updatedMetadata = {
      ...(product.metadata || {}),
      model_3d_file: model3dPath,
      aura_badge: auraBadge,
      is_3d_featured: is3dFeatured,
      fabric_spec: fabricSpec,
    }

    const res = await adminFetch(`/admin/products/${product.id}`, {
      method: "POST",
      body: JSON.stringify({ metadata: updatedMetadata }),
    })

    if (res.error) {
      alert(`Hata: ${res.error}`)
    } else {
      setSavedMsg("Aura 3D ve sunum özellikleri başarıyla kaydedildi.")
      setTimeout(() => setSavedMsg(null), 3500)
    }
    setSaving(false)
  }

  return (
    <Container className="p-6 divide-y divide-gray-200 border border-amber-900/20 bg-white rounded-lg shadow-xs">
      <div className="pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded-lg text-amber-700">
            <CubeSolid />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Heading level="h2" className="text-base font-bold text-gray-900">
                Aura 3D Dijital İkiz ve Özel Sunum Yönetimi
              </Heading>
              <Badge color="orange">Aura 3D</Badge>
            </div>
            <Text className="text-xs text-gray-500 mt-0.5">
              Bu ürünün Storefront 3D vitrinindeki GLB modelini, kumaş kalitesini ve etkileşim
              rozetini yönetin.
            </Text>
          </div>
        </div>

        <Button
          variant="primary"
          size="base"
          disabled={saving}
          onClick={handleSave3dConfig}
          className="bg-[#D4AF37] hover:bg-[#c19d29] text-gray-950 font-bold"
        >
          {saving ? "Kaydediliyor..." : "3D Ayarlarını Kaydet"}
        </Button>
      </div>

      <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <Label className="text-xs font-semibold text-gray-700">3D GLB/GLTF Model Dosyası</Label>
          <Input
            value={model3dPath}
            onChange={(e) => setModel3dPath(e.target.value)}
            className="mt-1 font-mono text-xs"
            placeholder="/models/nizamlar-tee.glb"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-700">Aura Vitrin Rozeti (Badge)</Label>
          <Input
            value={auraBadge}
            onChange={(e) => setAuraBadge(e.target.value)}
            className="mt-1 text-xs"
            placeholder="Örn: 240 GSM PREMİUM BASKI"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-700">Kumaş ve Doku Özelliği</Label>
          <Input
            value={fabricSpec}
            onChange={(e) => setFabricSpec(e.target.value)}
            className="mt-1 text-xs"
            placeholder="Örn: 340 GSM %100 Organik Pamuk Şardonlu"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-700">
            3D Vitrinde & Askılıkta Öne Çıkarılsın
          </Label>
          <div className="mt-2 flex items-center gap-2">
            <Switch checked={is3dFeatured} onCheckedChange={(val) => setIs3dFeatured(val)} />
            <span className="text-xs text-gray-600">
              {is3dFeatured ? "Evet, 3D vitrinde gösterilir" : "Hayır, yalnızca standart katalogda"}
            </span>
          </div>
        </div>
      </div>

      {savedMsg && (
        <div className="mt-4 pt-3 text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
          <Sparkles />
          <span>{savedMsg}</span>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details",
})

export default ProductAura3dWidget
