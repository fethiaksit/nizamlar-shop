import { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function seedRackProducts({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info(
    "Nizamlar Dimaac Clothes Rack ürünleri (Sweatshirt & Kazak) kontrol ediliyor...",
  )

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "default_sales_channel_id"],
  })
  const salesChannelId = (stores[0]?.default_sales_channel_id || "") as string

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfileId = shippingProfiles[0]?.id as string

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title"],
  })
  const existingHandles = new Set(
    existingProducts.map((p: { handle?: string }) => p.handle),
  )

  const productsToCreate: any[] = []

  if (!existingHandles.has("nizamlar-signature-sweatshirt")) {
    productsToCreate.push({
      title: "Nizamlar Signature Sweatshirt",
      handle: "nizamlar-signature-sweatshirt",
      description:
        "340 GSM %100 Organik Pamuk 3 İplik Şardonlu ağır gramaj kumaş. Yaka altı V-dikiş ribana detayı, esnek manşetler ve göğüste yüksek yoğunluklu Nizamlar Baskı kurumsal logo uygulaması.",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      metadata: {
        product_type: "ready_product",
        garment_category: "sweatshirt",
        model_type: "tshirt",
        fabric: "340 GSM %100 Pamuk 3 İplik Şardonlu",
        cut: "Relaxed Boxy Fit",
        wash_care: "30 derecede tersten yıkayınız, tamburlu kurutma yapmayınız.",
        sales_model: "ready",
      },
      images: [
        {
          url: "/products/nizamlar-tshirt-collection.webp",
        },
        {
          url: "/products/nizamlar-tshirt-anthracite.webp",
        },
      ],
      options: [
        { title: "Beden", values: ["S", "M", "L", "XL"] },
        { title: "Renk", values: ["Antrasit", "Bej", "Koyu Kahve"] },
      ],
      variants: [
        ...["S", "M", "L", "XL"].map((size) => ({
          title: `Antrasit / ${size}`,
          sku: `NZM-SWT-ANT-${size}`,
          options: { Beden: size, Renk: "Antrasit" },
          prices: [
            { amount: 650, currency_code: "try" },
            { amount: 22, currency_code: "usd" },
          ],
        })),
        ...["S", "M", "L", "XL"].map((size) => ({
          title: `Bej / ${size}`,
          sku: `NZM-SWT-BEJ-${size}`,
          options: { Beden: size, Renk: "Bej" },
          prices: [
            { amount: 650, currency_code: "try" },
            { amount: 22, currency_code: "usd" },
          ],
        })),
        ...["S", "M", "L", "XL"].map((size) => ({
          title: `Koyu Kahve / ${size}`,
          sku: `NZM-SWT-BRN-${size}`,
          options: { Beden: size, Renk: "Koyu Kahve" },
          prices: [
            { amount: 650, currency_code: "try" },
            { amount: 22, currency_code: "usd" },
          ],
        })),
      ],
      sales_channels: [{ id: salesChannelId }],
    })
  }

  if (!existingHandles.has("nizamlar-essential-kazak")) {
    productsToCreate.push({
      title: "Nizamlar Essential Kazak",
      handle: "nizamlar-essential-kazak",
      description:
        "Premium ince triko örgü %100 pamuk kazak. Reglan omuz dikiş geçişleri, çift katmanlı esnek ribana yaka ve göğüste Nizamlar Atelier nakış amblem uygulaması.",
      status: ProductStatus.PUBLISHED,
      shipping_profile_id: shippingProfileId,
      metadata: {
        product_type: "ready_product",
        garment_category: "sweater",
        model_type: "tshirt",
        fabric: "12 Gauge %100 Pamuk Triko Örgü",
        cut: "Regular Comfort Fit",
        wash_care: "Hassas programda 30 derecede yıkayınız, sererek kurutunuz.",
        sales_model: "ready",
      },
      images: [
        {
          url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=1000&auto=format&fit=crop",
        },
        {
          url: "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?q=80&w=1000&auto=format&fit=crop",
        },
      ],
      options: [
        { title: "Beden", values: ["S", "M", "L", "XL"] },
        { title: "Renk", values: ["Krem Taş", "Koyu Kahve", "Antrasit"] },
      ],
      variants: [
        ...["S", "M", "L", "XL"].map((size) => ({
          title: `Krem Taş / ${size}`,
          sku: `NZM-KZK-KRM-${size}`,
          options: { Beden: size, Renk: "Krem Taş" },
          prices: [
            { amount: 740, currency_code: "try" },
            { amount: 25, currency_code: "usd" },
          ],
        })),
        ...["S", "M", "L", "XL"].map((size) => ({
          title: `Koyu Kahve / ${size}`,
          sku: `NZM-KZK-BRN-${size}`,
          options: { Beden: size, Renk: "Koyu Kahve" },
          prices: [
            { amount: 740, currency_code: "try" },
            { amount: 25, currency_code: "usd" },
          ],
        })),
        ...["S", "M", "L", "XL"].map((size) => ({
          title: `Antrasit / ${size}`,
          sku: `NZM-KZK-ANT-${size}`,
          options: { Beden: size, Renk: "Antrasit" },
          prices: [
            { amount: 740, currency_code: "try" },
            { amount: 25, currency_code: "usd" },
          ],
        })),
      ],
      sales_channels: [{ id: salesChannelId }],
    })
  }

  if (productsToCreate.length > 0) {
    await createProductsWorkflow(container).run({
      input: {
        products: productsToCreate,
      },
    })
    logger.info(
      `${productsToCreate.length} yeni Nizamlar ürünü (Sweatshirt & Kazak) oluşturuldu.`,
    )
  } else {
    logger.info("Nizamlar Sweatshirt ve Kazak ürünleri zaten mevcut.")
  }

  // Stok seviyelerini tamamla
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  const nizamlarLocation =
    locations.find((l: any) => l.name?.includes("Nizamlar")) || locations[0]
  if (nizamlarLocation) {
    const { data: inventoryItems } = await query.graph({
      entity: "inventory_item",
      fields: ["id"],
    })
    const { data: existingLevels } = await query.graph({
      entity: "inventory_level",
      fields: ["inventory_item_id", "location_id"],
    })
    const existingMap = new Set(
      existingLevels.map(
        (l: any) => `${l.inventory_item_id}_${l.location_id}`,
      ),
    )
    const missingLevels = inventoryItems
      .filter(
        (item: any) => !existingMap.has(`${item.id}_${nizamlarLocation.id}`),
      )
      .map((item: any) => ({
        location_id: nizamlarLocation.id,
        stocked_quantity: 500,
        inventory_item_id: item.id,
      }))
    if (missingLevels.length > 0) {
      await createInventoryLevelsWorkflow(container).run({
        input: { inventory_levels: missingLevels },
      })
      logger.info(
        `${missingLevels.length} yeni varyant için 500 adet stok tanımlandı.`,
      )
    }
  }
}
