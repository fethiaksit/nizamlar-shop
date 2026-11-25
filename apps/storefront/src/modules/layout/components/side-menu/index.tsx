"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { ArrowRightMini, BarsThree, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text, clx } from "@modules/common/components/ui"
import Image from "next/image"
import { Fragment } from "react"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"

const SideMenuItems: { name: string; href: string; highlight?: boolean }[] = [
  { name: "Ana Sayfa", href: "/" },
  { name: "Mağaza", href: "/store" },
  { name: "Koleksiyon", href: "/collections" },
  { name: "Tasarım Oluştur", href: "/products/t-shirt?studio=1", highlight: true },
  { name: "Hesabım", href: "/account" },
  { name: "Sepetim", href: "/cart" },
]

const UsSideMenuItems: { name: string; href: string; highlight?: boolean }[] = [
  { name: "Home", href: "/" },
  { name: "Shop Transfers", href: "/store" },
  { name: "Gang Sheet Builder", href: "/gang-sheet-builder", highlight: true },
  { name: "How to Apply", href: "/how-to-apply" },
  { name: "US DTF FAQ", href: "/faq" },
  { name: "Track Order", href: "/order-tracking" },
  { name: "My Account", href: "/account" },
  { name: "Cart", href: "/cart" },
]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  countryCode?: string
}

const SideMenu = ({
  regions,
  locales,
  currentLocale,
  countryCode,
}: SideMenuProps) => {
  const isUs = String(countryCode || "").toLowerCase() === "us"
  const activeMenuItems = isUs ? UsSideMenuItems : SideMenuItems
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="flex items-center h-full shrink-0">
      <div className="flex items-center h-full shrink-0">
        <Popover className="h-full flex items-center">
          {({ open, close }) => (
            <>
              <div className="relative flex items-center h-full shrink-0">
                <Popover.Button
                  data-testid="nav-menu-button"
                  aria-label="Menüyü Aç"
                  className="relative w-10 h-10 flex items-center justify-center shrink-0 text-[#F3EFE7]/80 hover:text-[#B29460] focus:outline-none transition-colors rounded-full hover:bg-white/5"
                >
                  <BarsThree className="w-5 h-5 shrink-0" />
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-x-4"
                enterTo="opacity-100 translate-x-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-x-0"
                leaveTo="opacity-0 translate-x-4"
              >
                <PopoverPanel className="flex flex-col fixed top-0 right-0 w-[320px] max-w-[88vw] h-full z-[70] p-3 sm:p-4 text-sm text-brand-cream-light pointer-events-auto">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-[#222325] border border-[#B29460]/30 shadow-2xl rounded-2xl justify-between p-6 overflow-y-auto"
                  >
                    <div className="flex justify-between items-center border-b border-[#B29460]/20 pb-4" id="xmark">
                      <Image
                        src="/brand/logo-light.svg"
                        alt="Nizamlar Baskı"
                        width={140}
                        height={28}
                        className="h-6 w-auto object-contain"
                      />
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        aria-label="Menüyü Kapat"
                        className="p-1.5 rounded-lg bg-white/5 text-[#F3EFE7] hover:text-[#B29460] border border-[#B29460]/20 transition-colors"
                      >
                        <XMark className="w-5 h-5" />
                      </button>
                    </div>

                    <ul className="flex flex-col gap-4 items-start justify-start py-6">
                      {activeMenuItems.map((item) => (
                        <li key={item.name} className="w-full">
                          <LocalizedClientLink
                            href={item.href}
                            className={`text-2xl font-bold tracking-tight transition-colors flex items-center justify-between w-full py-1 ${
                              item.highlight
                                ? "text-[#B29460] hover:text-[#F3EFE7]"
                                : "text-[#F3EFE7] hover:text-[#B29460]"
                            }`}
                            onClick={close}
                            data-testid={`${item.name.toLowerCase().replace(/\s+/g, "-")}-link`}
                          >
                            <span>{item.name}</span>
                            {item.highlight && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B29460]/20 text-[#B29460] border border-[#B29460]/40 uppercase tracking-widest">
                                3D
                              </span>
                            )}
                          </LocalizedClientLink>
                        </li>
                      ))}

                      {/* Kurumsal Web Dış Bağlantısı */}
                      <li className="w-full pt-2 border-t border-white/5">
                        <a
                          href="https://nizamlarbaski.com"
                          target="_blank"
                          rel="noreferrer"
                          className="text-base font-semibold text-[#F3EFE7]/70 hover:text-[#B29460] transition-colors flex items-center justify-between w-full py-1.5"
                          onClick={close}
                        >
                          <span>Kurumsal Web</span>
                          <span className="text-xs text-[#B29460]">↗</span>
                        </a>
                      </li>
                    </ul>

                    <div className="flex flex-col gap-y-4 border-t border-[#B29460]/20 pt-4 text-[#DED9CF]">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small text-[#C9C1B5] text-xs">
                        © {new Date().getFullYear()} Nizamlar Baskı. Tüm hakları saklıdır.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
