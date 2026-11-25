# NIZAMLAR SHOP — ANTIGRAVITY PROJE DEVRALMA VE DTF / SHOPIFY DÖNÜŞÜM RAPORU

- **Tarih:** 25 Kasım 2026
- **Depo:** `https://github.com/fethiaksit/nizamlar-shop`
- **Çalışma Alanı:** `/Volumes/KIOXIA/nizamlar-shop`
- **Branch:** `feat/dtf-transfer-shopify-integration`
- **Mevcut PR:** `https://github.com/fethiaksit/nizamlar-shop/pull/1`
- **Genel Durum:** **FAZ 00.1 stabilizasyonu ve FAZ 01 – FAZ 06 DTF/Shopify dönüşümünün tamamı mevcut görsel tasarım %100 korunarak uygulandı, doğrulandı ve PR #1 branch'ine push edildi.** (`Phase 00` aday referansların özgün referansların yerine terfisi kullanıcı onayını beklemektedir; canlı Shopify mağaza bağlantısı gerçek kimlik bilgileri girilene kadar güvenlik bayrağı ile kapalıdır.)

---

## 1. Codex'ten Devralınan Mevcut Çalışma Özeti

Codex oturumu kullanım limitine ulaştığında projede şu çalışmalar tamamlanmış durumdaydı:

- `73ff7c8`: FAZ 00 mimari analizi (`docs/dtf/phase-00-analysis.md`), 6 fazlı uygulama planı (`docs/superpowers/plans/2026-11-24-dtf-migration.md`) ve 57 geçici referans ekran görüntüsü (`apps/storefront/e2e/visual/baselines/`).
- `970a3e2`: Kullanıcının önceki 10 storefront dosyasındaki değişikliklerini koruyan onaylı commit.
- `381d71f` & `72236ea`: Tasarımı değiştirmeden Backend React/Node tip izolasyonu ve önbellek/texture tip düzeltmeleri (351 TypeScript hatasının giderilmesi).
- `efa361f`: Ayrı tek kullanımlık PostgreSQL konteynerinde (`127.0.0.1:55434`) modül ve HTTP entegrasyon test altyapısı.

## 2. Devralma Sırasındaki Gerçek Git Durumu ve Yerel Yedekleme

Devralma anında çalışma ağacında commit edilmemiş stabilizasyon taslakları tespit edildi ve herhangi bir işlem yapılmadan önce git-ignore kapsamındaki yerel yedek dizinine kaydedildi:

