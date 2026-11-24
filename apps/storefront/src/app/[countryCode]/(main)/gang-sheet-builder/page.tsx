import { Metadata } from "next"
import { listProducts } from "@lib/data/products"
import GangSheetBuilder from "@modules/gang-sheet-builder"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: 'DTF Gang Sheet Builder (22" Roll) | Nizamlar Custom Transfers',
  description:
    "Build 300-DPI transparent DTF transfer gang sheets online with auto-nesting, collision detection, and instant USD pricing. DTF transfer only. Garment not included.",
}

export default async function GangSheetBuilderPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params

  let carrierVariantId: string | undefined
  try {
    const { response } = await listProducts({
      countryCode,
      queryParams: { limit: 10 },
    })
    const firstWithVariant = response.products.find(
      (p) => (p.variants?.length || 0) > 0,
    )
    carrierVariantId = firstWithVariant?.variants?.[0]?.id
  } catch {
    carrierVariantId = undefined
  }

  return (
    <GangSheetBuilder
      countryCode={countryCode}
      carrierVariantId={carrierVariantId}
    />
  )
}
