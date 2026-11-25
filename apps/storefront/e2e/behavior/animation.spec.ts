import { expect, test, type Locator, type Page } from "@playwright/test"

async function openHome(page: Page) {
  const response = await page.goto("/tr", { waitUntil: "networkidle" })
  expect(response?.status()).toBe(200)
  await page.evaluate(() => document.fonts.ready)
}

async function canvasImage(canvas: Locator) {
  return canvas.screenshot({ animations: "allow" })
}

async function pauseClockSafely(page: Page, minStepMs = 500) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const now = await page.evaluate(() => Date.now())
    try {
      await page.clock.pauseAt(new Date(now + minStepMs * (attempt + 1)))
      return
    } catch (err) {
      if (attempt === 3) throw err
    }
  }
}

test("hero controls preserve 440ms transitions, configured autoplay, and mobile touch swipe", async ({
  page,
  request,
}) => {
  const isMobile = test.info().project.name === "mobile"
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  expect(
    key,
    "Local storefront publishable key required for read-only site settings"
  ).toBeTruthy()
  const settings = await request.get(
    `${
      process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
    }/store/site-content`,
    {
      headers: { "x-publishable-api-key": key! },
    }
  )
  expect(settings.ok()).toBe(true)
  const { slides } = (await settings.json()) as {
    slides: { autoplay_duration_ms?: number }[]
  }
  const interval = slides?.[0]?.autoplay_duration_ms || 4400
  await page.clock.install()
  await openHome(page)
  const hero = page.getByTestId("cinematic-hero")

  if (isMobile) {
    await page.getByTestId("hero-dot-0").tap()
  } else {
    await page.getByTestId("hero-dot-0").click()
  }
  await expect(hero).toHaveAttribute("data-slide", "0")
  await expect(page.getByTestId("hero-autoplay-toggle")).toHaveAttribute(
    "aria-pressed",
    "false"
  )

  if (isMobile) {
    await page.evaluate(() => window.scrollTo(0, 0))
    const heroBox = await hero.boundingBox()
    expect(heroBox).not.toBeNull()
    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 5,
    })
    const startX = Math.round(heroBox!.x + heroBox!.width * 0.8)
    const endX = Math.round(heroBox!.x + heroBox!.width * 0.18)
    const midY = Math.round(Math.max(110, heroBox!.y + 180))
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: startX, y: midY, radiusX: 4, radiusY: 4, id: 1 }],
    })
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: endX, y: midY, radiusX: 4, radiusY: 4, id: 1 }],
    })
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
    await expect(hero).toHaveAttribute("data-slide", "1")
  } else {
    await page.getByTestId("hero-next").click()
    await expect(hero).toHaveAttribute("data-slide", "1")
  }

  await expect
    .poll(() =>
      page
        .locator(".hero-slider__track")
        .evaluate((el) => getComputedStyle(el).transitionDuration)
    )
    .toBe("0.44s")

  if (isMobile) {
    await page.getByTestId("hero-prev").tap()
  } else {
    await page.getByTestId("hero-prev").click()
  }
  await expect(hero).toHaveAttribute("data-slide", "0")

  await pauseClockSafely(page)
  if (isMobile) {
    await page.getByTestId("hero-autoplay-toggle").tap()
    // Blur focus on mobile so focusCapture does not hold hoverPaused=true
    await page
      .getByTestId("hero-autoplay-toggle")
      .evaluate((el) => (el as HTMLElement).blur())
  } else {
    await page.getByTestId("hero-autoplay-toggle").click()
    await page.mouse.move(0, 0)
    await page
      .getByTestId("hero-autoplay-toggle")
      .evaluate((el) => (el as HTMLElement).blur())
  }
  await expect(page.getByTestId("hero-autoplay-toggle")).toHaveAttribute(
    "aria-pressed",
    "true"
  )
  await page.clock.runFor(interval - 1)
  await expect(hero).toHaveAttribute("data-slide", "0")
  await page.clock.runFor(1)
  await expect(hero).toHaveAttribute("data-slide", "1")

  if (isMobile) {
    await page.getByTestId("hero-autoplay-toggle").tap()
  } else {
    await page.getByTestId("hero-autoplay-toggle").click()
    await page.mouse.move(0, 0)
  }
  await page.clock.runFor(interval * 2)
  await expect(hero).toHaveAttribute("data-slide", "1")
})

