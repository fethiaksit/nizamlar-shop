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

    it("seeds DTF transfer catalog and calculates verified USD quotes in inches and centimeters", async () => {
      const catalog = await api.get("/store/dtf/catalog", { headers })
      expect(catalog.status).toBe(200)
      expect(catalog.data.disclaimer).toBe(
        "DTF transfer only. Garment not included.",
      )
      expect(catalog.data.garmentIncluded).toBe(false)
      expect(catalog.data.currencyCode).toBe("USD")
      expect(
        catalog.data.products.map((p: { product_type: string }) => p.product_type).sort(),
      ).toEqual(["custom_dtf", "dtf_bundle", "gang_sheet", "ready_to_press"])

      const quoteInch = await api.post(
        "/store/dtf/quote",
        {
          productType: "custom_dtf",
          unit: "in",
          width: 10,
          height: 12,
          quantity: 10,
        },
        { headers },
      )
      expect(quoteInch.status).toBe(200)
      expect(quoteInch.data.quote).toMatchObject({
        currencyCode: "USD",
        garmentIncluded: false,
        disclaimer: "DTF transfer only. Garment not included.",
        discountPercent: 10,
        discountedUnitCents: 648,
        subtotalCents: 6480,
      })
      expect(typeof quoteInch.data.quoteSignature).toBe("string")

      const quoteCm = await api.post(
        "/store/dtf/quote",
        {
          productType: "custom_dtf",
          unit: "cm",
          width: 25.4,
          height: 30.48,
          quantity: 10,
        },
        { headers },
      )
      expect(quoteCm.data.quote.subtotalCents).toBe(6480)

      // Rejects invalid dimensions and unauthenticated admin DTF mutations
      await expect(
        api.post(
          "/store/dtf/quote",
          {
            productType: "custom_dtf",
            unit: "in",
            width: 30,
            height: 10,
            quantity: 1,
          },
          { headers },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })

      await expect(
        api.post("/admin/dtf/pricing-rules", { code: "unauthorized" }),
      ).rejects.toMatchObject({ response: { status: 401 } })

      // Rejects publishing unapproved numeric iron parameters in admin
      const login = await api.post("/auth/user/emailpass", {
        email: "admin@integration.test",
        password: "integration-test-only",
      })
      await expect(
        api.post(
          "/admin/dtf/products",
          {
            handle: "unsafe-iron-spec",
            product_type: "ready_to_press",
            title_en: "Unsafe Spec",
            description_en: "DTF transfer only. Garment not included.",
            application_approved: false,
            application_instructions_json: {
              verified_parameters: { temp_f: 315, seconds: 15 },
            },
          },
          { headers: { Authorization: `Bearer ${login.data.token}` } },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })
    })

    it("enforces separate transparent production PNG vs garment mockup, DPI validation, and signed DTF cart binding", async () => {
      const makePngHeaderBase64 = (
        w: number,
        h: number,
        colorType: 2 | 6,
        saltByte = 0,
      ) => {
        const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        const ihdrLen = Buffer.alloc(4)
        ihdrLen.writeUInt32BE(13, 0)
        const ihdrType = Buffer.from("IHDR", "ascii")
        const ihdrData = Buffer.alloc(13)
        ihdrData.writeUInt32BE(w, 0)
        ihdrData.writeUInt32BE(h, 4)
        ihdrData[8] = 8
        ihdrData[9] = colorType
        const crc = Buffer.from([0, 0, 0, saltByte])
        const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130])
        return Buffer.concat([sig, ihdrLen, ihdrType, ihdrData, crc, iend]).toString(
          "base64",
        )
      }

      const hiResSourceRgba = makePngHeaderBase64(3000, 3300, 6, 1)
      const printReadyRgba = makePngHeaderBase64(3000, 3300, 6, 2)
      const opaqueGarmentMockupRgb = makePngHeaderBase64(1200, 1360, 2, 3)
      const lowResSourceRgba = makePngHeaderBase64(400, 400, 6, 4)

      // 1. Rejects opaque garment mockup passed as production print PNG
      await expect(
        api.post(
          "/store/dtf/designs",
          {
            productType: "custom_dtf",
            unit: "in",
            width: 10,
            height: 11,
            quantity: 5,
            originalFileName: "eagle.png",
            originalFileMimeType: "image/png",
            originalFileBase64: hiResSourceRgba,
            productionPrintPngBase64: opaqueGarmentMockupRgb,
          },
          { headers },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })

      // 2. Rejects low-DPI (<150 DPI) artwork unless allowLowDpi=true
      await expect(
        api.post(
          "/store/dtf/designs",
          {
            productType: "custom_dtf",
            unit: "in",
            width: 10,
            height: 10,
            quantity: 1,
            originalFileName: "tiny.png",
            originalFileMimeType: "image/png",
            originalFileBase64: lowResSourceRgba,
            productionPrintPngBase64: printReadyRgba,
          },
          { headers },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })

      // 3. Rejects malicious SVG XSS payload
      await expect(
        api.post(
          "/store/dtf/designs",
          {
            productType: "custom_dtf",
            unit: "in",
            width: 4,
            height: 4,
            quantity: 1,
            originalFileName: "xss.svg",
            originalFileMimeType: "image/svg+xml",
            originalFileBase64: Buffer.from(
              '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            ).toString("base64"),
            productionPrintPngBase64: printReadyRgba,
          },
          { headers },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })

      // 4. Saves valid custom DTF transfer with distinct private source, transparent production PNG, and mockup
      const created = await api.post(
        "/store/dtf/designs",
        {
          productHandle: "custom-dtf-transfer",
          productType: "custom_dtf",
          unit: "in",
          width: 10,
          height: 11,
          quantity: 5,
          originalFileName: "crest-300dpi.png",
          originalFileMimeType: "image/png",
          originalFileBase64: hiResSourceRgba,
          productionPrintPngBase64: printReadyRgba,
          mockupPreviewPngBase64: opaqueGarmentMockupRgb,
          previewGarmentColor: "Anthracite (#222325)",
        },
        { headers },
      )
      expect(created.status).toBe(201)
      const assetId = created.data.designAsset.id
      expect(created.data.designAsset).toMatchObject({
        product_type: "custom_dtf",
        width_in: 10,
        height_in: 11,
        quantity: 5,
        effective_dpi: 300,
        has_transparency: true,
        has_separate_production_file: true,
        has_mockup_preview: true,
      })
      // Never leaks filesystem paths in public store response
      expect(created.data.designAsset.original_asset_path).toBeUndefined()
      expect(created.data.designAsset.production_asset_path).toBeUndefined()

      // Mockup endpoint serves only mockup PNG, never production asset
      const mockupRes = await api.get(`/store/dtf/designs/${assetId}/mockup`, {
        headers,
        responseType: "arraybuffer",
      })
      expect(mockupRes.status).toBe(200)
      expect(mockupRes.headers["content-type"]).toContain("image/png")

      // 5. Adds verified DTF transfer to Medusa cart and rejects tampered dimensions
      const cartRes = await api.post(
        "/store/carts",
        { region_id: regionId },
        { headers },
      )
      const cartId = cartRes.data.cart.id

      await expect(
        api.post(
          "/store/dtf/cart",
          {
            cartId,
            variantId,
            productType: "custom_dtf",
            unit: "in",
            width: 2,
            height: 2,
            quantity: 5,
            designAssetId: assetId,
          },
          { headers },
        ),
      ).rejects.toMatchObject({ response: { status: 400 } })

      const added = await api.post(
        "/store/dtf/cart",
        {
          cartId,
          variantId,
          productType: "custom_dtf",
          unit: "in",
          width: 10,
          height: 11,
          quantity: 5,
          designAssetId: assetId,
          previewColorName: "Anthracite",
          previewColorHex: "#222325",
          quoteSignature: created.data.quoteSignature,
        },
        { headers },
      )
      expect(added.status).toBe(200)
      expect(added.data.metadata).toMatchObject({
        dtf_transfer: true,
        garment_included: false,
        disclaimer: "DTF transfer only. Garment not included.",
        design_asset_id: assetId,
        width_in: 10,
        height_in: 11,
      })
      const fetchedCart = await api.get(`/store/carts/${cartId}`, { headers })
      expect(fetchedCart.data.cart.items[0].metadata).toMatchObject({
        dtf_transfer: true,
        garment_included: false,
        design_asset_id: assetId,
      })
    })
  },
})
