import * as THREE from "three"

export type NizamlarLogoStyle =
  | "tee-chest-and-center"
  | "tee-atelier-minimal"
  | "sweatshirt-signature"
  | "sweatshirt-embossed"
  | "sweater-embroidery"
  | "sweater-atelier-crest"

export type NizamlarPrintSpec = {
  kind: "nizamlar"
  style: NizamlarLogoStyle
  primaryInk: string
  accentInk: string
  badgeBg: string
  badgeBorder: string
  subtitle?: string
  code?: string
}

type Pt = [number, number]

type PatternMetrics = {
  half: number
  shoulderX: number
  shoulderDrop: number
  armpit: number
  length: number
  neckHalf: number
  neckFront: number
  neckBack: number
}

type BoxMetrics = {
  x0: number
  y0: number
  y1: number
  w: number
  h: number
  texW: number
  texH: number
}

// -----------------------------------------------------------------------------
// 1. Official Corporate Logo Asset Preloader (/brand/logo.svg, /brand/logo-light.svg, /brand/sample-monogram.svg)
// -----------------------------------------------------------------------------

type BrandImages = {
  logoDark: HTMLImageElement | null
  logoLight: HTMLImageElement | null
  monogram: HTMLImageElement | null
}

let brandImagesPromise: Promise<BrandImages> | null = null
let cachedBrandImages: BrandImages = {
  logoDark: null,
  logoLight: null,
  monogram: null,
}

