"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { isVariantInStock } from "@lib/util/inventory"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { useParams, usePathname, useRouter } from "next/navigation"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import CustomPrintStudio from "@modules/custom-studio"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const getDefaultVariant = (product: HttpTypes.StoreProduct) =>
  product.variants?.find(isVariantInStock) ?? product.variants?.[0]

export default function ProductActions({
  product,
  region,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    () => optionsAsKeymap(getDefaultVariant(product)?.options ?? null) ?? {}
  )
  const [isAdding, setIsAdding] = useState(false)
  const [showStudio, setShowStudio] = useState(false)
  const countryCode = useParams().countryCode as string

  // Ürünün özel baskıya uygun olup olmadığını tespit et
  const isPrintEligible = useMemo(() => {
    const meta = (product.metadata || {}) as any
    const handle = product.handle || ""
    return (
      meta.product_type === "custom_print" ||
      meta.sales_model === "custom_print" ||
      meta.print_ready === true ||
      handle.includes("t-shirt") ||
      handle.includes("hoodie") ||
      handle.includes("sweatshirt") ||
      handle.includes("canta")
    )
  }, [product])

  const variants = product.variants

  const selectedVariant = useMemo(() => {
    if (!variants || variants.length === 0) {
      return undefined
    }

    return variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return Object.entries(options).every(([key, value]) => {
        return variantOptions?.[key] === value
      })
    })
  }, [variants, options])

  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [title]: value,
    }))
  }

  const isValidVariant = useMemo(() => {
    return variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return Object.entries(options).every(([key, value]) => {
        return variantOptions?.[key] === value
      })
    })
  }, [variants, options])

  const inStock = useMemo(() => {
    if (selectedVariant && !isVariantInStock(selectedVariant)) {
      return false
    }
    return true
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity: 1,
      countryCode,
    })
    notifyCartUpdated()

    setIsAdding(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleAddToCart()
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <form
          method="post"
          action={`/${countryCode}/cart/add`}
          onSubmit={handleSubmit}
          className="flex flex-col gap-y-2"
        >
          <input type="hidden" name="product_id" value={product.id} />
          <input
            type="hidden"
            name="variant_id"
            value={isValidVariant ? selectedVariant?.id ?? "" : ""}
          />
          <input type="hidden" name="quantity" value="1" />

          <div>
            {(product.variants?.length ?? 0) > 1 && (
              <div className="flex flex-col gap-y-4">
                {(product.options || []).map((option) => {
                  return (
                    <div key={option.id}>
                      <OptionSelect
                        option={option}
                        current={options[option.id]}
                        updateOption={setOptionValue}
                        title={option.title ?? ""}
                        name={`options[${option.id}]`}
                        data-testid="product-options"
                        disabled={!!disabled || isAdding}
                      />
                    </div>
                  )
                })}
                <Divider />
              </div>
            )}
          </div>

          <ProductPrice product={product} variant={selectedVariant} />

          {selectedVariant && isValidVariant && (
            <p
              className="text-small-regular text-ui-fg-subtle"
              data-testid="product-availability"
            >
              {inStock ? "Stokta Var" : "Tükendi"}
            </p>
          )}

          {/* İKİ SEÇENEKLİ SATIŞ MODELİ: BASKISIZ VE BASKILI */}
          <div className="flex flex-col gap-2.5 mt-2">
            {/* 1. Baskısız Satın Al (Standart Medusa Sepet Akışı) */}
            <Button
              type="submit"
              disabled={
                !inStock ||
                !selectedVariant ||
                !!disabled ||
                isAdding ||
                !isValidVariant
              }
              variant="secondary"
              className="w-full h-11 border-[#34373D] hover:bg-[#202226] text-[#F8F8F5] font-medium"
              isLoading={isAdding}
              data-testid="add-product-button"
            >
              {!selectedVariant
                ? "Varyant Seçiniz"
                : !inStock || !isValidVariant
                ? "Tükendi"
                : "🛒 Baskısız Sepete Ekle"}
            </Button>

            {/* 2. Baskılı Satın Al (Canlı Editör Modalını Açar) */}
            {isPrintEligible && (
              <Button
                type="button"
                onClick={() => setShowStudio(true)}
                disabled={!inStock || !selectedVariant}
                className="w-full h-11 bg-[#D4AF37] hover:bg-[#C49F27] text-[#141517] font-bold shadow-md hover:shadow-lg transition-all"
              >
                🎨 Kendi Tasarımınla Baskılı Satın Al
              </Button>
            )}
          </div>
        </form>

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>

      {/* CANLI BASKI EDİTÖRÜ MODAL PENCERESİ */}
      {showStudio && (
        <CustomPrintStudio
          product={product}
          region={region}
          countryCode={countryCode}
          onClose={() => setShowStudio(false)}
        />
      )}
    </>
  )
}
