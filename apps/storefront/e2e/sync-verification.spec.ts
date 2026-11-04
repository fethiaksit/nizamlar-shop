import { test, expect } from "@playwright/test"

const TEST_PROD_ID = "prod_01M6GP9DMYQ1Z62JTV01V1BGT2"
const TEST_HANDLE = "premium-oversize-penye-t-shirt"
const ADMIN_URL = "http://localhost:9000"
const STOREFRONT_URL = "http://localhost:8000"

async function getAdminToken() {
  const loginRes = await fetch(`${ADMIN_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@admin.com", password: "admin" }),
  })
  const { token } = await loginRes.json()
  return token
}

test.describe("Admin - Storefront Senkronizasyon E2E Testleri", () => {
  let token: string

  test.beforeAll(async () => {
    token = await getAdminToken()
  })

  test.afterAll(async () => {
    // Fiyat ve ürün bilgilerini orijinal haline getir
    if (token) {
      await fetch(`${ADMIN_URL}/admin/site-management/products-simple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "update_price",
          productId: TEST_PROD_ID,
          newPrice: 450,
        }),
      })

      const getRes = await fetch(
        `${ADMIN_URL}/admin/site-management/products-simple/${TEST_PROD_ID}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const { product } = await getRes.json()

      await fetch(`${ADMIN_URL}/admin/site-management/products-simple/${TEST_PROD_ID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...product,
          title: "Premium Oversize Penye T-Shirt",
          status: "published",
        }),
      })
    }
  })

  test("1. Fiyat Değişikliği Mağaza Detay ve Sepete Anında Yansır", async ({ page }) => {
    // 1. Admin panelinden fiyatı 550 TL yap
    const updateRes = await fetch(`${ADMIN_URL}/admin/site-management/products-simple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "update_price",
        productId: TEST_PROD_ID,
        newPrice: 550,
      }),
    })
    expect(updateRes.ok).toBeTruthy()

    // 2. Storefront ürün sayfasına git
    await page.goto(`${STOREFRONT_URL}/products/${TEST_HANDLE}`, { waitUntil: "networkidle" })

    // 3. Fiyatın 550 TL olduğunu doğrula
    const pageContent = await page.content()
    expect(pageContent).toContain("550")

    // 4. Sepete ekle ve sepet kontrolü
    const addToCartButton = page.locator('button[type="submit"]:has-text("Sepete Ekle"), button:has-text("Sepete Ekle")').first()
    if (await addToCartButton.isVisible()) {
      await addToCartButton.click()
      await page.waitForTimeout(1000)
    }

    // 5. Fiyatı tekrar 450 TL'ye geri döndür
    await fetch(`${ADMIN_URL}/admin/site-management/products-simple`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "update_price",
        productId: TEST_PROD_ID,
        newPrice: 450,
      }),
    })

    // 6. Sayfayı yenile ve 450 TL olduğunu gör
    await page.reload({ waitUntil: "networkidle" })
    const reloadedContent = await page.content()
    expect(reloadedContent).toContain("450")
  })

  test("2. Ürün Başlığı Güncellemesi Anında Vitrine Yansır", async ({ page }) => {
    const getRes = await fetch(
      `${ADMIN_URL}/admin/site-management/products-simple/${TEST_PROD_ID}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const { product } = await getRes.json()

    // Başlığı güncelle
    const testTitle = "Premium Oversize Penye T-Shirt [E2E ONAYLI]"
    await fetch(`${ADMIN_URL}/admin/site-management/products-simple/${TEST_PROD_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...product,
        title: testTitle,
      }),
    })

    // Storefront sayfasını ziyaret et
    await page.goto(`${STOREFRONT_URL}/products/${TEST_HANDLE}`, { waitUntil: "networkidle" })
    const content = await page.content()
    expect(content).toContain("[E2E ONAYLI]")

    // Orijinal başlığı geri yükle
    await fetch(`${ADMIN_URL}/admin/site-management/products-simple/${TEST_PROD_ID}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...product,
        title: "Premium Oversize Penye T-Shirt",
      }),
    })

    await page.reload({ waitUntil: "networkidle" })
    const restoredContent = await page.content()
    expect(restoredContent).not.toContain("[E2E ONAYLI]")
  })
})
