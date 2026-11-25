import { expect, test, type Page } from "@playwright/test"
import {
  installDeterministicSceneHarness,
  settleDeterministicTshirt3dSection,
  settleDeterministicUi,
} from "../helpers/webgl-determinism"

const country = process.env.E2E_COUNTRY || "tr"
const product =
  process.env.E2E_PRODUCT_HANDLE || "premium-oversize-penye-t-shirt"

async function openHealthyPage(page: Page, url: string) {
  const response = await page.goto(url, { waitUntil: "networkidle" })
  expect(response, `No document response from ${url}`).not.toBeNull()
  expect(
    response!.status(),
    `Cannot baseline an error response from ${url}`
  ).toBeLessThan(400)
  await expect(page.locator("body")).not.toContainText("Internal Server Error")
  await page.evaluate(() => document.fonts.ready)
}

test.beforeEach(async ({ page }) => {
  await installDeterministicSceneHarness(page)
})

test("home, navbar, slider, rack, cards, footer and mobile navigation", async ({
  page,
}) => {
  await openHealthyPage(page, `/${country}`)
  const hero = page.getByTestId("cinematic-hero")
  await expect(hero).toBeVisible()
  await expect
    .poll(async () => {
      await hero.getByTestId("hero-dot-0").click()
      return page
        .getByTestId("hero-autoplay-toggle")
        .getAttribute("aria-pressed")
    })
    .toBe("false")
  await page.evaluate(() => window.scrollTo(0, 0))
  await settleDeterministicUi(page)
  await expect(page).toHaveScreenshot("home-viewport.png", {
    animations: "disabled",
  })
  await expect(page.locator("header").first()).toHaveScreenshot("navbar.png")
  await expect(hero).toHaveScreenshot("hero.png", { animations: "disabled" })

  // 1. Animated Clothes Rack
  const rackSection = page.getByTestId("clothes-rack-section")
  await page.clock.resume()
  await rackSection.scrollIntoViewIfNeeded()
  await expect(rackSection).toBeVisible()
  await expect(rackSection.locator("canvas")).not.toHaveCount(0)
  await page.waitForLoadState("networkidle")
  await settleDeterministicUi(page)
  await expect(rackSection).toHaveScreenshot("animated-rack.png", {
    animations: "disabled",
  })

  // 2. Home 3D T-Shirt Studio (deterministic R3F clock + <Center> + pointer sync)
  const tshirtSection = page.getByTestId("tshirt3d-section")
  await settleDeterministicTshirt3dSection(page)
  await expect(tshirtSection).toHaveScreenshot("home-3d-studio.png", {
    animations: "disabled",
  })

  // 3. Popular Products Cards
  const productsSection = page.getByTestId("popular-products-section")
  await page.clock.resume()
  await productsSection.scrollIntoViewIfNeeded()
  await expect(productsSection).toBeVisible()
  await settleDeterministicUi(page)
  await expect(productsSection).toHaveScreenshot("product-cards.png", {
    animations: "disabled",
  })

  // 4. Footer
  const footer = page.locator("footer").first()
  await page.clock.resume()
  await footer.scrollIntoViewIfNeeded()
  await settleDeterministicUi(page)
  await expect(footer).toHaveScreenshot("footer.png", {
    animations: "disabled",
  })

  // 5. Mobile Navigation
  if (page.viewportSize()!.width < 1024) {
    await page.clock.resume()
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.getByTestId("nav-menu-button").click()
    await page.mouse.move(0, 0)
    await expect(page.getByTestId("nav-menu-popup")).toBeVisible()
    await settleDeterministicUi(page)
    await expect(page).toHaveScreenshot("mobile-navigation.png", {
      animations: "disabled",
    })
  }
})

test("product custom studio", async ({ page }) => {
  await openHealthyPage(page, `/${country}/products/${product}?studio=1`)
  const studio = page.locator(".studio-panel")
  await expect(studio).toBeVisible()
  await studio.scrollIntoViewIfNeeded()
  const studioCanvas = studio.locator("canvas").first()
  await expect(studioCanvas).toBeVisible()
  await expect(studioCanvas).toHaveAttribute("data-test-garment-drawn", "true")
  await page.waitForLoadState("networkidle")
  await settleDeterministicUi(page)
  await expect(page).toHaveScreenshot("custom-studio.png", {
    animations: "disabled",
  })

  const canvas = page.getByTestId("studio-canvas")
  await page.clock.resume()
  await canvas.scrollIntoViewIfNeeded()
  await settleDeterministicUi(page)
  await expect(canvas).toHaveScreenshot("custom-studio-canvas.png", {
    animations: "disabled",
  })
})

test("cart", async ({ page }) => {
  await openHealthyPage(page, `/${country}/cart`)
  await settleDeterministicUi(page)
  await expect(page).toHaveScreenshot("cart.png", { animations: "disabled" })
})

test("authenticated admin", async ({ browser }) => {
  expect(
    process.env.E2E_ADMIN_STORAGE_STATE,
    "Authenticated admin storage state is mandatory; login page is not admin coverage"
  ).toBeTruthy()
  const context = await browser.newContext({
    storageState: process.env.E2E_ADMIN_STORAGE_STATE,
    viewport: test.info().project.use.viewport,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
  })
  try {
    const page = await context.newPage()
    await openHealthyPage(
      page,
      `${process.env.E2E_ADMIN_URL || "http://localhost:9000"}/app/site-hub`
    )
    await expect(page).not.toHaveURL(/login/)
    await expect(
      page.getByRole("heading", { name: "Site & Vitrin Yönetimi", exact: true })
    ).toBeVisible()
    await expect(page).toHaveScreenshot("admin.png", { animations: "disabled" })
  } finally {
    await context.close()
  }
})