- `artifacts/antigravity-handover-backup/git-status-at-handover.txt`
- `artifacts/antigravity-handover-backup/tracked-uncommitted.patch`
- `artifacts/antigravity-handover-backup/uncommitted-files.tar.gz`
- `artifacts/dtf-stabilization/archived-original-baselines/` (57 özgün referans PNG'nin birebir kopyası)

Hiçbir aşamada `git reset --hard`, `git clean` veya `force push` çalıştırılmamıştır.

## 3. Tamamlanan FAZ 00.1 Stabilizasyonu (`a5435ca`)

1. **Harici Disk (`KIOXIA` exFAT) AppleDouble Karantina Sistemi:**
   - `scripts/quarantine-appledouble.cjs` oluşturuldu; `._*` dosyalarının ilk 4 baytının gerçek AppleDouble sihirli başlığı (`0x00051607`) olduğunu doğrular ve yalnızca doğrulanmış yan dosyaları `artifacts/dtf-stabilization/appledouble-quarantine/` dizinine taşır (`.git/objects/pack/._pack-*.idx` dahil).
   - `apps/backend/package.json` ve `apps/storefront/package.json` içerisine `prebuild`, `predev`, `prestart`, `prelint`, `pretest:*` kancaları ve `tsconfig.json` dosyalarına `**/._*` dışlamaları eklendi.
2. **Deterministik 3D WebGL Sahne Test Altyapısı (Üretim Koduna Dokunmadan):**
   - `apps/storefront/e2e/helpers/webgl-determinism.ts`: `@react-three/fiber` Zustand store'undaki `THREE.Clock`, `@react-three/drei` `<Center>` sınır kutusu ofseti, `16ms` kare hizalı sanal saat ve sentetik fare/pointer durumu yalnızca Playwright `addInitScript` katmanında senkronize edildi. Üretim animasyonları, dönüş hızları ve shader'lar kesinlikle yavaşlatılmadı veya dondurulmadı.
3. **Gerçek Mobil Dokunmatik (CDP Touch) Davranış Testleri:**
   - `apps/storefront/e2e/behavior/animation.spec.ts` ve `playwright.behavior.config.ts`: Codex'in gizli masaüstü butonuna (`hidden sm:flex`) yaptığı sentetik DOM `.click()` çağrısı kaldırıldı; yerine gerçek Chrome CDP `Input.dispatchTouchEvent` ile Hero dokunmatik kaydırma (swipe) ve 3D tişört üzerinde basılı tutup yatay sürükleyerek döndürme doğrulaması eklendi.

## 4. Çözülen Teknik Sorunlar ve Kök Nedenleri

| Sorun | Kök Neden | Uygulanan Kalıcı Çözüm |
| --- | --- | --- |
| `._*.ts` / `._pack-*.idx` derleme ve Git hataları | exFAT harici diskte macOS AppleDouble metadata dosyaları | `0x00051607` doğrulamalı `scripts/quarantine-appledouble.cjs` + npm pre-hook'ları |
| `home-3d-studio.png` piksel kaymaları | R3F `THREE.Clock` ağ gecikmesi + `<Center>` ilk kare rotasyon ofseti | Test-içi `webgl-determinism.ts` R3F saat/merkez/pointer senkronizasyonu (15/15 sıfır fark) |
| Mobil 3D touch testinde gizli buton hilesi | `<640px` görünümde masaüstü döndürme çubuğunun `hidden sm:flex` olması | Gerçek CDP `touchStart -> touchMove -> touchEnd` rotasyon testi (`10/10`) |
| Medusa DML kesirli inç sütunları | `model.number()` çağrısının PostgreSQL `integer` üretmesi (`0.5"`, `3.5"`) | `model.float()` kullanımı ve temiz `Migration20261124215424.ts` üretimi |
| `custom-studio.png` 8 alt-piksel kerning farkı | JSX içinde iki metin düğümünün tek template literal'e birleşmesi | `/tr` modunda özgün `<>{product.title} — Özel Tasarım Stüdyosu</>` düğüm yapısının korunması |

## 5. Görsel Regresyon ve Animasyon Test Sonuçları

- **3D Sahne Tekrarlanabilirlik Kalibrasyonu (`playwright.calibration.config.ts`):** `390, 768, 1024, 1440, 1920` genişliklerinde 3'er bağımsız tarayıcı oturumu = **15/15 bayt-özdeş render (0 piksel fark)**.
- **Aday Görsel Regresyon Paketi (`VISUAL_BASELINE_SET=candidate`, `maxDiffPixels: 0`, maskeleme yok):** **20/20 test (57/57 ekran görüntüsü) 0 piksel fark ile geçti** (FAZ 01–06 tamamlandıktan sonra yeniden doğrulandı).
- **Özgün 57 Referans Görsel Bütünlüğü (`scripts/compare-visual-baselines.cjs`):** `apps/storefront/e2e/visual/baselines/` içindeki **57/57 görselin SHA-256 özeti %100 korundu** (46/57'si aday referanslarla zaten sıfır farkta eşleşmekte; kalan 11 görseldeki fark yalnızca FAZ 00'daki eski yakalamaların sanal saat durdurulmadan önceki rastgele animasyon açısından kaynaklanmaktadır).
- **Animasyon ve Gerçek Dokunmatik Davranış Paketi (`playwright.behavior.config.ts`):** **10/10 başarılı**.
- **Hero Slider & 3D Askılık E2E (`design-experience.spec.ts`):** **3/3 başarılı** (desktop, mobile, tablet).
- **ABD DTF Deneyimi E2E (`e2e/dtf-us-experience.spec.ts`):** **6/6 başarılı** (desktop + mobile).

## 6. Faz Bazlı Uygulama Özeti (FAZ 01 – FAZ 06)

### FAZ 01 — DTF Ürün Modeli, Veritabanı ve USD Fiyatlandırma (`f079f43`)
- `apps/backend/src/modules/dtf_commerce/` Medusa v2 modülü ve eklemeli (additive) PostgreSQL migration (`Migration20261124215424.ts`) oluşturuldu; mevcut hiçbir ürün/sipariş kaydı silinmedi.
- 4 DTF ürün türü tanımlandı: `ready_to_press`, `custom_dtf`, `gang_sheet`, `dtf_bundle`.
- Tam sayı USD cent tabanlı sunucu fiyatlandırma motoru (`pricing.ts`): `in` ve `cm` dönüşümü, inç-kare alan fiyatı, gang sheet film uzunluğu katmanları (`12"`–`120"`), adet indirim kademeleri (`5+`, `10+`, `25+`, `50+`, `100+`, `250+`), minimum sipariş tabanı, HMAC-SHA256 fiyat imzalama ve PNG/WebP/JPEG/güvenli SVG başlık + DPI + şeffaflık denetimi.
- Zorunlu uyarı her katmanda yerleştirildi: **`"DTF transfer only. Garment not included."`** Kumaş rengi yalnızca önizleme amaçlıdır, beden seçimi zorunlu değildir.

### FAZ 02 — Custom DTF Studio (`1e4b288`)
- Mevcut 3D ve 2D stüdyonun görsel tasarımı, kamerası, ışıkları ve tişört modeli değiştirilmeden DTF sipariş yetenekleri eklendi (`apps/storefront/src/modules/custom-studio/index.tsx`, `apps/storefront/src/modules/tshirt3d-experience/index.tsx`).
- `createTransparentDtfPrintPng` (`preview.ts`): Tişört silüeti, gölge veya arka plan dolgusu **içermeyen** saf RGBA şeffaf üretime hazır baskı PNG'sini, giysi mockup önizlemesinden (`createProductionPreview`) tamamen ayrı üretir.
- `createDtfDesignAssetWorkflow` (`POST /store/dtf/designs`): Şeffaf olmayan mockup dosyasının üretim dosyası olarak gönderilmesini sunucu tarafında reddeder (`400`), kaynak DPI değerini kontrol eder ve dosyaları `private/uploads/dtf-{originals,production,mockups}/` altında ayrı saklar.

### FAZ 03 — Gang Sheet Builder (`5337cac`)
- Nizamlar renk paletine (`#222325`, `#B29460`, `#49372E`, `#FAF9F6`) birebir sadık `/[countryCode]/gang-sheet-builder` sayfası ve etkileşimli editörü oluşturuldu (`apps/storefront/src/modules/gang-sheet-builder/`).
- Mil (`1/1000 inç`) hassasiyetinde yerleşim motoru (`gang-sheet-layout.ts`): Çoklu görsel yükleme, raf/skyline otomatik dizilim (**Auto-Nest**), çoğaltma (`+1`, `+5`, `+10`), ölçeklendirme (`in`/`cm` + oran kilidi), döndürme (`-90°`, `+90°`), hizalama kılavuzları (snap guides), çakışma (overlap) ve taşma/güvenli kenar boşluğu (`0.25"`) kontrolü, zoom & pan, undo/redo, JSON taslak kaydı ve 300-DPI hedefli şeffaf üretim PNG çıktısı.
- Film genişliği (`22"` varsayılan + `printer_rip_verified` durumu) ve uzunluk fiyatları Admin panelinden yönetilebilir.

### FAZ 04 — Shopify Headless Entegrasyonu (`8eea4e9`)
- Sunucu-içi (server-only) Shopify Storefront & Admin GraphQL istemcileri (`apps/backend/src/modules/dtf_commerce/shopify-client.ts`, `apps/storefront/src/lib/data/shopify-commerce.ts`).
- Özellik bayrağı (`DTF_SHOPIFY_COMMERCE_ENABLED=false` / `NEXT_PUBLIC_DTF_SHOPIFY_ENABLED=false`) varsayılan kapalıdır.
- Özel ölçülü DTF transfer ve gang sheet'lerde istemci sepet özelliklerine (cart attributes) fiyat için **asla güvenilmez**; sunucu HMAC imzasını ve kaydedilmiş tasarım boyutlarını doğruladıktan sonra Shopify Admin `draftOrderCreate` ile yetkili USD `invoiceUrl` oluşturur, doğrulanamazsa **fail-closed** reddeder.
- `POST /webhooks/shopify`: Ham gövde (`preserveRawBody: true`) üzerinde sabit zamanlı (`timingSafeEqual`) `X-Shopify-Hmac-Sha256` doğrulaması, `dtf_webhook_event` tablosuyla kalıcı idempotency, yeniden deneme sayacı, sırasız (out-of-order) iptal/iade koruması ve **yalnızca ödenmiş siparişlerin** (`orders/paid`) üretime alınması kuralı.

### FAZ 05 — DTF Üretim Yönetimi ve Admin Modülü (`0a17751`)
- 8 aşamalı üretim iş akışı (`transition-dtf-production-job.ts`): `payment_confirmed -> design_review -> ready_for_printing -> printing -> quality_control -> packed -> shipped -> delivered` + ayrı `cancellation_state` ve `refund_state`.
- Ödenmemiş siparişlerin üretime girmesi ve kargo takip numarası olmadan `shipped` durumuna geçilmesi engellenir.
- Üretim dosyaları herkese açık değildir; Admin operatörü 15 dakikalık süreli HMAC imzalı indirme bağlantısı üretir (`POST /admin/dtf/production-jobs/[id]/download-token` -> `GET /store/dtf/production-assets/[jobId]`).
- Modüler Nizamlar ERP adaptörü (`dtf-erp-adapter.ts`, varsayılan güvenli `dryRun=true`).
- Admin sayfaları: `/app/dtf-production` ve `/app/dtf-config` (`/app/site-hub` sol menüsünü değiştirmeden eklendi; `admin.png` görsel referansı 0 piksel fark ile korundu).

### FAZ 06 — ABD Pazar Hazırlığı (`67d84a6`)
- `/tr` Türkçe mağaza %100 korunurken `/us` rotası İngilizce ABD DTF vitrini, USD para birimi ve inç ölçü birimiyle çalışacak şekilde etkinleştirildi (`middleware.ts`, `regions.ts`, `nav`, `side-menu`, `footer`).
- 50 ABD eyaleti + Washington D.C. + Puerto Rico ve 5/9 haneli ZIP kodu (`12345` / `12345-6789`) doğrulaması (`us-address.ts` + Checkout `ShippingAddress`) ve Türkiye -> ABD hava ekspres kargo / ABD gümrük vergisi (CBP) bilgilendirmesi eklendi.
- Yeni sayfalar: `/[countryCode]/how-to-apply` (`application_approved === false` iken doğrulanmamış sayısal sıcaklık/süre/basınç/yıkama değerlerini **asla yayınlamayan** güvenlik kapısı ile), `/[countryCode]/faq` (`FAQPage` JSON-LD SEO şemalı), `/[countryCode]/order-tracking` (PII korumalı e-posta + sipariş/üretim referansı sorgulama) ve güncellenmiş `/us/shipping` + `/us/returns`.

## 7. Shopify Bağlantı ve Test Adaptörü Durumu (Dürüst Durum Bildirimi)

- **Canlı Shopify Mağaza Bağlantısı:** **AKTİF DEĞİL** (Gerçek `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, `SHOPIFY_ADMIN_ACCESS_TOKEN` ve `SHOPIFY_WEBHOOK_SECRET` henüz ortam değişkenlerine tanımlanmamıştır).
- **Canlı Ödeme Doğrulaması:** **YAPILMADI** (Gerçek ABD kart tahsilatı operatörün Shopify Payments kurulumundan sonra test edilmelidir).
- **Test Adaptörü Doğrulaması:** `DTF_SHOPIFY_TEST_ADAPTER=true` yalnızca birim ve entegrasyon testlerinde (`isSimulatedTestAdapter: true` etiketiyle) sepet, indirim kodu, yetkili Draft Order, fail-closed fiyat kontrolü ve HMAC webhook akışlarını doğrulamak için kullanılmıştır; üretimde varsayılan `false` değerindedir.

## 8. Eksik Kimlik Bilgileri ve Dış Bağımlılıklar

Canlı ABD satışına geçmeden önce operatör tarafından sağlanması gereken bilgiler (`apps/backend/.env.template` ve `apps/storefront/.env.example` içinde belgelenmiştir):

1. `SHOPIFY_STORE_DOMAIN` (örn. `nizamlar-dtf-us.myshopify.com`)
2. `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (sunucu-içi Storefront API token)
3. `SHOPIFY_ADMIN_ACCESS_TOKEN` (`write_draft_orders`, `read_orders`, `read_products` yetkili Admin API token)
4. `SHOPIFY_WEBHOOK_SECRET` (`orders/paid`, `orders/cancelled`, `refunds/create`, `fulfillments/create` imzalama anahtarı)
5. `DTF_QUOTE_SECRET` ve `DTF_ASSET_DOWNLOAD_SECRET` (üretim ortamına özel güçlü rastgele HMAC anahtarları)
6. Fiziksel DTF yazıcı/RIP rulo genişliği onayı (`/app/dtf-config` üzerinden `printer_rip_verified = true`) ve test edilmiş ısı pres / ev ütüsü parametre onayı (`/admin/dtf/products` üzerinden `application_approved = true`).

## 9. Oluşturulan ve Değiştirilen Ana Dosyalar

- **Stabilizasyon & Araçlar:** `scripts/quarantine-appledouble.cjs`, `scripts/compare-visual-baselines.cjs`, `apps/storefront/e2e/helpers/webgl-determinism.ts`, `apps/storefront/e2e/visual/candidate-baselines/*`, `apps/storefront/e2e/dtf-us-experience.spec.ts`.
- **Backend Modül & İş Akışları:** `apps/backend/src/modules/dtf_commerce/{index.ts,service.ts,pricing.ts,production-state.ts,catalog-defaults.ts,gang-sheet-layout.ts,shopify-client.ts,dtf-erp-adapter.ts,us-address.ts}`, `apps/backend/src/modules/dtf_commerce/models/*`, `apps/backend/src/modules/dtf_commerce/migrations/Migration20261124215424.ts`, `apps/backend/src/workflows/dtf/*`.
- **Backend API & Admin:** `apps/backend/src/api/dtf-validators.ts`, `apps/backend/src/api/middlewares.ts`, `apps/backend/src/api/store/dtf/**`, `apps/backend/src/api/admin/dtf/**`, `apps/backend/src/api/webhooks/shopify/route.ts`, `apps/backend/src/admin/routes/{dtf-production,dtf-config}/page.tsx`.
- **Storefront Modüller & Sayfalar:** `apps/storefront/src/lib/data/{dtf.ts,shopify-commerce.ts,regions.ts}`, `apps/storefront/src/lib/util/us-address.ts`, `apps/storefront/src/modules/products/components/dtf-transfer-configurator/index.tsx`, `apps/storefront/src/modules/custom-studio/{index.tsx,preview.ts,design-order-service.ts}`, `apps/storefront/src/modules/tshirt3d-experience/index.tsx`, `apps/storefront/src/modules/gang-sheet-builder/{index.tsx,layout-engine.ts}`, `apps/storefront/src/modules/order-tracking/index.tsx`, `apps/storefront/src/app/[countryCode]/(main)/{gang-sheet-builder,how-to-apply,faq,order-tracking,shipping,returns}/page.tsx`.

## 10. Korunan Tasarım Bileşenleri

Aşağıdaki bileşenlerin görsel tasarımı, renkleri (`#222325`, `#B29460`, `#49372E`), tipografisi, global CSS/Tailwind tokenları ve animasyon hızları **sıfır piksel farkla (`20/20`)** korunmuştur:

- Ana sayfa, Sinematik Hero Slider (440ms geçişler ve autoplay), Animasyonlu 3D Kıyafet Askılığı, 3D Tişört Stüdyosu sahnesi/ışıklandırması/kamerası, `/tr` Navbar & Mobil Menü, `/tr` Footer, Ürün Kartları & Hover efektleri, Sepet çekmecesi/sayfası ve `/app/site-hub` Admin paneli.

## 11. Commit Listesi ve PR Durumu

- **PR #1:** `https://github.com/fethiaksit/nizamlar-shop/pull/1` (`feat/dtf-transfer-shopify-integration` — açık, `main`'e merge edilmedi, canlıya deploy edilmedi)
- `a5435ca` — `test: complete phase 00.1 WebGL determinism, touch behavior, and AppleDouble quarantine`
- `f079f43` — `feat(dtf): implement Phase 01 DTF transfer models, USD pricing engine, and verified quote APIs`
- `1e4b288` — `feat(dtf-studio): implement Phase 02 Custom DTF Studio with transparent print PNG, DPI validation, and USD cart flow`
- `5337cac` — `feat(gang-sheet): implement Phase 03 DTF Gang Sheet Builder, auto-nesting engine, collision checks, and 300-DPI export`
- `8eea4e9` — `feat(shopify): implement Phase 04 Shopify Headless client, verified Draft Order checkout, and idempotent HMAC webhooks`
- `0a17751` — `feat(dtf-production): implement Phase 05 8-stage DTF production module, expiring signed asset links, ERP adapter, and Admin queue`
- `67d84a6` — `feat(us-market): implement Phase 06 US market readiness, state/ZIP validation, safety-gated application guide, FAQ, and order tracking`

## 12. Bilinen Sınırlamalar ve Kullanıcı Onayı Bekleyen Konular

1. **Görsel Referans Terfisi (`Phase 00` Onayı):** `apps/storefront/e2e/visual/baselines/` altındaki 57 özgün görsel değiştirilmeden korunmuştur; deterministik 57 aday referans `apps/storefront/e2e/visual/candidate-baselines/` altındadır (`20/20` sıfır fark). Kullanıcı onayladığında aday referanslar ana `baselines/` dizinine terfi ettirilebilir.
2. **Büyük Gang Sheet Tarayıcı Bellek Sınırı:** `exportGangSheetTransparentPng` tarayıcı çökmelerini önlemek için uzun rulolarda maksimum kenar pikselini güvenli sınırda (`6600px`) tutar ve kaynak yüksek çözünürlüklü yerleşim manifestosunu da sunucuda saklar; RIP operatörü dilerse kaynak dosyaları imzalı bağlantıyla indirebilir.
3. **Harici exFAT Disk:** macOS Finder yeni dosya yazımlarında `._*` oluşturmaya devam edebileceğinden tüm script'lerdeki `quarantine:appledouble` ön-kancaları aktif tutulmalıdır.

## 13. Canlıya Geçiş Öncesi Operatör Kontrol Listesi

1. Shopify ABD mağazasını oluşturun, USD para birimini ve Shopify Payments ABD kart tahsilatını etkinleştirin.
2. Backend ve Storefront ortam değişkenlerine gerçek Shopify token'larını, webhook gizli anahtarını ve güçlü `DTF_QUOTE_SECRET` / `DTF_ASSET_DOWNLOAD_SECRET` değerlerini girin.
3. Shopify Admin'de `orders/paid`, `orders/cancelled`, `refunds/create` ve `fulfillments/create` webhook'larını `https://<backend-domain>/webhooks/shopify` adresine yönlendirin.
4. Fiziksel DTF yazıcı/RIP rulo genişliğini doğrulayıp `/app/dtf-config` ekranından `printer_rip_verified` seçeneğini işaretleyin.
5. Kumaş/film lot testlerini tamamladıktan sonra `/admin/dtf/products` üzerinden onaylı pres/ütü değerlerini girip `application_approved = true` yapın.
6. Geliştirme mağazasında uçtan uca bir test siparişi verip ödeme, webhook, üretim kuyruğu (`/app/dtf-production`) ve kargo takip akışını doğruladıktan sonra `DTF_SHOPIFY_COMMERCE_ENABLED=true` ve `NEXT_PUBLIC_DTF_SHOPIFY_ENABLED=true` bayraklarını açın.
