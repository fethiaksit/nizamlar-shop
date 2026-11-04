"use client"

import { indexedCurrency, priceAttribute } from "@lib/search-client"
import { convertToLocale } from "@lib/util/money"
import { Text, clx } from "@modules/common/components/ui"

/** The per-currency price fields a hit may carry, e.g. `min_price_eur`. */
export type HitPricing = Record<string, unknown>

type HitPriceProps = {
  hit: HitPricing
  currencyCode: string
}

const amount = (value: unknown) => (typeof value === "number" ? value : null)

const HitPrice = ({ hit, currencyCode }: HitPriceProps) => {
  let currency_code = indexedCurrency(currencyCode)
  let min_price = amount(hit[priceAttribute("min_price", currencyCode)])
  let max_price = amount(hit[priceAttribute("max_price", currencyCode)])
  let original_price = amount(
    hit[priceAttribute("original_price", currencyCode)]
  )
  let on_sale = hit[priceAttribute("on_sale", currencyCode)] === true

  if (min_price === null) {
    for (const altCurrency of ["try", "eur", "usd"]) {
      const altMin = amount(hit[`min_price_${altCurrency}`])
      if (altMin !== null) {
        currency_code = altCurrency
        min_price = altMin
        max_price = amount(hit[`max_price_${altCurrency}`])
        original_price = amount(hit[`original_price_${altCurrency}`])
        on_sale = hit[`on_sale_${altCurrency}`] === true
        break
      }
    }
  }

  if (min_price === null) {
    return null
  }

  const format = (value: number) =>
    convertToLocale({ amount: value, currency_code })

  const max = max_price ?? min_price
  const isRange = max > min_price

  return (
    <div className="flex items-center gap-x-2" data-testid="product-price">
      {!isRange && on_sale && original_price !== null && (
        <Text
          className="line-through text-ui-fg-muted"
          data-testid="original-price"
        >
          {format(original_price)}
        </Text>
      )}
      <Text
        className={clx("text-ui-fg-muted", {
          "text-ui-tag-red-text": on_sale,
        })}
        data-testid="price"
      >
        {isRange ? `${format(min_price)} - ${format(max)}` : format(min_price)}
      </Text>
    </div>
  )
}

export default HitPrice
