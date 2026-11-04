import test from "node:test"
import assert from "node:assert/strict"
import { buildRackProducts, colorHex, getVariantOptions, printPlacement } from "../apps/storefront/src/lib/3d/product.ts"

test("rack only maps actual supported products with stable IDs and registry fields", () => {
  const products = [{ id: "tee", handle: "premium-t-shirt", title: "Tişört", options: [], variants: [] }, { id: "bag", handle: "canta", title: "Çanta" }, { id: "pants", handle: "sweatpants", title: "Pants" }]
  assert.deepEqual(buildRackProducts(products).map(p => [p.productId, p.kind, p.colour]), [["tee", "tee", "#e8e2d6"]])
  assert.deepEqual(buildRackProducts([]), [])
})
test("variant option values and Turkish colors remain consistent", () => {
  assert.equal(colorHex("SİYAH"), "#252528")
  assert.deepEqual(getVariantOptions({ options: [{ option_id: "color", value: "Bej" }] }), { color: "Bej" })
})
test("physical print preserves aspect ratio and rejects rotated overflow", () => {
  const p = printPlacement({ widthMm: 180, aspect: 2, xMm: 0, yMm: 0, rotation: 0 })
  assert.equal(p.heightMm, 90)
  assert.equal(p.areaCm2, 162)
  assert.equal(p.valid, true)
  assert.equal(printPlacement({ widthMm: 300, aspect: 1, xMm: 100, yMm: 0, rotation: 45 }).valid, false)
})
