"use client"

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react"
import { ShoppingBag } from "@medusajs/icons"
import { retrieveCart } from "@lib/data/cart"
import { CART_UPDATED_EVENT } from "@lib/util/cart-events"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { useParams, usePathname, useRouter } from "next/navigation"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"

const countItems = (cart?: HttpTypes.StoreCart | null) =>
  cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0

const CartDropdown = ({
  cart: serverCart,
}: {
  cart?: HttpTypes.StoreCart | null
}) => {
  const router = useRouter()
  const { countryCode } = useParams()
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  // Statically rendered pages can't read the cart cookie, so the cart is loaded in the browser.
  // We keep a single unified cart state initialized with serverCart if provided.
  const [cart, setCart] = useState<HttpTypes.StoreCart | null>(serverCart ?? null)
  const [activeTimer, setActiveTimer] = useState<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )
  const [cartDropdownOpen, setCartDropdownOpen] = useState(false)

  const open = () => setCartDropdownOpen(true)
  const close = () => setCartDropdownOpen(false)

  const totalItems = countItems(cart)
  const subtotal = cart?.subtotal ?? 0
  const itemRef = useRef<number>(totalItems)

  // 1. Sync serverCart if prop changes during navigation
  const [prevServerCart, setPrevServerCart] = useState(serverCart)
  if (serverCart !== prevServerCart) {
    setPrevServerCart(serverCart)
    setCart(serverCart ?? null)
  }

  // 2. Fetch cart on mount if serverCart is null or undefined
  useEffect(() => {
    if (!serverCart) {
      retrieveCart()
        .then((latestCart) => {
          setCart(latestCart)
          itemRef.current = countItems(latestCart)
        })
        .catch(() => {})
    }
  }, [serverCart])

  // 3. Always listen to CART_UPDATED_EVENT (even when serverCart was initially provided!)
  useEffect(() => {
    const handleCartUpdated = () => {
      retrieveCart()
        .then((latestCart) => {
          setCart(latestCart)
        })
        .catch(() => {})
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdated)
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdated)
  }, [])

  const timedOpen = useCallback(() => {
    open()
    const timer = setTimeout(close, 5000)
    setActiveTimer(timer)
  }, [])

  const openAndCancel = () => {
    if (activeTimer) {
      clearTimeout(activeTimer)
    }
    open()
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (activeTimer) {
        clearTimeout(activeTimer)
      }
    }
  }, [activeTimer])

  // Open cart dropdown when modifying the cart items (count increased), but only if not on cart page
  useEffect(() => {
    if (totalItems > itemRef.current && !pathname.includes("/cart")) {
      timedOpen()
    }
    itemRef.current = totalItems
  }, [totalItems, pathname, timedOpen])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        close()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCartButtonClick = (e: React.MouseEvent) => {
    // Mobil görünümde (<1024px) doğrudan sepet sayfasına git
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      e.preventDefault()
      close()
      const targetCountry =
        (typeof countryCode === "string" && countryCode ? countryCode : "") ||
        pathname.split("/")[1] ||
        "tr"
      router.push(`/${targetCountry}/cart`)
      return
    }

    // Masaüstünde açılır menüyü aç / kapat
    setCartDropdownOpen((prev) => !prev)
  }

  return (
    <div
      ref={containerRef}
      className="flex items-center h-full z-[50] shrink-0"
      onMouseEnter={openAndCancel}
      onMouseLeave={close}
    >
      <Popover className="relative flex items-center h-full">
        <PopoverButton
          className="relative w-10 h-10 flex items-center justify-center shrink-0 text-[#F3EFE7]/80 hover:text-[#B29460] transition-colors rounded-full hover:bg-white/5 focus:outline-none"
          data-testid="nav-cart-link"
          aria-label={`Sepet (${totalItems})`}
          title="Sepet"
          onClick={handleCartButtonClick}
        >
          <ShoppingBag className="w-5 h-5 text-current shrink-0" />
          {totalItems > 0 && (
            <span
              data-testid="cart-count-badge"
              className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#B29460] text-[#222325] text-[10px] font-black rounded-full flex items-center justify-center leading-none shadow-sm ring-2 ring-[#222325] pointer-events-none"
            >
              {totalItems}
            </span>
          )}
          <span className="sr-only">{`Sepet (${totalItems})`}</span>
        </PopoverButton>

        <Transition
          show={cartDropdownOpen}
          as={Fragment}
          enter="transition ease-out duration-200"
          enterFrom="opacity-0 translate-y-1"
          enterTo="opacity-100 translate-y-0"
          leave="transition ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-1"
        >
          <PopoverPanel
            static
            className="hidden small:block absolute top-[calc(100%+1px)] right-0 bg-brand-white border-x border-b border-brand-stone shadow-2xl rounded-b-lg w-[420px] text-brand-anthracite z-[50]"
            data-testid="nav-cart-dropdown"
          >
            <div className="p-4 flex items-center justify-center">
              <h3 className="text-large-semi">Sepet</h3>
            </div>
            {cart && cart.items?.length ? (
              <>
                <div className="overflow-y-scroll max-h-[402px] px-4 grid grid-cols-1 gap-y-8 no-scrollbar p-px">
                  {cart.items
                    .sort((a, b) => {
                      return (a.created_at ?? "") > (b.created_at ?? "")
                        ? -1
                        : 1
                    })
                    .map((item) => (
                      <div
                        className="grid grid-cols-[122px_1fr] gap-x-4"
                        key={item.id}
                        data-testid="cart-item"
                      >
                        <LocalizedClientLink
                          href={`/products/${item.product_handle}`}
                          className="w-24"
                        >
                          <Thumbnail
                            thumbnail={item.thumbnail}
                            images={item.variant?.product?.images}
                            size="square"
                          />
                        </LocalizedClientLink>
                        <div className="flex flex-col justify-between flex-1">
                          <div className="flex flex-col flex-1">
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col overflow-ellipsis whitespace-nowrap mr-4 w-[180px]">
                                <h3 className="text-base-regular overflow-hidden text-ellipsis">
                                  <LocalizedClientLink
                                    href={`/products/${item.product_handle}`}
                                    data-testid="product-link"
                                  >
                                    {item.title}
                                  </LocalizedClientLink>
                                </h3>
                                {item.metadata?.dtf_transfer ? (
                                  <span className="text-[11px] font-semibold text-brand-brown-dark whitespace-normal">
                                    DTF transfer only. Garment not included.
                                  </span>
                                ) : (
                                  <LineItemOptions
                                    variant={item.variant}
                                    data-testid="cart-item-variant"
                                    data-value={item.variant}
                                  />
                                )}
                                <span
                                  data-testid="cart-item-quantity"
                                  data-value={item.quantity}
                                >
                                  Adet: {item.quantity}
                                </span>
                              </div>
                              <div className="flex justify-end">
                                <LineItemPrice
                                  item={item}
                                  style="tight"
                                  currencyCode={cart.currency_code}
                                />
                              </div>
                            </div>
                          </div>
                          <DeleteButton
                            id={item.id}
                            className="mt-1"
                            data-testid="cart-item-remove-button"
                          >
                            Sil
                          </DeleteButton>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="p-4 flex flex-col gap-y-4 text-small-regular">
                  <div className="flex items-center justify-between">
                    <span className="text-ui-fg-base font-semibold">
                      Ara Toplam{" "}
                      <span className="font-normal">(KDV hariç)</span>
                    </span>
                    <span
                      className="text-large-semi"
                      data-testid="cart-subtotal"
                      data-value={subtotal}
                    >
                      {convertToLocale({
                        amount: subtotal,
                        currency_code: cart.currency_code,
                      })}
                    </span>
                  </div>
                  <LocalizedClientLink
                    href="/cart"
                    className="w-full inline-flex items-center justify-center rounded-md font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 bg-[#222325] text-white hover:bg-[#38393C] h-12 px-6 text-sm tracking-wide shadow-md active:scale-[0.99]"
                    data-testid="go-to-cart-button"
                    onClick={close}
                  >
                    Sepete Git
                  </LocalizedClientLink>
                </div>
              </>
            ) : (
              <div>
                <div className="flex py-16 flex-col gap-y-4 items-center justify-center">
                  <div className="bg-gray-900 text-small-regular flex items-center justify-center w-6 h-6 rounded-full text-white">
                    <span>0</span>
                  </div>
                  <span>Sepetiniz şu anda boş.</span>
                  <div>
                    <LocalizedClientLink
                      href="/store"
                      className="inline-flex items-center justify-center rounded-md font-semibold transition-colors bg-[#222325] text-white hover:bg-[#38393C] h-10 px-4 text-sm"
                      onClick={close}
                    >
                      Ürünleri Keşfet
                    </LocalizedClientLink>
                  </div>
                </div>
              </div>
            )}
          </PopoverPanel>
        </Transition>
      </Popover>
    </div>
  )
}

export default CartDropdown
