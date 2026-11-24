export interface GangSheetItemPlacement {
  id: string
  artworkId: string
  fileName: string
  mimeType: string
  pixelWidth: number
  pixelHeight: number
  xIn: number
  yIn: number
  widthIn: number
  heightIn: number
  rotationDeg: number
}

export interface GangSheetRulesInput {
  sheetWidthIn: number
  sheetLengthIn: number
  minMarginIn: number
  minGapIn: number
  minAcceptableDpi: number
  targetDpi: number
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

export interface OverlapPair {
  firstId: string
  secondId: string
  type: "overlap" | "gap_violation"
}

export interface GangSheetItemValidation {
  id: string
  effectiveDpi: number
  meetsTarget300Dpi: boolean
  meetsMinimumDpi: boolean
  outOfBounds: boolean
  marginViolation: boolean
  hasOverlap: boolean
  hasGapViolation: boolean
  bounds: BoundingBoxIn
}

export interface GangSheetValidationReport {
  isValid: boolean
  sheetWidthIn: number
  sheetLengthIn: number
  minMarginIn: number
  minGapIn: number
  totalSheetAreaSqIn: number
  usedArtworkAreaSqIn: number
  utilizationPercent: number
  outOfBoundsIds: string[]
  marginViolationIds: string[]
  overlapIds: string[]
  gapViolationIds: string[]
  lowDpiIds: string[]
  overlapPairs: OverlapPair[]
  items: GangSheetItemValidation[]
}

export interface AlignmentGuide {
  axis: "vertical" | "horizontal"
  positionIn: number
  source: "sheet-center" | "sheet-margin" | "item-edge" | "item-center"
}

const MILS_PER_INCH = 1000

function toMils(inches: number): number {
  return Math.round(inches * MILS_PER_INCH)
}

function fromMils(mils: number): number {
  return Math.round((mils / MILS_PER_INCH) * 10000) / 10000
}

export function normalizeRotationDeg(deg: number): number {
  if (!Number.isFinite(deg)) return 0
  const mod = ((deg % 360) + 360) % 360
  return Math.round(mod * 100) / 100
}

export function getRotatedBoundingBox(
  item: Pick<
    GangSheetItemPlacement,
    "xIn" | "yIn" | "widthIn" | "heightIn" | "rotationDeg"
  >
): BoundingBoxIn {
  const rad = (normalizeRotationDeg(item.rotationDeg) * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))

  const boxWidthIn = item.widthIn * cos + item.heightIn * sin
  const boxHeightIn = item.widthIn * sin + item.heightIn * cos

  const centerXIn = item.xIn + item.widthIn / 2
  const centerYIn = item.yIn + item.heightIn / 2

  const leftIn = fromMils(toMils(centerXIn - boxWidthIn / 2))
  const topIn = fromMils(toMils(centerYIn - boxHeightIn / 2))
  const rightIn = fromMils(toMils(centerXIn + boxWidthIn / 2))
  const bottomIn = fromMils(toMils(centerYIn + boxHeightIn / 2))

  return {
    leftIn,
    topIn,
    rightIn,
    bottomIn,
    widthIn: fromMils(toMils(boxWidthIn)),
    heightIn: fromMils(toMils(boxHeightIn)),
    centerXIn: fromMils(toMils(centerXIn)),
    centerYIn: fromMils(toMils(centerYIn)),
  }
}

