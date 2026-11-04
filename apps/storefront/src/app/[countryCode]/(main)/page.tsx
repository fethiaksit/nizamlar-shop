import { Metadata } from "next"

import { isTshirt } from "@lib/3d/product"
import FeaturedProducts from "@modules/home/components/featured-products"
import CinematicHero from "@modules/cinematic-hero"
import NizamlarClothesRackSection from "@modules/clothes-rack"
import Tshirt3dExperience from "@modules/tshirt3d-experience"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"
import { listCollections } from "@lib/data/collections"
import { listProducts } from "@lib/data/products"
import { getSiteContent } from "@lib/data/site-content"
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
          ]),
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

  const [{ collections }, productResult, siteContent] = await Promise.all([
    listCollections({
      fields: "id, handle, title",
    }),
    listProducts({
      countryCode,
      queryParams: { limit: 24 },
    }).catch(() => ({ response: { products: [], count: 0 } })),
    getSiteContent().catch(() => ({
      settings: null,
      slides: [],
      sections: [],
      rackItems: [],
      customizer: null,
    })),
  ])

  if (!collections || !region) {
    return null
  }

  const products = productResult?.response?.products || []
  const primaryTshirtHandle =
    products.find((p) => p.handle === "premium-oversize-penye-t-shirt")
      ?.handle ||
    products.find(
      (p) =>
        isTshirt(p) &&
        (p.options?.some((o) => /^renk$/i.test(o.title)) ||
          /premium-oversize/i.test(p.handle || "")),
    )?.handle ||
    products.find(isTshirt)?.handle ||
    undefined

  const studioHref = primaryTshirtHandle
    ? `/products/${primaryTshirtHandle}?studio=1`
    : "/store"

  const popularProducts = [...products]
    .sort((a, b) => {
      const rankA =
        a.options?.some((o) => /^renk$/i.test(o.title)) ||
        /premium-oversize|nizamlar-|ozel-baskili/i.test(a.handle || "")
          ? 0
          : 1
      const rankB =
        b.options?.some((o) => /^renk$/i.test(o.title)) ||
        /premium-oversize|nizamlar-|ozel-baskili/i.test(b.handle || "")
          ? 0
          : 1
      return rankA - rankB
    })
    .slice(0, 6)

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
    <div className="bg-brand-cream-light text-brand-anthracite">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />

      {/* 1. Kurumsal 3 Sahneli Hero Slider (Medusa Admin'den Dinamik Yönetilebilir) */}
      <CinematicHero
        designHandle={primaryTshirtHandle}
        initialSlides={siteContent?.slides}
      />

      {/* 2. Dimaac 3D Clothes Rack Ürün Vitrini (Medusa Admin'den Dinamik Yönetilebilir) */}
      <NizamlarClothesRackSection
        products={products}
        initialRackItems={siteContent?.rackItems}
      />

      {/* 3. Yeni TSHIRT3D Experience (Dimaac Clothes Rack'in hemen altında) */}
      <Tshirt3dExperience
        products={products}
        region={region}
        countryCode={countryCode}
      />

      {/* 4. Popüler Ürünler */}
      <section
        id="popular-products"
        data-testid="popular-products-section"
        className="py-20 bg-brand-cream-light border-b border-brand-stone"
      >
        <div className="content-container">
          <div className="flex flex-col small:flex-row small:items-end justify-between gap-4 mb-12">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-brand-brown mb-2">
                <span className="w-4 h-0.5 bg-brand-gold inline-block" />
                <span>02 / SEÇKİN KATALOG</span>
              </p>
              <h2 className="text-3xl small:text-4xl font-extrabold tracking-tight text-brand-anthracite">
                Popüler Ürünler
              </h2>
              <p className="text-sm text-brand-brown-dark mt-2 max-w-xl">
                Yüksek gramajlı %100 pamuk penye tişörtler, kapüşonlu
                sweatshirtler ve özel baskıya uygun tekstil ürünleri.
              </p>
            </div>
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-5 py-3.5 rounded-md bg-brand-anthracite text-brand-white hover:bg-brand-brown transition-colors w-fit"
            >
              <span>Tüm Ürünleri Gör</span>
              <span aria-hidden="true">→</span>
            </LocalizedClientLink>
          </div>

          {popularProducts.length > 0 && (
            <ul className="grid grid-cols-2 small:grid-cols-3 gap-x-6 gap-y-12 mb-12">
              {popularProducts.map((product) => (
                <li key={product.id}>
                  <ProductPreview product={product} region={region} isFeatured />
                </li>
              ))}
            </ul>
          )}

          {collections.length > 0 && (
            <ul className="flex flex-col gap-x-6">
              <FeaturedProducts collections={collections} region={region} />
            </ul>
          )}
        </div>
      </section>

      {/* 5. Baskı Hizmetleri */}
      <section
        id="print-services"
        data-testid="print-services-section"
        className="py-20 bg-brand-cream-light border-b border-brand-stone"
      >
        <div className="content-container">
          <div className="max-w-2xl mb-12">
            <p className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-brand-brown mb-2">
              <span className="w-4 h-0.5 bg-brand-gold inline-block" />
              <span>03 / ÜRETİM TEKNOLOJİLERİ</span>
            </p>
            <h2 className="text-3xl small:text-4xl font-extrabold tracking-tight text-brand-anthracite">
              Profesyonel Baskı Hizmetleri
            </h2>
            <p className="text-sm text-brand-brown-dark mt-2 leading-relaxed">
              Her tasarıma ve sipariş adedine uygun endüstriyel baskı
              teknikleriyle yıkamaya dayanıklı, canlı ve net sonuçlar.
            </p>
          </div>

          <div className="grid grid-cols-1 small:grid-cols-3 gap-6">
            {[
              {
                tag: "EN ÇOK TERCİH EDİLEN",
                badgeClass: "bg-brand-anthracite text-brand-gold-hover border border-brand-gold/40",
                title: "DTF Dijital Baskı",
                desc: "Fotoğraf kalitesinde çok renkli tasarımlar ve degrade geçişler için 300 DPI çözünürlükte esnek, çatlama yapmayan transfer teknolojisi.",
                specs: "1 Adetten Başlayan Sipariş · Canlı Renk Gamı",
              },
              {
                tag: "YÜKSEK ADET & KURUMSAL",
                badgeClass: "bg-brand-brown text-brand-cream-light border border-brand-brown-dark",
                title: "Serigrafi Baskı",
                desc: "Kumaş liflerine işleyen su bazlı ve plastisol boyalarla yüksek adetli koleksiyon ve etkinlik ürünlerinde maksimum dayanıklılık.",
                specs: "Pantone Renk Eşleşmesi · Nefes Alan Doku",
              },
              {
                tag: "PREMİUM MARKALAMA",
                badgeClass: "bg-brand-brown-dark text-brand-gold-hover border border-brand-gold/40",
                title: "Özel Kalıp & Etiketleme",
                desc: "240 GSM %100 pamuk penye kumaş, ense baskı ve kurumsal paketleme seçenekleriyle markanıza özel tekstil üretimi.",
                specs: "240 GSM Penye Pamuk · Çift İğne Dikiş",
              },
            ].map((service) => (
              <div
                key={service.title}
                className="flex flex-col justify-between p-8 rounded-2xl bg-brand-white border border-brand-stone shadow-sm hover:border-brand-brown transition-colors"
              >
                <div>
                  <span
                    className={`inline-block text-[11px] font-bold tracking-wider uppercase px-3.5 py-1 rounded-full mb-5 ${service.badgeClass}`}
                  >
                    {service.tag}
                  </span>
                  <h3 className="text-xl font-bold text-brand-anthracite mb-3">
                    {service.title}
                  </h3>
                  <p className="text-sm text-brand-brown-dark leading-relaxed">
                    {service.desc}
                  </p>
                </div>
                <p className="text-xs font-bold text-brand-brown pt-6 mt-6 border-t border-brand-stone">
                  {service.specs}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Toplu Üretim / Kurumsal Sipariş */}
      <section
        id="bulk-production"
        data-testid="bulk-production-section"
        className="py-20 bg-[linear-gradient(135deg,#F8F6F0_0%,#E8E2D4_100%)]"
      >
        <div className="content-container">
          <div className="grid grid-cols-1 small:grid-cols-12 gap-10 items-center">
            <div className="small:col-span-6">
              <p className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-brand-brown mb-2">
                <span className="w-4 h-0.5 bg-brand-gold inline-block" />
                <span>04 / KURUMSAL ÇÖZÜMLER & TOPLU SİPARİŞ</span>
              </p>
              <h2 className="text-3xl small:text-4xl font-extrabold tracking-tight text-brand-anthracite">
                Adet Arttıkça Büyüyen{" "}
                <span className="text-brand-brown">Otomatik İskonto</span>
              </h2>
              <p className="text-sm text-brand-brown-dark mt-3 leading-relaxed">
                Şirket etkinlikleri, ekip kıyafetleri, üniversite kulüpleri ve
                kendi giyim markasını kuranlar için şeffaf kademeli fiyatlandırma.
                3D stüdyoda adedi girdiğiniz anda indiriminiz otomatik
                hesaplanır.
              </p>

              <div className="flex flex-wrap gap-4 mt-8">
                <LocalizedClientLink
                  href={studioHref}
                  className="inline-flex items-center gap-3 px-6 py-3.5 rounded-md bg-brand-anthracite hover:bg-brand-brown text-brand-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <span>Toplu Fiyat Hesapla</span>
                  <span aria-hidden="true">↗</span>
                </LocalizedClientLink>
                <LocalizedClientLink
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-md bg-brand-white border border-brand-brown text-brand-anthracite hover:bg-brand-brown hover:text-brand-white text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  <span>Kurumsal İletişim</span>
                  <span aria-hidden="true">→</span>
                </LocalizedClientLink>
              </div>
            </div>

            <div className="small:col-span-6">
              <div className="grid grid-cols-2 small:grid-cols-3 gap-4">
                {[
                  ["5+ Adet", "%5 Baskı İndirimi", "Küçük Ekip"],
                  ["10+ Adet", "%10 Baskı İndirimi", "Etkinlik & Kulüp"],
                  ["20+ Adet", "%15 Baskı İndirimi", "Kurumsal Paket"],
                  ["50+ Adet", "%20 Baskı İndirimi", "Marka Koleksiyonu"],
                  ["100+ Adet", "%25 Baskı İndirimi", "Seri Üretim"],
                  ["250+ Adet", "%30 Baskı İndirimi", "Toptan Üretim"],
                ].map(([qty, discount, label]) => (
                  <div
                    key={qty}
                    className="p-5 rounded-xl bg-brand-white border border-brand-stone shadow-sm"
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-brown">
                      {label}
                    </span>
                    <p className="text-xl font-extrabold text-brand-anthracite mt-1">
                      {qty}
                    </p>
                    <p className="inline-block text-xs font-bold bg-brand-anthracite text-brand-gold-hover px-2.5 py-1 rounded mt-2">
                      {discount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
