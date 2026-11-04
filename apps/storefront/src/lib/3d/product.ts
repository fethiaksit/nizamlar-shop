import type { HttpTypes } from "@medusajs/types"
import type { GarmentKind, GarmentPrint } from "@modules/clothes-rack/garment"

const COLORS: Record<string, string> = {
  siyah: "#252528",
  black: "#252528",
  beyaz: "#f4f1e9",
  white: "#f4f1e9",
  antrasit: "#2b2d31",
  ekru: "#e8e2d6",
  "krem taş": "#e6dfd2",
  krem: "#e6dfd2",
  bej: "#c6ad8f",
  "koyu kahve": "#3b2b23",
  kahve: "#3b2b23",
  haki: "#666d4f",
  lacivert: "#242f4a",
  bordo: "#703443",
  navy: "#242f4a",
  grey: "#777879",
}

export function colorHex(value = "") {
  return COLORS[value.toLocaleLowerCase("tr-TR").trim()] || "#e8e2d6"
}

export function getVariantOptions(
  variant?: Pick<HttpTypes.StoreProductVariant, "options">,
) {
  return Object.fromEntries(
    (variant?.options || [])
      .filter((o) => o.option_id)
      .map((o) => [o.option_id!, o.value]),
  )
}

export function isTshirt(
  product: Pick<HttpTypes.StoreProduct, "handle" | "title" | "metadata">,
) {
  return (
    product.metadata?.model_type === "tshirt" ||
    /(?:^|[\s-])(t-shirt|tshirt|tişört|tisort|tee)(?:$|[\s-])/i.test(
      `${product.handle} ${product.title}`,
    )
  )
}

export function isSweater(
  product: Pick<HttpTypes.StoreProduct, "handle" | "title" | "metadata">,
) {
  return (
    product.metadata?.garment_category === "sweater" ||
    /(?:^|[\s-])(kazak|triko|sweater|knit)(?:$|[\s-])/i.test(
      `${product.handle} ${product.title}`,
    )
  )
}

export function isSweatshirt(
  product: Pick<HttpTypes.StoreProduct, "handle" | "title" | "metadata">,
) {
  return (
    product.metadata?.garment_category === "sweatshirt" ||
    (/sweatshirt|crewneck/i.test(`${product.handle} ${product.title}`) &&
      !/hoodie|kapüşon|kapuson/i.test(`${product.handle} ${product.title}`))
  )
}

export function variantColor(
  product: HttpTypes.StoreProduct,
  variant?: HttpTypes.StoreProductVariant,
) {
  const option = product.options?.find((o) =>
    /^(renk|color|colour)$/i.test(o.title),
  )
  return colorHex(
    variant?.options?.find((o) => o.option_id === option?.id)?.value,
  )
}

export type RackProductItem = {
  productId: string
  variantId?: string
  handle: string
  name: string
  categoryLabel: string
  fabricBadge: string
  kind: GarmentKind
  colour: string
  print: GarmentPrint
}

