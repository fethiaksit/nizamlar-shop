import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import { PoliciesUnavailable, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Return policy",
  description: "How to return items and get a refund.",
}

export default async function ReturnsPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const isUs = countryCode.toLowerCase() === "us"
  const { current } = await getStorePolicies(countryCode)

  return (
    <PolicyPage
      title={isUs ? "US DTF Return & Reprint Policy" : "Return policy"}
    >
      {isUs && (
        <div
          data-testid="us-return-policy-disclosure"
          className="mb-6 rounded-xl border border-brand-gold/60 bg-brand-cream-light p-5 text-sm text-brand-anthracite space-y-2"
        >
          <p>
            <strong>Ready-to-Press Stock Transfers &amp; Bundles:</strong> Eligible
            for return within 14 days of delivery in original, unpressed,
            uncut condition.
          </p>
          <p>
            <strong>Custom DTF Transfers &amp; 22&quot; Gang Sheets:</strong>{" "}
            Manufactured to your custom artwork and dimensions; non-returnable
            for buyer&apos;s remorse or customer-approved low-DPI files. If your
            transfer film arrives damaged in transit or exhibits a verified
            printing/adhesive defect, contact us within 7 days of delivery with
            photos for an expedited free reprint or full USD refund.
          </p>
        </div>
      )}
      {current ? (
        <>
          <p>
            You can return items within {current.returnWindowDays} days of
            delivery. Items are returned by mail.
          </p>
          <p>
            {current.freeReturns
              ? "Return shipping is free."
              : "Return shipping costs are paid by the customer."}
          </p>
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
