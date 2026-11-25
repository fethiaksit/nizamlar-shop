import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer({
  countryCode,
}: {
  countryCode?: string
} = {}) {
  const isUs = (countryCode || "").toLowerCase() === "us"
  const categories = await listCategories({
    fields: "id,name,handle,parent_category_id",
  }).catch(() => [])
  if (isUs) {
    return (
      <footer className="brand-footer">
        <div className="content-container brand-footer-grid">
          <div>
            <LocalizedClientLink href="/" className="brand-footer-logo">
              NIZAMLAR DTF USA<span>DIRECT-TO-FILM TRANSFER STUDIO</span>
            </LocalizedClientLink>
            <p>
              DTF transfer only. Garment not included. Crafted in Türkiye &amp;
              express shipped across all 50 US states.
            </p>
          </div>
          <div>
            <h3>DTF Transfers</h3>
            <LocalizedClientLink href="/store">
              Ready to Press Transfers
            </LocalizedClientLink>
            <LocalizedClientLink href="/gang-sheet-builder">
              22&quot; Gang Sheet Builder
            </LocalizedClientLink>
            <LocalizedClientLink href="/how-to-apply">
              How to Apply DTF Film
            </LocalizedClientLink>
            <LocalizedClientLink href="/faq">
              US DTF FAQ
            </LocalizedClientLink>
          </div>
          <div>
            <h3>US Customer Care</h3>
            {[
              ["/order-tracking", "Track DTF Order"],
              ["/shipping", "US Shipping & Customs"],
              ["/returns", "Return & Reprint Policy"],
              ["/contact", "Contact Support"],
            ].map(([href, label]) => (
              <LocalizedClientLink key={href} href={href}>
                {label}
              </LocalizedClientLink>
            ))}
          </div>
          <div>
            <h3>Legal</h3>
            <LocalizedClientLink href="/terms">
              Terms of Sale
            </LocalizedClientLink>
            <LocalizedClientLink href="/privacy">
              Privacy Policy
            </LocalizedClientLink>
            <LocalizedClientLink href="/account">
              My Account
            </LocalizedClientLink>
          </div>
        </div>
        <div className="content-container brand-footer-bottom">
          <span>© {new Date().getFullYear()} Nizamlar DTF Transfers (USD)</span>
          <span>DTF transfer only. Garment not included.</span>
        </div>
      </footer>
    )
  }
  return (
    <footer className="brand-footer">
      <div className="content-container brand-footer-grid">
        <div>
          <LocalizedClientLink href="/" className="brand-footer-logo">
            NİZAMLAR BASKI<span>TEXTILE & PRINT STUDIO</span>
          </LocalizedClientLink>
          <p>İyi kumaş. Özenli baskı. Size ait bir iz.</p>
        </div>
        <div>
          <h3>Koleksiyon</h3>
          <LocalizedClientLink href="/store">Tüm ürünler</LocalizedClientLink>
          {categories
            .filter((c) => !c.parent_category_id)
            .slice(0, 4)
            .map((c) => (
              <LocalizedClientLink key={c.id} href={`/categories/${c.handle}`}>
                {c.name}
              </LocalizedClientLink>
            ))}
        </div>
        <div>
          <h3>Müşteri Hizmetleri</h3>
          {[
            ["/shipping", "Teslimat"],
            ["/returns", "İade koşulları"],
            ["/contact", "İletişim"],
            ["/account", "Hesabım"],
          ].map(([href, label]) => (
            <LocalizedClientLink key={href} href={href}>
              {label}
            </LocalizedClientLink>
          ))}
        </div>
        <div>
          <h3>Bilgi</h3>
          <LocalizedClientLink href="/terms">
            Satış koşulları
          </LocalizedClientLink>
          <LocalizedClientLink href="/privacy">Gizlilik</LocalizedClientLink>
          <LocalizedClientLink href="/search">Ürün ara</LocalizedClientLink>
        </div>
      </div>
      <div className="content-container brand-footer-bottom">
        <span>© {new Date().getFullYear()} Nizamlar Baskı</span>
        <span>Fikrinizi birlikte üretelim.</span>
      </div>
    </footer>
  )
}
