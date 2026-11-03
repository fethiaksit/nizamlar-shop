/**
 * Nizamlar ERP Güvenli Entegrasyon Servisi (Stage 3)
 *
 * Özellikler:
 * 1. İdempotency koruması (erp_sync_log tablosu ile mükerrer aktarımı engeller)
 * 2. Müşteri kimliği eşleme tablosu (erp_customer_mapping ile mükerrer cari oluşturulmaz)
 * 3. Dry-run ve test modu desteği (Canlı ERP'ye test siparişi gitmesini engeller)
 * 4. Karma sipariş yönetimi (Hazır ürün ve özel baskı satırlarını ayırır)
 * 5. Üretim durum eşleme katmanı
 */

import { Client } from "pg"

export interface NizamlarErpConfig {
  baseUrl: string
  authSecret?: string
  username?: string
  password?: string
  dryRun: boolean
}

export interface SyncOrderResult {
  orderId: string
  status: "synced" | "skipped_unpaid" | "dry_run_success" | "failed"
  erpCustomerId?: string
  erpJobIds?: string[]
  note?: string
}

function getPgClient() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"
  return new Client({ connectionString })
}

export class NizamlarErpClient {
  private config: NizamlarErpConfig
  private token: string | null = null
  private tokenExpiry: number = 0

  constructor() {
    this.config = {
      baseUrl: process.env.NIZAMLAR_ERP_BASE_URL || "http://localhost:8080/api/v1",
      authSecret: process.env.NIZAMLAR_ERP_AUTH_SECRET,
      username: process.env.NIZAMLAR_ERP_SERVICE_USER || "medusa_service",
      password: process.env.NIZAMLAR_ERP_SERVICE_PASSWORD,
      // Gerçek ödeme aktif olana kadar veya test modunda dryRun = true
      dryRun: process.env.NIZAMLAR_ERP_DRY_RUN !== "false",
    }
  }

  private async getAuthToken(): Promise<string> {
    if (this.config.dryRun) {
      return "mock_erp_jwt_token_dry_run"
    }

    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token
    }

