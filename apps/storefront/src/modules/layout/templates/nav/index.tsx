import { Suspense } from "react"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import Search from "@modules/layout/components/search"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    listLocales(),
    getLocale(),
  ])

  return (
    <div className="sticky top-0 inset-x-0 z-[40] group">
      <header className="relative h-16 mx-auto border-b duration-200 bg-brand-anthracite border-brand-gold/30 text-brand-cream-light">
        <nav className="content-container txt-xsmall-plus text-[#DED9CF] flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center">
            <div className="h-full">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="text-base font-extrabold tracking-tight text-brand-cream-light hover:text-brand-gold-hover transition-colors uppercase flex items-center gap-2.5"
              data-testid="nav-store-link"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-brand-gold inline-block" />
              <span>NİZAMLAR BASKI</span>
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-6 h-full flex-1 basis-0 justify-end">
            <Search />
            <div className="hidden small:flex items-center gap-x-6 h-full">
              <a
                href="https://nizamlarbaski.com"
                target="_blank"
                rel="noreferrer"
                className="text-[#DED9CF] hover:text-brand-gold-hover text-xs font-semibold transition-colors"
              >
                Kurumsal Web
              </a>
              <LocalizedClientLink
                className="text-[#DED9CF] hover:text-brand-gold-hover font-semibold transition-colors"
                href="/account"
                data-testid="nav-account-link"
              >
                Hesabım
              </LocalizedClientLink>
            </div>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="text-brand-cream-light hover:text-brand-gold-hover font-semibold flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Sepet (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
