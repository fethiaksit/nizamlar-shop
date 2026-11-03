import { Metadata } from "next"

import FeaturedProducts from "@modules/home/components/featured-products"
import CinematicHero from "@modules/cinematic-hero"
import NizamlarClothesRackSection from "@modules/clothes-rack"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { toJsonLd } from "@lib/util/product-structured-data"
import { getSiteOrigin, listCountryCodes, STORE_NAME } from "@lib/util/site"
import { buildRegionsReturnPolicies } from "@lib/util/store-policies"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])

  return {
    title: "Nizamlar Baskı — Premium Tekstil ve Kişiye Özel Baskı Çözümleri",
    description:
      "DTF ve serigrafi baskı teknolojisiyle yüksek kaliteli oversize tişört, sweatshirt ve kurumsal tekstil ürünleri. Kendi tasarımınızı 3D stüdyoda anında oluşturun.",
    alternates: {
      canonical: `${origin}/${countryCode}`,
      languages: {
        ...Object.fromEntries(
          listCountryCodes(regions).map((code) => [
            `en-${code.toUpperCase()}`,
            `${origin}/${code}`,
          ])
        ),
        "x-default": origin,
      },
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  const [{ collections }, productResult] = await Promise.all([
    listCollections({
      fields: "id, handle, title",
    }),
    listProducts({
      countryCode,
      queryParams: { limit: 12 },
    }).catch(() => ({ response: { products: [], count: 0 } })),
  ])

  if (!collections || !region) {
    return null
  }

  const products = productResult?.response?.products || []

  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])
  const homeUrl = `${origin}/${countryCode}`
  const returnPolicies = buildRegionsReturnPolicies(regions)
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: STORE_NAME,
      url: origin,
      ...(returnPolicies.length
        ? { hasMerchantReturnPolicy: returnPolicies }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: STORE_NAME,
      url: homeUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${homeUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />
      {/* 1. VeloriQ Sinematik 3D Scroll Hero */}
      <CinematicHero />

      {/* 2. Dimaac 3D İnteraktif Kıyafet Askılığı Vitrini */}
      <NizamlarClothesRackSection products={products} />

      {/* 3. Öne Çıkan Koleksiyonlar & Ürün Listesi */}
      <div className="py-16 bg-[#0E0F11]">
        <div className="content-container">
          <ul className="flex flex-col gap-x-6">
            <FeaturedProducts collections={collections} region={region} />
          </ul>
        </div>
      </div>
    </>
  )
}