    const response = await fetch(`${this.config.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
      }),
    })

    if (!response.ok) {
      throw new Error(`[ErpClient] Giriş başarısız (${response.status})`)
    }

    const data = await response.json()
    this.token = data.token
    this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000
    return this.token!
  }

  /**
   * Müşteri Kimliği Eşleştirme (Mükerrer cari oluşumunu engeller)
   */
  async matchOrCreateCustomer(customerData: {
    email: string
    name: string
    phone?: string
    address?: string
    medusaCustomerId?: string
  }): Promise<{ id: string; companyName: string }> {
    const pg = getPgClient()
    await pg.connect()

    // 1. Önce lokal eşleştirme tablosuna bak
    const existing = await pg.query(
      "SELECT * FROM erp_customer_mapping WHERE medusa_email = $1 LIMIT 1",
      [customerData.email.toLowerCase()]
    )

    if (existing.rows.length > 0) {
      await pg.end()
      return {
        id: existing.rows[0].erp_customer_id,
        companyName: existing.rows[0].erp_company_name,
      }
    }

    // 2. Eşleşme yoksa ERP üzerinde ara veya oluştur
    const erpCompanyName = `${customerData.name} (Online)`
    let erpCustomerId = `erp_cust_${Date.now()}`

    if (!this.config.dryRun) {
      const token = await this.getAuthToken()
      // ERP API'sinde ara
      const searchRes = await fetch(
        `${this.config.baseUrl}/customers?search=${encodeURIComponent(customerData.name)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (searchRes.ok) {
        const found = await searchRes.json()
        if (Array.isArray(found) && found.length > 0) {
          erpCustomerId = found[0].id
        }
      }

      if (erpCustomerId.startsWith("erp_cust_")) {
        // Yeni cari oluştur
        const createRes = await fetch(`${this.config.baseUrl}/customers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            company_name: erpCompanyName,
            contact_name: customerData.name,
            phone: customerData.phone || "",
            address: customerData.address || "",
            notes: `Medusa E-Ticaret: ${customerData.email}`,
            is_active: true,
          }),
        })
        if (createRes.ok) {
          const created = await createRes.json()
          erpCustomerId = created.id
        }
      }
    }

    // 3. Eşleştirme tablosuna kaydet
    await pg.query(
      `INSERT INTO erp_customer_mapping (id, medusa_customer_id, medusa_email, medusa_phone, erp_customer_id, erp_company_name)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [
        `map_${Date.now()}`,
        customerData.medusaCustomerId || null,
        customerData.email.toLowerCase(),
        customerData.phone || null,
        erpCustomerId,
        erpCompanyName,
      ]
    )

    await pg.end()
    return { id: erpCustomerId, companyName: erpCompanyName }
  }

  /**
   * Medusa Siparişini Nizamlar ERP'ye Güvenli Aktarma (İdempotent)
   */
  async syncOrderToErp(
    orderId: string,
    options: { force?: boolean } = {}
  ): Promise<SyncOrderResult> {
    const idempotencyKey = `order_placed_${orderId}`
    const pg = getPgClient()
    await pg.connect()

    // 1. İdempotency Kontrolü: Daha önce başarıyla aktarılmış mı?
    const existingLog = await pg.query(
      "SELECT * FROM erp_sync_log WHERE idempotency_key = $1",
      [idempotencyKey]
    )

    if (existingLog.rows.length > 0 && !options.force) {
      const log = existingLog.rows[0]
      if (log.status === "success") {
        await pg.end()
        return {
          orderId,
          status: "synced",
          erpCustomerId: log.erp_customer_id,
          note: "Sipariş zaten ERP'ye aktarılmış (idempotent atlama).",
        }
      }
    }

    // 2. Medusa Sipariş ve Kalem Detaylarını Oku
    const orderRes = await pg.query('SELECT * FROM "order" WHERE id = $1', [orderId])
    if (orderRes.rows.length === 0) {
      await pg.end()
      throw new Error(`Sipariş bulunamadı: ${orderId}`)
    }
    const order = orderRes.rows[0]

    // Sipariş Kalemlerini Oku
    const itemsRes = await pg.query(
      'SELECT * FROM order_item WHERE order_id = $1',
      [orderId]
    )
    const items = itemsRes.rows

    // 3. Müşteri Bilgilerini Çöz ve ERP Carisi ile Eşle
    const customer = await this.matchOrCreateCustomer({
      email: order.email || "musteri@nizamlar.com",
      name: `${order.shipping_address?.first_name || "Müşteri"} ${order.shipping_address?.last_name || ""}`.trim(),
      phone: order.shipping_address?.phone,
      address: order.shipping_address?.address_1,
      medusaCustomerId: order.customer_id,
    })

    // 4. Kalemleri Ayrıştır: Hazır Ürün vs Özel Baskılı Ürün
    const createdJobIds: string[] = []
    const customItems = items.filter((item) => {
      const meta = item.metadata || {}
      return !!meta.design_id || meta.print_mode === "custom"
    })

    const readyItems = items.filter((item) => {
      const meta = item.metadata || {}
      return !meta.design_id && meta.print_mode !== "custom"
    })

    // Özel baskılı her satır için ERP İş Emri (Job Order) Planla
    for (const cItem of customItems) {
      const meta = cItem.metadata || {}
      const designRes = await pg.query("SELECT * FROM custom_design WHERE id = $1", [
        meta.design_id,
      ])
      const design = designRes.rows[0] || {}

      const jobNumber = `NZM-${order.display_id || orderId.slice(-6)}-${cItem.id.slice(-4)}`
      const jobPayload = {
        jobNumber,
        customerId: customer.id,
        patternName: `${cItem.title} - ${design.position_name || "Özel Baskı"}`,
        printType: design.pricing_estimate?.technique || "DTF",
        colorInfo: design.color_name || "Standart",
        quantity: cItem.quantity,
        unit: "Adet",
        unitPrice: Number(cItem.unit_price) || 450,
        notes: `Tasarım Dosyası: ${design.original_file_name || "Yüklendi"}, Önizleme: ${design.id}`,
      }

      if (!this.config.dryRun) {
        const token = await this.getAuthToken()
        const jobRes = await fetch(`${this.config.baseUrl}/jobs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(jobPayload),
        })
        if (jobRes.ok) {
          const createdJob = await jobRes.json()
          createdJobIds.push(createdJob.id)
        }
      } else {
        createdJobIds.push(`mock_job_${Date.now()}_${cItem.id.slice(-4)}`)
      }
    }

    // 5. İdempotency Senkronizasyon Kaydını Yaz
    await pg.query(
      `INSERT INTO erp_sync_log (
        id, order_id, event_type, idempotency_key, status, erp_customer_id,
        erp_job_id, payload, response
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (idempotency_key) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = NOW();`,
      [
        `sync_${Date.now()}`,
        orderId,
        "order.placed",
        idempotencyKey,
        "success",
        customer.id,
        createdJobIds.join(","),
        JSON.stringify({ customItemsCount: customItems.length, readyItemsCount: readyItems.length }),
        JSON.stringify({ dryRun: this.config.dryRun, createdJobIds }),
      ]
    )

    await pg.end()

    return {
      orderId,
      status: this.config.dryRun ? "dry_run_success" : "synced",
      erpCustomerId: customer.id,
      erpJobIds: createdJobIds,
      note: `Aktarım tamamlandı. Hazır Ürün: ${readyItems.length}, Özel Baskı İş Emri: ${customItems.length} (DryRun: ${this.config.dryRun})`,
    }
  }
}

export const nizamlarErpClient = new NizamlarErpClient()
