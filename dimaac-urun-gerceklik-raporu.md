# NİZAMLAR SHOP — DIMAAC CLOTHES RACK ÜRÜN GERÇEKLİK RAPORU

**Tarih:** 3 Kasım 2026  
**Proje:** `/Volumes/KIOXIA/nizamlar-shop`  
**Kapsam:** Ana sayfadaki **Dimaac Clothes Rack** (`apps/storefront/src/modules/clothes-rack/`) 3D askılık vitrininin Nizamlar Baskı kurumsal tişört, sweatshirt ve kazak ürünleriyle fiziksel ürün kalitesinde güçlendirilmesi.

---

## 1. EKLENEN VE SERGİLENEN NİZAMLAR ÜRÜNLERİ

Dimaac Clothes Rack vitrinindeki genel/dummy ve İngilizce isimli (`Medusa T-Shirt`, `Medusa Sweatshirt` vb.) ürünler tamamen kaldırıldı. Hem PostgreSQL/Medusa veritabanına gerçek stoklu ve varyantlı ürünler eklendi (`apps/backend/src/scripts/seed-rack-products.ts`), hem de askılıkta Nizamlar Baskı kurumsal renk paletiyle uyumlu **8 gerçek ürün** öncelik sırasıyla konumlandırıldı:

| Sıra | Ürün Adı | Kategori | Kurumsal Renk | Logo Uygulaması | Medusa Ürün Bağlantısı (`handle`) |
|---:|---|---|---|---|---|
| **1** | **Nizamlar Premium Oversize Tişört · Beyaz** | Tişört (240 GSM Penye) | `#F8F6F0` (Krem Beyaz) | Sol göğüs kurumsal arma + Göğüs ortası kabartma `NİZAMLAR BASKI` + Etek ucu dokuma etiket | `/tr/products/premium-oversize-penye-t-shirt` |
| **2** | **Nizamlar Signature Sweatshirt · Antrasit** | Sweatshirt (340 GSM 3 İplik) | `#222325` (Antrasit) | Göğüs ortası gold çerçeveli monogram arma + Mat krem/gold serigrafi logo + Yaka altı V-gusset | `/tr/products/nizamlar-signature-sweatshirt` |
| **3** | **Nizamlar Essential Kazak · Krem Taş** | Kazak (12 Gauge Triko) | `#EBE4D8` (Krem Taş) | Göğüs ortası 3D nakış dikişli dairesel `NZM` madalyon + Kabartmalı Nizamlar tipografisi | `/tr/products/nizamlar-essential-kazak` |
| **4** | **Nizamlar Premium Oversize Tişört · Siyah** | Tişört (240 GSM Penye) | `#18191B` (Derin Siyah) | Sol göğüs gold arma + Göğüs ortası yüksek kontrastlı krem/gold serigrafi baskı | `/tr/products/premium-oversize-penye-t-shirt` |
| **5** | **Nizamlar Signature Sweatshirt · Bej** | Sweatshirt (340 GSM 3 İplik) | `#D6C8B4` (Kurumsal Taş/Bej) | Göğüs ortası koyu kahve/gold kabartma (puff print) arma ve tipografi + V-gusset | `/tr/products/nizamlar-signature-sweatshirt` |
| **6** | **Nizamlar Essential Kazak · Koyu Kahve** | Kazak (12 Gauge Triko) | `#49372E` (Kurumsal Kahve) | Göğüs ortası gold/krem nakış dikişli kurumsal madalyon + Triko örgü dokusu | `/tr/products/nizamlar-essential-kazak` |
| **7** | **Nizamlar Premium Oversize Tişört · Antrasit** | Tişört (240 GSM Penye) | `#2B2C2F` (Antrasit Yüzey) | Sol göğüs nakış arma + Göğüs ortası çerçeveli gold/krem atelier rozeti | `/tr/products/premium-oversize-penye-t-shirt` |
| **8** | **Nizamlar Signature Sweatshirt · Koyu Kahve** | Sweatshirt (340 GSM 3 İplik) | `#3A2B23` (Koyu Kahve) | Göğüs ortası gold çerçeveli monogram + Krem kabartma baskı | `/tr/products/nizamlar-signature-sweatshirt` |

---

## 2. KULLANILAN KURUMSAL LOGO DOSYALARI

Orijinal kurumsal web projesinden (`/Volumes/KIOXIA/nizamlarbaski-web/assets/images/`) alınan resmi vektörel logo dosyaları `apps/storefront/public/brand/` dizinine eklendi ve 3D kumaş dokusu üreteci (`nizamlar-garment-art.ts`) tarafından doğrudan kullanıldı:

