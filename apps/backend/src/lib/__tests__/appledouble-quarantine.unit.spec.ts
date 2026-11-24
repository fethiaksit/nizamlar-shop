import fs from "node:fs"
import os from "node:os"
import path from "node:path"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const quarantineModule = require("../../../../../scripts/quarantine-appledouble.cjs") as {
  isVerifiedAppleDoubleFile: (filePath: string) => boolean
  quarantineAppleDoubleFiles: (opts: {
    repoRoot: string
  }) => { from: string; to: string }[]
}

const APPLE_DOUBLE_MAGIC = Buffer.from([0x00, 0x05, 0x16, 0x07])

describe("appledouble quarantine utility", () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nizamlar-appledouble-"))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it("moves only verified AppleDouble sidecar files and never deletes real source files", () => {
    const srcDir = path.join(tmpDir, "apps", "backend", "src", "subscribers")
    fs.mkdirSync(srcDir, { recursive: true })

    const realSource = path.join(srcDir, "order-placed.ts")
    const fakeSidecar = path.join(srcDir, "._not-metadata.ts")
    const verifiedSidecar = path.join(srcDir, "._order-placed.ts")

    fs.writeFileSync(realSource, "export default async function handler() {}\n")
    fs.writeFileSync(fakeSidecar, "// real text file named with dot-underscore\n")
    fs.writeFileSync(
      verifiedSidecar,
      Buffer.concat([APPLE_DOUBLE_MAGIC, Buffer.alloc(4092, 0)])
    )

    expect(quarantineModule.isVerifiedAppleDoubleFile(realSource)).toBe(false)
    expect(quarantineModule.isVerifiedAppleDoubleFile(fakeSidecar)).toBe(false)
    expect(quarantineModule.isVerifiedAppleDoubleFile(verifiedSidecar)).toBe(
      true
    )

    const moved = quarantineModule.quarantineAppleDoubleFiles({
      repoRoot: tmpDir,
    })

    expect(moved).toHaveLength(1)
    expect(moved[0].from).toBe("apps/backend/src/subscribers/._order-placed.ts")
    expect(fs.existsSync(realSource)).toBe(true)
    expect(fs.existsSync(fakeSidecar)).toBe(true)
    expect(fs.existsSync(verifiedSidecar)).toBe(false)
    expect(fs.existsSync(path.join(tmpDir, moved[0].to))).toBe(true)
  })
})