function loadSvgImage(src: string): Promise<HTMLImageElement | null> {
  if (typeof window === "undefined") return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

export function ensureBrandLogos(): Promise<BrandImages> {
  if (!brandImagesPromise) {
    brandImagesPromise = Promise.all([
      loadSvgImage("/brand/logo.svg"),
      loadSvgImage("/brand/logo-light.svg"),
      loadSvgImage("/brand/sample-monogram.svg"),
    ]).then(([logoDark, logoLight, monogram]) => {
      cachedBrandImages = { logoDark, logoLight, monogram }
      return cachedBrandImages
    })
  }
  return brandImagesPromise
}

export function getBrandLogos(): BrandImages {
  return cachedBrandImages
}

// -----------------------------------------------------------------------------
// 2. High-Definition Procedural PBR Normal & Roughness Maps (Jersey, Fleece, Knit Sweater)
// -----------------------------------------------------------------------------

type FabricPBR = {
  normal: THREE.CanvasTexture
  roughness: THREE.CanvasTexture
  normalScale: number
}

const PBR_CACHE = new Map<"tee" | "crewneck" | "sweater", FabricPBR>()

function hash2D(x: number, y: number, seed: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453
  return h - Math.floor(h)
}

export function getProceduralFabricPBR(
  kind: "tee" | "crewneck" | "sweater",
): FabricPBR {
  const existing = PBR_CACHE.get(kind)
  if (existing) return existing

  const N = 128
  const hgt = new Float32Array(N * N)
  const rgh = new Float32Array(N * N)

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = x / N
      const v = y / N
      const noise = (hash2D(x, y, kind === "sweater" ? 31 : 17) - 0.5) * 0.22

      if (kind === "tee") {
        // 240 GSM Combed Cotton Single Jersey: fine interlock V-stitches
        const wales = 16
        const courses = 20
        const row = Math.floor(v * courses)
        const loop = Math.abs(
          Math.sin(
            Math.PI *
              (u * wales + (row % 2) * 0.5 + (v * courses - row) * 0.55),
          ),
        )
        const waleRidge = 0.5 + 0.5 * Math.cos(2 * Math.PI * u * wales)
        const h = 0.55 * loop + 0.3 * waleRidge + noise * 0.5
        hgt[y * N + x] = h
        rgh[y * N + x] = 0.88 + (1 - h) * 0.08
      } else if (kind === "crewneck") {
        // 340 GSM Heavy 3-Thread Fleece: dense diagonal French-terry/fleece twill backing & matte face
        const wales = 14
        const courses = 14
        const diag = Math.sin(2 * Math.PI * (u * wales + v * courses * 0.5))
        const cross = Math.abs(Math.cos(Math.PI * (u * wales - v * courses)))
        const loft =
          (hash2D(Math.floor(x / 2), Math.floor(y / 2), 53) - 0.5) * 0.35
        const h = 0.45 * (0.5 + 0.5 * diag) + 0.35 * cross + loft + noise * 0.4
        hgt[y * N + x] = h
        rgh[y * N + x] = 0.91 + (1 - h) * 0.07
      } else {
        // 12-Gauge Merino/Cotton Knitwear (Kazak): pronounced vertical V-rib wales & purl loop crowns
        const wales = 8
        const courses = 10
        const wu = (u * wales) % 1
        const cv = (v * courses) % 1
        // V-shaped knit loop: left leg and right leg meeting at bottom of stitch
        const vShape = Math.cos(
          Math.PI * ((wu - 0.5) * 2.2 - (cv - 0.5) * (wu < 0.5 ? 0.9 : -0.9)),
        )
        const waleChannel = Math.sin(Math.PI * wu)
        const courseCrown = 0.5 + 0.5 * Math.sin(2 * Math.PI * cv)
        const yarnTwist =
          0.18 * Math.sin(2 * Math.PI * (u * wales * 3 + v * courses * 2))
        const h =
          0.52 * waleChannel * (0.65 + 0.35 * vShape) +
          0.28 * courseCrown +
          yarnTwist +
          noise * 0.35
        hgt[y * N + x] = h
        rgh[y * N + x] = 0.84 + (1 - Math.max(0, Math.min(1, h))) * 0.13
      }
    }
  }

  const normCanvas = document.createElement("canvas")
  normCanvas.width = N
  normCanvas.height = N
  const normCtx = normCanvas.getContext("2d")!
  const normImg = normCtx.createImageData(N, N)

  const roughCanvas = document.createElement("canvas")
  roughCanvas.width = N
  roughCanvas.height = N
  const roughCtx = roughCanvas.getContext("2d")!
  const roughImg = roughCtx.createImageData(N, N)

  const strength = kind === "sweater" ? 3.2 : kind === "crewneck" ? 2.4 : 2.1

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const H = (ix: number, iy: number) =>
        hgt[((iy + N) % N) * N + ((ix + N) % N)] ?? 0
      const hx = H(x + 1, y) - H(x - 1, y)
      const hy = H(x, y + 1) - H(x, y - 1)
      const n = new THREE.Vector3(
        -hx * strength,
        -hy * strength,
        1,
      ).normalize()
      const idx = (y * N + x) * 4
      normImg.data[idx] = Math.round((n.x * 0.5 + 0.5) * 255)
      normImg.data[idx + 1] = Math.round((n.y * 0.5 + 0.5) * 255)
      normImg.data[idx + 2] = Math.round((n.z * 0.5 + 0.5) * 255)
      normImg.data[idx + 3] = 255

      const rv = Math.max(
        0,
        Math.min(255, Math.round((rgh[y * N + x] ?? 0.9) * 255)),
      )
      roughImg.data[idx] = rv
      roughImg.data[idx + 1] = rv
      roughImg.data[idx + 2] = rv
      roughImg.data[idx + 3] = 255
    }
  }

  normCtx.putImageData(normImg, 0, 0)
  roughCtx.putImageData(roughImg, 0, 0)

  const normal = new THREE.CanvasTexture(normCanvas)
  normal.colorSpace = THREE.NoColorSpace
  normal.wrapS = normal.wrapT = THREE.RepeatWrapping

  const roughness = new THREE.CanvasTexture(roughCanvas)
  roughness.colorSpace = THREE.NoColorSpace
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping

  const result: FabricPBR = {
    normal,
    roughness,
    normalScale:
      kind === "sweater" ? 1.05 : kind === "crewneck" ? 0.72 : 0.52,
  }
  PBR_CACHE.set(kind, result)
  return result
}

// -----------------------------------------------------------------------------
// 3. Garment Construction Details (Woven Neck Tag, Sweatshirt V-Gusset, Knitwear Wales)
// -----------------------------------------------------------------------------

