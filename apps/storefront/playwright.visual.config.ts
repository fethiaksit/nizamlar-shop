import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e/visual",
  testIgnore: ["**/._*"],
  timeout: 120_000,
  expect: {
    timeout: 30_000,
    toHaveScreenshot: { maxDiffPixels: 0, threshold: 0.1 },
  },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  updateSnapshots: process.env.VISUAL_CAPTURE === "1" ? "missing" : "none",
  snapshotPathTemplate:
    "{testDir}/baselines/{projectName}/{testFilePath}/{arg}{ext}",
  outputDir: "../../artifacts/dtf-visual/results",
  reporter: [
    ["list"],
    ["html", { outputFolder: "../../artifacts/dtf-visual/report", open: "never" }],
    ["json", { outputFile: "../../artifacts/dtf-visual/results.json" }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:8000",
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    colorScheme: "light",
    deviceScaleFactor: 1,
    serviceWorkers: "block",
    launchOptions: {
      ...(process.env.CHROME_PATH
        ? { executablePath: process.env.CHROME_PATH }
        : { channel: "chrome" }),
    },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [390, 768, 1024, 1440, 1920].map((width) => ({
    name: `width-${width}`,
    use: {
      viewport: { width, height: width === 390 ? 844 : 1080 },
      hasTouch: width <= 768,
    },
  })),
})
