export interface DtfErpJobPayload {
  productionRef: string
  externalOrderId: string
  externalOrderName: string | null
  customerEmail: string | null
  productType: string
  widthIn: number
  heightIn: number
  quantity: number
  currencyCode: string
  totalCents: number
  shippingCountry: string
  shippingState: string | null
  shippingZip: string | null
  qcNotes: string | null
}

export interface DtfErpSyncResult {
  status: "dry_run_synced" | "synced" | "failed"
  erpWorkOrderId: string | null
  dryRun: boolean
  message: string
}

/**
 * Modular Nizamlar ERP boundary for US DTF transfer production orders.
 * Defaults safely to dryRun=true unless NIZAMLAR_ERP_DRY_RUN==="false".
 */
export async function syncDtfProductionJobToErp(
  job: DtfErpJobPayload
): Promise<DtfErpSyncResult> {
  const baseUrl =
    process.env.NIZAMLAR_ERP_BASE_URL || "http://localhost:8080/api/v1"
  const username = process.env.NIZAMLAR_ERP_SERVICE_USER || "medusa_service"
  const password = process.env.NIZAMLAR_ERP_SERVICE_PASSWORD || ""
  const dryRun = process.env.NIZAMLAR_ERP_DRY_RUN !== "false"

  if (dryRun) {
    return {
      status: "dry_run_synced",
      erpWorkOrderId: `ERP-DRY-${job.productionRef}`,
      dryRun: true,
      message: `Dry-run ERP work order prepared (${job.widthIn}" x ${job.heightIn}", qty ${job.quantity})`,
    }
  }

  try {
    const authRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    if (!authRes.ok) {
      return {
        status: "failed",
        erpWorkOrderId: null,
        dryRun: false,
        message: `ERP authentication failed with HTTP ${authRes.status}`,
      }
    }
    const authData = (await authRes.json()) as { token?: string }

    const jobRes = await fetch(`${baseUrl}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.token || ""}`,
      },
      body: JSON.stringify({
        jobNumber: job.productionRef,
        externalOrderRef: job.externalOrderName || job.externalOrderId,
        printType: "DTF_TRANSFER_FILM_ONLY",
        garmentIncluded: false,
        dimensionsInches: `${job.widthIn}x${job.heightIn}`,
        quantity: job.quantity,
        unit: "PCS",
        unitPriceUsd: Number((job.totalCents / Math.max(1, job.quantity) / 100).toFixed(2)),
        destination: `${job.shippingState || ""} ${job.shippingZip || ""} ${job.shippingCountry}`.trim(),
        notes: job.qcNotes || "US DTF Transfer Order",
      }),
    })

    if (!jobRes.ok) {
      return {
        status: "failed",
        erpWorkOrderId: null,
        dryRun: false,
        message: `ERP job creation failed with HTTP ${jobRes.status}`,
      }
    }
    const created = (await jobRes.json()) as { id?: string }
    return {
      status: "synced",
      erpWorkOrderId: created.id || job.productionRef,
      dryRun: false,
      message: "Synced DTF work order to Nizamlar ERP",
    }
  } catch (err) {
    return {
      status: "failed",
      erpWorkOrderId: null,
      dryRun: false,
      message: err instanceof Error ? err.message : "ERP network error",
    }
  }
}
