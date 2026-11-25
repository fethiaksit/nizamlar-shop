import { Container, Heading, Text, Button, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch } from "../../lib/client"

interface PricingRuleRecord {
  code: string
  rate_per_sq_inch_cents: number
  min_transfer_unit_cents: number
  min_order_cents: number
  gang_sheet_width_in: number
  max_print_width_in: number
  max_print_height_in: number
  printer_rip_verified: boolean
  gang_sheet_lengths_json?: {
    tiers?: Array<{ length_in: number; price_cents: number; label?: string }>
  }
  quantity_tiers_json?: {
    tiers?: Array<{ min_qty: number; discount_pct: number }>
  }
}

const DtfConfigAdminPage = () => {
  const [code, setCode] = useState("us_default_v1")
  const [rateCents, setRateCents] = useState(6)
  const [minUnitCents, setMinUnitCents] = useState(150)
  const [minOrderCents, setMinOrderCents] = useState(1500)
  const [rollWidthIn, setRollWidthIn] = useState(22)
  const [ripVerified, setRipVerified] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    void adminFetch<{ rules: PricingRuleRecord[] }>("/admin/dtf/pricing-rules").then(
      (res) => {
        const first = res.data?.rules?.[0]
        if (!first) return
        setCode(first.code)
        setRateCents(Number(first.rate_per_sq_inch_cents))
        setMinUnitCents(Number(first.min_transfer_unit_cents))
        setMinOrderCents(Number(first.min_order_cents))
        setRollWidthIn(Number(first.gang_sheet_width_in))
        setRipVerified(Boolean(first.printer_rip_verified))
      }
    )
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage("")
    const res = await adminFetch("/admin/dtf/pricing-rules", {
      method: "POST",
      body: JSON.stringify({
        code,
        rate_per_sq_inch_cents: rateCents,
        min_transfer_unit_cents: minUnitCents,
        min_order_cents: minOrderCents,
        gang_sheet_width_in: rollWidthIn,
        max_print_width_in: rollWidthIn,
        max_print_height_in: 120,
        printer_rip_verified: ripVerified,
        gang_sheet_lengths: [
          { length_in: 12, price_cents: 990, label: `${rollWidthIn}" x 12"` },
          { length_in: 24, price_cents: 1790, label: `${rollWidthIn}" x 24"` },
          { length_in: 36, price_cents: 2490, label: `${rollWidthIn}" x 36"` },
          { length_in: 48, price_cents: 3190, label: `${rollWidthIn}" x 48"` },
          { length_in: 60, price_cents: 3790, label: `${rollWidthIn}" x 60"` },
          { length_in: 120, price_cents: 6990, label: `${rollWidthIn}" x 120"` },
        ],
        quantity_tiers: [
          { min_qty: 5, discount_pct: 5 },
          { min_qty: 10, discount_pct: 10 },
          { min_qty: 25, discount_pct: 15 },
          { min_qty: 50, discount_pct: 20 },
          { min_qty: 100, discount_pct: 25 },
          { min_qty: 250, discount_pct: 30 },
        ],
      }),
    })
    setSaving(false)
    setMessage(
      res.error
        ? `Error: ${res.error}`
        : "Saved US DTF roll dimensions & USD pricing rules."
    )
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-4xl font-sans text-ui-fg-base">
      <Container className="bg-[#222325] text-[#FFFFFF] p-8 rounded-2xl border border-[#49372E]">
        <Badge className="bg-[#B29460] text-[#222325] font-black uppercase text-[11px] border-0 mb-2">
          DTF ROLL &amp; USD PRICING RULES
        </Badge>
        <Heading level="h1" className="text-2xl font-black text-[#FFFFFF]">
          Gang Sheet Roll Width &amp; US Pricing Configuration
        </Heading>
        <Text className="text-sm text-[#F3EFE7] mt-1">
          Configure roll film width, USD square-inch pricing, minimum order floor, and RIP hardware verification status.
        </Text>
      </Container>

      <Container className="p-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-xs font-bold">
            <span>Gang Sheet Roll Width (inches)</span>
            <input
              type="number"
              step="0.5"
              value={rollWidthIn}
              onChange={(e) => setRollWidthIn(Number(e.target.value) || 22)}
              className="rounded border border-ui-border-base px-3 py-2 text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold">
            <span>Area Rate (USD cents per sq. in.)</span>
            <input
              type="number"
              value={rateCents}
              onChange={(e) => setRateCents(Number(e.target.value) || 6)}
              className="rounded border border-ui-border-base px-3 py-2 text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold">
            <span>Min Single Transfer Price (USD cents)</span>
            <input
              type="number"
              value={minUnitCents}
              onChange={(e) => setMinUnitCents(Number(e.target.value) || 150)}
              className="rounded border border-ui-border-base px-3 py-2 text-xs"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-bold">
            <span>Min US Order Floor (USD cents)</span>
            <input
              type="number"
              value={minOrderCents}
              onChange={(e) => setMinOrderCents(Number(e.target.value) || 1500)}
              className="rounded border border-ui-border-base px-3 py-2 text-xs"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-xs font-bold pt-2">
          <input
            type="checkbox"
            checked={ripVerified}
            onChange={(e) => setRipVerified(e.target.checked)}
          />
          <span>
            Physical DTF Printer &amp; RIP Roll Width Verified by Production Operator
          </span>
        </label>

        <div className="flex items-center justify-between pt-2">
          <a
            href="/app/dtf-production"
            className="text-xs font-bold text-[#49372E] underline"
          >
            Back to DTF Production Queue
          </a>
          <Button
            variant="primary"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving..." : "Save DTF Pricing Rule"}
          </Button>
        </div>

        {message && (
          <p className="text-xs font-semibold text-[#222325]">{message}</p>
        )}
      </Container>
    </div>
  )
}

export default DtfConfigAdminPage
