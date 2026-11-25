const crypto = require("node:crypto")
const fs = require("node:fs")
const path = require("node:path")
const zlib = require("node:zlib")

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex")
}

function decodePng(filePath) {
  const buf = fs.readFileSync(filePath)
  let pos = 8
  let width = 0
  let height = 0
  let colorType = 0
  const idats = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString("ascii", pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === "IHDR") {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      colorType = data[9]
    } else if (type === "IDAT") {
      idats.push(data)
    }
    pos += 12 + len
  }
  const bpp = colorType === 6 ? 4 : 3
  const raw = zlib.inflateSync(Buffer.concat(idats))
  const stride = width * bpp
  const pixels = Buffer.alloc(height * stride)
  const paeth = (a, b, c) => {
    const p = a + b - c
    const pa = Math.abs(p - a)
    const pb = Math.abs(p - b)
    const pc = Math.abs(p - c)
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
  }
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)]
    const ri = y * (stride + 1) + 1
    const ro = y * stride
    for (let i = 0; i < stride; i++) {
      const x = raw[ri + i]
      const a = i >= bpp ? pixels[ro + i - bpp] : 0
      const b = y > 0 ? pixels[ro - stride + i] : 0
      const c = y > 0 && i >= bpp ? pixels[ro - stride + i - bpp] : 0
      const val =
        f === 0
          ? x
          : f === 1
            ? x + a
            : f === 2
              ? x + b
              : f === 3
                ? x + ((a + b) >> 1)
                : x + paeth(a, b, c)
      pixels[ro + i] = val & 255
    }
  }
  return { width, height, bpp, pixels }
}

function comparePngPair(origPath, candPath) {
  const origHash = sha256File(origPath)
  const candHash = sha256File(candPath)
  if (origHash === candHash) {
    return {
      identicalBytes: true,
      origSha256: origHash,
      candSha256: candHash,
      diffPixelsAny: 0,
      diffPixelsAboveThreshold: 0,
      maxChannelDelta: 0,
      bbox: null,
    }
  }
  const p1 = decodePng(origPath)
  const p2 = decodePng(candPath)
  if (p1.width !== p2.width || p1.height !== p2.height) {
    return {
      identicalBytes: false,
      origSha256: origHash,
      candSha256: candHash,
      dimensionMismatch: {
        orig: [p1.width, p1.height],
        cand: [p2.width, p2.height],
      },
      diffPixelsAny: -1,
      diffPixelsAboveThreshold: -1,
      maxChannelDelta: 255,
      bbox: null,
    }
  }
  let diffAny = 0
  let diffAboveThreshold = 0
  let maxDelta = 0
  let minX = 1e9
  let minY = 1e9
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < p1.height; y++) {
    for (let x = 0; x < p1.width; x++) {
      const idx = (y * p1.width + x) * p1.bpp
      const d = Math.max(
        Math.abs(p1.pixels[idx] - p2.pixels[idx]),
        Math.abs(p1.pixels[idx + 1] - p2.pixels[idx + 1]),
        Math.abs(p1.pixels[idx + 2] - p2.pixels[idx + 2])
      )
      if (d > 0) {
        diffAny++
        maxDelta = Math.max(maxDelta, d)
        if (d > 25) {
          diffAboveThreshold++
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }
  }
  return {
    identicalBytes: false,
    width: p1.width,
    height: p1.height,
    origSha256: origHash,
    candSha256: candHash,
    diffPixelsAny: diffAny,
    diffPixelsAboveThreshold: diffAboveThreshold,
    maxChannelDelta: maxDelta,
    bbox: diffAboveThreshold > 0 ? [minX, minY, maxX, maxY] : null,
  }
}

function listPngRelPaths(rootDir) {
  const out = []
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith("._")) continue
      const full = path.join(dir, ent.name)
      if (ent.isDirectory()) walk(full)
      else if (ent.isFile() && ent.name.endsWith(".png")) {
        out.push(path.relative(rootDir, full))
      }
    }
  }
  walk(rootDir)
  return out.sort()
}

if (require.main === module) {
  const repoRoot = path.resolve(__dirname, "..")
  const origRoot = path.join(
    repoRoot,
    "apps/storefront/e2e/visual/baselines"
  )
  const archiveRoot = path.join(
    repoRoot,
    "artifacts/dtf-stabilization/archived-original-baselines"
  )
  const candRoot = path.join(
    repoRoot,
    "apps/storefront/e2e/visual/candidate-baselines"
  )
  const manifest = JSON.parse(
    fs.readFileSync(path.join(origRoot, "manifest.json"), "utf8")
  )

  const origFiles = listPngRelPaths(origRoot)
  let manifestVerified = 0
  let archiveVerified = 0
  const comparisons = []

  for (const rel of origFiles) {
    const origPath = path.join(origRoot, rel)
    const archPath = path.join(archiveRoot, rel)
    const candPath = path.join(candRoot, rel)
    const origSha = sha256File(origPath)
    const expectedManifestSha =
      manifest.images?.[`apps/storefront/e2e/visual/baselines/${rel}`] ||
      manifest.images?.[rel] ||
      manifest.files?.[rel]
    if (!expectedManifestSha || expectedManifestSha === origSha) {
      manifestVerified++
    }
    if (fs.existsSync(archPath) && sha256File(archPath) === origSha) {
      archiveVerified++
    }
    if (fs.existsSync(candPath)) {
      comparisons.push({
        file: rel,
        ...comparePngPair(origPath, candPath),
      })
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    originalCount: origFiles.length,
    manifestIntegrityCount: manifestVerified,
    archiveIntegrityCount: archiveVerified,
    candidateCount: comparisons.length,
    exactThresholdPassingCount: comparisons.filter(
      (c) => c.diffPixelsAboveThreshold === 0
    ).length,
    differingFromOriginal: comparisons.filter(
      (c) => c.diffPixelsAboveThreshold > 0
    ),
  }

  const outJson = path.join(
    repoRoot,
    "artifacts/dtf-stabilization/baseline-comparison-report.json"
  )
  fs.mkdirSync(path.dirname(outJson), { recursive: true })
  fs.writeFileSync(outJson, JSON.stringify({ summary, comparisons }, null, 2))
  console.log(JSON.stringify(summary, null, 2))
}
