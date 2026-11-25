import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { getShopifyRuntimeStatus } from "../../../../../modules/dtf_commerce/shopify-client"

export async function GET(_req: MedusaStoreRequest, res: MedusaResponse) {
  const status = getShopifyRuntimeStatus()
  return res.status(200).json(status)
}
