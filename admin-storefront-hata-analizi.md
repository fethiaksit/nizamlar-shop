# NİZAMLAR SHOP — ADMİN İLE STOREFRONT ARASINDAKİ SENKRONİZASYON HATA ANALİZİ

**Proje:** Nizamlar Shop (`/Volumes/KIOXIA/nizamlar-shop`)  
**Tarih:** 4 Kasım 2026  
**Durum:** Hata Analizi ve Kanıtlanmış Test Raporu (Kod Değişikliği Öncesi)

---

## 1. YÜRÜTÜCÜ ÖZETİ (EXECUTIVE SUMMARY)

Yönetim panelinde (Medusa Admin) yapılan ürün güncellemelerinin (fiyat, başlık, açıklama, stok, görsel ve yayın durumu) mağaza vitrinine (Next.js Storefront) yansımaması veya geç/tutarsız yansıması sorunu, yapılan kapsamlı canlı testlerle **kesin olarak kanıtlanmıştır**.

**Hatanın Temel Özeti:**
1. **Admin ve Veritabanı Sorunsuz Çalışıyor:** Admin panelinde veya API'de yapılan güncellemeler PostgreSQL veritabanına (`product`, `price`, `inventory_level`) milisaniyeler içinde yazılmakta ve Medusa Store API (`/store/products`) güncel veriyi anında döndürmektedir.
2. **Sepet Motoru Doğru Fiyatı Alıyor:** Müşteri sepete ürün eklediğinde Medusa çekirdeği veritabanındaki gerçek güncel fiyatı (örneğin 550 TL) hesaplamaktadır.
3. **Kopukluk Noktası — Next.js Data Cache ve Revalidation Yokluğu:** Next.js Storefront, Medusa API'den ürün çekerken `cache: "force-cache"` kullanmaktadır. Ancak:
   - Ürün fetch isteklerine küresel bir etiket (`tags: ["products"]`) atanmamaktadır (yalnızca kullanıcı çerezi bazlı geçersiz UUID etiketleri kullanılmaktadır).
   - Medusa Admin'de bir güncelleme yapıldığında Storefront'u haberdar edecek bir **revalidation webhook/API** mekanizması bulunmamaktadır.
   - Sayfalarda `dynamic = "force-static"` tanımlıdır; sayfa yeniden oluşturulsa dahi Next.js Data Cache alt katmanda eski `force-cache` yanıtını sunmaktadır.
4. **Katalog Arama İndeksinde TRY Para Birimi Eksikliği:** `/store` katalog sayfasında kullanılan arama indeksinde (`apps/backend/src/search/helpers/pricing.ts` ve `apps/storefront/src/lib/search-client.ts`) yalnızca `["eur", "usd"]` tanımlıdır; Türk Lirası (`try`) hiç indekslenmemekte ve katalogda fiyatlar EUR'a düşmekte veya boş kalmaktadır.

---

## 2. CANLI TEST SENARYOLARI VE KANITLANMIŞ SONUÇLAR

Aşağıdaki testler `http://localhost:9000` (Medusa Backend) ve `http://localhost:8000` (Next.js Storefront) üzerinde kontrollü şekilde icra edilmiştir:

