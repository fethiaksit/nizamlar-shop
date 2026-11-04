const fs = require("node:fs")
const path = require("node:path")
const { build } = require("esbuild")
async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright")
  const bundled = await build({ entryPoints: [path.join(__dirname, "export-shirt-entry.ts")], bundle: true, write: false, format: "iife" })
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true })
  try {
    const page = await browser.newPage()
    await page.goto("http://localhost:8000/tr")
    await page.addScriptTag({ content: bundled.outputFiles[0].text })
    const result = await page.evaluate(() => window.exportNizamlarShirt())
    fs.writeFileSync(path.join(__dirname, "../apps/storefront/public/models/nizamlar-tee.glb"), Buffer.from(result.data, "base64"))
    console.log("Exported metric tee:", result.dimensions)
  } finally { await browser.close() }
}
main().catch(e => { console.error(e); process.exitCode = 1 })
