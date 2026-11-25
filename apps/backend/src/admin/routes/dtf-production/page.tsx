import { Container, Heading, Text, Button, Badge } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { adminFetch } from "../../lib/client"

const STATES = [
  "payment_confirmed",
  "design_review",
  "ready_for_printing",
  "printing",
  "quality_control",
  "packed",
  "shipped",
  "delivered",
] as const

type ProductionState = (typeof STATES)[number]

const NEXT_STATE_MAP: Record<ProductionState, ProductionState | null> = {
  payment_confirmed: "design_review",
  design_review: "ready_for_printing",
  ready_for_printing: "printing",
  printing: "quality_control",
  quality_control: "packed",
  packed: "shipped",
  shipped: "delivered",
  delivered: null,
}

interface ProductionJobItem {
  id: string
  production_ref: string
  source_channel: string
  external_order_id: string
  external_order_name: string | null
  customer_email: string | null
  payment_verified: boolean
  state: ProductionState
  cancellation_state: string
  refund_state: string
  design_asset_id: string | null
  product_type: string
  width_in: number
  height_in: number
  quantity: number
  currency_code: string
  total_cents: number
  qc_notes: string | null
  tracking_number: string | null
  tracking_carrier: string | null
  tracking_url: string | null
  shipping_country: string
  shipping_state: string | null
  shipping_zip: string | null
  erp_sync_status: string
}

