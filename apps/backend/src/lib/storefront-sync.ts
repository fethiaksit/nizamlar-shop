/**
 * Nizamlar Shop — Storefront Senkronizasyon ve Revalidation Yardımcısı
 * Yönetim panelinde ürün veya fiyat değiştiğinde Storefront önbelleğini
 * (Next.js Data Cache ve sayfa ISR) anında geçersiz kılar.
 */

export interface StorefrontSyncOptions {
  tags?: string[]
  paths?: string[]
  productId?: string
  handle?: string
}

export async function notifyStorefrontSync(options: StorefrontSyncOptions = {}): Promise<boolean> {
  const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:8000"
  const secret = process.env.REVALIDATION_SECRET || "nizamlar_revalidate_secret_2026"

  const tags = new Set<string>(["products", "site-content"])
  if (options.tags) {
    options.tags.forEach((t) => tags.add(t))
  }
  if (options.handle) {
    tags.add(`product-${options.handle}`)
  }
  if (options.productId) {
    tags.add(`product-${options.productId}`)
  }

  const paths = new Set<string>(["/", "/tr", "/store", "/tr/store"])
  if (options.handle) {
    paths.add(`/products/${options.handle}`)
    paths.add(`/tr/products/${options.handle}`)
  }
  if (options.paths) {
    options.paths.forEach((p) => paths.add(p))
  }

  try {
    const res = await fetch(`${storefrontUrl}/api/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({
        tags: Array.from(tags),
        paths: Array.from(paths),
        handle: options.handle,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => "")
      console.warn(`[StorefrontSync] Revalidation status: ${res.status} ${text}`)
      return false
    }

    const json = await res.json().catch(() => ({}))
    console.info(`[StorefrontSync] Revalidated tags: ${tags.size}, paths: ${paths.size}`)
    return true
  } catch (err: any) {
    // Storefront kapalı olsa bile backend işlemini engellemez
    console.warn(`[StorefrontSync] Storefront revalidation ulaşılamadı (${storefrontUrl}):`, err?.message || err)
    return false
  }
}