export function drawWovenNeckLabel(
  ctx: CanvasRenderingContext2D,
  p: PatternMetrics,
  toPx: (x: number, y: number) => Pt,
  unit: number,
) {
  // Back panel inside neck label — visible through the front collar opening!
  const [cx, cy] = toPx(0, -p.neckBack - 0.032)
  const w = 0.068 * unit
  const h = 0.034 * unit
  ctx.save()
  ctx.fillStyle = "rgba(0,0,0,0.22)"
  ctx.fillRect(cx - w / 2 + 1.5, cy - h / 2 + 2, w, h)
  ctx.fillStyle = "#1B1C1E"
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h)
  ctx.strokeStyle = "#B29460"
  ctx.lineWidth = Math.max(1, unit * 0.0012)
  ctx.strokeRect(cx - w / 2 + 2, cy - h / 2 + 2, w - 4, h - 4)
  ctx.fillStyle = "#F3EFE7"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = `800 ${Math.max(8, Math.round(h * 0.34))}px 'Plus Jakarta Sans', sans-serif`
  ctx.fillText("NİZAMLAR", cx, cy - h * 0.1)
  ctx.fillStyle = "#C4A774"
  ctx.font = `600 ${Math.max(5, Math.round(h * 0.2))}px 'Plus Jakarta Sans', sans-serif`
  ctx.fillText("ATELIER · TR", cx, cy + h * 0.22)
  ctx.restore()
}

export function drawSweatshirtConstruction(
  ctx: CanvasRenderingContext2D,
  p: PatternMetrics,
  toPx: (x: number, y: number) => Pt,
  unit: number,
  colour: string,
  dark: boolean,
) {
  // Classic Sweatshirt Ribbed V-Insert ("Dorito" Gusset) below front collar
  const ribW = 0.024
  const vTopY = -p.neckFront - ribW * 0.85
  const vHalfW = 0.044
  const vBotY = vTopY - 0.056
  const [lx, ly] = toPx(-vHalfW, vTopY)
  const [rx, ry] = toPx(vHalfW, vTopY)
  const [bx, by] = toPx(0, vBotY)

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(lx, ly)
  ctx.lineTo(rx, ry)
  ctx.lineTo(bx, by)
  ctx.closePath()
  ctx.fillStyle = dark ? "rgba(0,0,0,0.16)" : "rgba(0,0,0,0.055)"
  ctx.fill()

  // Fine vertical ribs inside the V-gusset
  ctx.save()
  ctx.clip()
  ctx.fillStyle = dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"
  for (let x = lx; x <= rx; x += 3.2) {
    ctx.fillRect(x, ly, 1.3, by - ly)
  }
  ctx.restore()

  // Twin-needle coverstitch along the V-insert
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.18)"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(lx, ly)
  ctx.lineTo(bx, by)
  ctx.lineTo(rx, ry)
  ctx.stroke()

  ctx.setLineDash([3.5, 2.5])
  ctx.lineWidth = 1.1
  ctx.beginPath()
  ctx.moveTo(lx - 3, ly)
  ctx.lineTo(bx, by + 4)
  ctx.lineTo(rx + 3, ry)
  ctx.stroke()
  ctx.restore()
}

let sweaterKnitTileCache: HTMLCanvasElement | null = null
function getSweaterKnitTile(): HTMLCanvasElement {
  if (sweaterKnitTileCache) return sweaterKnitTileCache
  const tile = document.createElement("canvas")
  tile.width = 48
  tile.height = 48
  const g = tile.getContext("2d")!
  // Fine vertical wales + V-shaped knit purl texture
  for (let x = 0; x < 48; x += 6) {
    g.fillStyle = "rgba(0,0,0,0.042)"
    g.fillRect(x, 0, 1.6, 48)
    g.fillStyle = "rgba(255,255,255,0.038)"
    g.fillRect(x + 2, 0, 1.4, 48)
    for (let y = 0; y < 48; y += 6) {
      g.strokeStyle = "rgba(0,0,0,0.038)"
      g.lineWidth = 1
      g.beginPath()
      g.moveTo(x + 0.8, y + 1)
      g.lineTo(x + 3, y + 4.5)
      g.lineTo(x + 5.2, y + 1)
      g.stroke()
    }
  }
  sweaterKnitTileCache = tile
  return tile
}