- [`apps/storefront/public/brand/logo.svg`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/brand/logo.svg) — Açık renk kumaşlar (Beyaz Tişört, Krem Taş Kazak, Bej Sweatshirt) üzerinde yüksek kontrastlı koyu kurumsal logo.
- [`apps/storefront/public/brand/logo-light.svg`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/brand/logo-light.svg) — Koyu renk kumaşlar (Antrasit Sweatshirt, Siyah Tişört, Koyu Kahve Kazak/Sweatshirt) üzerinde net okunan açık/krem kurumsal logo.
- [`apps/storefront/public/brand/sample-monogram.svg`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/brand/sample-monogram.svg) — Sol göğüs ve orta göğüs nakış/kabartma kurumsal `N` monogram arması.

---

## 3. GERÇEKLİK VE KUMAŞ DOKUSU İÇİN YAPILAN GELİŞTİRMELER

Kıyafetlerin "düz karton UI mockup" yerine gerçek fiziksel tekstil ürünü gibi görünmesi için [`nizamlar-garment-art.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/clothes-rack/nizamlar-garment-art.ts) ve [`garment.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/clothes-rack/garment.ts) içinde aşağıdaki teknik geliştirmeler uygulandı:

1. **Üç Ayrı Prosedürel PBR Kumaş Dokusu (Normal Map + Roughness Map):**
   - **Tişört (`tee` - 240 GSM Compact Penye):** İnce diagonal süprem ilmek dokusu (`normalScale: 0.52`, `roughness: 0.80`).
   - **Sweatshirt (`crewneck` - 340 GSM 3 İplik Şardonlu):** Belirgin diagonal 3-iplik twill örgü kanalları ve tok kumaş kalınlığı (`normalScale: 0.72`, `roughness: 0.86`).
   - **Kazak (`sweater` - 12 Gauge Triko Örgü):** Dikey V-şekilli triko ilmek kolonları (*knit wales*) ve yatay *purl* boğumlarından oluşan gerçek 3D kabartma örgü haritası (`normalScale: 1.05`, `roughness: 0.90`).
2. **Ürün Tipine Özgü Kalıp ve Dikiş Detayları:**
   - **Tişört:** Kısa kol, ribana bisiklet yaka, çift iğne etek/kol reçme dikişi.
   - **Sweatshirt:** Kalın ribana yaka, manşet ve etek bandı (`ribHeight: 20px`), ön yaka altında klasik **üçgen ribana V-gusset** parçası ve çift sıra *coverstitch* dikiş detayı.
   - **Kazak:** Daha toplu/fit triko omuz ve kol silüeti, reglan/tam moda kol evi eksiltme ilmek izleri (*fashioned knit marks*), daha yüksek ve tok 2x2 ribana etek/manşet/yaka örgü bantları (`ribHeight: 24px`).
3. **Fiziksel Baskı, Kabartma (Puff Print) ve Nakış (Embroidery) Etkisi:**
   - Logolar kumaşa düz yapıştırılmadı; 3 katmanlı fiziksel uygulama ile işlendi:
     1. Kumaş liflerine gömülme/kabartma gölgesi (*drop-shadow indentation*),
     2. Üst-sol ışık yönünden gelen mikro-kabartma tepe parlaklığı (*specular bevel highlight*),
     3. Kazak ve arma kenarlarında gerçekçi kesikli **nakış dikiş adımları** (*embroidery stitch ring*),
     4. Yaka içinde dokuma **NİZAMLAR BASKI · ATELIER** ense etiketi ve sol alt etek ucunda dokuma **NZM** tekstil etiket 탭ı.
4. **3 Noktalı Stüdyo Işıklandırması ve Derin Kumaş Kıvrımları:**
   - Askıdaki kumaş kıvrımlarının (`foldDepth` ve `computeClothNormals`) ışıkla etkileşimi güçlendirildi; sıcak ana ışık (`#FFFBF4`), taş tonlu yan dolgu ışığı (`#EFE6D8`) ve kurumsal gold arka kontur ışığı (`#D4B886`) ile omuz, göğüs ve kol kıvrımlarında gerçekçi hacim sağlandı.
   - Askı açısı `restAngle={52}` ve ürün aralığı `gap={10}` olarak ayarlanarak ürünlerin genel görünümde bile üç-çeyrek butik açısıyla logolarını ve kumaş dokularını göstermesi, üzerine gelindiğinde ise `0°` tam karşıya dönerek `1.08x` ölçekle öne çıkması sağlandı.

---

## 4. PERFORMANS ÖNLEMLERİ

- **Lazy Mount (`IntersectionObserver`):** 3D WebGL askılık bileşeni yalnızca kullanıcı ilgili bölüme yaklaştığında (`rootMargin: "250px"`) belleğe yüklenir.
- **Talep Odaklı Render Döngüsü (`breeze={0}`):** Askılık hareketsizken sürekli GPU/CPU tüketen animasyon döngüsü çalışmaz; yalnızca hover, ürün seçimi veya kamera geçişi sırasında render tetiklenir ve hareket durduğunda `0 FPS` bekleme moduna geçer.
- **Paylaşımlı PBR Texture Önbelleği ve Cihaz Bazlı Çözünürlük:** Prosedürel PBR normal ve roughness haritaları kategori bazında bir kez üretilip tüm kıyafetler arasında paylaşılır (`sharedPBRCache`). Masaüstünde yüksek netlik (`1792px` maksimum doku boyutu), mobilde ise bellek dostu (`1152px`, `devicePixelRatio <= 1.25`) sınırlar kullanılır.

