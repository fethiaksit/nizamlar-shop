import { Metadata } from "next"
import { DTF_GARMENT_DISCLAIMER, fetchDtfCatalog } from "@lib/data/dtf"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "How to Apply DTF Transfers | Nizamlar DTF USA",
  description:
    "Step-by-step preparation and application guide for Nizamlar Direct-to-Film (DTF) transfers. DTF transfer only. Garment not included.",
}

export default async function HowToApplyDtfPage() {
  const catalog = await fetchDtfCatalog()
  const specs = catalog?.products || []
  const approvedSpecs = specs.filter((s) => s.application_approved)
  const anyHomeIronVerified = specs.some(
    (s) => s.application_approved && s.home_iron_verified,
  )

  return (
    <section
      data-testid="how-to-apply-page"
      className="min-h-screen bg-brand-cream-light text-brand-anthracite py-12 px-4 sm:px-8"
    >
      <div className="mx-auto max-w-5xl flex flex-col gap-8">
        {/* Editorial Hero Header */}
        <div className="rounded-2xl bg-brand-anthracite text-brand-cream-light p-8 sm:p-10 border border-brand-gold/50 shadow-sm">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-gold block mb-2">
            NIZAMLAR DTF APPLICATION GUIDE
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            How to Apply DTF Transfer Film
          </h1>
          <p className="text-sm sm:text-base text-brand-cream-light/90 max-w-2xl leading-relaxed mb-4">
            Every order ships as unapplied Direct-to-Film (DTF) transfer film
            engineered for cotton, polyester, and poly-cotton blends.
          </p>
          <span
            data-testid="apply-garment-disclaimer"
            className="inline-block rounded-md border border-brand-gold bg-brand-brown px-3.5 py-1.5 text-xs font-bold text-brand-cream-light"
          >
            {DTF_GARMENT_DISCLAIMER}
          </span>
        </div>

        {/* General Preparation Workflow (Safe, Non-Numeric Steps) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            {
              step: "01",
              title: "Inspect Film & Pre-Smooth Garment",
              body: "Lay your blank garment flat on a firm, heat-safe pressing surface. Pre-press briefly to remove fabric moisture and wrinkles before positioning the transfer film.",
            },
            {
              step: "02",
              title: "Position Transfer & Protective Sheet",
              body: "Place the DTF transfer film with the printed ink side facing up (white adhesive side against the fabric). Cover with parchment paper or a protective PTFE sheet.",
            },
            {
              step: "03",
              title: "Commercial Heat Press Application",
              body: "A calibrated commercial clamshell or swing-away heat press is strongly recommended for uniform edge-to-edge bonding across detailed graphics and gang sheets.",
            },
            {
              step: "04",
              title: "Peel, Finishing Pass & Care",
              body: "Follow your film batch peel instructions, then perform a brief protective finishing pass for a matte hand-feel. Wash garments inside-out in cold water and hang dry.",
            },
          ].map((card) => (
            <div
              key={card.step}
              className="rounded-2xl border border-brand-stone bg-brand-white p-6 flex flex-col gap-2"
            >
              <span className="font-mono text-xs font-extrabold text-brand-gold">
                STEP {card.step}
              </span>
              <h2 className="text-lg font-extrabold text-brand-anthracite">
                {card.title}
              </h2>
              <p className="text-sm text-brand-brown-dark leading-relaxed">
                {card.body}
              </p>
            </div>
          ))}
        </div>

        {/* Strict Operator-Verified Parameter Gate */}
        <div
          data-testid="verified-application-parameters-card"
          className="rounded-2xl border border-brand-gold bg-brand-white p-6 sm:p-8 flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl font-extrabold text-brand-anthracite">
              Press &amp; Home Iron Parameter Status
            </h2>
            <span className="rounded-full bg-brand-anthracite px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-gold">
              {approvedSpecs.length > 0
                ? "Operator Approved Specs Active"
                : "Lab Verification Gate Active"}
            </span>
          </div>

          {approvedSpecs.length > 0 ? (
            <div className="flex flex-col gap-3">
              {approvedSpecs.map((spec) => (
                <div
                  key={spec.id}
                  className="rounded-xl border border-brand-stone bg-brand-cream-light p-4 text-sm"
                >
                  <strong className="block text-brand-anthracite mb-1">
                    {spec.title_en}
                  </strong>
                  <pre className="text-xs font-mono text-brand-brown-dark whitespace-pre-wrap">
                    {JSON.stringify(spec.application_instructions_json, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div
              data-testid="unapproved-parameters-guardrail"
              className="rounded-xl border border-brand-stone bg-brand-cream-light p-4 text-sm text-brand-brown-dark leading-relaxed"
            >
              <strong className="text-brand-anthracite block mb-1">
                Verified Lot Slip Included With Shipment:
              </strong>
              Specific numeric temperature, dwell duration, pressure, and wash
              test ratings depend on the exact PET film + hot-melt powder lot
              used for your production run and are withheld online until
              approved by our production QC team. Every shipped package includes
              the lot-verified press card for that film batch.
            </div>
          )}

          {!anyHomeIronVerified && (
            <p
              data-testid="home-iron-verification-notice"
              className="text-xs font-semibold text-brand-brown"
            >
              Home Iron Note: Household irons vary unevenly across steam vents.
              Confirmed home-iron settings are only displayed on products
              explicitly marked as Home-Iron Verified by our QC team; otherwise,
              use a commercial heat press for durable adhesion.
            </p>
          )}

          <div className="pt-2 flex flex-wrap gap-3">
            <LocalizedClientLink
              href="/store"
              className="rounded-lg bg-brand-anthracite px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-brand-cream-light border border-brand-gold"
            >
              Browse DTF Transfers
            </LocalizedClientLink>
            <LocalizedClientLink
              href="/gang-sheet-builder"
              className="rounded-lg border border-brand-anthracite bg-brand-white px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-brand-anthracite"
            >
              Open 22&quot; Gang Sheet Builder
            </LocalizedClientLink>
          </div>
        </div>
      </div>
    </section>
  )
}
