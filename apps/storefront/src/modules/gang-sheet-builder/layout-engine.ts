export interface UploadedSheetArtwork {
  id: string
  fileName: string
  mimeType: string
  dataUrl: string
  pixelWidth: number
  pixelHeight: number
  aspect: number
}

export interface GangSheetCanvasItem {
  id: string
  artworkId: string
  fileName: string
  mimeType: string
  dataUrl: string
  pixelWidth: number
  pixelHeight: number
  xIn: number
  yIn: number
  widthIn: number
  heightIn: number
  rotationDeg: number
}

export interface BoundingBoxIn {
  leftIn: number
  topIn: number
  rightIn: number
  bottomIn: number
  widthIn: number
  heightIn: number
  centerXIn: number
  centerYIn: number
}

export interface AlignmentGuide {
  axis: "vertical" | "horizontal"
  positionIn: number
}

export interface GangSheetValidationSummary {
  isValid: boolean
  usedAreaSqIn: number
  totalAreaSqIn: number
  utilizationPercent: number
  outOfBoundsIds: string[]
  marginViolationIds: string[]
  overlapIds: string[]
  gapViolationIds: string[]
  lowDpiIds: string[]
  itemDpiMap: Record<string, number>
}

const MILS = 1000
const toMils = (v: number) => Math.round(v * MILS)
const fromMils = (m: number) => Math.round((m / MILS) * 10000) / 10000

export function normalizeRotationDeg(deg: number): number {
  if (!Number.isFinite(deg)) return 0
  return Math.round((((deg % 360) + 360) % 360) * 100) / 100
}

export function getRotatedBoundingBox(
  item: Pick<
    GangSheetCanvasItem,
    "xIn" | "yIn" | "widthIn" | "heightIn" | "rotationDeg"
  >,
): BoundingBoxIn {
  const rad = (normalizeRotationDeg(item.rotationDeg) * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))

  const boxW = item.widthIn * cos + item.heightIn * sin
  const boxH = item.widthIn * sin + item.heightIn * cos

  const cx = item.xIn + item.widthIn / 2
  const cy = item.yIn + item.heightIn / 2

  return {
    leftIn: fromMils(toMils(cx - boxW / 2)),
    topIn: fromMils(toMils(cy - boxH / 2)),
    rightIn: fromMils(toMils(cx + boxW / 2)),
    bottomIn: fromMils(toMils(cy + boxH / 2)),
    widthIn: fromMils(toMils(boxW)),
    heightIn: fromMils(toMils(boxH)),
    centerXIn: fromMils(toMils(cx)),
    centerYIn: fromMils(toMils(cy)),
  }
}

export function validateClientGangSheet(
  items: GangSheetCanvasItem[],
  rules: {
    sheetWidthIn: number
    sheetLengthIn: number
    minMarginIn: number
    minGapIn: number
    minAcceptableDpi: number
    targetDpi: number
  },
): GangSheetValidationSummary {
  const sheetW = toMils(rules.sheetWidthIn)
  const sheetH = toMils(rules.sheetLengthIn)
  const margin = toMils(rules.minMarginIn)
  const minGap = toMils(rules.minGapIn)

  const boxes = items.map((item) => ({
    item,
    box: getRotatedBoundingBox(item),
  }))

  const outOfBounds = new Set<string>()
  const marginViolations = new Set<string>()
  const overlaps = new Set<string>()
  const gapViolations = new Set<string>()
  const lowDpi = new Set<string>()
  const itemDpiMap: Record<string, number> = {}

  for (const { item, box } of boxes) {
    const l = toMils(box.leftIn)
    const t = toMils(box.topIn)
    const r = toMils(box.rightIn)
    const b = toMils(box.bottomIn)

    if (l < 0 || t < 0 || r > sheetW || b > sheetH) {
      outOfBounds.add(item.id)
    } else if (
      l < margin ||
      t < margin ||
      r > sheetW - margin ||
      b > sheetH - margin
    ) {
      marginViolations.add(item.id)
    }
  }

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]
      const b = boxes[j]
      const aL = toMils(a.box.leftIn)
      const aT = toMils(a.box.topIn)
      const aR = toMils(a.box.rightIn)
      const aB = toMils(a.box.bottomIn)
      const bL = toMils(b.box.leftIn)
      const bT = toMils(b.box.topIn)
      const bR = toMils(b.box.rightIn)
      const bB = toMils(b.box.bottomIn)

      if (aL < bR && aR > bL && aT < bB && aB > bT) {
        overlaps.add(a.item.id)
        overlaps.add(b.item.id)
      } else if (
        minGap > 0 &&
        aL - minGap < bR &&
        aR + minGap > bL &&
        aT - minGap < bB &&
        aB + minGap > bT
      ) {
        gapViolations.add(a.item.id)
        gapViolations.add(b.item.id)
      }
    }
  }

  let usedAreaSqIn = 0
  for (const item of items) {
    usedAreaSqIn += item.widthIn * item.heightIn
    const isSvg = item.mimeType.toLowerCase().includes("svg")
    const dpi = isSvg
      ? rules.targetDpi
      : Math.round(
          Math.min(
            item.pixelWidth / Math.max(0.1, item.widthIn),
            item.pixelHeight / Math.max(0.1, item.heightIn),
          ),
        )
    itemDpiMap[item.id] = dpi
    if (dpi < rules.minAcceptableDpi) {
      lowDpi.add(item.id)
    }
  }

  const totalAreaSqIn = Math.max(0.01, rules.sheetWidthIn * rules.sheetLengthIn)
  const utilizationPercent = Math.min(
    100,
    Math.round((usedAreaSqIn / totalAreaSqIn) * 1000) / 10,
  )

  return {
    isValid:
      items.length > 0 &&
      outOfBounds.size === 0 &&
      marginViolations.size === 0 &&
      overlaps.size === 0,
    usedAreaSqIn: Math.round(usedAreaSqIn * 100) / 100,
    totalAreaSqIn: Math.round(totalAreaSqIn * 100) / 100,
    utilizationPercent,
    outOfBoundsIds: [...outOfBounds],
    marginViolationIds: [...marginViolations],
    overlapIds: [...overlaps],
    gapViolationIds: [...gapViolations],
    lowDpiIds: [...lowDpi],
    itemDpiMap,
  }
}

