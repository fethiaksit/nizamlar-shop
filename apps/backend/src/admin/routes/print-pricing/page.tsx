import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
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

type PrintConfig = {
  id: string
  technique_dtf_cost: number
  technique_serigrafi_cost: number
  technique_nakkas_cost: number
  size_pocket_mult: number
  size_a5_mult: number
  size_a4_mult: number
  size_a3_mult: number
  size_a3_plus_mult: number
  vat_rate: number
  discount_tiers: Array<{ minQuantity: number; discountPercent: number }>
  is_active: boolean
}

const PrintPricingPage = () => {
  const [configData, setConfigData] = useState<PrintConfig | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  )

  const loadConfig = async () => {
    setLoading(true)
    const res = await adminFetch("/admin/custom-print-config")
    if (res.data?.config) {
      setConfigData(res.data.config)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!configData) return
    setSaving(true)
    setFeedback(null)

    const payload = {
      techniqueDtfCost: Number(configData.technique_dtf_cost),
      techniqueSerigrafiCost: Number(configData.technique_serigrafi_cost),
      techniqueNakkasCost: Number(configData.technique_nakkas_cost),
      sizePocketMult: Number(configData.size_pocket_mult),
      sizeA5Mult: Number(configData.size_a5_mult),
      sizeA4Mult: Number(configData.size_a4_mult),
      sizeA3Mult: Number(configData.size_a3_mult),
      sizeA3PlusMult: Number(configData.size_a3_plus_mult),
      vatRate: Number(configData.vat_rate),
      discountTiers: configData.discount_tiers,
    }

    const res = await adminFetch("/admin/custom-print-config", {
      method: "POST",
      body: JSON.stringify(payload),
    })

    if (res.error) {
      setFeedback({ type: "error", text: res.error })
    } else {
      setFeedback({
        type: "success",
        text: "Baskı fiyatlandırması ve indirim baremleri başarıyla kaydedildi.",
      })
      await loadConfig()
    }
    setSaving(false)
  }

  if (loading) {
    return <Container className="p-8 text-center text-ui-fg-muted max-w-7xl">Fiyatlandırma verileri yükleniyor...</Container>
  }

  if (!configData) return null

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl">
      <Container className="p-6">
        <div className="flex items-center gap-2">
          <Badge color="orange">FİYATLANDIRMA MOTORU</Badge>
          <span className="text-xs text-ui-fg-subtle">Maliyet ve İskonto Parametreleri</span>
        </div>
        <Heading level="h1" className="text-2xl font-bold text-ui-fg-base mt-1">
          Baskı Fiyatlandırması ve Kurumsal Baremler
        </Heading>
        <Text className="text-xs text-ui-fg-subtle mt-1">
          Baskı tekniklerinin temel birim maliyetleri (DTF, Serigrafi, Nakış), boyut çarpanları, KDV
          oranı ve toplu sipariş kademeli indirim oranları.
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

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Baskı Teknik Maliyetleri */}
        <Container className="p-6 flex flex-col gap-4">
          <Heading level="h2" className="text-base font-bold text-ui-fg-base border-b border-ui-border-base pb-2">
            Baskı Teknik Birim Taban Fiyatları (TRY)
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs font-semibold text-ui-fg-base">DTF Baskı Birim Fiyatı (TL)</Label>
              <Input
                type="number"
                step="0.5"
                value={configData.technique_dtf_cost}
                onChange={(e) =>
                  setConfigData({
                    ...configData,
                    technique_dtf_cost: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 font-bold text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ui-fg-base">Serigrafi Birim Fiyatı (TL)</Label>
              <Input
                type="number"
                step="0.5"
                value={configData.technique_serigrafi_cost}
                onChange={(e) =>
                  setConfigData({
                    ...configData,
                    technique_serigrafi_cost: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 font-bold text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-ui-fg-base">Nakış / Flok Birim Fiyatı (TL)</Label>
              <Input
                type="number"
                step="0.5"
                value={configData.technique_nakkas_cost}
                onChange={(e) =>
                  setConfigData({
                    ...configData,
                    technique_nakkas_cost: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 font-bold text-sm"
              />
            </div>
          </div>
        </Container>

        {/* Boyut Çarpanları */}
        <Container className="p-6 flex flex-col gap-4">
          <Heading level="h2" className="text-base font-bold text-ui-fg-base border-b border-ui-border-base pb-2">
            Baskı Ebat Çarpanları
          </Heading>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs text-ui-fg-subtle font-medium">Cep (Pocket)</Label>
              <Input
                type="number"
                step="0.05"
                value={configData.size_pocket_mult}
                onChange={(e) =>
                  setConfigData({
                    ...configData,
                    size_pocket_mult: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-ui-fg-subtle font-medium">A5 Boyut</Label>
              <Input
                type="number"
                step="0.05"
                value={configData.size_a5_mult}
                onChange={(e) =>
                  setConfigData({
                    ...configData,
                    size_a5_mult: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-ui-fg-subtle font-medium">A4 Standart (1.00x)</Label>
              <Input
                type="number"
                step="0.05"
                value={configData.size_a4_mult}
                onChange={(e) =>
                  setConfigData({
                    ...configData,
                    size_a4_mult: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-ui-fg-subtle font-medium">A3 Boyut</Label>
              <Input
                type="number"
                step="0.05"
                value={configData.size_a3_mult}
                onChange={(e) =>
                  setConfigData({
                    ...configData,
                    size_a3_mult: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-ui-fg-subtle font-medium">A3+ Jumbo</Label>
              <Input
                type="number"
                step="0.05"
                value={configData.size_a3_plus_mult}
                onChange={(e) =>
                  setConfigData({
                    ...configData,
                    size_a3_plus_mult: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1 font-mono"
              />
            </div>
          </div>
        </Container>

        {/* KDV ve İskonto Baremleri */}
        <Container className="p-6 flex flex-col gap-4">
          <Heading level="h2" className="text-base font-bold text-ui-fg-base border-b border-ui-border-base pb-2">
            Vergi Oranı & Toplu Sipariş İndirimleri
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-ui-fg-base">KDV Oranı (%)</Label>
              <Input
                type="number"
                step="1"
                value={configData.vat_rate}
                onChange={(e) =>
                  setConfigData({ ...configData, vat_rate: parseFloat(e.target.value) || 0 })
                }
                className="mt-1 w-32"
              />
            </div>
          </div>

          <div className="mt-2 p-4 bg-ui-bg-subtle/80 rounded-lg border border-ui-border-base">
            <Label className="text-xs font-bold text-ui-fg-base mb-2 block">
              Kurumsal Adet İskonto Kademeleri
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {configData.discount_tiers?.map((tier, idx) => (
                <div key={idx} className="p-3 bg-ui-bg-base rounded border border-ui-border-base flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-ui-fg-base">
                    {tier.minQuantity}+ Adet Sipariş
                  </span>
                  <span className="text-[#B29460] font-bold">%{tier.discountPercent} İskonto</span>
                </div>
              ))}
            </div>
          </div>
        </Container>

        <div className="flex justify-end">
          <Button
            variant="primary"
            size="large"
            type="submit"
            disabled={saving}
            className="bg-[#B29460] hover:bg-[#9a7d4a] text-[#222325] font-bold px-8"
          >
            {saving ? "Kaydediliyor..." : "💾 Fiyatlandırma Parametrelerini Kaydet"}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default PrintPricingPage
