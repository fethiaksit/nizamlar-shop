import path from "node:path"
import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { DTF_COMMERCE_MODULE } from "../index"
import type DtfCommerceModuleService from "../service"
import { DEFAULT_DTF_PRICING_RULE } from "../pricing"
import {
  configureIsolatedDatabase,
  integrationDatabaseName,
} from "../../../../integration-tests/helpers/isolated-database"

configureIsolatedDatabase()
jest.setTimeout(120000)

moduleIntegrationTestRunner<DtfCommerceModuleService>({
  moduleName: DTF_COMMERCE_MODULE,
  dbName: integrationDatabaseName,
  resolve: path.resolve(__dirname, ".."),
  testSuite: ({ service }) => {
    it("persists USD DTF pricing rules and all four DTF transfer product specs", async () => {
      const rule = await service.createDtfPricingRules({
        code: "us_test_v1",
        currency_code: "USD",
        is_active: true,
        rate_per_sq_inch_cents: 6,
        min_transfer_unit_cents: 150,
        min_order_cents: 1500,
        gang_sheet_width_in: 22,
        max_print_width_in: 22,
        max_print_height_in: 120,
        min_dimension_in: 0.5,
        min_margin_in: 0.25,
        min_gap_in: 0.25,
        target_dpi: 300,
        min_acceptable_dpi: 150,
        printer_rip_verified: false,
        gang_sheet_lengths_json:
          DEFAULT_DTF_PRICING_RULE.gang_sheet_lengths as unknown as Record<
            string,
            unknown
          >,
        quantity_tiers_json:
          DEFAULT_DTF_PRICING_RULE.quantity_tiers as unknown as Record<
            string,
            unknown
          >,
      })
      expect(rule.code).toBe("us_test_v1")
      expect(rule.gang_sheet_width_in).toBe(22)
      expect(rule.min_dimension_in).toBeCloseTo(0.5)

      for (const productType of [
        "ready_to_press",
        "custom_dtf",
        "gang_sheet",
        "dtf_bundle",
      ] as const) {
        const spec = await service.createDtfProductSpecs({
          handle: `spec-${productType}`,
          product_type: productType,
          title_en: `Title ${productType}`,
          description_en: "DTF transfer only. Garment not included.",
          garment_included: false,
          presets_json: {},
          application_instructions_json: { status: "pending" },
        })
        expect(spec.garment_included).toBe(false)
        expect(spec.product_type).toBe(productType)
      }

      const allSpecs = await service.listDtfProductSpecs({})
      expect(allSpecs).toHaveLength(4)
    })
  },
})