| Test Senaryosu | Yapılan İşlem | Medusa DB / Store API | Storefront Vitrin (HTML) | Sepet (Cart) | Sonuç |
|---|---|:---:|:---:|:---:|:---:|
| **TEST A — Fiyat Güncelleme** | 450 TL → 550 TL | ✅ 550 TL döndü | ❌ **Eski 450 TL gösterildi** | ✅ 550 TL eklendi | **KRİTİK HATA:** Vitrinde 450 TL gören müşteri sepete eklediğinde 550 TL ile karşılaşıyor. |
| **TEST B — Ürün Adı & Açıklaması** | `[SENKRON TEST]` başlığı eklendi | ✅ Anında yansıdı | ❌ **Eski başlık kaldı** | - | **HATA:** Storefront Data Cache eski HTML/JSON'u tutuyor. |
| **TEST C — Stok ve Satın Alma** | Stok 4500 → 0 yapıldı | ✅ `inventory: 0` | ❌ **Hala stokta ve sepete eklenebilir** | ⚠️ Sepete izin verildi | **HATA:** Tükendi rozeti çıkmıyor, sepete ekle butonu aktif kalıyor. |
| **TEST D — Ürün Görünürlüğü** | Durum: `draft` yapıldı | ✅ Store API 0 ürün | ❌ **Storefront 200 OK ile ürünü göstermeye devam etti** (Beklenen: 404) | - | **HATA:** Gizlenen ürün vitrinden kalkmıyor. |
| **TEST E — Görsel Değişimi** | Thumbnail değiştirildi | ✅ API güncel URL | ❌ **Eski görsel kaldı** | - | **HATA:** Vitrin ve Dimaac rafı güncel görseli çekmiyor. |
| **TEST F — Sepet Hesaplaması** | Fiyat 450 iken sepete atıldı, sonra 500 yapıldı | ✅ 500 DB'de | - | ✅ Sepete +1 eklenince 500 TL'ye güncellendi | **DOĞRU:** Medusa çekirdek sepet mantığı kurallara uygun çalışıyor. |

---

## 3. HATALARIN KAYNAĞI VE İLGİLİ DOSYALAR (ROOT CAUSE ANALYSIS)

### Hata 1: Kalıcı Next.js Data Cache ve Geçersiz Önbellek Etiketleri
- **İlgili Dosyalar:**
  - `apps/storefront/src/lib/data/products.ts` (Satır 60-80)
  - `apps/storefront/src/lib/data/cookies.ts` (Satır 21-50)
- **Neden:** `products.ts` içinde `sdk.client.fetch("/store/products", { cache: "force-cache", next })` kullanılmaktadır. `getCacheOptions("products")` fonksiyonu ise `_medusa_cache_id` adında rastgele bir müşteri UUID çerezine bağlıdır. Müşteri çerezi olmadığında `next: {}` dönmekte; Next.js bu fetch isteğini **sonsuza kadar** hiçbir etiket olmadan önbelleğe almaktadır. Çerez olduğunda ise `products-${uuid}` şeklinde istemciye özel etiket üretilmekte, bu nedenle sunucu tarafından genel ürün önbelleği asla temizlenememektedir.

