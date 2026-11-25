import type { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import type { ShopifyCartActionBody } from "../../../../dtf-validators"
import {
  shopifyCreateCart,
  shopifyMutateCart,
} from "../../../../../modules/dtf_commerce/shopify-client"

export async function POST(
  req: MedusaStoreRequest<ShopifyCartActionBody>,
  res: MedusaResponse
) {
  const body = req.validatedBody
  if (body.action === "create") {
    const cart = await shopifyCreateCart(body.lines || [])
    return res.status(200).json({ cart })
  }

  if (!body.cartId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "cartId is required for Shopify cart operations"
    )
  }

  const cart = await shopifyMutateCart({
    action: body.action,
    cartId: body.cartId,
    lines: body.lines,
    updateLines: body.updateLines,
    lineIds: body.lineIds,
    discountCodes: body.discountCodes,
  })

  return res.status(200).json({ cart })
}
