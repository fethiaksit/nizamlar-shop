import { Metadata } from "next"
import { DTF_GARMENT_DISCLAIMER } from "@lib/data/dtf"
import { toJsonLd } from "@lib/util/product-structured-data"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "US DTF Transfers FAQ | Nizamlar DTF USA",
  description:
    "Frequently asked questions about ordering Ready-to-Press DTF transfers, Custom DTF Studio files, 22-inch Gang Sheets, and express shipping from Türkiye to the USA.",
}

const FAQ_ITEMS = [
  {
    q: "Am I buying a printed T-shirt or only the DTF transfer film?",
    a: `${DTF_GARMENT_DISCLAIMER} Every item sold is an unapplied Direct-to-Film (DTF) heat transfer ready for you to press onto your own blanks. The 3D shirt models and fabric colors on our site are strictly for visual contrast preview.`,
  },
  {
    q: "What file formats and resolution should I upload?",
    a: "Upload transparent RGBA PNG, WebP, or vector SVG files at 300 DPI at your actual physical print dimensions in inches. Our Custom DTF Studio and Gang Sheet Builder automatically inspect your pixel dimensions, DPI, and alpha channel before checkout.",
  },
  {
    q: "How does the 22-inch Gang Sheet Builder work?",
    a: 'Upload multiple logos, pocket prints, neck labels, and full fronts onto a single 22" wide roll (12" to 120" lengths). Use Auto-Nest to pack graphics with safe margins and zero overlaps, preview USD pricing in real time, and add directly to cart.',
  },
  {
    q: "Where are transfers manufactured and how do they ship to the United States?",
    a: "All DTF transfers are produced at Nizamlar Printing facilities in Türkiye using industrial DTF roll systems and ship via tracked international air express to all 50 US states, Washington D.C., and Puerto Rico.",
  },
  {
    q: "Are US customs duties or import fees included?",
    a: "Product prices are quoted in USD. Shipments clear US Customs and Border Protection (CBP) via express air courier. Any applicable US import duties, tariffs, customs brokerage fees, or state taxes assessed under current US import regulations are disclosed at checkout or collected by the carrier prior to delivery.",
  },
  {
    q: "What is your return and reprint policy?",
    a: "Unused Ready-to-Press stock transfers may be returned in original unpressed condition within 14 days of delivery. Custom DTF Transfers and Gang Sheets are manufactured to your uploaded artwork and are non-returnable for buyer's remorse, but qualify for a free reprint or full refund if damaged in transit or defective in print quality.",
  },
] as const

export default function UsDtfFaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  }

  return (
    <section
      data-testid="dtf-faq-page"
      className="min-h-screen bg-brand-cream-light text-brand-anthracite py-12 px-4 sm:px-8"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(faqSchema) }}
      />
      <div className="mx-auto max-w-4xl flex flex-col gap-6">
        <div className="rounded-2xl bg-brand-anthracite text-brand-cream-light p-8 border border-brand-gold/50">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold block mb-2">
            NIZAMLAR DTF USA / SUPPORT
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-brand-cream-light/85">
            {DTF_GARMENT_DISCLAIMER} Everything you need to know about artwork
            prep, 22&quot; gang sheets, and tracked air shipping to the USA.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {FAQ_ITEMS.map((item) => (
            <article
              key={item.q}
              className="rounded-2xl border border-brand-stone bg-brand-white p-6 shadow-xs"
            >
              <h2 className="text-base sm:text-lg font-extrabold text-brand-anthracite mb-2">
                {item.q}
              </h2>
              <p className="text-sm text-brand-brown-dark leading-relaxed">
                {item.a}
              </p>
            </article>
          ))}
        </div>

        <div className="rounded-2xl border border-brand-gold bg-brand-white p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <strong className="block text-sm font-extrabold text-brand-anthracite">
              Need to check an existing US DTF order?
            </strong>
            <span className="text-xs text-brand-brown-dark">
              Look up real-time production &amp; international air courier tracking.
            </span>
          </div>
          <LocalizedClientLink
            href="/order-tracking"
            className="rounded-lg bg-brand-anthracite px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-brand-cream-light border border-brand-gold"
          >
            Track My Order
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}