export function validateGangSheetLayout(
  items: GangSheetItemPlacement[],
  rules: GangSheetRulesInput
): GangSheetValidationReport {
  const sheetW = toMils(rules.sheetWidthIn)
  const sheetH = toMils(rules.sheetLengthIn)
  const margin = toMils(rules.minMarginIn)
  const minGap = toMils(rules.minGapIn)

  const boxes = items.map((item) => ({
    item,
    box: getRotatedBoundingBox(item),
  }))

  const outOfBoundsSet = new Set<string>()
  const marginViolationSet = new Set<string>()
  const overlapSet = new Set<string>()
  const gapViolationSet = new Set<string>()
  const lowDpiSet = new Set<string>()
  const overlapPairs: OverlapPair[] = []

  for (const { item, box } of boxes) {
    const left = toMils(box.leftIn)
    const top = toMils(box.topIn)
    const right = toMils(box.rightIn)
    const bottom = toMils(box.bottomIn)

    if (left < 0 || top < 0 || right > sheetW || bottom > sheetH) {
      outOfBoundsSet.add(item.id)
    } else if (
      left < margin ||
      top < margin ||
      right > sheetW - margin ||
      bottom > sheetH - margin
    ) {
      marginViolationSet.add(item.id)
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

      const strictOverlap = aL < bR && aR > bL && aT < bB && aB > bT
      if (strictOverlap) {
        overlapSet.add(a.item.id)
        overlapSet.add(b.item.id)
        overlapPairs.push({
          firstId: a.item.id,
          secondId: b.item.id,
          type: "overlap",
        })
      } else if (minGap > 0) {
        const gapViolation =
          aL - minGap < bR &&
          aR + minGap > bL &&
          aT - minGap < bB &&
          aB + minGap > bT
        if (gapViolation) {
          gapViolationSet.add(a.item.id)
          gapViolationSet.add(b.item.id)
          overlapPairs.push({
            firstId: a.item.id,
            secondId: b.item.id,
            type: "gap_violation",
          })
        }
      }
    }
  }

  let usedAreaSqIn = 0
  const itemValidations: GangSheetItemValidation[] = boxes.map(({ item, box }) => {
    usedAreaSqIn += item.widthIn * item.heightIn
    const isVector = item.mimeType.toLowerCase().includes("svg")
    const effectiveDpi = isVector
      ? rules.targetDpi
      : Math.round(
          Math.min(
            item.pixelWidth / Math.max(0.1, item.widthIn),
            item.pixelHeight / Math.max(0.1, item.heightIn)
          )
        )
    const meetsMinimumDpi = effectiveDpi >= rules.minAcceptableDpi
    if (!meetsMinimumDpi) {
      lowDpiSet.add(item.id)
    }

    return {
      id: item.id,
      effectiveDpi,
      meetsTarget300Dpi: effectiveDpi >= rules.targetDpi,
      meetsMinimumDpi,
      outOfBounds: outOfBoundsSet.has(item.id),
      marginViolation: marginViolationSet.has(item.id),
      hasOverlap: overlapSet.has(item.id),
      hasGapViolation: gapViolationSet.has(item.id),
      bounds: box,
    }
  })

  const totalArea = Math.max(0.01, rules.sheetWidthIn * rules.sheetLengthIn)
  const utilizationPercent = Math.min(
    100,
    Math.round((usedAreaSqIn / totalArea) * 1000) / 10
  )

  const isValid =
    items.length > 0 &&
    outOfBoundsSet.size === 0 &&
    marginViolationSet.size === 0 &&
    overlapSet.size === 0

  return {
    isValid,
    sheetWidthIn: rules.sheetWidthIn,
    sheetLengthIn: rules.sheetLengthIn,
    minMarginIn: rules.minMarginIn,
    minGapIn: rules.minGapIn,
    totalSheetAreaSqIn: Math.round(totalArea * 100) / 100,
    usedArtworkAreaSqIn: Math.round(usedAreaSqIn * 100) / 100,
    utilizationPercent,
    outOfBoundsIds: [...outOfBoundsSet],
    marginViolationIds: [...marginViolationSet],
    overlapIds: [...overlapSet],
    gapViolationIds: [...gapViolationSet],
    lowDpiIds: [...lowDpiSet],
    overlapPairs,
    items: itemValidations,
  }
}

/**
 * Deterministic shelf-packing auto-nesting algorithm (largest height first,
 * maintaining exact safe margins and minimum inter-item gaps).
 */
