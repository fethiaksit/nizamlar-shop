import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nizamlarErpClient } from "../lib/erp-client"

/**
 * Medusa v2 Sipariş Tamamlanma Event Dinleyicisi
 *
 * Müşteri siparişi tamamladığında tetiklenir:
 * 1. Siparişin ödeme ve durum kontrollerini yapar
 * 2. Idempotent olarak Nizamlar ERP'ye iş emri ve cari senkronizasyonu başlatır
 * 3. Hata durumunda erp_sync_log tablosuna loglayarak yönetici panelinden tekrar denenebilir kılar
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderId = data.id

  logger.info(`[Nizamlar ERP Subscriber] Sipariş alındı, kontrol ediliyor: ${orderId}`)

  try {
    const result = await nizamlarErpClient.syncOrderToErp(orderId)
    logger.info(`[Nizamlar ERP Subscriber] Senkronizasyon sonucu: ${JSON.stringify(result)}`)
  } catch (error: any) {
    logger.error(`[Nizamlar ERP Subscriber] Aktarım hatası (sipariş ${orderId}): ${error.message}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
