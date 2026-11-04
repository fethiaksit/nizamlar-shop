/**
 * Adapted from https://github.com/accodes21/tshirt3d (MIT License — Copyright (c) 2023 Aarya Chopkar)
 * Motion configurations and color/file helpers for Nizamlar Baskı TSHIRT3D Experience.
 */

export const transition = { type: "spring" as const, duration: 0.8 }

export const slideAnimation = (
  direction: "left" | "right" | "up" | "down",
) => {
  return {
    initial: {
      x: direction === "left" ? -100 : direction === "right" ? 100 : 0,
      y: direction === "up" ? 100 : direction === "down" ? -100 : 0,
      opacity: 0,
      transition: { ...transition, delay: 0.15 },
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: { ...transition, delay: 0 },
    },
    exit: {
      x: direction === "left" ? -100 : direction === "right" ? 100 : 0,
      y: direction === "up" ? 100 : direction === "down" ? -100 : 0,
      opacity: 0,
      transition: { ...transition, delay: 0 },
    },
  }
}

export const fadeAnimation = {
  initial: {
    opacity: 0,
    transition: { ...transition, delay: 0.15 },
  },
  animate: {
    opacity: 1,
    transition: { ...transition, delay: 0 },
  },
  exit: {
    opacity: 0,
    transition: { ...transition, delay: 0 },
  },
}

export const headTextAnimation = {
  initial: { x: 80, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  transition: {
    type: "spring" as const,
    damping: 7,
    stiffness: 45,
    restDelta: 0.001,
    duration: 0.35,
  },
}

export const headContentAnimation = {
  initial: { y: 60, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: {
    type: "spring" as const,
    damping: 8,
    stiffness: 35,
    restDelta: 0.001,
    duration: 0.5,
    delay: 0.1,
  },
}

export const headContainerAnimation = {
  initial: { x: -80, opacity: 0, transition: { ...transition, delay: 0.15 } },
  animate: { x: 0, opacity: 1, transition: { ...transition, delay: 0 } },
  exit: { x: -80, opacity: 0, transition: { ...transition, delay: 0 } },
}

export function getContrastingColor(color: string): "#161718" | "#F8F6F0" {
  const clean = (color || "#B29460").replace("#", "").trim()
  const hex =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0")
  const r = parseInt(hex.substring(0, 2), 16) || 0
  const g = parseInt(hex.substring(2, 4), 16) || 0
  const b = parseInt(hex.substring(4, 6), 16) || 0
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 145 ? "#161718" : "#F8F6F0"
}

export function downloadCanvasElementToPng(
  canvas: HTMLCanvasElement | null,
  fileName = "nizamlar-3d-tasarim.png",
): string | null {
  if (!canvas) return null
  const dataURL = canvas.toDataURL("image/png")
  const link = document.createElement("a")
  link.href = dataURL
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  return dataURL
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader()
    fileReader.onload = () => resolve(String(fileReader.result))
    fileReader.onerror = reject
    fileReader.readAsDataURL(file)
  })
}

export const NIZAMLAR_TSHIRT_PALETTE = [
  { name: "Gold", hex: "#B29460", variantMatch: "Bej" },
  { name: "Antrasit", hex: "#222325", variantMatch: "Antrasit" },
  { name: "Kırık Beyaz", hex: "#F4F1EA", variantMatch: "Beyaz" },
  { name: "Krem Taş", hex: "#E6DFD2", variantMatch: "Ekru" },
  { name: "Kahverengi", hex: "#49372E", variantMatch: "Koyu Kahve" },
  { name: "Siyah", hex: "#18191B", variantMatch: "Siyah" },
  { name: "Taş Bej", hex: "#C9C1B5", variantMatch: "Bej" },
  { name: "Haki", hex: "#666D4F", variantMatch: "Haki" },
  { name: "Lacivert", hex: "#242F4A", variantMatch: "Lacivert" },
  { name: "Bordo", hex: "#703443", variantMatch: "Bordo" },
] as const
