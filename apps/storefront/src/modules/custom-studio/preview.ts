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