export function autoPlaceGangSheetItems(
  items: GangSheetItemPlacement[],
  options: {
    sheetWidthIn: number
    minMarginIn: number
    minGapIn: number
  }
): {
  placedItems: GangSheetItemPlacement[]
  requiredLengthIn: number
} {
  if (items.length === 0) {
    return { placedItems: [], requiredLengthIn: 12 }
  }

  const marginMils = toMils(options.minMarginIn)
  const gapMils = toMils(options.minGapIn)
  const sheetWMils = toMils(options.sheetWidthIn)
  const maxContentWMils = Math.max(500, sheetWMils - marginMils * 2)

  // Sort copies deterministically by rotated height descending, then width descending
  const indexed = items.map((item, idx) => {
    const box = getRotatedBoundingBox({
      ...item,
      xIn: 0,
      yIn: 0,
    })
    return {
      idx,
      item,
      boxWMils: toMils(box.widthIn),
      boxHMils: toMils(box.heightIn),
    }
  })

  indexed.sort((a, b) => b.boxHMils - a.boxHMils || b.boxWMils - a.boxWMils || a.idx - b.idx)

  let cursorXMils = marginMils
  let cursorYMils = marginMils
  let shelfHeightMils = 0
  let maxBottomMils = marginMils

  const placedByIndex = new Map<number, GangSheetItemPlacement>()

  for (const entry of indexed) {
    let wMils = entry.boxWMils
    let hMils = entry.boxHMils
    let nextItem = { ...entry.item }

    // Clamp item if wider than printable roll width
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

    if (
      cursorXMils > marginMils &&
      cursorXMils + wMils > sheetWMils - marginMils
    ) {
      cursorXMils = marginMils
      cursorYMils += shelfHeightMils + gapMils
      shelfHeightMils = 0
    }

    // Offset so rotated bounding box top-left lands exactly at (cursorX, cursorY)
    const zeroBox = getRotatedBoundingBox({ ...nextItem, xIn: 0, yIn: 0 })
    const targetLeftIn = fromMils(cursorXMils)
    const targetTopIn = fromMils(cursorYMils)

    const placed: GangSheetItemPlacement = {
      ...nextItem,
      xIn: fromMils(toMils(targetLeftIn - zeroBox.leftIn)),
      yIn: fromMils(toMils(targetTopIn - zeroBox.topIn)),
    }

    placedByIndex.set(entry.idx, placed)

    cursorXMils += wMils + gapMils
    shelfHeightMils = Math.max(shelfHeightMils, hMils)
    maxBottomMils = Math.max(maxBottomMils, cursorYMils + hMils)
  }

  const placedItems = items.map((_, i) => placedByIndex.get(i)!)
  const requiredLengthIn = fromMils(maxBottomMils + marginMils)

  return {
    placedItems,
    requiredLengthIn,
  }
}

export function duplicateGangSheetItem(
  items: GangSheetItemPlacement[],
  targetId: string,
  copies: number,
  idFactory: (index: number) => string,
  gapIn = 0.25
): GangSheetItemPlacement[] {
  const source = items.find((i) => i.id === targetId)
  if (!source || copies < 1) return items

  const safeCopies = Math.min(200, Math.floor(copies))
  const additions: GangSheetItemPlacement[] = []
  for (let c = 0; c < safeCopies; c++) {
    additions.push({
      ...source,
      id: idFactory(c),
      xIn: fromMils(toMils(source.xIn + (c + 1) * (source.widthIn + gapIn))),
      yIn: source.yIn,
    })
  }
  return [...items, ...additions]
}

