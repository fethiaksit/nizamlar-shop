import { Container, clx } from "@modules/common/components/ui"
import Image from "next/image"
import React from "react"

import PlaceholderImage from "@modules/common/icons/placeholder-image"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: { url?: string }[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  alt?: string
  "data-testid"?: string
}

function normalizeProductImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.includes("photo-1521572267360-ee0c2909d518")) {
    return "/products/nizamlar-tshirt-anthracite.webp"
  }
  if (url.includes("photo-1503342217505-b0a15ec3261c")) {
    return "/products/nizamlar-tshirt-cream.webp"
  }
  if (
    url.includes("photo-1556905055-8f358a7a47b2") ||
    url.includes("photo-1578632767115-351597cf2477")
  ) {
    return "/products/nizamlar-tshirt-collection.webp"
  }
  return url
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  alt = "",
  "data-testid": dataTestid,
}) => {
  const initialImage = normalizeProductImageUrl(thumbnail || images?.[0]?.url)

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden p-4 bg-brand-white border border-brand-stone/80 group-hover:border-brand-brown shadow-elevation-card-rest rounded-large group-hover:shadow-elevation-card-hover transition-all ease-in-out duration-150",
        className,
        {
          "aspect-[11/14]": isFeatured,
          "aspect-[9/16]": !isFeatured && size !== "square",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium",
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} alt={alt} />
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
  alt,
}: Pick<ThumbnailProps, "size" | "alt"> & { image?: string }) => {
  return image ? (
    <Image
      src={image}
      alt={alt ?? ""}
      className="absolute inset-0 object-cover object-center"
      draggable={false}
      quality={50}
      sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
      fill
    />
  ) : (
    <div className="w-full h-full absolute inset-0 flex items-center justify-center">
      <PlaceholderImage size={size === "small" ? 16 : 24} />
    </div>
  )
}

export default Thumbnail