export function getLogoPrintForGarment(
  kind: GarmentKind,
  colorName: string,
): GarmentPrint {
  const norm = colorName.toLocaleLowerCase("tr-TR").trim()
  const isLight =
    norm.includes("beyaz") ||
    norm.includes("krem") ||
    norm.includes("ekru") ||
    norm.includes("bej") ||
    norm.includes("white")

  if (kind === "tee") {
    if (isLight) {
      return {
        kind: "nizamlar",
        style: "tee-chest-and-center",
        primaryInk: "#222325",
        accentInk: "#8F703D",
        badgeBg: "#222325",
        badgeBorder: "#B29460",
        subtitle: "B A S K I   ·   A T E L I E R",
        code: "NİZAMLAR BASKI  ·  240 GSM PENYE",
      }
    }
    return {
      kind: "nizamlar",
      style: norm.includes("antrasit")
        ? "tee-atelier-minimal"
        : "tee-chest-and-center",
      primaryInk: "#F8F6F0",
      accentInk: "#C4A774",
      badgeBg: "#161718",
      badgeBorder: "#B29460",
      subtitle: "P R E M I U M   ·   T E K S T İ L",
      code: "NİZAMLAR BASKI  ·  240 GSM PENYE",
    }
  }

  if (kind === "sweater") {
    if (isLight) {
      return {
        kind: "nizamlar",
        style: "sweater-embroidery",
        primaryInk: "#222325",
        accentInk: "#8A6B39",
        badgeBg: "#222325",
        badgeBorder: "#B29460",
        subtitle: "ESSENTIAL TRİKO KAZAK  ·  ATELIER",
      }
    }
    return {
      kind: "nizamlar",
      style: "sweater-atelier-crest",
      primaryInk: "#F8F6F0",
      accentInk: "#C4A774",
      badgeBg: "#191A1B",
      badgeBorder: "#C4A774",
      subtitle: "ESSENTIAL TRİKO KAZAK  ·  ATELIER",
    }
  }

  // Sweatshirt (crewneck)
  if (isLight) {
    return {
      kind: "nizamlar",
      style: "sweatshirt-embossed",
      primaryInk: "#222325",
      accentInk: "#49372E",
      badgeBg: "#222325",
      badgeBorder: "#B29460",
      subtitle: "SIGNATURE 3 İPLİK ŞARDONLU  ·  340 GSM",
    }
  }
  return {
    kind: "nizamlar",
    style: "sweatshirt-signature",
    primaryInk: "#F8F6F0",
    accentInk: "#C4A774",
    badgeBg: "#161718",
    badgeBorder: "#C4A774",
    subtitle: "SIGNATURE 3 İPLİK ŞARDONLU  ·  340 GSM",
  }
}