export function drawSweaterKnitOverlay(
  ctx: CanvasRenderingContext2D,
  texW: number,
  texH: number,
  p?: PatternMetrics,
  toPx?: (x: number, y: number) => Pt,
  dark?: boolean,
) {
  ctx.save()
  const pat = ctx.createPattern(getSweaterKnitTile(), "repeat")
  if (pat) {
    ctx.fillStyle = pat
    ctx.fillRect(0, 0, texW, texH)
  }

  // Fully-fashioned knitwear decrease stitch marks along upper armholes
  if (p && toPx) {
    ctx.strokeStyle = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.13)"
    ctx.lineWidth = 2.2
    for (const side of [-1, 1] as const) {
      for (let i = 1; i <= 7; i++) {
        const t = i / 9
        const x = side * (p.shoulderX * (1 - t) + p.half * t - 0.022)
        const y = -(p.shoulderDrop * (1 - t) + p.armpit * t)
        const [px, py] = toPx(x, y)
        ctx.beginPath()
        ctx.moveTo(px - side * 4, py - 2)
        ctx.lineTo(px + side * 4, py + 2)
        ctx.stroke()
      }
    }
  }
  ctx.restore()
}

// -----------------------------------------------------------------------------
// 4. Authentic Corporate Nizamlar Monogram & Typography Renderer (3D Puff / Embroidery / Relief)
// -----------------------------------------------------------------------------

function drawMonogramMark(
  g: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  bg: string,
  border: string,
  primaryStroke: string,
  secondaryStroke: string,
  embroidery: boolean,
) {
  const half = size / 2
  const r = size * 0.17
  const x0 = cx - half
  const y0 = cy - half

  g.save()
  // 1. Contact drop shadow on fabric
  g.shadowColor = "rgba(0, 0, 0, 0.38)"
  g.shadowBlur = size * 0.07
  g.shadowOffsetX = 0
  g.shadowOffsetY = size * 0.045

  // 2. Badge base rounded square (from logo.svg: rect 48x48 rx=8)
  g.fillStyle = bg
  g.beginPath()
  g.roundRect(x0, y0, size, size, r)
  g.fill()

  g.shadowColor = "transparent"

  // 3. Top-left bevel highlight & border
  g.strokeStyle = border
  g.lineWidth = Math.max(1.8, size * 0.042)
  g.beginPath()
  g.roundRect(x0, y0, size, size, r)
  g.stroke()

  if (embroidery) {
    // Stitched inner embroidery border
    g.save()
    g.strokeStyle = primaryStroke
    g.globalAlpha = 0.55
    g.lineWidth = Math.max(1.1, size * 0.022)
    g.setLineDash([size * 0.06, size * 0.04])
    g.beginPath()
    g.roundRect(
      x0 + size * 0.065,
      y0 + size * 0.065,
      size * 0.87,
      size * 0.87,
      r * 0.75,
    )
    g.stroke()
    g.restore()
  }

  // Coordinate helper mapping 48x48 logo.svg box (x: 4..52, y: 8..56) to [x0..x0+size, y0..y0+size]
  const mapX = (svgX: number) => x0 + ((svgX - 4) / 48) * size
  const mapY = (svgY: number) => y0 + ((svgY - 8) / 48) * size

  // 4. Three corporate print dots at top (from logo.svg lines 8-10)
  const dotRadius = size * 0.044
  const dots: [number, string][] = [
    [20, "#B29460"],
    [28, "#C9C1B5"],
    [36, "#7A5C4D"],
  ]
  for (const [dx, col] of dots) {
    g.fillStyle = col
    g.beginPath()
    g.arc(mapX(dx), mapY(16.5), dotRadius, 0, Math.PI * 2)
    g.fill()
  }

  // 5. Primary 'N' path (from logo.svg line 5: M16 44V20L32 38V20)
  g.lineCap = "round"
  g.lineJoin = "round"
  g.shadowColor = "rgba(0, 0, 0, 0.35)"
  g.shadowBlur = size * 0.03
  g.shadowOffsetY = size * 0.025

  g.strokeStyle = primaryStroke
  g.lineWidth = size * 0.068
  g.beginPath()
  g.moveTo(mapX(15.5), mapY(44))
  g.lineTo(mapX(15.5), mapY(21))
  g.lineTo(mapX(31.5), mapY(39))
  g.lineTo(mapX(31.5), mapY(21))
  g.stroke()

  // 6. Secondary wing path (from logo.svg line 6: M32 44V26L40 35)
  g.strokeStyle = secondaryStroke
  g.lineWidth = size * 0.054
  g.beginPath()
  g.moveTo(mapX(31.5), mapY(44))
  g.lineTo(mapX(31.5), mapY(26.5))
  g.lineTo(mapX(40.5), mapY(35.5))
  g.stroke()

  g.restore()
}