---

## 5. DEĞİŞEN DOSYALAR

- [`apps/backend/src/scripts/seed-rack-products.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/backend/src/scripts/seed-rack-products.ts) — Medusa veritabanına `Nizamlar Signature Sweatshirt` ve `Nizamlar Essential Kazak` ürünlerini, varyantlarını ve stoklarını ekleyen seed betiği.
- [`apps/storefront/public/brand/logo.svg`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/brand/logo.svg), [`logo-light.svg`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/brand/logo-light.svg), [`sample-monogram.svg`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/brand/sample-monogram.svg) — Kurumsal Nizamlar vektörel logo dosyaları.
- [`apps/storefront/src/modules/clothes-rack/nizamlar-garment-art.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/clothes-rack/nizamlar-garment-art.ts) — Prosedürel PBR kumaş dokuları (penye, 3 iplik şardonlu, triko kazak), yaka/etek dokuma etiketleri, V-gusset, triko örgü kolonları ve kabartma/nakış Nizamlar logo işleyici.
- [`apps/storefront/src/modules/clothes-rack/garment.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/clothes-rack/garment.ts) — `"tee" | "crewneck" | "sweater" | "shirt"` 3D geometri kalıpları, PBR materyal entegrasyonu, kumaş kıvrım normalleri ve 3 noktalı stüdyo ışıklandırması.
- [`apps/storefront/src/lib/3d/product.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/lib/3d/product.ts) — İngilizce/dummy ürünlerin filtrelenmesi ve 8 kurumsal Nizamlar ürününün gerçek Medusa ürün bağlantılarına eşlenmesi.
- [`apps/storefront/src/modules/clothes-rack/clothes-rack.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/clothes-rack/clothes-rack.tsx) — Kontrollü `activeIndex` / `onActiveChange` desteği, WebGL screenshot uyumluluğu (`preserveDrawingBuffer: true`) ve kamera/buton iyileştirmeleri.
- [`apps/storefront/src/modules/clothes-rack/index.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/clothes-rack/index.tsx) — Kategori/ürün hızlı seçici barı, seçili ürün bilgi/aksiyon kartı ve Türkçe vitrin metinleri.
- [`apps/storefront/e2e/design-experience.spec.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/e2e/design-experience.spec.ts) — Masaüstü, tablet ve mobil görünümde Dimaac askılık genel görünüm, tişört, sweatshirt, kazak ve detay sahnesi ekran görüntüsü doğrulama testleri.

---

## 6. ALINAN EKRAN GÖRÜNTÜLERİ

Tüm ekran görüntüleri gerçek tarayıcı (Playwright Chromium) üzerinden alınmış ve görsel olarak doğrulanmıştır (`/Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/`):

### Masaüstü (`1440×900`)
- [`desktop-dimaac-rack-overview.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/desktop-dimaac-rack-overview.png) — Dimaac askılık genel görünüm
- [`desktop-dimaac-rack-tisort.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/desktop-dimaac-rack-tisort.png) — Beyaz Nizamlar Premium Oversize Tişört öne çıkmış görünüm
- [`desktop-dimaac-rack-sweatshirt.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/desktop-dimaac-rack-sweatshirt.png) — Antrasit Nizamlar Signature Sweatshirt öne çıkmış görünüm
- [`desktop-dimaac-rack-kazak.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/desktop-dimaac-rack-kazak.png) — Krem Taş Nizamlar Essential Kazak öne çıkmış görünüm
- [`desktop-dimaac-detail-stage.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/desktop-dimaac-detail-stage.png) — Ürün detay sahnesi (`01 / 08` ve `Ürünü İncele` aksiyonu)

### Tablet (`768×1024`)
- [`tablet-dimaac-rack-overview.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tablet-dimaac-rack-overview.png)
- [`tablet-dimaac-rack-tisort.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tablet-dimaac-rack-tisort.png)
- [`tablet-dimaac-rack-sweatshirt.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tablet-dimaac-rack-sweatshirt.png)
- [`tablet-dimaac-rack-kazak.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tablet-dimaac-rack-kazak.png)
- [`tablet-dimaac-detail-stage.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tablet-dimaac-detail-stage.png)

### Mobil (`390×844`)
- [`mobile-dimaac-rack-overview.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/mobile-dimaac-rack-overview.png)
- [`mobile-dimaac-rack-tisort.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/mobile-dimaac-rack-tisort.png)
- [`mobile-dimaac-rack-sweatshirt.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/mobile-dimaac-rack-sweatshirt.png)
- [`mobile-dimaac-rack-kazak.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/mobile-dimaac-rack-kazak.png)
- [`mobile-dimaac-detail-stage.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/mobile-dimaac-detail-stage.png)
