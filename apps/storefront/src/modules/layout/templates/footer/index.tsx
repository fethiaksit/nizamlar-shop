import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  const categories = await listCategories({
    fields: "id,name,handle,parent_category_id",
  }).catch(() => [])
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