function drawReliefText(
  g: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fill: string,
  bevelHighlight = "rgba(255,255,255,0.28)",
  shadowAlpha = 0.34,
) {
  g.save()
  // Pressed contact shadow
  g.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`
  g.fillText(text, x + 0.8, y + 2.4)
  // Top-left raised bevel highlight
  g.fillStyle = bevelHighlight
  g.fillText(text, x - 0.8, y - 1.1)
  // Main ink/thread body
  g.fillStyle = fill
  g.fillText(text, x, y)
  g.restore()
}

export function drawNizamlarLogoPrint(
  ctx: CanvasRenderingContext2D,
  spec: NizamlarPrintSpec,
  p: PatternMetrics,
  box: BoxMetrics,
) {
  const unit = box.texW / box.w
  const toPx = (x: number, y: number): Pt => [
    (x - box.x0) * unit,
    (box.y1 - y) * unit,
  ]
  const bodyW = 2 * p.half * 0.82 * unit
  const [cx, chestY] = toPx(0, -p.neckFront - 0.165)
  const [leftChestX, leftChestY] = toPx(
    p.neckHalf + 0.048,
    -p.neckFront - 0.068,
  )

  const g = ctx
  g.save()
  g.textAlign = "center"
  g.textBaseline = "middle"

  const logos = getBrandLogos()

  if (spec.style === "tee-chest-and-center") {
    // 1. Left-chest corporate Nizamlar Monogram Badge (embossed patch)
    const leftBadgeSize = bodyW * 0.135
    drawMonogramMark(
      g,
      leftChestX,
      leftChestY,
      leftBadgeSize,
      spec.badgeBg,
      spec.badgeBorder,
      spec.accentInk,
      "#F3EFE7",
      false,
    )

    // 2. Center-chest high-contrast NİZAMLAR BASKI corporate lockup (so it is unmistakable even from a distance)
    const centerY = chestY + bodyW * 0.055
    const ruleW = bodyW * 0.56

    // Top gold rule with diamond accent
    g.strokeStyle = spec.accentInk
    g.lineWidth = Math.max(1.8, bodyW * 0.0045)
    g.beginPath()
    g.moveTo(cx - ruleW / 2, centerY - bodyW * 0.13)
    g.lineTo(cx - bodyW * 0.04, centerY - bodyW * 0.13)
    g.moveTo(cx + bodyW * 0.04, centerY - bodyW * 0.13)
    g.lineTo(cx + ruleW / 2, centerY - bodyW * 0.13)
    g.stroke()

    g.fillStyle = spec.accentInk
    g.beginPath()
    g.arc(cx, centerY - bodyW * 0.13, bodyW * 0.009, 0, Math.PI * 2)
    g.fill()

    // Main "NİZAMLAR" bold wordmark
    const titleSize = Math.round(bodyW * 0.125)
    g.font = `900 ${titleSize}px 'Plus Jakarta Sans', 'Montserrat', 'Arial Black', sans-serif`
    drawReliefText(
      g,
      "NİZAMLAR",
      cx,
      centerY - bodyW * 0.035,
      spec.primaryInk,
      "rgba(255,255,255,0.25)",
      0.32,
    )

    // "BASKI · ATELIER" sub-headline
    const subSize = Math.round(bodyW * 0.044)
    g.font = `800 ${subSize}px 'Plus Jakarta Sans', 'Montserrat', sans-serif`
    drawReliefText(
      g,
      spec.subtitle || "B A S K I   ·   A T E L I E R",
      cx,
      centerY + bodyW * 0.055,
      spec.accentInk,
      "rgba(255,255,255,0.18)",
      0.28,
    )

    // Bottom rule + EST. 1994
    g.strokeStyle = spec.accentInk
    g.lineWidth = Math.max(1.4, bodyW * 0.0035)
    g.beginPath()
    g.moveTo(cx - ruleW * 0.38, centerY + bodyW * 0.105)
    g.lineTo(cx + ruleW * 0.38, centerY + bodyW * 0.105)
    g.stroke()

    const microSize = Math.round(bodyW * 0.024)
    g.font = `700 ${microSize}px 'Plus Jakarta Sans', monospace`
    g.fillStyle = spec.primaryInk
    g.fillText(
      spec.code || "TEKSTİL BASKI SANAYİ  ·  240 GSM COMBED COTTON",
      cx,
      centerY + bodyW * 0.138,
    )
  } else if (spec.style === "tee-atelier-minimal") {
    // Left chest prominent Nizamlar Monogram + wordmark lockup + center architectural badge
    const badgeSize = bodyW * 0.155
    drawMonogramMark(
      g,
      leftChestX - badgeSize * 0.25,
      leftChestY,
      badgeSize,
      spec.badgeBg,
      spec.badgeBorder,
      spec.accentInk,
      "#F3EFE7",
      false,
    )

    // Center high-contrast horizontal lockup plaque
    const plaqueW = bodyW * 0.62
    const plaqueH = bodyW * 0.19
    const py = chestY + bodyW * 0.05
    g.save()
    g.shadowColor = "rgba(0,0,0,0.34)"
    g.shadowBlur = bodyW * 0.018
    g.shadowOffsetY = bodyW * 0.01
    g.fillStyle = spec.badgeBg
    g.beginPath()
    g.roundRect(cx - plaqueW / 2, py - plaqueH / 2, plaqueW, plaqueH, 10)
    g.fill()
    g.shadowColor = "transparent"
    g.strokeStyle = spec.badgeBorder
    g.lineWidth = Math.max(2, bodyW * 0.005)
    g.stroke()

    const tSize = Math.round(bodyW * 0.088)
    g.font = `900 ${tSize}px 'Plus Jakarta Sans', 'Montserrat', sans-serif`
    drawReliefText(
      g,
      "NİZAMLAR",
      cx,
      py - plaqueH * 0.12,
      spec.primaryInk,
      "rgba(255,255,255,0.22)",
      0.35,
    )
    const sSize = Math.round(bodyW * 0.03)
    g.font = `700 ${sSize}px 'Plus Jakarta Sans', sans-serif`
    g.fillStyle = spec.accentInk
    g.fillText(
      spec.subtitle || "PREMIUM TEXTILE  ·  EST. 1994",
      cx,
      py + plaqueH * 0.27,
    )
    g.restore()
  } else if (
    spec.style === "sweatshirt-signature" ||
    spec.style === "sweatshirt-embossed"
  ) {
    // Heavyweight Sweatshirt Chest Center Emblem + Monogram + Puff Typography
    const centerY = chestY + bodyW * 0.04
    const badgeSize = bodyW * 0.175
    drawMonogramMark(
      g,
      cx,
      centerY - bodyW * 0.115,
      badgeSize,
      spec.badgeBg,
      spec.badgeBorder,
      spec.accentInk,
      "#F3EFE7",
      true,
    )

    const titleSize = Math.round(bodyW * 0.122)
    g.font = `900 ${titleSize}px 'Plus Jakarta Sans', 'Montserrat', 'Arial Black', sans-serif`
    drawReliefText(
      g,
      "NİZAMLAR",
      cx,
      centerY + bodyW * 0.048,
      spec.primaryInk,
      "rgba(255,255,255,0.3)",
      0.42,
    )

    const subSize = Math.round(bodyW * 0.038)
    g.font = `800 ${subSize}px 'Plus Jakarta Sans', sans-serif`
    drawReliefText(
      g,
      spec.subtitle || "SIGNATURE HEAVY FLEECE  ·  ATELIER",
      cx,
      centerY + bodyW * 0.128,
      spec.accentInk,
      "rgba(255,255,255,0.2)",
      0.32,
    )

    // Flanking gold embroidery bars
    const barW = bodyW * 0.16
    g.fillStyle = spec.accentInk
    g.fillRect(
      cx - bodyW * 0.28,
      centerY + bodyW * 0.168,
      barW,
      Math.max(2, bodyW * 0.005),
    )
    g.fillRect(
      cx + bodyW * 0.12,
      centerY + bodyW * 0.168,
      barW,
      Math.max(2, bodyW * 0.005),
    )
    const estSize = Math.round(bodyW * 0.025)
    g.font = `700 ${estSize}px 'Plus Jakarta Sans', monospace`
    g.fillStyle = spec.primaryInk
    g.fillText("EST. 1994", cx, centerY + bodyW * 0.17)
  } else if (
    spec.style === "sweater-embroidery" ||
    spec.style === "sweater-atelier-crest"
  ) {
    // Knitwear (Kazak) Luxury Embroidered Crest & Satin-Stitch Typography
    const centerY = chestY + bodyW * 0.025
    const crestR = bodyW * 0.115
    const crestY = centerY - bodyW * 0.095

    g.save()
    // Outer embroidered medallion ring (matching sample-monogram.svg)
    g.shadowColor = "rgba(0, 0, 0, 0.36)"
    g.shadowBlur = bodyW * 0.015
    g.shadowOffsetY = bodyW * 0.008
    g.fillStyle = spec.badgeBg
    g.beginPath()
    g.arc(cx, crestY, crestR, 0, Math.PI * 2)
    g.fill()
    g.shadowColor = "transparent"

    g.strokeStyle = spec.badgeBorder
    g.lineWidth = Math.max(2.2, bodyW * 0.006)
    g.beginPath()
    g.arc(cx, crestY, crestR, 0, Math.PI * 2)
    g.stroke()

    // Dashed embroidery stitch ring inside medallion
    g.strokeStyle = spec.accentInk
    g.lineWidth = Math.max(1.4, bodyW * 0.0035)
    g.setLineDash([5, 3.5])
    g.beginPath()
    g.arc(cx, crestY, crestR * 0.86, 0, Math.PI * 2)
    g.stroke()
    g.setLineDash([])

    if (logos.monogram) {
      g.drawImage(
        logos.monogram,
        cx - crestR * 0.92,
        crestY - crestR * 0.92,
        crestR * 1.84,
        crestR * 1.84,
      )
    } else {
      const nbSize = Math.round(crestR * 0.72)
      g.font = `900 ${nbSize}px 'Plus Jakarta Sans', sans-serif`
      drawReliefText(g, "NB", cx, crestY - crestR * 0.08, "#F3EFE7")
      const estSmall = Math.round(crestR * 0.2)
      g.font = `700 ${estSmall}px 'Plus Jakarta Sans', monospace`
      g.fillStyle = spec.accentInk
      g.fillText("EST. 1994", cx, crestY + crestR * 0.36)
    }
    g.restore()

    // Embroidered "NİZAMLAR" chest lettering below crest
    const knitTitleSize = Math.round(bodyW * 0.105)
    g.font = `900 ${knitTitleSize}px 'Plus Jakarta Sans', 'Montserrat', serif`
    drawReliefText(
      g,
      "NİZAMLAR",
      cx,
      centerY + bodyW * 0.085,
      spec.primaryInk,
      "rgba(255,255,255,0.28)",
      0.38,
    )

    const knitSubSize = Math.round(bodyW * 0.034)
    g.font = `700 ${knitSubSize}px 'Plus Jakarta Sans', sans-serif`
    drawReliefText(
      g,
      spec.subtitle || "ESSENTIAL KNITWEAR  ·  ATELIER",
      cx,
      centerY + bodyW * 0.152,
      spec.accentInk,
      "rgba(255,255,255,0.18)",
      0.28,
    )
  }

  // Woven lower-left hem brand tab ("NZM / 94")
  const [hemTabX, hemTabY] = toPx(p.half - 0.055, -p.length + 0.036)
  const tabW = 0.046 * unit
  const tabH = 0.022 * unit
  g.fillStyle = "#191A1B"
  g.fillRect(hemTabX - tabW / 2, hemTabY - tabH / 2, tabW, tabH)
  g.strokeStyle = "#B29460"
  g.lineWidth = 1.2
  g.strokeRect(hemTabX - tabW / 2, hemTabY - tabH / 2, tabW, tabH)
  g.fillStyle = "#F3EFE7"
  g.font = `800 ${Math.max(7, Math.round(tabH * 0.45))}px 'Plus Jakarta Sans', sans-serif`
  g.fillText("NZM", hemTabX, hemTabY)

  g.restore()
}
