import crypto from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"

export const PRODUCTION_STATES = [
  "payment_confirmed",
  "design_review",
  "ready_for_printing",
  "printing",
  "quality_control",
  "packed",
  "shipped",
  "delivered",
] as const

export type ProductionState = (typeof PRODUCTION_STATES)[number]

export type CancellationState = "none" | "cancel_requested" | "cancelled"
export type RefundState = "none" | "partial_refund" | "refunded"

const ALLOWED_TRANSITIONS: Record<ProductionState, ProductionState[]> = {
  payment_confirmed: ["design_review"],
  design_review: ["ready_for_printing"],
  ready_for_printing: ["printing", "design_review"],
  printing: ["quality_control"],
  quality_control: ["packed", "printing"],
  packed: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
}

export function generateProductionReference(now = new Date()): string {
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(now.getUTCDate()).padStart(2, "0")
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase()
  return `DTF-${yyyy}${mm}${dd}-${suffix}`
}

export function assertPaidOrderBeforeProduction(paymentVerified: boolean) {
  if (!paymentVerified) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Unpaid or unverified orders cannot enter DTF production"
    )
  }
}

export function assertValidProductionTransition(
  current: ProductionState,
  next: ProductionState,
  cancellationState: CancellationState = "none"
) {
  if (cancellationState === "cancelled") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cancelled production jobs cannot advance through fulfillment states"
    )
  }
  if (current === next) {
    return
  }
  const allowed = ALLOWED_TRANSITIONS[current] || []
  if (!allowed.includes(next)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid DTF production transition from '${current}' to '${next}'`
    )
  }
}

export function createSignedAssetDownloadToken({
  jobId,
  assetKind,
  expiresAtEpochSec,
  secret,
}: {
  jobId: string
  assetKind: "original" | "production" | "mockup"
  expiresAtEpochSec: number
  secret?: string
}): string {
  const signingSecret =
    secret ||
    process.env.DTF_ASSET_DOWNLOAD_SECRET ||
    process.env.JWT_SECRET ||
    "nizamlar-dev-asset-hmac"
  const payload = `${jobId}:${assetKind}:${expiresAtEpochSec}`
  const sig = crypto
    .createHmac("sha256", signingSecret)
    .update(payload)
    .digest("hex")
  return `${expiresAtEpochSec}.${sig}`
}

export function verifySignedAssetDownloadToken({
  jobId,
  assetKind,
  token,
  nowEpochSec = Math.floor(Date.now() / 1000),
  secret,
}: {
  jobId: string
  assetKind: "original" | "production" | "mockup"
  token: string
  nowEpochSec?: number
  secret?: string
}): boolean {
  if (!token || !token.includes(".")) return false
  const [expStr, providedSig] = token.split(".", 2)
  const exp = Number(expStr)
  if (!Number.isInteger(exp) || exp < nowEpochSec) {
    return false
  }
  const expectedToken = createSignedAssetDownloadToken({
    jobId,
    assetKind,
    expiresAtEpochSec: exp,
    secret,
  })
  const expectedSig = expectedToken.split(".", 2)[1] || ""
  const bufA = Buffer.from(providedSig || "", "utf8")
  const bufB = Buffer.from(expectedSig, "utf8")
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}
