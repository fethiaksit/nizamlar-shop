"use client"

import { Table, Text, clx } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import CartItemSelect from "@modules/cart/components/cart-item-select"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
}

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const maxQtyFromInventory = 10
  const maxQuantity = item.variant?.manage_inventory ? 10 : maxQtyFromInventory

  // Özel Baskı ve DTF Transfer Metadata Tespiti
  const meta = (item.metadata || {})
  const isCustomPrint = !!meta.design_id || meta.print_mode === "custom"
  const isDtfTransfer =
    meta.dtf_transfer === true ||
    meta.dtf_transfer === "true" ||
    Boolean(meta.dtf_product_type)

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className={clx("flex", {
            "w-16": type === "preview",
            "small:w-24 w-12": type === "full",
          })}
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
      </Table.Cell>

      <Table.Cell className="text-left">
        <div className="flex flex-col gap-1">
          <Text
            className="txt-medium-plus text-ui-fg-base"
            data-testid="product-title"
          >
            {item.product_title}
          </Text>

          {/* Özel Baskı Rozeti ve Tasarım Detayları */}
          {isCustomPrint && (
            <div className="inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded bg-brand-anthracite border border-brand-gold/50 text-brand-cream-light text-[11px] font-semibold w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
              <span>Özel Baskılı Sipariş</span>
              {typeof meta.surfaces === "string" && meta.surfaces && (
                <span className="text-[10px] text-brand-gold-hover">· {meta.surfaces}</span>
              )}
              <span className="text-[9px] text-[#DED9CF] font-mono">({typeof meta.design_id === "string" ? meta.design_id : ""})</span>
            </div>
          )}

          {/* DTF Transfer Zorunlu Uyarı & Ölçü Bilgisi */}
          {isDtfTransfer && (
            <div
              data-testid="cart-dtf-disclaimer"
              className="inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded bg-brand-cream border border-brand-gold/60 text-brand-anthracite text-[11px] font-bold w-fit"
            >
              <span>DTF transfer only. Garment not included.</span>
              {typeof meta.width_in === "number" &&
                typeof meta.height_in === "number" && (
                  <span className="font-mono text-brand-brown-dark">
                    · {meta.width_in}&quot; × {meta.height_in}&quot;
                  </span>
                )}
            </div>
          )}

          {!isDtfTransfer && (
            <LineItemOptions variant={item.variant} data-testid="product-variant" />
          )}
        </div>
      </Table.Cell>

      {type === "full" && (
        <Table.Cell>
          <div className="flex gap-2 items-center w-28">
            <DeleteButton id={item.id} data-testid="product-delete-button" />
            <CartItemSelect
              value={item.quantity}
              onChange={(value) => changeQuantity(parseInt(value.target.value))}
              className="w-14 h-10 p-4"
              data-testid="product-select-button"
            >
              {Array.from(
                {
                  length: Math.min(maxQuantity, 10),
                },
                (_, i) => (
                  <option value={i + 1} key={i}>
                    {i + 1}
                  </option>
                )
              )}

            </CartItemSelect>
            {updating && <Spinner />}
          </div>
          <ErrorMessage error={error} data-testid="product-error-message" />
        </Table.Cell>
      )}

      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <LineItemUnitPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </Table.Cell>
      )}

      <Table.Cell className="!pr-0">
        <span
          className={clx("!pr-0", {
            "flex flex-col items-end h-full justify-center": type === "preview",
            "flex flex-col items-end justify-center": type === "full",
          })}
        >
          <LineItemPrice
            item={item}
            style="tight"
            currencyCode={currencyCode}
          />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