### Hata 2: Medusa Backend ile Storefront Arasında Revalidation Bağlantısının Olmaması
- **İlgili Dosyalar:**
  - `apps/backend/src/api/admin/site-management/products-simple/[id]/route.ts`
  - `apps/backend/src/api/admin/site-management/products-simple/route.ts`
  - `apps/storefront/src/app/api/` (Revalidation endpoint'i hiç yok!)
- **Neden:** Yönetici panelinden ürün adı, fiyatı veya stoku güncellendiğinde backend veritabanını güncelliyor, ancak Storefront'a "X ürününün veya tüm ürünlerin önbelleğini temizle (`revalidateTag`, `revalidatePath`)" sinyali gönderecek hiçbir webhook veya API çağrısı yapmıyor.

### Hata 3: Katalog Arama İndeksinde (InstantSearch) TRY Para Birimi Eksikliği
- **İlgili Dosyalar:**
  - `apps/backend/src/search/helpers/pricing.ts` (Satır 10: `PRICE_CURRENCIES = ["eur", "usd"]`)
  - `apps/storefront/src/lib/search-client.ts` (Satır 14: `SEARCH_PRICE_CURRENCIES = ["eur", "usd"]`)
  - `apps/storefront/src/modules/store/components/store-hits/price.tsx` (Satır 18: `indexedCurrency`)
- **Neden:** `/store` (Tüm Ürünler) sayfası MeiliSearch/Medusa Search indeksini kullanmaktadır. İndeks şeması yalnızca `eur` ve `usd` için fiyat alanları (`min_price_eur`, `min_price_usd`) açmıştır. Türkiye bölgesindeki bir müşteri girdiğinde `indexedCurrency("try")` kodu TRY bulamadığı için mecburen `eur` alanına düşmekte; sonuç olarak katalogda fiyatlar ya Euro olarak çıkmakta ya da `null` dönüp hiç görünmemektedir.

### Hata 4: Özel Admin Güncellemelerinin Medusa Olaylarını Tetiklememesi
- **İlgili Dosyalar:**
  - `apps/backend/src/api/admin/site-management/products-simple/route.ts`
  - `apps/backend/src/search/product.ts` (Satır 131-148)
- **Neden:** `products-simple` API'si doğrudan PostgreSQL `UPDATE price ...` sorgusu çalıştırmaktadır. Bu işlem doğrudan SQL olduğu için Medusa'nın `product.updated` veya `product-variant.updated` olaylarını (Event Bus) tetiklememekte; Medusa arama motoru ürünün güncellendiğini fark edememektedir.

### Hata 5: Sayfa Seviyesinde Statik Kilitleme (`force-static`)
- **İlgili Dosyalar:**
  - `apps/storefront/src/app/[countryCode]/(main)/products/[handle]/page.tsx` (Satır 19-20)
  - `apps/storefront/src/app/[countryCode]/(main)/page.tsx` (Satır 18-19)
- **Neden:** `export const dynamic = "force-static"` ve `export const revalidate = 60` kullanılmıştır. Altındaki fetch istekleri de `force-cache` olduğu için ISR süresi dolsa bile Next.js arka planda aynı bayat fetch verisini okuyarak sayfayı eski haliyle sunmaktadır.

---

## 4. DÜZELTME EYLEM PLANI (REMEDIATION PLAN)

1. **Storefront Önbellek Mimarisi İyileştirmesi:**
   - `apps/storefront/src/lib/data/products.ts`: Ürün listeleme ve detay fetch çağrılarına global kanonik etiketler (`tags: ["products", `product-${handle}`]`) atanacak; `force-cache` yerine akıllı etiketli önbellekleme sağlanacak.
   - `apps/storefront/src/lib/data/cookies.ts`: Genel katalog etiketleri (`products`, `categories`, `collections`) istemci UUID'sinden bağımsız kanonik etiket olarak tutulacak; yalnızca kullanıcıya özel sepet/müşteri verileri istemciye özel tutulacak.
2. **Güvenli Revalidation API Endpoint'i Oluşturulması:**
   - `apps/storefront/src/app/api/revalidate/route.ts`: Gizli bir güvenlik anahtarı (`REVALIDATION_SECRET`) ile korunan, etiket veya handle bazlı anında önbellek temizleyen (`revalidateTag`, `revalidatePath`) uç nokta kurulacak.
3. **Backend Senkronizasyon Tetikleyicisi:**
   - Admin ürün ve fiyat güncelleme endpoint'lerine (`products-simple`), işlem tamamlandığında Storefront Revalidation API'sini çağırarak anında önbelleği düşüren entegrasyon eklenecek.
   - Medusa çekirdek olayları (`product.updated`, `product.deleted`) için bir abone (subscriber) eklenerek standart admin panelinden yapılan değişikliklerin de Storefront'a anında yansıması sağlanacak.
4. **TRY Para Biriminin Arama İndeksine Eklenmesi:**
   - `apps/backend/src/search/helpers/pricing.ts`: `PRICE_CURRENCIES` dizisine `"try"` eklenecek.
   - `apps/storefront/src/lib/search-client.ts`: `SEARCH_PRICE_CURRENCIES` dizisine `"try"` eklenecek.
   - Arama indeksi Türk Lirası fiyatlarını da hesaplayacak ve katalog sayfasında doğru ₺ fiyatı görüntülenecek.
5. **Tüm Testlerin Yeniden Koşulması ve Doğrulanması:**
   - TEST A, B, C, D, E, F adımları baştan sona tekrarlanacak; fiyat, başlık, stok ve görünürlüğün vitrinde anında güncellendiği kanıtlanacak.