export function autoNestClientGangSheet(
  items: GangSheetCanvasItem[],
  options: {
    sheetWidthIn: number
    minMarginIn: number
    minGapIn: number
  },
): {
  placedItems: GangSheetCanvasItem[]
  requiredLengthIn: number
} {
  if (items.length === 0) {
    return { placedItems: [], requiredLengthIn: 12 }
  }

  const marginMils = toMils(options.minMarginIn)
  const gapMils = toMils(options.minGapIn)
  const sheetWMils = toMils(options.sheetWidthIn)
  const maxContentWMils = Math.max(500, sheetWMils - marginMils * 2)

  const indexed = items.map((item, idx) => {
    const box = getRotatedBoundingBox({ ...item, xIn: 0, yIn: 0 })
    return {
      idx,
      item,
      boxWMils: toMils(box.widthIn),
      boxHMils: toMils(box.heightIn),
    }
  })

  indexed.sort(
    (a, b) =>
      b.boxHMils - a.boxHMils || b.boxWMils - a.boxWMils || a.idx - b.idx,
  )

  let cursorX = marginMils
  let cursorY = marginMils
  let shelfH = 0
  let maxBottom = marginMils

  const placedMap = new Map<number, GangSheetCanvasItem>()

  for (const entry of indexed) {
    let wMils = entry.boxWMils
    let hMils = entry.boxHMils
    let nextItem = { ...entry.item }

    if (wMils > maxContentWMils) {
      const ratio = maxContentWMils / wMils
      nextItem = {
        ...nextItem,
        rotationDeg: 0,
        widthIn: fromMils(Math.floor(toMils(nextItem.widthIn) * ratio)),
        heightIn: fromMils(Math.floor(toMils(nextItem.heightIn) * ratio)),
      }
      wMils = toMils(nextItem.widthIn)
      hMils = toMils(nextItem.heightIn)
    }

    if (cursorX > marginMils && cursorX + wMils > sheetWMils - marginMils) {
      cursorX = marginMils
      cursorY += shelfH + gapMils
      shelfH = 0
    }

    const zeroBox = getRotatedBoundingBox({ ...nextItem, xIn: 0, yIn: 0 })
    const targetLeftIn = fromMils(cursorX)
    const targetTopIn = fromMils(cursorY)

    placedMap.set(entry.idx, {
      ...nextItem,
      xIn: fromMils(toMils(targetLeftIn - zeroBox.leftIn)),
      yIn: fromMils(toMils(targetTopIn - zeroBox.topIn)),
    })

    cursorX += wMils + gapMils
    shelfH = Math.max(shelfH, hMils)
    maxBottom = Math.max(maxBottom, cursorY + hMils)
  }

  return {
    placedItems: items.map((_, i) => placedMap.get(i)!),
    requiredLengthIn: fromMils(maxBottom + marginMils),
  }
}