test("rack selection uses the actual published garment labels and responds to real pointer/touch", async ({
  page,
}) => {
  const isMobile = test.info().project.name === "mobile"
  await openHome(page)
  const rack = page.getByTestId("clothes-rack-section")
  await rack.scrollIntoViewIfNeeded()
  const buttons = rack.locator("[data-garments] button")
  await expect.poll(() => buttons.count()).toBeGreaterThan(1)
  await expect(rack.locator("[data-garments]")).toHaveAttribute(
    "aria-hidden",
    "false"
  )
  const firstName = (await buttons.nth(0).innerText()).trim()
  const secondName = (await buttons.nth(1).innerText()).trim()
  expect(firstName).not.toBe(secondName)
  const canvas = rack.locator("canvas").first()
  await expect(canvas).toBeVisible()

  if (isMobile) {
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    const restShot = await canvasImage(canvas)
    await page.touchscreen.tap(
      box!.x + box!.width * 0.5,
      box!.y + box!.height * 0.52
    )
    await expect
      .poll(async () => (await canvasImage(canvas)).equals(restShot))
      .toBe(false)
  }

  await buttons.nth(0).focus()
  await expect(rack.getByRole("status")).toContainText(firstName)
  const before = await canvasImage(canvas)
  await buttons.nth(1).focus()
  await expect(rack.getByRole("status")).toContainText(secondName)
  await expect
    .poll(async () => (await canvasImage(canvas)).equals(before))
    .toBe(false)
})

test("home shirt animates and responds to desktop buttons and real mobile touch drag", async ({
  page,
}) => {
  const isMobile = test.info().project.name === "mobile"
  await page.clock.install()
  await openHome(page)
  const section = page.getByTestId("tshirt3d-section")
  await section.scrollIntoViewIfNeeded()
  const canvas = section.locator("canvas")
  await expect(canvas).toBeVisible()
  await page.waitForLoadState("networkidle")
  const initial = await canvasImage(canvas)
  await expect
    .poll(async () => (await canvasImage(canvas)).equals(initial), {
      message: "Live shirt scene must animate",
    })
    .toBe(false)

  if (isMobile) {
    await page.getByTestId("tshirt3d-customize-btn").tap()
  } else {
    await page.getByTestId("tshirt3d-customize-btn").click()
  }
  await expect(section).toHaveAttribute("data-mode", "customizer")
  await expect(page.getByTestId("tshirt3d-intro")).toHaveCount(0)

  const autoplay = section.locator('button[aria-label="Otomatik döndürme"]')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()

  if (isMobile) {
    // On <640px mobile viewports, desktop helper buttons are intentionally hidden (hidden sm:flex);
    // rotation is controlled directly via real touch-drag on the 3D shirt mesh.
    await expect(autoplay).toBeHidden()

    // First let customizer camera finish damping from intro -> customizer pose
    await pauseClockSafely(page)
    await page.clock.runFor(4000)

    const cdp = await page.context().newCDPSession(page)
    await cdp.send("Emulation.setTouchEmulationEnabled", {
      enabled: true,
      maxTouchPoints: 5,
    })
    const settledBox = await canvas.boundingBox()
    expect(settledBox).not.toBeNull()
    const visibleTop = Math.max(90, settledBox!.y)
    const visibleBottom = Math.min(820, settledBox!.y + settledBox!.height)
    const startX = Math.round(settledBox!.x + settledBox!.width * 0.45)
    // Touch lower-mid torso below chest decal so pointer stays on main shirt mesh throughout drag
    const startY = Math.round(visibleTop + (visibleBottom - visibleTop) * 0.66)

    // Real hardware touch press on the 3D shirt sets dragRef.current.active = true (pausing sway)
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: startX, y: startY, radiusX: 4, radiusY: 4, id: 1 }],
    })
    await page.clock.runFor(6000)
    const heldTouchFrame = await canvasImage(canvas)
    await page.clock.runFor(500)
    expect(
      (await canvasImage(canvas)).equals(heldTouchFrame),
      "Active touch press on 3D shirt must stabilize sway"
    ).toBe(true)

    // Real horizontal touch drag across the 3D shirt rotates rotationYOffsetRef
    for (let step = 1; step <= 8; step++) {
      const nextX = Math.round(startX + (settledBox!.width * 0.25 * step) / 8)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: nextX, y: startY, radiusX: 4, radiusY: 4, id: 1 }],
      })
    }
    await page.clock.runFor(800)
    const rotatedFrame = await canvasImage(canvas)
    expect(
      rotatedFrame.equals(heldTouchFrame),
      "Real mobile touch drag must rotate the 3D shirt pose"
    ).toBe(false)

    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    })
  } else {
    await expect(autoplay).toBeVisible()
    await autoplay.click()
    await expect(autoplay).toHaveAttribute("aria-pressed", "false")
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await pauseClockSafely(page)
    await page.clock.runFor(5000)
    const beforeRotation = await canvasImage(canvas)
    await page.clock.runFor(500)
    expect(
      (await canvasImage(canvas)).equals(beforeRotation),
      "Disabled autoplay must leave a stable control frame"
    ).toBe(true)
    await section.getByRole("button", { name: "Sağa döndür", exact: true }).click()
    await page.clock.runFor(500)
    expect(
      (await canvasImage(canvas)).equals(beforeRotation),
      "Rotation control must change the frozen scene pose"
    ).toBe(false)
  }
})

