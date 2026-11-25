import { expect, test } from "@playwright/test"
import {
  installDeterministicSceneHarness,
  settleDeterministicTshirt3dSection,
} from "../helpers/webgl-determinism"

test("deterministic WebGL harness produces byte-identical 3D shirt renders across three fresh browser sessions", async ({
  browser,
}, info) => {
  let reference: Buffer | undefined

  for (let attempt = 1; attempt <= 3; attempt++) {
    const context = await browser.newContext({
      viewport: info.project.use.viewport,
      deviceScaleFactor: 1,
      hasTouch: info.project.use.hasTouch,
      locale: "tr-TR",
      timezoneId: "Europe/Istanbul",
      colorScheme: "light",
      serviceWorkers: "block",
    })

    try {
      const page = await context.newPage()
      await installDeterministicSceneHarness(page)

      const base = info.project.use.baseURL || "http://localhost:8000"
      const response = await page.goto(`${base}/tr`, {
        waitUntil: "networkidle",
      })
      expect(response?.status()).toBe(200)
      await page.evaluate(() => document.fonts.ready)
      await page.getByTestId("hero-dot-0").click()

      await settleDeterministicTshirt3dSection(page)

      const section = page.getByTestId("tshirt3d-section")
      const image = await section.screenshot({ animations: "disabled" })
      await info.attach(`controlled-pose-${attempt}`, {
        body: image,
        contentType: "image/png",
      })

      if (reference) {
        expect(
          image.equals(reference),
          `Attempt ${attempt} must match Attempt 1 byte-for-byte`
        ).toBe(true)
      } else {
        reference = image
      }

      expect(
        (await section.screenshot({ animations: "disabled" })).equals(image),
        "Paused WebGL frame must remain completely stable"
      ).toBe(true)
    } finally {
      await context.close()
    }
  }
})
