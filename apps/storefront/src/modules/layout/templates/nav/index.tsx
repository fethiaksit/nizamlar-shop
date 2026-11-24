import { Suspense } from "react"
import Image from "next/image"

import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import { ShoppingBag } from "@medusajs/icons"
import User from "@modules/common/icons/user"
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
    <div className="sticky top-0 inset-x-0 z-[40]">
      <header className="relative h-[76px] mx-auto bg-[#222325] border-b border-[#B29460]/20 text-[#F3EFE7] transition-colors">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full h-full">
          {/* 1. SOL: Gerçek Nizamlar Baskı Vektör Logosu */}
          <div className="flex items-center shrink-0 min-w-0">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-3 shrink-0 focus:outline-none group/logo"
              data-testid="nav-store-link"
              aria-label="Nizamlar Baskı Ana Sayfa"
            >
              <Image
                src="/brand/logo-light.svg"
                alt="Nizamlar Baskı"
                width={190}
                height={38}
                className="h-7 sm:h-8 md:h-9 lg:h-10 w-auto object-contain transition-opacity group-hover/logo:opacity-90 shrink-0"
                priority
              />
            </LocalizedClientLink>
          </div>

          {/* 2. ORTA: Mağaza, Koleksiyon ve Tasarım Oluştur (Desktop) */}
          <div className="hidden md:flex items-center gap-x-6 lg:gap-x-8 h-full">
            <LocalizedClientLink
              href="/store"
              className="text-[#F3EFE7]/85 hover:text-[#B29460] font-medium text-[13.5px] tracking-wide transition-colors py-2 relative group flex items-center"
              data-testid="nav-store-collection-link"
            >
              <span>Mağaza</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#B29460] transition-all duration-200 group-hover:w-full" />
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/collections"
              className="text-[#F3EFE7]/85 hover:text-[#B29460] font-medium text-[13.5px] tracking-wide transition-colors py-2 relative group flex items-center"
              data-testid="nav-collections-link"
            >
              <span>Koleksiyon</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#B29460] transition-all duration-200 group-hover:w-full" />
            </LocalizedClientLink>

            <LocalizedClientLink
              href="/products/t-shirt?studio=1"
              className="text-[#F3EFE7]/85 hover:text-[#B29460] font-medium text-[13.5px] tracking-wide transition-colors py-2 relative group flex items-center gap-1.5"
              data-testid="nav-create-design-link"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#B29460] inline-block" />
              <span>Tasarım Oluştur</span>
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#B29460] transition-all duration-200 group-hover:w-full" />
            </LocalizedClientLink>
          </div>

          {/* 3. SAĞ: Kurumsal Web, Arama, Hesap, Sepet ve Menü */}
          <div className="flex items-center gap-x-2 sm:gap-x-3.5 h-full justify-end flex-none shrink-0 min-w-0">
            {/* Kurumsal Web Linki (Geniş Ekran) */}
            <div className="hidden lg:flex items-center shrink-0">
              <a
                href="https://nizamlarbaski.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-[#F3EFE7]/70 hover:text-[#B29460] transition-colors py-1.5 px-2.5 rounded hover:bg-white/5"
              >
                Kurumsal Web ↗
              </a>
            </div>

            <div className="hidden lg:block h-4 w-[1px] bg-[#B29460]/20 shrink-0" />

            {/* Arama */}
            <Search />

            {/* Hesabım (Desktop) */}
            <LocalizedClientLink
              className="hidden sm:flex relative w-10 h-10 items-center justify-center shrink-0 text-[#F3EFE7]/80 hover:text-[#B29460] transition-colors rounded-full hover:bg-white/5 focus:outline-none"
              href="/account"
              data-testid="nav-account-link"
              aria-label="Hesabım"
              title="Hesabım"
            >
              <User size="20" color="currentColor" />
            </LocalizedClientLink>

            {/* Sepet Dropdown / Butonu */}
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="relative w-10 h-10 flex items-center justify-center shrink-0 text-[#F3EFE7]/80 hover:text-[#B29460] transition-colors rounded-full hover:bg-white/5 focus:outline-none"
                  href="/cart"
                  data-testid="nav-cart-link"
                  aria-label="Sepet (0)"
                >
                  <ShoppingBag className="w-5 h-5 text-current shrink-0" />
                  <span className="sr-only">Sepet (0)</span>
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>

            {/* Hamburger Menü (SideMenu) */}
            <div className="flex items-center h-full shrink-0">
              <SideMenu regions={regions} locales={locales} currentLocale={currentLocale} />
            </div>
          </div>
        </nav>
      </header>
    </div>
  )
}
