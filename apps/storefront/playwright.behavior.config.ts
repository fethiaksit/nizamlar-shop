import { defineConfig } from "@playwright/test"
import { existsSync } from "node:fs"

for (const name of [".env.local", ".env"]) {
  if (existsSync(name)) process.loadEnvFile(name)
}

export default defineConfig({
  testDir: "./e2e/behavior",
  testIgnore: ["**/._*"],
  timeout: 90_000,
  expect: { timeout: 20_000 },
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    [
      "json",
      { outputFile: "../../artifacts/dtf-stabilization/behavior/results.json" },
    ],
  ],
  outputDir: "../../artifacts/dtf-stabilization/behavior/results",
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:8000",
    launchOptions: { channel: "chrome" },
    deviceScaleFactor: 1,
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
})
