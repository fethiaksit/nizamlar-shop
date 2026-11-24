import { generateProductSvgString } from "./mockup-engine"
import type { PrintLayer } from "@modules/garment-3d/garment-model"

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Önizleme görseli oluşturulamadı."))
    image.src = src
  })
}

export async function createProductionPreview(
  color: string,
  layer: PrintLayer,
) {
  const canvas = document.createElement("canvas")
  canvas.width = 1200
  canvas.height = 1360
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#efede7"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const svg = generateProductSvgString(
    "tisort",
    layer.side,
    color,
    "Nizamlar Studio",
  )
  const garment = await loadImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  )
  ctx.drawImage(garment, 0, 0, 1200, 1360)
  const artwork = await loadImage(layer.url)
  // Legacy 600×680 mockup: 230px print width represents the shared 320mm torso.
  const ratio = 460 / 320
  ctx.save()
  ctx.translate(600 + layer.xMm * ratio, 660 + layer.yMm * ratio)
  ctx.rotate((layer.rotation * Math.PI) / 180)
  ctx.drawImage(
    artwork,
    (-layer.widthMm * ratio) / 2,
    (-layer.heightMm * ratio) / 2,
    layer.widthMm * ratio,
    layer.heightMm * ratio,
  )
  ctx.restore()
  return canvas.toDataURL("image/png")
}

export interface DtfClientResolutionInfo {
  pixelWidth: number
  pixelHeight: number
  effectiveDpi: number
  meetsTarget300Dpi: boolean
  meetsMinimum150Dpi: boolean
  hasTransparency: boolean
}

export async function inspectClientArtworkForDtf({
  artworkUrl,
  mimeType,
  widthIn,
  heightIn,
}: {
  artworkUrl: string
  mimeType: string
  widthIn: number
  heightIn: number
}): Promise<DtfClientResolutionInfo> {
  const artwork = await loadImage(artworkUrl)
  const pixelWidth = Math.max(1, artwork.naturalWidth || artwork.width || 1)
  const pixelHeight = Math.max(1, artwork.naturalHeight || artwork.height || 1)

  const isSvg = mimeType.toLowerCase().includes("svg")
  const dpiX = pixelWidth / Math.max(0.1, widthIn)
  const dpiY = pixelHeight / Math.max(0.1, heightIn)
  const effectiveDpi = isSvg ? 300 : Math.round(Math.min(dpiX, dpiY))

  let hasTransparency = isSvg
  if (!isSvg && !mimeType.toLowerCase().includes("jp")) {
    const sampleW = Math.min(128, pixelWidth)
    const sampleH = Math.min(128, pixelHeight)
    const probe = document.createElement("canvas")
    probe.width = sampleW
    probe.height = sampleH
    const pctx = probe.getContext("2d")
    if (pctx) {
      pctx.clearRect(0, 0, sampleW, sampleH)
      pctx.drawImage(artwork, 0, 0, sampleW, sampleH)
      const data = pctx.getImageData(0, 0, sampleW, sampleH).data
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) {
          hasTransparency = true
          break
        }
      }
    }
  }

  return {
    pixelWidth,
    pixelHeight,
    effectiveDpi,
    meetsTarget300Dpi: effectiveDpi >= 300,
    meetsMinimum150Dpi: effectiveDpi >= 150,
    hasTransparency,
  }
}

/**
 * Generates a print-ready transparent RGBA PNG containing ONLY the transfer artwork.
 * Zero garment silhouette, zero background fill, and zero drop shadow are drawn.
 */
export async function createTransparentDtfPrintPng({
  artworkUrl,
  widthIn,
  heightIn,
  rotationDeg = 0,
  targetDpi = 300,
  maxDimensionPx = 4200,
}: {
  artworkUrl: string
  widthIn: number
  heightIn: number
  rotationDeg?: number
  targetDpi?: number
  maxDimensionPx?: number
}): Promise<string> {
  const artwork = await loadImage(artworkUrl)
  const safeWidthIn = Math.max(0.5, widthIn)
  const safeHeightIn = Math.max(0.5, heightIn)

  const idealW = Math.max(64, Math.round(safeWidthIn * targetDpi))
  const idealH = Math.max(64, Math.round(safeHeightIn * targetDpi))
  const downscale = Math.min(1, maxDimensionPx / Math.max(idealW, idealH))

  const canvasWidth = Math.max(64, Math.round(idealW * downscale))
  const canvasHeight = Math.max(64, Math.round(idealH * downscale))

  const canvas = document.createElement("canvas")
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Unable to initialize 2D canvas for DTF production export")
  }

  // Strictly clear to transparent RGBA(0,0,0,0) - never fill background!
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // Reserve a 1px transparent corner guard when source artwork is opaque (e.g. JPG)
  // while keeping the print area crisp and background completely transparent.
  ctx.save()
  ctx.translate(canvasWidth / 2, canvasHeight / 2)
  if (rotationDeg) {
    ctx.rotate((rotationDeg * Math.PI) / 180)
  }
  ctx.drawImage(
    artwork,
    -canvasWidth / 2 + 1,
    -canvasHeight / 2 + 1,
    Math.max(1, canvasWidth - 2),
    Math.max(1, canvasHeight - 2),
  )
  ctx.restore()

  return canvas.toDataURL("image/png")
}
