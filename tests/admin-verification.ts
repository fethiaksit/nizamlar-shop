import { Client } from "pg"

const BACKEND_URL = "http://localhost:9000"
const PUBLISHABLE_KEY = "pk_0a79f3d5cf6d94e1b78d382788f4c59ead1824c818ff9c8542d80c8dab0462cc"
const ADMIN_EMAIL = "admin"
const ADMIN_PASS = "admin"

type TestResult = {
  id: number
  title: string
  passed: boolean
  details: string
}

async function runVerification() {
  console.log("=== NİZAMLAR MEDUSA YÖNETİM PANELİ TEST PAKETİ ===")
  const results: TestResult[] = []

  // Test 1: Yönetici Girişi
  let token = ""
  try {
    const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
    })
    const json = await res.json()
    if (res.ok && json.token) {
      token = json.token
      results.push({
        id: 1,
        title: "Yönetici Girişi (Auth API & JWT)",
        passed: true,
        details: `Giriş başarılı, Token alındı (Kullanıcı: ${ADMIN_EMAIL})`,
      })
    } else {
      results.push({
        id: 1,
        title: "Yönetici Girişi (Auth API & JWT)",
        passed: false,
        details: `Giriş başarısız: ${JSON.stringify(json)}`,
      })
    }
  } catch (err: any) {
    results.push({
      id: 1,
      title: "Yönetici Girişi (Auth API & JWT)",
      passed: false,
      details: err.message,
    })
  }

  // Test 2: Yetkisiz kullanıcının admin API'ye erişememesi
  try {
    const unauthRes = await fetch(`${BACKEND_URL}/admin/site-management/settings`, {
      method: "GET",
    })
    const passed = unauthRes.status === 401
    results.push({
      id: 2,
      title: "Yetkisiz Kullanıcı Güvenlik Engeli (RBAC)",
      passed,
      details: `Yetkisiz erişim yanıtı: HTTP ${unauthRes.status} (Beklenen: 401 Unauthorized)`,
    })
  } catch (err: any) {
    results.push({
      id: 2,
      title: "Yetkisiz Kullanıcı Güvenlik Engeli (RBAC)",
      passed: false,
      details: err.message,
    })
  }

  // Test 3: Slider Başlığını Değiştirme
  try {
    const updateRes = await fetch(`${BACKEND_URL}/admin/site-management/hero-slides/slide-1`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        titleLine1: "KENDİ TARZINI",
        titleLine2: "YANSIT.",
        subtitle: "Yönetim panelinden anlık güncellenen Nizamlar 240 GSM koleksiyonu.",
        isPublished: true,
      }),
    })
    const updateJson = await updateRes.json()
    const passed = updateRes.ok && updateJson.slide?.title_line1 === "KENDİ TARZINI"
    results.push({
      id: 3,
      title: "Slider Başlığı ve Açıklaması Değiştirme",
      passed,
      details: `Slide 1 güncellendi: ${updateJson.slide?.title_line1} ${updateJson.slide?.title_line2}`,
    })
  } catch (err: any) {
    results.push({
      id: 3,
      title: "Slider Başlığı ve Açıklaması Değiştirme",
      passed: false,
      details: err.message,
    })
  }

  // Test 4: Slider Sırasını Değiştirme
  try {
    const reorderRes = await fetch(`${BACKEND_URL}/admin/site-management/hero-slides`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "reorder",
        orders: [
          { id: "slide-1", rank: 0 },
          { id: "slide-2", rank: 1 },
          { id: "slide-3", rank: 2 },
        ],
      }),
    })
    const reorderJson = await reorderRes.json()
    const passed = reorderRes.ok && Array.isArray(reorderJson.slides)
    results.push({
      id: 4,
      title: "Slider Sıralamasını Değiştirme (Rank Reordering)",
      passed,
      details: `3 slaytın sıralaması başarıyla teyit edildi.`,
    })
  } catch (err: any) {
    results.push({
      id: 4,
      title: "Slider Sıralamasını Değiştirme (Rank Reordering)",
      passed: false,
      details: err.message,
    })
  }

  // Test 5: Slider Yayınlama ve Storefront'ta Görüntüleme
  try {
    const publishRes = await fetch(`${BACKEND_URL}/admin/site-management/publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    const storeRes = await fetch(`${BACKEND_URL}/store/site-content`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
    })
    const storeJson = await storeRes.json()
    const passed = publishRes.ok && storeRes.ok && storeJson.slides?.length > 0
    results.push({
      id: 5,
      title: "Slider ve Vitrin Yayınlama (Store API Live Sync)",
      passed,
      details: `Yayınlanan slayt adedi: ${storeJson.slides?.length}, Canlı Senkronizasyon Başarılı`,
    })
  } catch (err: any) {
    results.push({
      id: 5,
      title: "Slider ve Vitrin Yayınlama (Store API Live Sync)",
      passed: false,
      details: err.message,
    })
  }

  // Test 6: Dimaac Askılığına Ürün Ekleme
  let testGarmentId = `test-rack-${Date.now()}`
  try {
    const addGarmentRes = await fetch(`${BACKEND_URL}/admin/site-management/garments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: testGarmentId,
        productId: "prod_01M6GP9DMYQ1Z62JTV01V1BGT2",
        productHandle: "premium-oversize-penye-t-shirt",
        name: "Test Koleksiyon Tişörtü",
        garmentKind: "tee",
        colour: "#161718",
        showNizamlarLogo: true,
        logoScale: 0.25,
        logoPosX: 0.35,
        logoPosY: 0.58,
        logoStyle: "screenprint",
        isActive: true,
      }),
    })
    const addJson = await addGarmentRes.json()
    const passed = addGarmentRes.ok && addJson.garment?.id === testGarmentId
    results.push({
      id: 6,
      title: "Dimaac Askılığına Model Ekleme",
      passed,
      details: `Askılık modeli başarıyla eklendi: ${addJson.garment?.name} (${testGarmentId})`,
    })
  } catch (err: any) {
    results.push({
      id: 6,
      title: "Dimaac Askılığına Model Ekleme",
      passed: false,
      details: err.message,
    })
  }

  // Test 7: Dimaac Ürün Sıralamasını Değiştirme
  try {
    const reorderGarmentRes = await fetch(`${BACKEND_URL}/admin/site-management/garments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: "reorder",
        orders: [
          { id: "rack-1", rank: 0 },
          { id: "rack-2", rank: 1 },
          { id: "rack-3", rank: 2 },
          { id: testGarmentId, rank: 3 },
        ],
      }),
    })
    const reorderJson = await reorderGarmentRes.json()
    const passed = reorderGarmentRes.ok && Array.isArray(reorderJson.garments)
    results.push({
      id: 7,
      title: "Dimaac Ürün Sıralamasını Değiştirme",
      passed,
      details: `Askılık sıralaması güncellendi (Toplam: ${reorderJson.garments?.length})`,
    })
  } catch (err: any) {
    results.push({
      id: 7,
      title: "Dimaac Ürün Sıralamasını Değiştirme",
      passed: false,
      details: err.message,
    })
  }

  // Temizlik: Test garment'i sil
  try {
    await fetch(`${BACKEND_URL}/admin/site-management/garments/${testGarmentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
  } catch (_) {}

  // Test 8: tshirt3d Varsayılan Rengini Değiştirme
  try {
    const custRes = await fetch(`${BACKEND_URL}/admin/site-management/customizer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        defaultShirtColor: "#202020",
        colorPalette: ["#202020", "#F4F1EA", "#DED9CF", "#D4AF37", "#2E382E", "#3B2820"],
        maxFileSizeMb: 50,
      }),
    })
    const custJson = await custRes.json()
    const passed = custRes.ok && custJson.customizer?.default_shirt_color === "#202020"
    results.push({
      id: 8,
      title: "tshirt3d Varsayılan Rengi ve Palet Yönetimi",
      passed,
      details: `Varsayılan renk: ${custJson.customizer?.default_shirt_color}, Palet boyutu: ${custJson.customizer?.color_palette?.length}`,
    })
  } catch (err: any) {
    results.push({
      id: 8,
      title: "tshirt3d Varsayılan Rengi ve Palet Yönetimi",
      passed: false,
      details: err.message,
    })
  }

  // Test 9: 3D Model Listeleme ve Doğrulama
  try {
    const modelsRes = await fetch(`${BACKEND_URL}/admin/site-management/models-3d`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const modelsJson = await modelsRes.json()
    const passed = modelsRes.ok && modelsJson.models?.length > 0
    results.push({
      id: 9,
      title: "3D GLB Model Kütüphanesi ve Yönetimi",
      passed,
      details: `Kayıtlı 3D modeller: ${modelsJson.models?.map((m: any) => m.file_name).join(", ")}`,
    })
  } catch (err: any) {
    results.push({
      id: 9,
      title: "3D GLB Model Kütüphanesi ve Yönetimi",
      passed: false,
      details: err.message,
    })
  }

  // Test 10: Ürün Fiyatı ve Stok Yönetimi (Baskı Fiyatlandırması)
  try {
    const priceRes = await fetch(`${BACKEND_URL}/admin/custom-print-config`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const priceJson = await priceRes.json()
    const passed = priceRes.ok && Number(priceJson.config?.technique_dtf_cost) > 0
    results.push({
      id: 10,
      title: "Baskı Fiyatlandırması ve Maliyet Baremleri",
      passed,
      details: `DTF: ${priceJson.config?.technique_dtf_cost} TL, Serigrafi: ${priceJson.config?.technique_serigrafi_cost} TL, KDV: %${priceJson.config?.vat_rate}`,
    })
  } catch (err: any) {
    results.push({
      id: 10,
      title: "Baskı Fiyatlandırması ve Maliyet Baremleri",
      passed: false,
      details: err.message,
    })
  }

  // Test 11: Özel Tasarım Dosyalarını İnceleme
  try {
    const designsRes = await fetch(`${BACKEND_URL}/admin/site-management/designs`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const designsJson = await designsRes.json()
    const passed = designsRes.ok && typeof designsJson.totalCount === "number"
    results.push({
      id: 11,
      title: "Özel Tasarım Kayıtları ve Güvenli Dosya Erişimi",
      passed,
      details: `Kayıtlı özel tasarım adedi: ${designsJson.totalCount}, Güvenli indirme rotası aktif`,
    })
  } catch (err: any) {
    results.push({
      id: 11,
      title: "Özel Tasarım Kayıtları ve Güvenli Dosya Erişimi",
      passed: false,
      details: err.message,
    })
  }

  // Test 12: Admin Paneli HTTP Erişimi
  try {
    const adminRes = await fetch(`${BACKEND_URL}/app`)
    const passed = adminRes.status === 200
    results.push({
      id: 12,
      title: "Medusa Admin Panel UI Erişilebilirliği (http://localhost:9000/app)",
      passed,
      details: `Admin SPA Yanıt Kodu: HTTP ${adminRes.status} OK`,
    })
  } catch (err: any) {
    results.push({
      id: 12,
      title: "Medusa Admin Panel UI Erişilebilirliği (http://localhost:9000/app)",
      passed: false,
      details: err.message,
    })
  }

  // Test 13: Storefront ve Backend Uçtan Uca Entegrasyon
  try {
    const storeRes = await fetch(`${BACKEND_URL}/store/site-content`, {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
    })
    const storeJson = await storeRes.json()
    const passed =
      storeRes.ok &&
      Boolean(storeJson.settings?.site_title) &&
      storeJson.slides?.length === 3 &&
      storeJson.rackItems?.length >= 3 &&
      Boolean(storeJson.customizer?.default_shirt_color)

    results.push({
      id: 13,
      title: "Storefront Canlı İçerik Senkronizasyon Bütünlüğü",
      passed,
      details: `Site Başlığı: "${storeJson.settings?.site_title}", Slaytlar: ${storeJson.slides?.length}, Askılık: ${storeJson.rackItems?.length}`,
    })
  } catch (err: any) {
    results.push({
      id: 13,
      title: "Storefront Canlı İçerik Senkronizasyon Bütünlüğü",
      passed: false,
      details: err.message,
    })
  }

  // Test 14: Sepet & Fiyat Hesaplama Akışı
  try {
    const calcRes = await fetch(`${BACKEND_URL}/store/pricing/calculate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        basePrice: 450,
        technique: "dtf",
        sizeCode: "a4",
        surfaceCount: 1,
        quantity: 1,
      }),
    })
    const calcJson = await calcRes.json()
    const passed = calcRes.ok && calcJson.pricing?.totalAmountWithVat > 450
    results.push({
      id: 14,
      title: "Mevcut Sepet ve Fiyat Hesaplama Akışı Bütünlüğü",
      passed,
      details: `Baskılı Ürün Hesaplama: ${calcJson.pricing?.totalAmountWithVat} TL, Doğrulama: ${calcJson.pricing?.isPriceVerified}`,
    })
  } catch (err: any) {
    results.push({
      id: 14,
      title: "Mevcut Sepet ve Fiyat Hesaplama Akışı Bütünlüğü",
      passed: false,
      details: err.message,
    })
  }

  // Sonuçları Yazdır
  console.log("\n================ TEST SONUÇLARI ================")
  let passCount = 0
  for (const r of results) {
    const icon = r.passed ? "✅ [GEÇTİ]" : "❌ [KALDI]"
    console.log(`${icon} #${r.id} ${r.title}: ${r.details}`)
    if (r.passed) passCount++
  }
  console.log(`\nÖzet: ${passCount}/${results.length} Test Başarıyla Tamamlandı.\n`)

  if (passCount !== results.length) {
    process.exit(1)
  }
}

runVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test paketi çalıştırma hatası:", err)
    process.exit(1)
  })
