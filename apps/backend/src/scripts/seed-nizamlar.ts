import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow,
  createRegionsWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function seedNizamlar({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT)

  logger.info("🇹🇷 Nizamlar Baskı verileri yapılandırılıyor...")

  // 1. Mağaza ayarları
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "name", "default_sales_channel_id"],
  })
  const store = stores[0]

  if (store) {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: store.id },
        update: {
          name: "Nizamlar Baskı",
          supported_currencies: [
            { currency_code: "try", is_default: true },
            { currency_code: "usd", is_default: false },
            { currency_code: "eur", is_default: false },
          ],
        },
      },
    })
    logger.info("Mağaza adı 'Nizamlar Baskı' ve varsayılan para birimi TRY olarak güncellendi.")
  }

  // 2. Türkiye Bölgesi (Region)
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "countries.iso_2"],
  })

  let trRegion: any = existingRegions.find((r: any) => r.name === "Türkiye")

  if (!trRegion) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Türkiye",
            currency_code: "try",
            countries: ["tr"],
            payment_providers: ["pp_system_default"],
            metadata: {
              return_window_days: 14,
              free_returns: false,
              shipping_rate: 75,
              handling_days_min: 1,
              handling_days_max: 3,
              transit_days_min: 1,
              transit_days_max: 3,
            },
          },
        ],
      },
    })
    trRegion = result[0]
    logger.info("Türkiye bölgesi (TRY) oluşturuldu.")

    // Vergi bölgesi
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "tr", provider_id: "tp_system" }],
    })
  }

  // 3. Stok Lokasyonu ve Kargo Sağlayıcısı
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })

  let nizamlarLocation: any = locations.find((l: any) => l.name.includes("Nizamlar"))
  if (!nizamlarLocation) {
    const { result: locResult } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Nizamlar Baskı Atölyesi",
            address: {
              city: "İstanbul",
              country_code: "tr",
              address_1: "İkitelli OSB",
            },
          },
        ],
      },
    })
    nizamlarLocation = locResult[0]

    if (store?.default_sales_channel_id) {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: {
          id: nizamlarLocation.id,
          add: [store.default_sales_channel_id],
        },
      })
    }

    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: nizamlarLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: "manual_manual",
      },
    })
  }

  // Kargo Profili
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "type"],
  })
  const defaultShippingProfile = shippingProfiles[0]

  // 4. Nizamlar Baskı Katalog Ürünleri (Hazır Ürün + Özel Baskılı Ürün)
  const salesChannelId = (store.default_sales_channel_id || "") as string

  // A) Hazır Ürün: Premium Oversize Penye T-Shirt
  const readyProductData = {
    title: "Premium Oversize Penye T-Shirt",
    handle: "premium-oversize-penye-t-shirt",
    description: "240 GSM %100 Pamuk, yumuşak tuşeli, birinci sınıf penye kumaş. Dayanıklı çift iğne dikiş ve fit kesim.",
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: defaultShippingProfile.id as string,
    metadata: {
      product_type: "ready_product", // 'ready_product' | 'custom_print'
      fabric: "240 GSM %100 Pamuk",
      cut: "Oversize",
      wash_care: "30 derecede tersten yıkayınız.",
      sales_model: "ready",
    },
    images: [
      { url: "/products/nizamlar-tshirt-anthracite.webp" },
      { url: "/products/nizamlar-tshirt-cream.webp" },
    ],
    options: [
      { title: "Beden", values: ["S", "M", "L", "XL"] },
      { title: "Renk", values: ["Siyah", "Beyaz", "Antrasit", "Bej"] },
    ],
    variants: [
      // Siyah
      {
        title: "Siyah / S",
        sku: "NZM-TSH-BLK-S",
        options: { Beden: "S", Renk: "Siyah" },
        prices: [
          { amount: 450, currency_code: "try" },
          { amount: 15, currency_code: "usd" },
        ],
      },
      {
        title: "Siyah / M",
        sku: "NZM-TSH-BLK-M",
        options: { Beden: "M", Renk: "Siyah" },
        prices: [
          { amount: 450, currency_code: "try" },
          { amount: 15, currency_code: "usd" },
        ],
      },
      {
        title: "Siyah / L",
        sku: "NZM-TSH-BLK-L",
        options: { Beden: "L", Renk: "Siyah" },
        prices: [
          { amount: 450, currency_code: "try" },
          { amount: 15, currency_code: "usd" },
        ],
      },
      {
        title: "Siyah / XL",
        sku: "NZM-TSH-BLK-XL",
        options: { Beden: "XL", Renk: "Siyah" },
        prices: [
          { amount: 450, currency_code: "try" },
          { amount: 15, currency_code: "usd" },
        ],
      },
      // Beyaz
      {
        title: "Beyaz / S",
        sku: "NZM-TSH-WHT-S",
        options: { Beden: "S", Renk: "Beyaz" },
        prices: [
          { amount: 450, currency_code: "try" },
          { amount: 15, currency_code: "usd" },
        ],
      },
      {
        title: "Beyaz / M",
        sku: "NZM-TSH-WHT-M",
        options: { Beden: "M", Renk: "Beyaz" },
        prices: [
          { amount: 450, currency_code: "try" },
          { amount: 15, currency_code: "usd" },
        ],
      },
      {
        title: "Beyaz / L",
        sku: "NZM-TSH-WHT-L",
        options: { Beden: "L", Renk: "Beyaz" },
        prices: [
          { amount: 450, currency_code: "try" },
          { amount: 15, currency_code: "usd" },
        ],
      },
      // Antrasit
      {
        title: "Antrasit / M",
        sku: "NZM-TSH-ANT-M",
        options: { Beden: "M", Renk: "Antrasit" },
        prices: [
          { amount: 450, currency_code: "try" },
          { amount: 15, currency_code: "usd" },
        ],
      },
      {
        title: "Antrasit / L",
        sku: "NZM-TSH-ANT-L",
        options: { Beden: "L", Renk: "Antrasit" },
        prices: [
          { amount: 450, currency_code: "try" },
          { amount: 15, currency_code: "usd" },
        ],
      },
    ],
    sales_channels: [{ id: salesChannelId }],
  }

  // B) Özel Baskı Ürünü: Özel Baskılı Hoodie (Kapüşonlu Sweatshirt)
  const customPrintProductData = {
    title: "Özel Baskılı Kapüşonlu Sweatshirt (Hoodie)",
    handle: "ozel-baskili-kapusonlu-sweatshirt-hoodie",
    description: "320 GSM 3 İplik Şardonlu pamuk kumaş. Göğüs, sırt veya kol bölgesine kendi tasarımınızı yüksek çözünürlüklü DTF veya Serigrafi baskı tekniğiyle uygulayın.",
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: defaultShippingProfile.id as string,
    metadata: {
      product_type: "custom_print", // 'ready_product' | 'custom_print'
      sales_model: "custom_print",
      fabric: "320 GSM 3 İplik Şardonlu",
      print_ready: true,
      supported_print_techniques: ["DTF Dijital Baskı", "Serigrafi Baskı", "Nakkaş Nakış"],
      print_areas: [
        { id: "front", name: "Ön Göğüs", max_width_cm: 30, max_height_cm: 35 },
        { id: "back", name: "Sırt", max_width_cm: 35, max_height_cm: 45 },
        { id: "left_chest", name: "Sol Göğüs Logo", max_width_cm: 10, max_height_cm: 10 },
      ],
      mockup_model_id: "hoodie",
    },
    images: [
      { url: "/products/nizamlar-tshirt-collection.webp" },
      { url: "/products/nizamlar-tshirt-cream.webp" },
    ],
    options: [
      { title: "Beden", values: ["S", "M", "L", "XL", "2XL"] },
      { title: "Renk", values: ["Siyah", "Antrasit", "Haki", "Ekru"] },
    ],
    variants: [
      {
        title: "Siyah / S",
        sku: "NZM-HD-CUST-BLK-S",
        options: { Beden: "S", Renk: "Siyah" },
        prices: [
          { amount: 890, currency_code: "try" },
          { amount: 28, currency_code: "usd" },
        ],
      },
      {
        title: "Siyah / M",
        sku: "NZM-HD-CUST-BLK-M",
        options: { Beden: "M", Renk: "Siyah" },
        prices: [
          { amount: 890, currency_code: "try" },
          { amount: 28, currency_code: "usd" },
        ],
      },
      {
        title: "Siyah / L",
        sku: "NZM-HD-CUST-BLK-L",
        options: { Beden: "L", Renk: "Siyah" },
        prices: [
          { amount: 890, currency_code: "try" },
          { amount: 28, currency_code: "usd" },
        ],
      },
      {
        title: "Antrasit / M",
        sku: "NZM-HD-CUST-ANT-M",
        options: { Beden: "M", Renk: "Antrasit" },
        prices: [
          { amount: 890, currency_code: "try" },
          { amount: 28, currency_code: "usd" },
        ],
      },
      {
        title: "Antrasit / L",
        sku: "NZM-HD-CUST-ANT-L",
        options: { Beden: "L", Renk: "Antrasit" },
        prices: [
          { amount: 890, currency_code: "try" },
          { amount: 28, currency_code: "usd" },
        ],
      },
    ],
    sales_channels: [{ id: salesChannelId }],
  }

  // C) Özel Baskılı Canvas Bez Çanta
  const customToteBag = {
    title: "Özel Baskılı Kanvas Bez Çanta (Tote Bag)",
    handle: "ozel-baskili-kanvas-bez-canta",
    description: "320 GSM %100 Ham Pamuk Kanvas Kumaş. 35x40 cm standart ölçü, uzun omuz askılı. Promosyon, marka ve etkinlikler için ideal.",
    status: ProductStatus.PUBLISHED,
    shipping_profile_id: defaultShippingProfile.id as string,
    metadata: {
      product_type: "custom_print",
      sales_model: "custom_print",
      fabric: "320 GSM Ham Pamuk Kanvas",
      print_ready: true,
      supported_print_techniques: ["DTF Dijital Baskı", "Serigrafi Baskı"],
      print_areas: [
        { id: "front", name: "Ön Yüz", max_width_cm: 28, max_height_cm: 32 },
      ],
      mockup_model_id: "canta",
    },
    images: [
      { url: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1000&auto=format&fit=crop" },
    ],
    options: [
      { title: "Boyut", values: ["Standart (35x40 cm)"] },
      { title: "Renk", values: ["Ham Ekru", "Siyah"] },
    ],
    variants: [
      {
        title: "Ham Ekru / Standart",
        sku: "NZM-BAG-EKR-STD",
        options: { Boyut: "Standart (35x40 cm)", Renk: "Ham Ekru" },
        prices: [
          { amount: 190, currency_code: "try" },
          { amount: 6, currency_code: "usd" },
        ],
      },
      {
        title: "Siyah / Standart",
        sku: "NZM-BAG-BLK-STD",
        options: { Boyut: "Standart (35x40 cm)", Renk: "Siyah" },
        prices: [
          { amount: 220, currency_code: "try" },
          { amount: 7, currency_code: "usd" },
        ],
      },
    ],
    sales_channels: [{ id: salesChannelId }],
  }

  logger.info("Nizamlar ürünleri ekleniyor...")
  await createProductsWorkflow(container).run({
    input: {
      products: [readyProductData, customPrintProductData, customToteBag],
    },
  })

  logger.info("✅ Nizamlar ürünleri başarıyla oluşturuldu!")
}
