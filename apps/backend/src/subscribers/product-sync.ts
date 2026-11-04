import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { notifyStorefrontSync } from "../lib/storefront-sync"

/**
 * Medusa v2 Ürün ve Varyant Değişiklik Dinleyicisi
 * Standart Medusa admin paneli veya core workflows üzerinden ürün, varyant
 * veya fiyat değiştiğinde Storefront önbelleğini otomatik olarak temizler.
 */
export default async function productSyncSubscriber({
  event: { name, data },
  container,
}: SubscriberArgs<{ id?: string; product_id?: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any
  const id = data?.id || data?.product_id

  logger.info(`[Storefront Sync Subscriber] Event: ${name}, Entity: ${id || "unknown"}`)

  let handle: string | undefined
  if (id) {
    try {
      const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
      const { data: products } = await query.graph({
        entity: "product",
        fields: ["id", "handle"],
        filters: { id },
      })
      handle = products?.[0]?.handle
    } catch {}
  }

  await notifyStorefrontSync({
    productId: id,
    handle,
  })
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
    "price.created",
    "price.updated",
    "price.deleted",
  ],
}