export function snapDraggedGangSheetItem(
  movingItem: GangSheetCanvasItem,
  siblings: GangSheetCanvasItem[],
  options: {
    sheetWidthIn: number
    sheetLengthIn: number
    minMarginIn: number
    snapThresholdIn?: number
  },
): {
  xIn: number
  yIn: number
  guides: AlignmentGuide[]
} {
  const threshold = options.snapThresholdIn ?? 0.14
  const guides: AlignmentGuide[] = []
  let nextX = movingItem.xIn
  let nextY = movingItem.yIn

  const box = getRotatedBoundingBox(movingItem)
  const centerX = options.sheetWidthIn / 2
  const centerY = options.sheetLengthIn / 2

  if (Math.abs(box.centerXIn - centerX) <= threshold) {
    nextX += centerX - box.centerXIn
    guides.push({ axis: "vertical", positionIn: centerX })
  } else if (Math.abs(box.leftIn - options.minMarginIn) <= threshold) {
    nextX += options.minMarginIn - box.leftIn
    guides.push({ axis: "vertical", positionIn: options.minMarginIn })
  } else if (
    Math.abs(box.rightIn - (options.sheetWidthIn - options.minMarginIn)) <=
    threshold
  ) {
    nextX += options.sheetWidthIn - options.minMarginIn - box.rightIn
    guides.push({
      axis: "vertical",
      positionIn: options.sheetWidthIn - options.minMarginIn,
    })
  }

  if (Math.abs(box.centerYIn - centerY) <= threshold) {
    nextY += centerY - box.centerYIn
    guides.push({ axis: "horizontal", positionIn: centerY })
  } else if (Math.abs(box.topIn - options.minMarginIn) <= threshold) {
    nextY += options.minMarginIn - box.topIn
    guides.push({ axis: "horizontal", positionIn: options.minMarginIn })
  }

  for (const sib of siblings) {
    if (sib.id === movingItem.id) continue
    const sBox = getRotatedBoundingBox(sib)
    if (guides.every((g) => g.axis !== "vertical")) {
      if (Math.abs(box.leftIn - sBox.leftIn) <= threshold) {
        nextX += sBox.leftIn - box.leftIn
        guides.push({ axis: "vertical", positionIn: sBox.leftIn })
      } else if (Math.abs(box.centerXIn - sBox.centerXIn) <= threshold) {
        nextX += sBox.centerXIn - box.centerXIn
        guides.push({ axis: "vertical", positionIn: sBox.centerXIn })
      }
    }
    if (guides.every((g) => g.axis !== "horizontal")) {
      if (Math.abs(box.topIn - sBox.topIn) <= threshold) {
        nextY += sBox.topIn - box.topIn
        guides.push({ axis: "horizontal", positionIn: sBox.topIn })
      } else if (Math.abs(box.centerYIn - sBox.centerYIn) <= threshold) {
        nextY += sBox.centerYIn - box.centerYIn
        guides.push({ axis: "horizontal", positionIn: sBox.centerYIn })
      }
    }
  }

  return {
    xIn: fromMils(toMils(nextX)),
    yIn: fromMils(toMils(nextY)),
    guides,
  }
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Failed to decode gang sheet artwork"))
    img.src = src
  })
}

/**
 * Exports a transparent RGBA print-ready gang sheet PNG (zero background, zero rulers, zero margins).
 * Targets 300 DPI while safely capping total canvas pixels within browser hardware limits.
 */
export async function exportGangSheetTransparentPng({
  items,
  sheetWidthIn,
  sheetLengthIn,
  targetDpi = 300,
  maxCanvasSidePx = 6600,
}: {
  items: GangSheetCanvasItem[]
  sheetWidthIn: number
  sheetLengthIn: number
  targetDpi?: number
  maxCanvasSidePx?: number
}): Promise<{ dataUrl: string; pixelWidth: number; pixelHeight: number }> {
  const idealW = Math.max(200, Math.round(sheetWidthIn * targetDpi))
  const idealH = Math.max(200, Math.round(sheetLengthIn * targetDpi))
  const scale = Math.min(1, maxCanvasSidePx / Math.max(idealW, idealH))

  const pixelWidth = Math.max(200, Math.round(idealW * scale))
  const pixelHeight = Math.max(200, Math.round(idealH * scale))
  const pxPerInX = pixelWidth / sheetWidthIn
  const pxPerInY = pixelHeight / sheetLengthIn

  const canvas = document.createElement("canvas")
  canvas.width = pixelWidth
  canvas.height = pixelHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("Unable to initialize 2D canvas for gang sheet export")
  }

  // Strictly transparent RGBA background
  ctx.clearRect(0, 0, pixelWidth, pixelHeight)

  const uniqueSources = new Map<string, HTMLImageElement>()
  for (const item of items) {
    if (!uniqueSources.has(item.dataUrl)) {
      uniqueSources.set(item.dataUrl, await loadImg(item.dataUrl))
    }
  }

  for (const item of items) {
    const img = uniqueSources.get(item.dataUrl)
    if (!img) continue
    const wPx = item.widthIn * pxPerInX
    const hPx = item.heightIn * pxPerInY
    const cxPx = (item.xIn + item.widthIn / 2) * pxPerInX
    const cyPx = (item.yIn + item.heightIn / 2) * pxPerInY

    ctx.save()
    ctx.translate(cxPx, cyPx)
    if (item.rotationDeg) {
      ctx.rotate((item.rotationDeg * Math.PI) / 180)
    }
    ctx.drawImage(img, -wPx / 2, -hPx / 2, wPx, hPx)
    ctx.restore()
  }

  return {
    dataUrl: canvas.toDataURL("image/png"),
    pixelWidth,
    pixelHeight,
  }
}
