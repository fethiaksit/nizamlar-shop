import crypto from "node:crypto"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { verifyShopifyWebhookHmac } from "../../../modules/dtf_commerce/shopify-client"
import { processShopifyWebhookWorkflow } from "../../../workflows/dtf/process-shopify-webhook"

export const AUTHENTICATE = false

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const hmacHeader = req.headers["x-shopify-hmac-sha256"]
  const hmac = Array.isArray(hmacHeader) ? hmacHeader[0] : hmacHeader
  const rawBody = req.rawBody

  if (!verifyShopifyWebhookHmac(rawBody, hmac)) {
    return res.status(401).json({
      verified: false,
      message: "Invalid or missing X-Shopify-Hmac-Sha256 signature",
    })
  }

  const topicHeader = req.headers["x-shopify-topic"]
  const topic = String(
    (Array.isArray(topicHeader) ? topicHeader[0] : topicHeader) || ""
  ).trim()

  const domainHeader = req.headers["x-shopify-shop-domain"]
  const shopDomain = String(
    (Array.isArray(domainHeader) ? domainHeader[0] : domainHeader) ||
      process.env.SHOPIFY_STORE_DOMAIN ||
      "unknown-shop"
  ).trim()

  const rawBuf = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(String(rawBody || ""), "utf8")
  const rawPayloadHash = crypto
    .createHash("sha256")
    .update(rawBuf)
    .digest("hex")

  const idHeader = req.headers["x-shopify-webhook-id"]
  const webhookId = String(
    (Array.isArray(idHeader) ? idHeader[0] : idHeader) ||
      `sha256_${rawPayloadHash}`
  ).trim()

  if (!topic) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing X-Shopify-Topic header"
    )
  }

  const parsedPayload = (
    req.body && typeof req.body === "object"
      ? req.body
      : JSON.parse(rawBuf.toString("utf8"))
  ) as Record<string, unknown>

  const { result } = await processShopifyWebhookWorkflow(req.scope).run({
    input: {
      webhookId,
      topic,
      shopDomain,
      rawPayloadHash,
      payload: parsedPayload,
    },
  })

  return res.status(200).json({
    verified: true,
    ...result,
  })
}
