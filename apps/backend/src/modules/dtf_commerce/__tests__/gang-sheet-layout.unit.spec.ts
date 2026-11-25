import {
  autoPlaceGangSheetItems,
  computeSnapPositionAndGuides,
  createGangSheetHistory,
  duplicateGangSheetItem,
  getRotatedBoundingBox,
  pushGangSheetHistory,
  redoGangSheetHistory,
  undoGangSheetHistory,
  validateGangSheetLayout,
  type GangSheetItemPlacement,
} from "../gang-sheet-layout"

const DEFAULT_RULES = {
  sheetWidthIn: 22,
  sheetLengthIn: 24,
  minMarginIn: 0.25,
  minGapIn: 0.25,
  minAcceptableDpi: 150,
  targetDpi: 300,
}

function makeItem(
  overrides: Partial<GangSheetItemPlacement> = {}
): GangSheetItemPlacement {
  return {
    id: overrides.id || "item_1",
    artworkId: overrides.artworkId || "art_1",
    fileName: overrides.fileName || "logo.png",
    mimeType: overrides.mimeType || "image/png",
    pixelWidth: overrides.pixelWidth || 1200,
    pixelHeight: overrides.pixelHeight || 1200,
    xIn: overrides.xIn ?? 0.5,
    yIn: overrides.yIn ?? 0.5,
    widthIn: overrides.widthIn ?? 4,
    heightIn: overrides.heightIn ?? 4,
    rotationDeg: overrides.rotationDeg ?? 0,
  }
}

describe("Gang Sheet Layout & Nesting Engine", () => {
  it("computes rotated axis-aligned bounding boxes accurately at 0, 90, and 45 degrees", () => {
    const base = makeItem({ xIn: 2, yIn: 3, widthIn: 10, heightIn: 4, rotationDeg: 0 })
    const box0 = getRotatedBoundingBox(base)
    expect(box0).toMatchObject({
      leftIn: 2,
      topIn: 3,
      rightIn: 12,
      bottomIn: 7,
      widthIn: 10,
      heightIn: 4,
    })

    const box90 = getRotatedBoundingBox({ ...base, rotationDeg: 90 })
    expect(box90.widthIn).toBeCloseTo(4, 3)
    expect(box90.heightIn).toBeCloseTo(10, 3)
    expect(box90.centerXIn).toBeCloseTo(7, 3)
    expect(box90.centerYIn).toBeCloseTo(5, 3)

    const box45 = getRotatedBoundingBox({ ...base, rotationDeg: 45 })
    expect(box45.widthIn).toBeGreaterThan(9.8)
    expect(box45.heightIn).toBeGreaterThan(9.8)
  })

  it("detects overlaps, gap violations, margin violations, out-of-bounds, and low DPI", () => {
    const overlappingA = makeItem({ id: "a", xIn: 1, yIn: 1, widthIn: 4, heightIn: 4 })
    const overlappingB = makeItem({ id: "b", xIn: 4.5, yIn: 1, widthIn: 4, heightIn: 4 })
    const outOfBoundsC = makeItem({ id: "c", xIn: 19, yIn: 1, widthIn: 4, heightIn: 4 })
    const lowDpiD = makeItem({
      id: "d",
      xIn: 1,
      yIn: 8,
      widthIn: 10,
      heightIn: 10,
      pixelWidth: 800,
      pixelHeight: 800,
    })

    const report = validateGangSheetLayout(
      [overlappingA, overlappingB, outOfBoundsC, lowDpiD],
      DEFAULT_RULES
    )

    expect(report.isValid).toBe(false)
    expect(report.overlapIds).toEqual(expect.arrayContaining(["a", "b"]))
    expect(report.outOfBoundsIds).toContain("c")
    expect(report.lowDpiIds).toContain("d")

    // Gap violation without overlap (0.10" gap < 0.25" minGapIn)
    const close1 = makeItem({ id: "c1", xIn: 1, yIn: 1, widthIn: 4, heightIn: 4 })
    const close2 = makeItem({ id: "c2", xIn: 5.1, yIn: 1, widthIn: 4, heightIn: 4 })
    const gapReport = validateGangSheetLayout([close1, close2], DEFAULT_RULES)
    expect(gapReport.overlapIds).toHaveLength(0)
    expect(gapReport.gapViolationIds).toEqual(expect.arrayContaining(["c1", "c2"]))
  })

  it("auto-nests mixed items within 22-inch roll margins with zero overlaps or gap violations", () => {
    const rawItems: GangSheetItemPlacement[] = [
      makeItem({ id: "chest_1", widthIn: 10, heightIn: 11, pixelWidth: 3000, pixelHeight: 3300 }),
      makeItem({ id: "chest_2", widthIn: 10, heightIn: 11, pixelWidth: 3000, pixelHeight: 3300 }),
      makeItem({ id: "pocket_1", widthIn: 3.5, heightIn: 3.5, pixelWidth: 1200, pixelHeight: 1200 }),
      makeItem({ id: "pocket_2", widthIn: 3.5, heightIn: 3.5, pixelWidth: 1200, pixelHeight: 1200 }),
      makeItem({ id: "pocket_3", widthIn: 3.5, heightIn: 3.5, pixelWidth: 1200, pixelHeight: 1200 }),
    ]

    const { placedItems, requiredLengthIn } = autoPlaceGangSheetItems(rawItems, {
      sheetWidthIn: 22,
      minMarginIn: 0.25,
      minGapIn: 0.25,
    })

    expect(placedItems).toHaveLength(5)
    expect(requiredLengthIn).toBeLessThanOrEqual(24)

    const validation = validateGangSheetLayout(placedItems, DEFAULT_RULES)
    expect(validation.isValid).toBe(true)
    expect(validation.overlapIds).toHaveLength(0)
    expect(validation.gapViolationIds).toHaveLength(0)
    expect(validation.outOfBoundsIds).toHaveLength(0)
    expect(validation.marginViolationIds).toHaveLength(0)
  })

  it("supports item duplication, snap alignment guides, and undo/redo history", () => {
    const initial = [makeItem({ id: "logo_1", xIn: 0.5, yIn: 0.5, widthIn: 3.5, heightIn: 3.5 })]
    let history = createGangSheetHistory(initial)

    const duplicated = duplicateGangSheetItem(
      initial,
      "logo_1",
      3,
      (idx) => `logo_copy_${idx}`,
      0.25
    )
    expect(duplicated).toHaveLength(4)
    history = pushGangSheetHistory(history, duplicated)

    const snap = computeSnapPositionAndGuides(
      makeItem({ id: "moving", xIn: 9.08, yIn: 0.28, widthIn: 4, heightIn: 4 }),
      duplicated,
      {
        sheetWidthIn: 22,
        sheetLengthIn: 24,
        minMarginIn: 0.25,
        snapThresholdIn: 0.15,
      }
    )
    // Center of 4" item at x=9.08 is 11.08 -> snaps to sheet center 11.0 (xIn = 9.0)
    expect(snap.xIn).toBe(9)
    expect(snap.yIn).toBe(0.25)
    expect(snap.guides.length).toBeGreaterThanOrEqual(2)

    history = undoGangSheetHistory(history)
    expect(history.snapshots[history.index]).toHaveLength(1)

    history = redoGangSheetHistory(history)
    expect(history.snapshots[history.index]).toHaveLength(4)
  })
})
