import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import {
  PoliciesUnavailable,
  PolicyPage,
  ShippingSummary,
} from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Shipping information",
  description: "Shipping rates and delivery times.",
}

export default async function ShippingPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const isUs = countryCode.toLowerCase() === "us"
  const { current, currencyCode } = await getStorePolicies(countryCode)

  return (
    <PolicyPage
      title={isUs ? "US Air Express Shipping & Customs Information" : "Shipping information"}
    >
      {isUs && (
        <div
          data-testid="us-shipping-policy-disclosure"
          className="mb-6 rounded-xl border border-brand-gold/60 bg-brand-cream-light p-5 text-sm text-brand-anthracite space-y-2"
        >
          <p className="font-bold">
            Direct-to-Film (DTF) Transfer Film Only — Garment Not Included.
          </p>
          <p>
            All transfers and 22&quot; gang sheets manufacture at Nizamlar Printing
            in Türkiye and ship in moisture-sealed protective tubes or flat
            mailers via tracked international air express (UPS / DHL / FedEx) to
            all 50 US states, Washington D.C., and Puerto Rico.
          </p>
          <p>
            <strong>Customs, Tariffs &amp; Import Duties:</strong> Prices are
            listed in USD. Shipments clear US Customs and Border Protection
            (CBP); any applicable US import duties, customs clearance charges,
            or state use taxes required under current US trade regulations are
            disclosed at checkout or collected by the courier upon import.
          </p>
        </div>
      )}
      {current ? (
        <>
          <p>
            Orders to {countryCode.toUpperCase()} ship with the following rates
            and delivery times.
          </p>
          <ShippingSummary policies={current} currencyCode={currencyCode} />
          <p className="text-ui-fg-subtle">
            Available shipping methods and final costs are shown at checkout.
          </p>
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
