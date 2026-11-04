import { test, expect } from "@playwright/test"
import path from "node:path"
import { readFile } from "node:fs/promises"

const screenshots = path.resolve(__dirname, "../../../artifacts/screenshots")
const productPath = "/tr/products/premium-oversize-penye-t-shirt"

// Generated artwork: a non-square PNG, so aspect-ratio and physical dimensions are exercised.
async function logo(page: import("@playwright/test").Page) {
  return Buffer.from(
    await page.evaluate(() => {
      const canvas = document.createElement("canvas")
      canvas.width = 600
      canvas.height = 300
      const ctx = canvas.getContext("2d")!
      ctx.fillStyle = "#bd9556"
      ctx.fillRect(0, 0, 600, 300)
      ctx.fillStyle = "#171719"
      ctx.font = "bold 65px Arial"
      ctx.textAlign = "center"
      ctx.fillText("NİZAMLAR", 300, 165)
      return canvas.toDataURL("image/png").split(",")[1]
    }),
    "base64",
  )
}

test("Hero slider 3 slides, native page scroll without pinning, lazy 3D rack and product navigation", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/tr")

  const hero = page.getByTestId("cinematic-hero")
  await expect(hero).toBeVisible()
  await expect(hero).toHaveAttribute("data-slide", "0")
  await expect(hero).toContainText("KENDİ TARZINI")

  // Verify hero is NOT sticky/pinned and does not mount heavy WebGL on first screen
  const heroPosition = await hero.evaluate((el) => getComputedStyle(el).position)
  expect(heroPosition).not.toBe("sticky")
  expect(heroPosition).not.toBe("fixed")

  await expect(hero.locator("canvas")).toHaveCount(0)
  await page.waitForTimeout(1400)
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-home.png`),
  })
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-hero-slide-1.png`),
  })

  // Navigate to Slide 2 via Next arrow
  await page.getByTestId("hero-next").click()
  await expect(hero).toHaveAttribute("data-slide", "1")
  await expect(hero).toContainText("TASARLA.")
  await page.waitForTimeout(480)
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-hero-slide-2.png`),
  })

  // Navigate to Slide 3 via Next arrow
  await page.getByTestId("hero-next").click()
  await expect(hero).toHaveAttribute("data-slide", "2")
  await expect(hero).toContainText("NİZAMLAR KALİTESİ.")
  await page.waitForTimeout(480)
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-hero-slide-3.png`),
  })

  // Navigate back to Slide 1 via Prev arrow / dot
  await page.getByTestId("hero-prev").click()
  await expect(hero).toHaveAttribute("data-slide", "1")
  await page.getByTestId("hero-dot-0").click()
  await expect(hero).toHaveAttribute("data-slide", "0")

  // Verify natural vertical scroll immediately moves hero upward and reveals Dimaac clothes rack
  const rack = page.getByTestId("clothes-rack-section")
  const rackStage = page.getByTestId("clothes-rack-stage")
  await rackStage.scrollIntoViewIfNeeded()
  const heroTopAfterScroll = await hero.evaluate(
    (el) => el.getBoundingClientRect().top,
  )
  expect(heroTopAfterScroll).toBeLessThan(-100)

  await expect(rack.locator("canvas")).toHaveCount(1)
  await page.waitForTimeout(1400)

  // 1. Dimaac askılık genel görünüm
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-dimaac-rack-overview.png`),
  })

  // 2. Kazak öne çıkmış hali (Nizamlar Essential Kazak · Krem Taş)
  const sweaterGarment = rack
    .locator("[data-garments] button")
    .filter({ hasText: "Nizamlar Essential Kazak" })
    .first()
  await expect(sweaterGarment).toHaveCount(1)
  await sweaterGarment.focus()
  await page.waitForTimeout(650)
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-dimaac-rack-kazak.png`),
  })

  // 3. Sweatshirt öne çıkmış hali (Nizamlar Signature Sweatshirt · Antrasit)
  const sweatshirtGarment = rack
    .locator("[data-garments] button")
    .filter({ hasText: "Nizamlar Signature Sweatshirt" })
    .first()
  await expect(sweatshirtGarment).toHaveCount(1)
  await sweatshirtGarment.focus()
  await page.waitForTimeout(650)
  await page.screenshot({
    path: path.join(
      screenshots,
      `${info.project.name}-dimaac-rack-sweatshirt.png`,
    ),
  })

  // 4. Tişört öne çıkmış hali (Nizamlar Premium Oversize Tişört · Beyaz)
  const garment = rack
    .locator("[data-garments] button")
    .filter({ hasText: "Premium Oversize" })
    .first()
  await garment.focus()
  await page.waitForTimeout(650)
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-dimaac-rack-tisort.png`),
  })
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-clothes-rack.png`),
  })
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-rack.png`),
  })
  await garment.press("Enter")
  const detail = rack.getByRole("dialog")
  await expect(detail).toBeVisible()
  await page.waitForTimeout(500)
  await page.screenshot({
    path: path.join(
      screenshots,
      `${info.project.name}-dimaac-detail-stage.png`,
    ),
  })
  await detail
    .getByRole("button", { name: "Ürünü İncele", exact: true })
    .click()
  await expect(page).toHaveURL(/premium-oversize-penye-t-shirt\?v_id=variant_/)
  await expect(page.getByTestId("product-viewer")).toBeVisible()
  expect(errors).toEqual([])
})

test("Aura real variants, stock, quantity, gallery and Medusa cart", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(productPath)
  await page.getByRole("radio", { name: "Renk: Bej", exact: true }).check()
  await expect(page.getByTestId("add-product-button")).toBeDisabled()
  await page.getByRole("radio", { name: "Renk: Beyaz", exact: true }).check()
  await page.getByRole("radio", { name: "Beden: L", exact: true }).check()
  await expect(page.getByTestId("product-viewer")).toHaveAttribute(
    "data-color",
    "#f4f1e9",
  )
  await page.getByRole("spinbutton", { name: "Adet", exact: true }).fill("2")
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(900)
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-product.png`),
    fullPage: false,
  })
  await page.getByTestId("add-product-button").click()
  await expect(page.locator(".aura-message")).toContainText(
    "2 adet ürün sepetinize eklendi",
  )
  await page.getByRole("tab", { name: "Ürün Galerisi" }).click()
  await expect(page.locator(".aura-photo")).toBeVisible()
  await page.getByRole("tab", { name: "3D İnceleme" }).click()
  await page.evaluate(() => window.scrollTo(0, 1500))
  await expect(page.getByTestId("sticky-cart-bar")).toBeVisible()
  await page.goto("/tr/cart")
  await expect(
    page.getByTestId("product-row").filter({ hasText: "Beyaz / L" }),
  ).toBeVisible()
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-cart.png`),
  })
  expect(errors).toEqual([])
})

test("3D studio preserves variant, artwork, millimetres, both surfaces and persistent draft", async ({
  page,
}, info) => {
  const errors: string[] = []
  let designEndpoint = ""
  let designHeaders: Record<string, string> = {}
  page.on("request", async (request) => {
    if (
      request.method() === "POST" &&
      request.url().endsWith("/store/custom-designs")
    ) {
      designEndpoint = request.url()
      designHeaders = await request.allHeaders()
    }
  })
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(productPath)
  await page.getByRole("radio", { name: "Renk: Beyaz", exact: true }).check()
  await page.getByRole("radio", { name: "Beden: L", exact: true }).check()
  await page.getByRole("spinbutton", { name: "Adet", exact: true }).fill("2")
  await page.getByTestId("add-product-button").click()
  await expect(page.locator(".aura-message")).toContainText(
    "2 adet ürün sepetinize eklendi",
  )
  await page.getByTestId("open-studio").click()
  await expect(page.getByLabel("Stüdyo Beden")).toHaveValue("L")
  await expect(page.getByLabel("Stüdyo Renk")).toHaveValue("Beyaz")
  await expect(page.getByLabel("Stüdyo adet")).toHaveValue("2")
  const artwork = await logo(page)
  await page
    .getByLabel("Logo yükle")
    .setInputFiles({
      name: "nizamlar-e2e.png",
      mimeType: "image/png",
      buffer: artwork,
    })
  await expect(
    page.getByRole("slider", { name: "Genişlik (mm)" }),
  ).toBeVisible()
  await expect(page.getByRole("dialog")).toContainText("180 × 90 mm")
  await page.getByRole("slider", { name: "Yatay konum (mm)" }).fill("140")
  await expect(
    page.getByRole("button", { name: "Tasarımı Kalıcı Kaydet" }),
  ).toBeDisabled()
  await page.getByRole("button", { name: "Ortala", exact: true }).click()
  await page.waitForTimeout(900)
  await page.getByTestId("studio-canvas").scrollIntoViewIfNeeded()
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-studio.png`),
  })
  await page.getByRole("button", { name: "Arka Yüz", exact: true }).click()
  await page
    .getByLabel("Logo yükle")
    .setInputFiles({
      name: "nizamlar-back-e2e.png",
      mimeType: "image/png",
      buffer: artwork,
    })
  await page.waitForTimeout(700)
  await page.getByRole("button", { name: "2D Önizleme", exact: true }).click()
  await expect(
    page.getByAltText("Üretim ölçüleriyle 2D baskı önizlemesi"),
  ).toBeVisible()
  await page.getByRole("button", { name: "3D", exact: true }).click()
  await page
    .getByRole("button", { name: "Tasarımı Kalıcı Kaydet", exact: true })
    .click()
  await expect(page.locator(".studio-status")).toContainText(
    "Tasarım kalıcı kaydedildi",
    { timeout: 30_000 },
  )
  await expect(page.getByTestId("saved-design")).toHaveCount(2)
  await expect(page.getByTestId("add-printed-to-cart")).toBeEnabled()
  const ids = await page
    .getByTestId("saved-design")
    .evaluateAll((elements) =>
      elements.map((e) => e.textContent?.match(/des_[a-f0-9]+/)?.[0]),
    )
  for (const id of ids) {
    expect(id).toBeTruthy()
    const response = await page.request.get(`${designEndpoint}?id=${id}`, {
      headers: {
        "x-publishable-api-key": designHeaders["x-publishable-api-key"],
      },
    })
    expect(response.status()).toBe(200)
    const persisted = (await response.json()).designs[0]
    expect(persisted.quantity).toBe(2)
    expect(persisted.color_name).toBe("Beyaz")
    expect(persisted.size).toBe("L")
    expect(persisted.physical_dimensions.heightMm).toBe(90)
    expect(persisted.pricing_estimate.isPriceVerified).toBe(true)
    const previewResponse = await page.request.get(
      `${designEndpoint}/${id}/preview`,
      {
        headers: {
          "x-publishable-api-key": designHeaders["x-publishable-api-key"],
        },
      },
    )
    expect(previewResponse.status()).toBe(200)
    const original = await readFile(
      path.resolve(
        __dirname,
        `../../backend/private/uploads/custom-designs/${id}_original.png`,
      ),
    )
    expect(original.toString("base64")).toBe(artwork.toString("base64"))
  }
  await page.getByTestId("add-printed-to-cart").click()
  await expect(page.locator(".studio-status")).toContainText(
    "baskılı ürün sepetinize eklendi",
    { timeout: 30_000 },
  )
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-studio-saved.png`),
  })
  await page.goto("/tr/cart")
  await expect(page.getByTestId("product-row")).toHaveCount(2)
  await expect(
    page.getByTestId("product-row").filter({ hasText: "Özel Baskılı Sipariş" }),
  ).toBeVisible()
  await page.screenshot({
    path: path.join(screenshots, `${info.project.name}-cart.png`),
  })
  expect(errors).toEqual([])
})

test("TSHIRT3D reference integration below Dimaac rack: intro, customizer, color, logo, full pattern, PNG download, Medusa save & cart", async ({
  page,
}, info) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))

  const tshirt3dShots = path.join(screenshots, "tshirt3d")

  // 1-3. Ana sayfa açılır, Hero ve Dimaac görünür
  await page.goto("/tr")
  const hero = page.getByTestId("cinematic-hero")
  const rack = page.getByTestId("clothes-rack-section")
  const tshirtSection = page.getByTestId("tshirt3d-section")

  await expect(hero).toBeVisible()
  await expect(rack).toBeVisible()

  // 4. Dimaac'ın hemen altında tshirt3d bölümü görünür
  await tshirtSection.scrollIntoViewIfNeeded()
  await expect(tshirtSection).toBeVisible()
  await expect(tshirtSection.locator("canvas")).toHaveCount(1)
  await expect(tshirtSection).toHaveAttribute("data-mode", "intro")
  await expect(tshirtSection).toContainText("HAYDİ")
  await expect(tshirtSection).toContainText("TASARLA.")
  await page.waitForTimeout(1400)

  // 5. 3D Nizamlar tişörtü açılış ekranı görüntüsü
  await page.screenshot({
    path: path.join(tshirt3dShots, `${info.project.name}-01-intro.png`),
  })

  // 6-7. "Tasarımını Oluştur" butonu çalışır, editör animasyonla açılır
  await page.getByTestId("tshirt3d-customize-btn").click()
  await expect(tshirtSection).toHaveAttribute("data-mode", "customizer")
  await expect(page.getByTestId("tshirt3d-editor-tabs")).toBeVisible()
  await expect(page.getByTestId("tshirt3d-filter-tabs")).toBeVisible()
  await page.waitForTimeout(900)

  await page.screenshot({
    path: path.join(tshirt3dShots, `${info.project.name}-02-customizer.png`),
  })

  // 8. Tişört rengi değişir
  await page.getByTestId("tshirt3d-tab-colorpicker").click()
  await expect(page.getByTestId("tshirt3d-colorpicker-popover")).toBeVisible()
  await page.getByTestId("tshirt3d-swatch-antrasit").click()
  await page.waitForTimeout(700)

  await page.screenshot({
    path: path.join(tshirt3dShots, `${info.project.name}-03-color-change.png`),
  })

  // 9-10. Kullanıcı logo yükler ve logo tişörtte görünür
  await page.getByTestId("tshirt3d-tab-filepicker").click()
  await expect(page.getByTestId("tshirt3d-filepicker-popover")).toBeVisible()
  const artwork = await logo(page)
  await page.getByTestId("tshirt3d-file-input").setInputFiles({
    name: "nizamlar-custom-logo.png",
    mimeType: "image/png",
    buffer: artwork,
  })
  await expect(page.getByTestId("tshirt3d-file-name")).toContainText(
    "nizamlar-custom-logo.png",
  )
  await page.getByTestId("tshirt3d-apply-logo").click()
  await page.waitForTimeout(800)

  await page.screenshot({
    path: path.join(tshirt3dShots, `${info.project.name}-04-custom-logo.png`),
  })

  // 11. Tam yüzey desen modu çalışır
  await page.getByTestId("tshirt3d-filter-stylishShirt").click()
  await page.waitForTimeout(800)

  await page.screenshot({
    path: path.join(tshirt3dShots, `${info.project.name}-05-full-pattern.png`),
  })

  // 12. PNG indirilebilir
  await page.getByTestId("tshirt3d-download-btn").click()
  await expect(page.getByTestId("tshirt3d-download-btn")).toHaveAttribute(
    "data-downloaded-count",
    "1",
  )

  // 13-14. Tasarım kalıcı kaydedilir ve Medusa sepetine eklenir
  if (info.project.name !== "desktop") {
    await page
      .getByRole("button", { name: /Sipariş & Beden/i })
      .click()
  }
  await expect(page.getByTestId("tshirt3d-order-panel")).toBeVisible()
  await page.getByTestId("tshirt3d-save-btn").click()
  await expect(page.getByTestId("tshirt3d-saved-badge")).toContainText(
    /des_[a-f0-9]+/,
    { timeout: 30_000 },
  )

  await page.getByTestId("tshirt3d-cart-btn").click()
  await expect(page.getByTestId("tshirt3d-status")).toContainText(
    "sepetinize eklendi",
    { timeout: 30_000 },
  )

  await page.screenshot({
    path: path.join(
      tshirt3dShots,
      `${info.project.name}-06-saved-and-added.png`,
    ),
  })

  // 15. "Geri Dön" ve doğal aşağı scroll kontrolü
  await page.getByTestId("tshirt3d-goback-btn").click()
  await expect(tshirtSection).toHaveAttribute("data-mode", "intro")

  const popularSection = page.getByTestId("popular-products-section")
  await popularSection.scrollIntoViewIfNeeded()
  await expect(popularSection).toBeVisible()

  // 16. Konsolda kritik hata oluşmaz
  expect(errors).toEqual([])
})
