"use client"

import React, { useState } from "react"
import { sdk } from "@lib/config"
import { DTF_GARMENT_DISCLAIMER } from "@lib/data/dtf"

const STAGE_LABELS: Record<string, string> = {
  payment_confirmed: "Payment Confirmed",
  design_review: "Artwork & DPI Review",
  ready_for_printing: "Queued for RIP",
  printing: "Printing on DTF Roll",
  quality_control: "Adhesive & QC Check",
  packed: "Protective Tube Packed",
  shipped: "Shipped to USA",
  delivered: "Delivered",
}

interface TrackingResponse {
  tracking: {
    productionRef: string
    orderName: string
    state: string
    stages: string[]
    cancellationState: string
    refundState: string
    productType: string
    widthIn: number
    heightIn: number
    quantity: number
    shippingCountry: string
    shippingState: string | null
    trackingCarrier: string | null
    trackingNumber: string | null
    trackingUrl: string | null
  }
}

export default function OrderTrackingClient() {
  const [refInput, setRefInput] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<TrackingResponse["tracking"] | null>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!refInput.trim() || !emailInput.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const qs = new URLSearchParams({
        ref: refInput.trim(),
        email: emailInput.trim(),
      })
      const data = await sdk.client.fetch<TrackingResponse>(
        `/store/dtf/order-tracking?${qs.toString()}`,
        { method: "GET" },
      )
      setResult(data.tracking)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No matching DTF order found for that order reference and email.",
      )
    } finally {
      setLoading(false)
    }
  }

  const activeStageIdx = result
    ? Math.max(0, result.stages.indexOf(result.state))
    : -1

  return (
    <section
      data-testid="order-tracking-page"
      className="min-h-screen bg-brand-cream-light text-brand-anthracite py-12 px-4 sm:px-8"
    >
      <div className="mx-auto max-w-3xl flex flex-col gap-6">
        <div className="rounded-2xl bg-brand-anthracite text-brand-cream-light p-8 border border-brand-gold/50">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold block mb-2">
            LIVE PRODUCTION &amp; US COURIER TRACKING
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Track Your DTF Transfer Order
          </h1>
          <p className="text-sm text-brand-cream-light/85">
            Enter your Order Number (e.g. #US-1001) or DTF Production Reference
            along with the checkout email address. {DTF_GARMENT_DISCLAIMER}
          </p>
        </div>

        <form
          onSubmit={(e) => void handleLookup(e)}
          className="rounded-2xl border border-brand-stone bg-brand-white p-6 flex flex-col gap-4 shadow-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-xs font-bold text-brand-anthracite">
              <span>Order # or Production Ref</span>
              <input
                type="text"
                required
                data-testid="tracking-ref-input"
                placeholder="#US-1001 or DTF-..."
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                className="rounded-lg border border-brand-stone bg-brand-cream-light px-3.5 py-2.5 text-sm font-semibold"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-brand-anthracite">
              <span>Checkout Email</span>
              <input
                type="email"
                required
                data-testid="tracking-email-input"
                placeholder="you@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="rounded-lg border border-brand-stone bg-brand-cream-light px-3.5 py-2.5 text-sm font-semibold"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={loading}
            data-testid="tracking-submit-btn"
            className="w-fit rounded-lg bg-brand-anthracite hover:bg-brand-brown px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-brand-cream-light border border-brand-gold"
          >
            {loading ? "Checking Status…" : "Check Order Status"}
          </button>

          {error && (
            <p
              role="alert"
              data-testid="tracking-error"
              className="text-xs font-bold text-[#BE123C]"
            >
              {error}
            </p>
          )}
        </form>

        {result && (
          <div
            data-testid="tracking-result-card"
            className="rounded-2xl border border-brand-gold bg-brand-white p-6 flex flex-col gap-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-stone pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-brand-brown block">
                  REF: {result.productionRef} · ORDER {result.orderName}
                </span>
                <h2 className="text-xl font-extrabold text-brand-anthracite">
                  {STAGE_LABELS[result.state] || result.state}
                </h2>
              </div>
              <div className="text-right text-xs font-semibold text-brand-brown-dark">
                <span className="block">
                  {result.widthIn}&quot; × {result.heightIn}&quot; · {result.quantity} pcs
                </span>
                <span>
                  Destination: {result.shippingState || ""}{" "}
                  {result.shippingCountry}
                </span>
              </div>
            </div>

            {/* 8-Stage Progress Steps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {result.stages.map((st, idx) => {
                const reached = idx <= activeStageIdx
                return (
                  <div
                    key={st}
                    className={`rounded-lg border p-2.5 text-xs ${
                      reached
                        ? "border-brand-gold bg-brand-anthracite text-brand-cream-light font-bold"
                        : "border-brand-stone bg-brand-cream-light text-brand-brown-dark"
                    }`}
                  >
                    <span className="font-mono text-[10px] block opacity-75">
                      0{idx + 1}
                    </span>
                    {STAGE_LABELS[st] || st}
                  </div>
                )
              })}
            </div>

            {result.trackingNumber && (
              <div className="rounded-xl bg-brand-cream-light border border-brand-stone p-4 text-xs flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-brand-brown block font-bold">
                    {result.trackingCarrier || "International Air Express"}
                  </span>
                  <strong className="font-mono text-sm text-brand-anthracite">
                    {result.trackingNumber}
                  </strong>
                </div>
                {result.trackingUrl && (
                  <a
                    href={result.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-brand-anthracite px-4 py-2 font-bold text-brand-cream-light border border-brand-gold"
                  >
                    Open Carrier Tracking ↗
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