test("menu opens and closes; product card retains hover and touch-accessible link", async ({
  page,
}) => {
  const isMobile = test.info().project.name === "mobile"
  await openHome(page)
  const menu = page.getByTestId("nav-menu-button")
  if (isMobile) {
    await menu.tap()
    await expect(page.getByTestId("nav-menu-popup")).toBeVisible()
    await page.getByTestId("close-menu-button").tap()
  } else {
    await menu.click()
    await expect(page.getByTestId("nav-menu-popup")).toBeVisible()
    await page.getByTestId("close-menu-button").click()
  }
  await expect(page.getByTestId("nav-menu-popup")).not.toBeVisible()

  const card = page.getByTestId("product-wrapper").first()
  await card.scrollIntoViewIfNeeded()
  const title = card.getByTestId("product-title")
  if (isMobile) {
    const link = card.locator("xpath=ancestor::a[1]")
    await expect(link).toHaveAttribute("href", /\/products\//)
  } else {
    const before = await title.evaluate((el) => getComputedStyle(el).color)
    await card.hover()
    await expect
      .poll(() => title.evaluate((el) => getComputedStyle(el).color))
      .not.toBe(before)
  }
})

test("studio uploads artwork, changes physical scale and rotation without saving", async ({
  page,
}) => {
  const isMobile = test.info().project.name === "mobile"
  const response = await page.goto(
    "/tr/products/premium-oversize-penye-t-shirt?studio=1",
    { waitUntil: "networkidle" }
  )
  expect(response?.status()).toBe(200)
  const panel = page.locator(".studio-panel")
  await expect(panel).toBeVisible()
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 600
    canvas.height = 300
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#B29460"
    ctx.fillRect(0, 0, 600, 300)
    ctx.clearRect(30, 30, 100, 100)
    return canvas.toDataURL("image/png").split(",")[1]
  })
  await page.getByLabel("Logo veya görsel yükle").setInputFiles({
    name: "behavior-artwork.png",
    mimeType: "image/png",
    buffer: Buffer.from(png, "base64"),
  })
  if (isMobile) {
    await panel.getByRole("button", { name: /Tasarım Araçları/ }).tap()
  }
  await expect(panel.getByAltText("Yüklenen logo")).toBeVisible()
  const width = panel.locator('.studio-transforms input[type="number"]').nth(0)
  const rotation = panel
    .locator('.studio-transforms input[type="number"]')
    .nth(3)
  await width.fill("150")
  await expect(width).toHaveValue("150")
  await expect(panel.locator(".studio-dimension-badge")).toContainText(
    "150 × 75"
  )
  await rotation.fill("35")
  await expect(rotation).toHaveValue("35")
  await expect(
    panel.locator('.studio-transforms input[type="range"]').nth(3)
  ).toHaveValue("35")
  await expect(page.getByTestId("saved-design")).toHaveCount(0)
})
