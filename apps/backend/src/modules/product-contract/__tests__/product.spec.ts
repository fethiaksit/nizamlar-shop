import path from "node:path"
import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"
import {
  configureIsolatedDatabase,
  integrationDatabaseName,
} from "../../../../integration-tests/helpers/isolated-database"

configureIsolatedDatabase()
jest.setTimeout(120000)
moduleIntegrationTestRunner<IProductModuleService>({
  moduleName: Modules.PRODUCT,
  dbName: integrationDatabaseName,
  resolve: path.dirname(require.resolve("@medusajs/product/package.json")),
  testSuite: ({ service }) => {
    it("persists product options and rejects duplicate variant combinations", async () => {
      const product = await service.createProducts({
        title: "Module contract shirt",
        options: [{ title: "Size", values: ["M", "L"] }],
        variants: [
          { title: "Medium", sku: "contract-medium", options: { Size: "M" } },
        ],
      })
      const retrieved = await service.retrieveProduct(product.id, {
        relations: ["variants", "options", "options.values"],
      })
      expect(retrieved.handle).toBe("module-contract-shirt")
      expect(retrieved.variants[0].sku).toBe("contract-medium")
      expect(
        retrieved.options[0].values.map((value) => value.value).sort(),
      ).toEqual(["L", "M"])
      await expect(
        service.createProductVariants({
          product_id: product.id,
          title: "Duplicate medium",
          options: { Size: "M" },
        }),
      ).rejects.toThrow()
    })
    it("starts each case with an empty isolated product database", async () => {
      expect(await service.listProducts({})).toEqual([])
    })
  },
})
