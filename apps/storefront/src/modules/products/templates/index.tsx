import React from "react"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import AuraProductShowcase from "@modules/product-showcase"
import RelatedProducts from "@modules/products/components/related-products"
import { Suspense } from "react"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <div className="bg-[#faf9f6] min-h-screen text-[#242426]">
      {/* AURA 3D ÜRÜN VİTRİNİ VE DETAY SİSTEMİ */}
      <AuraProductShowcase
        product={product}
        region={region}
        countryCode={countryCode}
      />

      {/* İLGİLİ ÜRÜNLER */}
      <div
        className="content-container my-16 small:my-24 border-t border-[#dedbd4] pt-12"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </div>
  )
}

export default ProductTemplate
