import { expect, test, type Page } from "@playwright/test"

const country = process.env.E2E_COUNTRY || "tr"
const product = process.env.E2E_PRODUCT_HANDLE || "premium-oversize-penye-t-shirt"

async function openHealthyPage(page: Page, url: string) {
  const response = await page.goto(url, { waitUntil: "networkidle" })
  expect(response, `No document response from ${url}`).not.toBeNull()
  expect(response!.status(), `Cannot baseline an error response from ${url}`).toBeLessThan(400)
  await expect(page.locator("body")).not.toContainText("Internal Server Error")
  await page.evaluate(() => document.fonts.ready)
}

async function settleAnimation(page: Page) {
  await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now()) + 100))
  await page.clock.runFor(2500)
  await expect.poll(() => page.evaluate(() => {
    return [...document.images].filter((image) => {
      const rect = image.getBoundingClientRect()
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 &&
        rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth &&
        getComputedStyle(image).visibility !== "hidden"
    }).every((image) => image.complete && image.naturalWidth > 0)
  }), { message: "Visible images must load successfully before a baseline is accepted" }).toBe(true)
}

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-24T12:00:00Z") })
  await page.addInitScript(() => {
    let seed = 20261124
    Math.random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 4294967296
    }
  })
})

test("home, navbar, slider, rack, cards, footer and mobile navigation", async ({ page }) => {
  await openHealthyPage(page, `/${country}`)
  const hero = page.getByTestId("cinematic-hero")
  await expect(hero).toBeVisible()
  await hero.getByTestId("hero-dot-0").click()
  await settleAnimation(page)
  await expect(page).toHaveScreenshot("home-viewport.png", { animations: "disabled" })
  await expect(page.locator("header").first()).toHaveScreenshot("navbar.png")
  await expect(hero).toHaveScreenshot("hero.png", { animations: "disabled" })

  for (const [id, name] of [
    ["clothes-rack-section", "animated-rack"],
    ["tshirt3d-section", "home-3d-studio"],
    ["popular-products-section", "product-cards"],
  ]) {
    const section = page.getByTestId(id)
    await page.clock.resume()
    await section.scrollIntoViewIfNeeded()
    await expect(section).toBeVisible()
    if (id !== "popular-products-section") {
      await expect(section.locator("canvas")).not.toHaveCount(0)
      await page.waitForLoadState("networkidle")
    }
    await settleAnimation(page)
    await expect(section).toHaveScreenshot(`${name}.png`, { animations: "disabled" })
  }

  const footer = page.locator("footer").first()
  await footer.scrollIntoViewIfNeeded()
  await settleAnimation(page)
  await expect(footer).toHaveScreenshot("footer.png", { animations: "disabled" })

  if (page.viewportSize()!.width < 1024) {
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.getByTestId("nav-menu-button").click()
    await settleAnimation(page)
    await expect(page).toHaveScreenshot("mobile-navigation.png", { animations: "disabled" })
  }
})

test("product custom studio", async ({ page }) => {
  await openHealthyPage(page, `/${country}/products/${product}?studio=1`)
  const studio = page.locator(".studio-panel")
  await expect(studio).toBeVisible()
  await studio.scrollIntoViewIfNeeded()
  await expect(studio.locator("canvas")).not.toHaveCount(0)
  await settleAnimation(page)
  await expect(page).toHaveScreenshot("custom-studio.png", { animations: "disabled" })
  const canvas = page.getByTestId("studio-canvas")
  await page.clock.resume()
  await canvas.scrollIntoViewIfNeeded()
  await settleAnimation(page)
  await expect(canvas).toHaveScreenshot("custom-studio-canvas.png", { animations: "disabled" })
})

test("cart", async ({ page }) => {
  await openHealthyPage(page, `/${country}/cart`)
  await settleAnimation(page)
  await expect(page).toHaveScreenshot("cart.png", { animations: "disabled" })
})

test("authenticated admin", async ({ browser }) => {
  expect(process.env.E2E_ADMIN_STORAGE_STATE, "Authenticated admin storage state is mandatory; login page is not admin coverage").toBeTruthy()
  const context = await browser.newContext({
    storageState: process.env.E2E_ADMIN_STORAGE_STATE,
    viewport: test.info().project.use.viewport,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
  })
  try {
    const page = await context.newPage()
    await openHealthyPage(page, `${process.env.E2E_ADMIN_URL || "http://localhost:9000"}/app/site-hub`)
    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByRole("heading", { name: "Site & Vitrin Yönetimi", exact: true })).toBeVisible()
    await expect(page).toHaveScreenshot("admin.png", { animations: "disabled" })
  } finally {
    await context.close()
  }
})
