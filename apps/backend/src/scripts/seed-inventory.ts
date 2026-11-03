import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"

export default async function seedInventory({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("📦 Nizamlar ürünleri için stok seviyeleri atanıyor...")

  // Lokasyonları al
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })

  const nizamlarLocation = locations.find((l: any) => l.name.includes("Nizamlar")) || locations[0]
  if (!nizamlarLocation) {
    logger.error("Stok lokasyonu bulunamadı!")
    return
  }

  // Tüm envanter kalemlerini al
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })

  // Mevcut stok seviyelerini al
  const { data: existingLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["inventory_item_id", "location_id"],
  })

  const existingMap = new Set(existingLevels.map((l: any) => `${l.inventory_item_id}_${l.location_id}`))

  const missingLevels = inventoryItems
    .filter((item: any) => !existingMap.has(`${item.id}_${nizamlarLocation.id}`))
    .map((item: any) => ({
      location_id: nizamlarLocation.id,
      stocked_quantity: 500,
      inventory_item_id: item.id,
    }))

  if (missingLevels.length > 0) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: missingLevels,
      },
    })
    logger.info(`✅ ${missingLevels.length} envanter kalemi için 500 adet stok başarıyla eklendi.`)
  } else {
    logger.info("Tüm envanter kalemlerinin stokları mevcut.")
  }
}
