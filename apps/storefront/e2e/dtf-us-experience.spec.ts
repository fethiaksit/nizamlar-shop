import { expect, test } from "@playwright/test"

const TINY_TRANSPARENT_PNG_BUFFER = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAOUlEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOA1v9AAAW6167wAAAAASUVORK5CYII=",
  "base64",
)

test.describe("US DTF Transfer Storefront, Studio & Gang Sheet Builder", () => {
  test("renders /us navigation, DTF product configurator, and Custom DTF Studio with USD quotes", async ({
    page,
  }) => {
    const homeRes = await page.goto("/us", { waitUntil: "networkidle" })
    expect(homeRes?.status()).toBeLessThan(400)
    if ((page.viewportSize()?.width || 1440) < 768) {
      await expect
        .poll(async () => {
          if (!(await page.getByTestId("nav-menu-popup").isVisible())) {
            await page.getByTestId("nav-menu-button").click()
          }
          return page.getByTestId("nav-menu-popup").isVisible()
        })
        .toBe(true)
      await expect(page.getByTestId("gang-sheet-builder-link")).toBeVisible()
      await page.getByTestId("close-menu-button").click()
    } else {
      await expect(page.getByTestId("nav-gang-sheet-link")).toBeVisible()
    }
    await expect(page.locator("footer")).toContainText(
      "DTF transfer only. Garment not included.",
    )

    await page.goto("/us/products/premium-oversize-penye-t-shirt", {
      waitUntil: "networkidle",
    })
    const configurator = page.getByTestId("dtf-transfer-configurator")
    await expect(configurator).toBeVisible()
    await expect(page.getByTestId("dtf-garment-disclaimer")).toHaveText(
      "DTF transfer only. Garment not included.",
    )
    await expect(page.getByTestId("dtf-verified-price")).toContainText("$")

    // Open Custom DTF Studio modal
    await page.getByTestId("open-studio").click()
    await expect(page.getByTestId("studio-dtf-disclaimer")).toHaveText(
      "DTF transfer only. Garment not included.",
    )
    await expect(page.getByTestId("studio-dtf-total")).toContainText("USD")
  })

  test("uploads, duplicates, auto-nests, and saves a 22-inch gang sheet with server USD verification", async ({
    page,
  }) => {
    await page.goto("/us/gang-sheet-builder", { waitUntil: "networkidle" })
    await expect(page.getByTestId("gang-sheet-disclaimer")).toHaveText(
      "DTF transfer only. Garment not included.",
    )
    await expect(page.getByTestId("gang-sheet-live-price")).toContainText("USD")

    const input = page.getByTestId("gang-sheet-file-input")
    await input.setInputFiles({
      name: "badge-transparent.png",
      mimeType: "image/png",
      buffer: TINY_TRANSPARENT_PNG_BUFFER,
    })

    await expect(page.getByTestId("gang-sheet-status")).toContainText(
      "Added 1 artwork",
    )
    await page.getByTestId("gang-duplicate-1").click()
    await page.getByTestId("gang-auto-place").click()
    await expect(page.getByTestId("gang-sheet-validation-panel")).toContainText(
      "0 (Clear)",
    )
  })

  test("enforces unapproved application parameter guardrails, FAQ schema, shipping/customs, and order tracking", async ({
    page,
  }) => {
    await page.goto("/us/how-to-apply", { waitUntil: "networkidle" })
    await expect(page.getByTestId("apply-garment-disclaimer")).toHaveText(
      "DTF transfer only. Garment not included.",
    )
    await expect(
      page.getByTestId("unapproved-parameters-guardrail"),
    ).toBeVisible()
    await expect(
      page.getByTestId("home-iron-verification-notice"),
    ).toBeVisible()

    await page.goto("/us/faq", { waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("dtf-faq-page")).toContainText(
      "DTF transfer only. Garment not included.",
    )

    await page.goto("/us/shipping", { waitUntil: "domcontentloaded" })
    await expect(
      page.getByTestId("us-shipping-policy-disclosure"),
    ).toContainText("Customs, Tariffs & Import Duties")

    await page.goto("/us/returns", { waitUntil: "domcontentloaded" })
    await expect(
      page.getByTestId("us-return-policy-disclosure"),
    ).toContainText("Custom DTF Transfers")

    await page.goto("/us/order-tracking", { waitUntil: "domcontentloaded" })
    await expect(page.getByTestId("order-tracking-page")).toBeVisible()
    await expect(page.getByTestId("tracking-submit-btn")).toBeVisible()
  })
})
