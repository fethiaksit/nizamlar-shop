import fs from "fs"
import { Modules } from "@medusajs/framework/utils"
import type { IAuthModuleService } from "@medusajs/framework/types"
import { customDesignSchema } from "../helpers/custom-design-schema"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createUserAccountWorkflow,
  createApiKeysWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  configureIsolatedDatabase,
  integrationDatabaseName,
} from "../helpers/isolated-database"

const env = configureIsolatedDatabase()
jest.setTimeout(180000)

medusaIntegrationTestRunner({
  dbName: integrationDatabaseName,
  env,
  testSuite: ({ api, getContainer, dbConnection }) => {
    let headers: Record<string, string>
    let productId: string
    let variantId: string
    let regionId: string
    let channelId: string
    beforeAll(async () => {
      await dbConnection.raw(customDesignSchema)
      const container = getContainer()
      const auth = container.resolve<IAuthModuleService>(Modules.AUTH)
      const registered = await auth.register("emailpass", {
        body: {
          email: "admin@integration.test",
          password: "integration-test-only",
        },
      })
      expect(registered.success).toBe(true)
      expect(registered.authIdentity).toBeDefined()
      await createUserAccountWorkflow(container).run({
        input: {
          authIdentityId: registered.authIdentity!.id,
          userData: { email: "admin@integration.test" },
        },
      })
      const {
        result: [channel],
      } = await createSalesChannelsWorkflow(container).run({
        input: { salesChannelsData: [{ name: "Isolated test channel" }] },
      })
      channelId = channel.id
      const {
        result: [key],
      } = await createApiKeysWorkflow(container).run({
        input: {
          api_keys: [
            { title: "Isolated test key", type: "publishable", created_by: "" },
          ],
        },
      })
      await linkSalesChannelsToApiKeyWorkflow(container).run({
        input: { id: key.id, add: [channel.id] },
      })
      headers = { "x-publishable-api-key": key.token }
      const {
        result: [region],
      } = await createRegionsWorkflow(container).run({
        input: {
          regions: [
            { name: "Test Turkey", currency_code: "try", countries: ["tr"] },
          ],
        },
      })
      regionId = region.id
      const {
        result: [product],
      } = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: "Integration shirt",
              handle: "integration-shirt",
              status: "published",
              sales_channels: [{ id: channel.id }],
              options: [{ title: "Size", values: ["M"] }],
              variants: [
                {
                  title: "M",
                  options: { Size: "M" },
                  manage_inventory: false,
                  prices: [{ amount: 450, currency_code: "try" }],
                },
              ],
            },
          ],
        },
      })
      productId = product.id
      variantId = product.variants![0].id
    })

    it("lists and retrieves the published catalog with calculated prices", async () => {
      const list = await api.get("/store/products", {
        headers,
        params: { region_id: regionId },
      })
      expect(list.status).toBe(200)
      expect(list.data.products.map((p: { id: string }) => p.id)).toContain(
        productId,
      )
      const detail = await api.get(`/store/products/${productId}`, {
        headers,
        params: { region_id: regionId },
      })
      expect(
        detail.data.product.variants[0].calculated_price.calculated_amount,
      ).toBe(450)
    })

    it("creates a cart and prices real variant line items on the server", async () => {
      const created = await api.post(
        "/store/carts",
        { region_id: regionId, sales_channel_id: channelId },
        { headers },
      )
      expect(created.status).toBe(200)
      const added = await api.post(
        `/store/carts/${created.data.cart.id}/line-items`,
        { variant_id: variantId, quantity: 2 },
        { headers },
      )
      expect(added.data.cart.items[0]).toMatchObject({
        variant_id: variantId,
        quantity: 2,
        unit_price: 450,
      })
      expect(added.data.cart.item_subtotal).toBe(900)
      await expect(
        api.post(
          `/store/carts/${created.data.cart.id}/line-items`,
          { variant_id: variantId, quantity: -1 },
          { headers },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })
    })

    it("rejects store requests without a publishable key and admin requests without authentication", async () => {
      await expect(api.get("/store/products")).rejects.toMatchObject({
        response: { status: 400 },
      })
      await expect(api.get("/admin/products")).rejects.toMatchObject({
        response: { status: 401 },
      })
      await expect(
        api.post("/auth/user/emailpass", {
          email: "absent@example.test",
          password: "invalid-test-password",
        }),
      ).rejects.toMatchObject({ response: { status: 401 } })
    })

    it("authenticates an isolated admin account and rejects an invalid password", async () => {
      const login = await api.post("/auth/user/emailpass", {
        email: "admin@integration.test",
        password: "integration-test-only",
      })
      expect(login.status).toBe(200)
      expect(typeof login.data.token).toBe("string")
      const me = await api.get("/admin/users/me", {
        headers: { Authorization: `Bearer ${login.data.token}` },
      })
      expect(me.data.user.email).toBe("admin@integration.test")
      await expect(
        api.post("/auth/user/emailpass", {
          email: "admin@integration.test",
          password: "wrong-password",
        }),
      ).rejects.toMatchObject({ response: { status: 401 } })
    })

    it("saves a PNG design with database pricing and serves its preview", async () => {
      const png =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII="
      let files: string[] = []
      try {
        const saved = await api.post(
          "/store/custom-designs",
          {
            productId,
            variantId,
            originalFileBase64: png,
            previewImageBase64: png,
            fileMimeType: "image/png",
            originalFileName: "integration.png",
            view: "front",
            quantity: 2,
            physicalDimensions: { widthMm: 100, heightMm: 100, areaCm2: 100 },
            pricingInput: {
              basePrice: 1,
              currencyCode: "try",
              technique: "dtf",
              sizeCode: "a4",
            },
          },
          { headers },
        )
        expect(saved.status).toBe(201)
        const rows = await dbConnection
          .table("custom_design")
          .where({ id: saved.data.design.id })
        files = [rows[0].original_file_path, rows[0].preview_file_path]
        expect(rows[0]).toMatchObject({
          product_id: productId,
          variant_id: variantId,
          quantity: 2,
          status: "draft",
        })
        expect(saved.data.pricingEstimate).toMatchObject({
          baseProductUnitPrice: 450,
          isPriceVerified: true,
        })
        expect(fs.readFileSync(files[0])).toEqual(Buffer.from(png, "base64"))
        const preview = await api.get(saved.data.previewUrl, {
          headers,
          responseType: "arraybuffer",
        })
        expect(Buffer.from(preview.data)).toEqual(Buffer.from(png, "base64"))
        const lookup = await api.get("/store/custom-designs", {
          headers,
          params: { id: saved.data.design.id },
        })
        expect(lookup.data.designs).toHaveLength(1)
        expect(lookup.data.designs[0].original_file_path).toBeUndefined()
      } finally {
        for (const file of files) fs.rmSync(file, { force: true })
      }
    })

    it("rejects incomplete designs before storage or database writes", async () => {
      await expect(
        api.post("/store/custom-designs", {}, { headers }),
      ).rejects.toMatchObject({ response: { status: 400 } })
      await expect(
        api.post(
          "/store/custom-designs",
          {
            productId,
            variantId,
            originalFileBase64: "invalid",
            fileMimeType: "image/png",
            quantity: 0,
            view: "front",
          },
          { headers },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })
      await expect(
        api.post(
          "/store/custom-designs",
          {
            productId,
            variantId,
            originalFileBase64: "invalid",
            fileMimeType: "image/png",
            quantity: 1,
            view: "front",
          },
          { headers },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })
    })
  },
})