const DtfProductionAdminPage = () => {
  const [jobs, setJobs] = useState<ProductionJobItem[]>([])
  const [stateCounts, setStateCounts] = useState<Record<string, number>>({})
  const [activeState, setActiveState] = useState<string>("")
  const [search, setSearch] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string>("")
  const [draftInputs, setDraftInputs] = useState<
    Record<
      string,
      { qcNotes: string; trackingCarrier: string; trackingNumber: string }
    >
  >({})

  const loadJobs = async () => {
    setLoading(true)
    const qs = new URLSearchParams()
    if (activeState) qs.set("state", activeState)
    if (search.trim()) qs.set("q", search.trim())
    const res = await adminFetch<{
      jobs: ProductionJobItem[]
      stateCounts: Record<string, number>
    }>(`/admin/dtf/production-jobs?${qs.toString()}`)
    if (res.data) {
      setJobs(res.data.jobs || [])
      setStateCounts(res.data.stateCounts || {})
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadJobs()
  }, [activeState])

  const getDraft = (job: ProductionJobItem) =>
    draftInputs[job.id] || {
      qcNotes: job.qc_notes || "",
      trackingCarrier: job.tracking_carrier || "UPS International",
      trackingNumber: job.tracking_number || "",
    }

  const updateDraft = (
    job: ProductionJobItem,
    patch: Partial<{
      qcNotes: string
      trackingCarrier: string
      trackingNumber: string
    }>
  ) => {
    const prev = getDraft(job)
    setDraftInputs((map) => ({
      ...map,
      [job.id]: { ...prev, ...patch },
    }))
  }

  const handleTransition = async (
    job: ProductionJobItem,
    nextState?: ProductionState,
    triggerErpSync = false
  ) => {
    setBusyId(job.id)
    setFeedback("")
    const draft = getDraft(job)
    const res = await adminFetch(`/admin/dtf/production-jobs/${job.id}/transition`, {
      method: "POST",
      body: JSON.stringify({
        nextState,
        qcNotes: draft.qcNotes || null,
        trackingCarrier: draft.trackingCarrier || null,
        trackingNumber: draft.trackingNumber || null,
        triggerErpSync,
      }),
    })
    if (res.error) {
      setFeedback(`Error (${job.production_ref}): ${res.error}`)
    } else {
      setFeedback(`Updated ${job.production_ref} successfully.`)
      await loadJobs()
    }
    setBusyId(null)
  }

  const handleDownloadSignedAsset = async (
    jobId: string,
    kind: "production" | "original"
  ) => {
    setBusyId(jobId)
    const res = await adminFetch<{
      downloads: {
        productionPrintPngUrl: string
        originalSourceUrl: string
      }
    }>(`/admin/dtf/production-jobs/${jobId}/download-token`, {
      method: "POST",
      body: JSON.stringify({ ttlSeconds: 900 }),
    })
    setBusyId(null)
    if (res.error || !res.data) {
      setFeedback(res.error || "Could not generate signed asset link")
      return
    }
    const targetUrl =
      kind === "production"
        ? res.data.downloads.productionPrintPngUrl
        : res.data.downloads.originalSourceUrl
    window.open(targetUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="flex flex-col gap-y-6 max-w-7xl font-sans text-ui-fg-base">
      <Container className="bg-[#222325] text-[#FFFFFF] p-8 rounded-2xl border border-[#49372E]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-[#B29460] text-[#222325] font-black uppercase text-[11px] border-0">
                US DTF PRODUCTION QUEUE
              </Badge>
              <span className="text-xs text-[#F3EFE7]">
                Paid-Order Verified Workflow &amp; ERP Sync
              </span>
            </div>
            <Heading level="h1" className="text-2xl font-black text-[#FFFFFF]">
              DTF Transfer Film Production &amp; US Fulfillment
            </Heading>
            <Text className="text-sm text-[#F3EFE7]">
              Manage artwork review, 300-DPI transparent RIP downloads, QC notes, Nizamlar ERP sync, and US tracking numbers.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/app/dtf-config"
              className="px-4 py-2.5 rounded-xl border border-[#B29460] bg-[#32251E] text-xs font-bold text-[#FFFFFF]"
            >
              Roll &amp; Pricing Rules
            </a>
            <Button
              variant="secondary"
              onClick={() => void loadJobs()}
              disabled={loading}
            >
              Refresh Queue
            </Button>
          </div>
        </div>
      </Container>

      {/* 8-State Filter Bar */}
      <Container className="p-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveState("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              activeState === ""
                ? "bg-[#222325] text-[#FFFFFF] border-[#B29460]"
                : "bg-ui-bg-subtle text-ui-fg-base border-ui-border-base"
            }`}
          >
            All Jobs
          </button>
          {STATES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setActiveState(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                activeState === st
                  ? "bg-[#222325] text-[#FFFFFF] border-[#B29460]"
                  : "bg-ui-bg-subtle text-ui-fg-base border-ui-border-base"
              }`}
            >
              {st.replace(/_/g, " ")} ({stateCounts[st] || 0})
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by DTF ref, Shopify order #, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-ui-border-base bg-ui-bg-field px-3 py-2 text-xs"
          />
          <Button variant="secondary" onClick={() => void loadJobs()}>
            Search
          </Button>
        </div>

        {feedback && (
          <div className="rounded-lg border border-[#B29460] bg-[#FAF5EB] px-3 py-2 text-xs font-semibold text-[#222325]">
            {feedback}
          </div>
        )}
      </Container>

      {/* Jobs List */}
      {loading ? (
        <Container className="p-8 text-center text-xs">
          Loading verified DTF production queue...
        </Container>
      ) : jobs.length === 0 ? (
        <Container className="p-8 text-center text-xs text-ui-fg-subtle">
          No paid DTF transfer production jobs match the current filter.
        </Container>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
            const draft = getDraft(job)
            const nextState = NEXT_STATE_MAP[job.state]
            return (
              <Container
                key={job.id}
                className="p-5 border border-ui-border-base flex flex-col gap-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ui-border-base pb-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-[#222325]">
                        {job.production_ref}
                      </span>
                      <Badge>{job.state.replace(/_/g, " ").toUpperCase()}</Badge>
                      {job.cancellation_state !== "none" && (
                        <Badge color="red">{job.cancellation_state}</Badge>
                      )}
                      {job.refund_state !== "none" && (
                        <Badge color="orange">{job.refund_state}</Badge>
                      )}
                    </div>
                    <span className="text-xs text-ui-fg-subtle">
                      Order {job.external_order_name || job.external_order_id} ·{" "}
                      {job.customer_email || "Guest"} · Ship to{" "}
                      {job.shipping_state || ""} {job.shipping_zip || ""}{" "}
                      {job.shipping_country}
                    </span>
                  </div>

                  <div className="text-right text-xs">
                    <strong className="block text-sm">
                      {job.width_in}&quot; × {job.height_in}&quot; · {job.quantity} pcs
                    </strong>
                    <span className="text-ui-fg-subtle">
                      {job.product_type} · ${(job.total_cents / 100).toFixed(2)}{" "}
                      {job.currency_code} · ERP: {job.erp_sync_status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex flex-col gap-1 text-xs font-semibold">
                    <span>QC &amp; RIP Operator Notes</span>
                    <input
                      type="text"
                      value={draft.qcNotes}
                      onChange={(e) =>
                        updateDraft(job, { qcNotes: e.target.value })
                      }
                      placeholder="White ink choke, film adhesion check..."
                      className="rounded border border-ui-border-base px-2.5 py-1.5 text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold">
                    <span>US Carrier</span>
                    <input
                      type="text"
                      value={draft.trackingCarrier}
                      onChange={(e) =>
                        updateDraft(job, { trackingCarrier: e.target.value })
                      }
                      className="rounded border border-ui-border-base px-2.5 py-1.5 text-xs"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold">
                    <span>Tracking Number</span>
                    <input
                      type="text"
                      value={draft.trackingNumber}
                      onChange={(e) =>
                        updateDraft(job, { trackingNumber: e.target.value })
                      }
                      placeholder="1Z999AA10123456784"
                      className="rounded border border-ui-border-base px-2.5 py-1.5 text-xs font-mono"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-2">
                    {job.design_asset_id && (
                      <>
                        <Button
                          variant="secondary"
                          size="small"
                          disabled={busyId === job.id}
                          onClick={() =>
                            void handleDownloadSignedAsset(job.id, "production")
                          }
                        >
                          Download Transparent Print PNG
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          disabled={busyId === job.id}
                          onClick={() =>
                            void handleDownloadSignedAsset(job.id, "original")
                          }
                        >
                          Download Source File
                        </Button>
                      </>
                    )}
                    <Button
                      variant="secondary"
                      size="small"
                      disabled={busyId === job.id}
                      onClick={() =>
                        void handleTransition(job, undefined, true)
                      }
                    >
                      Save Notes &amp; Sync ERP
                    </Button>
                  </div>

                  {nextState && job.cancellation_state !== "cancelled" && (
                    <Button
                      variant="primary"
                      size="small"
                      disabled={busyId === job.id}
                      onClick={() => void handleTransition(job, nextState, false)}
                      className="bg-[#222325] text-[#FFFFFF]"
                    >
                      Advance to {nextState.replace(/_/g, " ")}
                    </Button>
                  )}
                </div>
              </Container>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DtfProductionAdminPage