export function buildRackProducts(
  products: HttpTypes.StoreProduct[],
): RackProductItem[] {
  // Exclude English dummy Medusa seed items when Nizamlar Turkish products exist
  const nizamlarProducts = products.filter(
    (p) =>
      p.id &&
      p.handle &&
      !/^medusa\s/i.test(p.title || "") &&
      (isSweater(p) || isSweatshirt(p) || isTshirt(p)),
  )

  const sourceProducts = nizamlarProducts.length ? nizamlarProducts : products

  const findVariantByColor = (
    p: HttpTypes.StoreProduct | undefined,
    targetColor: string,
  ) => {
    if (!p) return undefined
    const colorOption = p.options?.find((o) =>
      /^(renk|color|colour)$/i.test(o.title),
    )
    const normTarget = targetColor.toLocaleLowerCase("tr-TR").trim()
    return (
      p.variants?.find((v) => {
        const val =
          v.options
            ?.find((o) => o.option_id === colorOption?.id)
            ?.value?.toLocaleLowerCase("tr-TR")
            .trim() || ""
        return val === normTarget || val.includes(normTarget)
      }) || p.variants?.[0]
    )
  }

  const teeProduct = sourceProducts.find(
    (p) =>
      p.handle === "premium-oversize-penye-t-shirt" ||
      (isTshirt(p) && !isSweater(p) && !isSweatshirt(p)),
  )
  const sweatshirtProduct = sourceProducts.find(
    (p) => p.handle === "nizamlar-signature-sweatshirt" || isSweatshirt(p),
  )
  const sweaterProduct = sourceProducts.find(
    (p) => p.handle === "nizamlar-essential-kazak" || isSweater(p),
  )

  const curatedSpecs: Array<{
    product?: HttpTypes.StoreProduct
    colorName: string
    colourHex: string
    kind: GarmentKind
    displayName: string
    categoryLabel: string
    fabricBadge: string
  }> = [
    // 1. Beyaz Nizamlar logolu premium tişört
    {
      product: teeProduct,
      colorName: "Beyaz",
      colourHex: "#F4F1EA",
      kind: "tee",
      displayName: "Nizamlar Premium Oversize Tişört · Beyaz",
      categoryLabel: "Tişört",
      fabricBadge: "240 GSM %100 Pamuk Penye",
    },
    // 2. Antrasit Nizamlar logolu sweatshirt
    {
      product: sweatshirtProduct || teeProduct,
      colorName: "Antrasit",
      colourHex: "#232528",
      kind: "crewneck",
      displayName: "Nizamlar Signature Sweatshirt · Antrasit",
      categoryLabel: "Sweatshirt",
      fabricBadge: "340 GSM 3 İplik Şardonlu",
    },
    // 3. Krem / taş tonunda Nizamlar logolu kazak
    {
      product: sweaterProduct || sweatshirtProduct || teeProduct,
      colorName: "Krem Taş",
      colourHex: "#E6DFD2",
      kind: "sweater",
      displayName: "Nizamlar Essential Kazak · Krem Taş",
      categoryLabel: "Kazak",
      fabricBadge: "12 Gauge %100 Pamuk Triko",
    },
    // 4. Siyah Nizamlar logolu tişört
    {
      product: teeProduct,
      colorName: "Siyah",
      colourHex: "#18191B",
      kind: "tee",
      displayName: "Nizamlar Premium Oversize Tişört · Siyah",
      categoryLabel: "Tişört",
      fabricBadge: "240 GSM %100 Pamuk Penye",
    },
    // 5. Bej Nizamlar logolu sweatshirt
    {
      product: sweatshirtProduct || teeProduct,
      colorName: "Bej",
      colourHex: "#C8B59B",
      kind: "crewneck",
      displayName: "Nizamlar Signature Sweatshirt · Bej",
      categoryLabel: "Sweatshirt",
      fabricBadge: "340 GSM 3 İplik Şardonlu",
    },
    // 6. Koyu kahve Nizamlar logolu kazak
    {
      product: sweaterProduct || sweatshirtProduct || teeProduct,
      colorName: "Koyu Kahve",
      colourHex: "#3B2B23",
      kind: "sweater",
      displayName: "Nizamlar Essential Kazak · Koyu Kahve",
      categoryLabel: "Kazak",
      fabricBadge: "12 Gauge %100 Pamuk Triko",
    },
    // 7. Antrasit Nizamlar logolu tişört
    {
      product: teeProduct,
      colorName: "Antrasit",
      colourHex: "#2E3034",
      kind: "tee",
      displayName: "Nizamlar Premium Oversize Tişört · Antrasit",
      categoryLabel: "Tişört",
      fabricBadge: "240 GSM %100 Pamuk Penye",
    },
    // 8. Koyu kahve Nizamlar logolu sweatshirt
    {
      product: sweatshirtProduct || teeProduct,
      colorName: "Koyu Kahve",
      colourHex: "#32251E",
      kind: "crewneck",
      displayName: "Nizamlar Signature Sweatshirt · Koyu Kahve",
      categoryLabel: "Sweatshirt",
      fabricBadge: "340 GSM 3 İplik Şardonlu",
    },
  ]

  const built = curatedSpecs
    .filter((spec): spec is typeof spec & { product: HttpTypes.StoreProduct } =>
      Boolean(spec.product?.id && spec.product?.handle),
    )
    .map((spec) => {
      const variant = findVariantByColor(spec.product, spec.colorName)
      return {
        productId: spec.product.id,
        variantId: variant?.id,
        handle: spec.product.handle!,
        name: spec.displayName,
        categoryLabel: spec.categoryLabel,
        fabricBadge: spec.fabricBadge,
        kind: spec.kind,
        colour: spec.colourHex,
        print: getLogoPrintForGarment(spec.kind, spec.colorName),
      }
    })

  return built
}

// One garment metre is one physical metre. The printable torso is 320 × 400 mm.
export function printPlacement({
  widthMm,
  aspect,
  xMm,
  yMm,
  rotation,
}: {
  widthMm: number
  aspect: number
  xMm: number
  yMm: number
  rotation: number
}) {
  const heightMm = widthMm / aspect
  const angle = (rotation * Math.PI) / 180
  const boxWidth =
    Math.abs(widthMm * Math.cos(angle)) + Math.abs(heightMm * Math.sin(angle))
  const boxHeight =
    Math.abs(widthMm * Math.sin(angle)) + Math.abs(heightMm * Math.cos(angle))
  return {
    widthMm,
    heightMm,
    areaCm2: (widthMm * heightMm) / 100,
    xMm,
    yMm,
    rotation,
    valid:
      [widthMm, aspect, xMm, yMm, rotation].every(Number.isFinite) &&
      widthMm >= 20 &&
      aspect > 0 &&
      Math.abs(xMm) + boxWidth / 2 <= 160 &&
      Math.abs(yMm) + boxHeight / 2 <= 200,
  }
}