export function computeSnapPositionAndGuides(
  movingItem: GangSheetItemPlacement,
  siblings: GangSheetItemPlacement[],
  options: {
    sheetWidthIn: number
    sheetLengthIn: number
    minMarginIn: number
    snapThresholdIn?: number
  }
): {
  xIn: number
  yIn: number
  guides: AlignmentGuide[]
} {
  const threshold = options.snapThresholdIn ?? 0.15
  const guides: AlignmentGuide[] = []
  let nextX = movingItem.xIn
  let nextY = movingItem.yIn

  const box = getRotatedBoundingBox(movingItem)
  const sheetCenterX = options.sheetWidthIn / 2
  const sheetCenterY = options.sheetLengthIn / 2

  // Snap X to sheet center or margins
  if (Math.abs(box.centerXIn - sheetCenterX) <= threshold) {
    nextX += sheetCenterX - box.centerXIn
    guides.push({
      axis: "vertical",
      positionIn: sheetCenterX,
      source: "sheet-center",
    })
  } else if (Math.abs(box.leftIn - options.minMarginIn) <= threshold) {
    nextX += options.minMarginIn - box.leftIn
    guides.push({
      axis: "vertical",
      positionIn: options.minMarginIn,
      source: "sheet-margin",
    })
  } else if (
    Math.abs(box.rightIn - (options.sheetWidthIn - options.minMarginIn)) <=
    threshold
  ) {
    nextX += options.sheetWidthIn - options.minMarginIn - box.rightIn
    guides.push({
      axis: "vertical",
      positionIn: options.sheetWidthIn - options.minMarginIn,
      source: "sheet-margin",
    })
  }

  // Snap Y to sheet center or margins
  if (Math.abs(box.centerYIn - sheetCenterY) <= threshold) {
    nextY += sheetCenterY - box.centerYIn
    guides.push({
      axis: "horizontal",
      positionIn: sheetCenterY,
      source: "sheet-center",
    })
  } else if (Math.abs(box.topIn - options.minMarginIn) <= threshold) {
    nextY += options.minMarginIn - box.topIn
    guides.push({
      axis: "horizontal",
      positionIn: options.minMarginIn,
      source: "sheet-margin",
    })
  }

  // Snap to sibling edges & centers
  for (const sib of siblings) {
    if (sib.id === movingItem.id) continue
    const sBox = getRotatedBoundingBox(sib)
    if (guides.every((g) => g.axis !== "vertical")) {
      if (Math.abs(box.leftIn - sBox.leftIn) <= threshold) {
        nextX += sBox.leftIn - box.leftIn
        guides.push({
          axis: "vertical",
          positionIn: sBox.leftIn,
          source: "item-edge",
        })
      } else if (Math.abs(box.centerXIn - sBox.centerXIn) <= threshold) {
        nextX += sBox.centerXIn - box.centerXIn
        guides.push({
          axis: "vertical",
          positionIn: sBox.centerXIn,
          source: "item-center",
        })
      }
    }
    if (guides.every((g) => g.axis !== "horizontal")) {
      if (Math.abs(box.topIn - sBox.topIn) <= threshold) {
        nextY += sBox.topIn - box.topIn
        guides.push({
          axis: "horizontal",
          positionIn: sBox.topIn,
          source: "item-edge",
        })
      } else if (Math.abs(box.centerYIn - sBox.centerYIn) <= threshold) {
        nextY += sBox.centerYIn - box.centerYIn
        guides.push({
          axis: "horizontal",
          positionIn: sBox.centerYIn,
          source: "item-center",
        })
      }
    }
  }

  return {
    xIn: fromMils(toMils(nextX)),
    yIn: fromMils(toMils(nextY)),
    guides,
  }
}

export interface GangSheetHistoryStack {
  snapshots: GangSheetItemPlacement[][]
  index: number
}

export function createGangSheetHistory(
  initial: GangSheetItemPlacement[] = []
): GangSheetHistoryStack {
  return {
    snapshots: [initial.map((i) => ({ ...i }))],
    index: 0,
  }
}

export function pushGangSheetHistory(
  history: GangSheetHistoryStack,
  nextItems: GangSheetItemPlacement[],
  maxDepth = 50
): GangSheetHistoryStack {
  const truncated = history.snapshots.slice(0, history.index + 1)
  const appended = [...truncated, nextItems.map((i) => ({ ...i }))]
  const trimmed =
    appended.length > maxDepth
      ? appended.slice(appended.length - maxDepth)
      : appended
  return {
    snapshots: trimmed,
    index: trimmed.length - 1,
  }
}

export function undoGangSheetHistory(
  history: GangSheetHistoryStack
): GangSheetHistoryStack {
  if (history.index <= 0) return history
  return {
    ...history,
    index: history.index - 1,
  }
}

export function redoGangSheetHistory(
  history: GangSheetHistoryStack
): GangSheetHistoryStack {
  if (history.index >= history.snapshots.length - 1) return history
  return {
    ...history,
    index: history.index + 1,
  }
}
