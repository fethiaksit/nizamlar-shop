import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e/calibration",
  testIgnore: ["**/._*"],
  timeout: 180_000,
  expect: { timeout: 30_000 },
  workers: 1,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "../../artifacts/dtf-stabilization/calibration/results.json" }]],
  outputDir: "../../artifacts/dtf-stabilization/calibration/results",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:8000",
    launchOptions: { channel: "chrome" },
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    colorScheme: "light",
    deviceScaleFactor: 1,
    serviceWorkers: "block",
    trace: "retain-on-failure",
  },
  projects: [390, 768, 1024, 1440, 1920].map((width) => ({
    name: `width-${width}`,
    use: { viewport: { width, height: width === 390 ? 844 : 1080 }, hasTouch: width <= 768 },
  })),
})
