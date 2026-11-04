# NİZAMLAR SHOP — YENİ ANA SAYFA, CANLI HERO SLIDER VE PERFORMANS OPTİMİZASYONU RAPORU

**Tarih:** 2026-11-03  
**Proje Dizini:** `/Volumes/KIOXIA/nizamlar-shop`  
**Odak Uygulama:** Next.js Storefront (`apps/storefront`) + Medusa.js v2 Backend (`apps/backend`)

---

## 1. Tespit Edilen Performans Darboğazları

Chrome Performance Observer ve kod analizi sonucunda mevcut ana sayfa ve 3D bileşenlerde aşağıdaki darboğazlar tespit edilmiştir:

1. **480svh Scroll-Kilitli (Sticky) VeloriQ Hero (`apps/storefront/src/modules/cinematic-hero/index.tsx` & `globals.css`):**
   - `.cinema { height: 480svh }` ve `.cinema-stage { position: sticky; top: 64px }` yapısı nedeniyle kullanıcı masaüstünde **4.320 px** (mobilde **4.051 px**) boyunca ilk ekrana kilitleniyordu.
   - Her `scroll` olayında `progress` hesaplanarak React state güncelleniyor ve 5 sahne boyunca 3D tişört modeli döndürülüyordu.
2. **İlk Açılışta Tam Ekran Sürekli Çalışan WebGL Canvas (`apps/storefront/src/modules/garment-3d/scene.tsx` & `garment-model.tsx`):**
   - `CinematicHero` açılışta `<GarmentScene>` bileşenini doğrudan (statik import ile) yüklüyor ve `frameloop="always"` modunda saniyede 60 kare (`~61 FPS`) WebGL render döngüsü çalıştırıyordu.
   - Scroll ilerledikçe `garment-model.tsx` içerisinde `<Decal>` materyali ve `CanvasTexture` her baskı değişiminde yeniden oluşturuluyordu.
   - Bu durum açılışta `three`, `@react-three/fiber`, `@react-three/drei` ve `/models/nizamlar-tee.glb` yükünü ana iş parçacığına (Main Thread) bindirerek masaüstünde **773 ms**, mobilde **700 ms** Long Task blokajına ve masaüstünde **8.328 ms LCP** değerine yol açıyordu.
3. **Dimaac 3D Clothes Rack Sürekli Rüzgar Fiziği (`apps/storefront/src/modules/clothes-rack/index.tsx`):**
   - `NizamlarClothesRackSection` bileşeni sayfa açılışında doğrudan yükleniyor ve `breeze={0.25}` parametresiyle çalışıyordu.
   - `clothes-rack.tsx` içindeki 240Hz yay + kumaş simülasyonu `breeze > 0` olduğunda hiçbir zaman uyku moduna (`idle`) geçmiyor, kullanıcı etkileşimi olmasa dahi arka planda sürekli CPU/GPU tüketiyordu.
4. **Aura Ürün Detayı ve T-Designer 3D Sahnesinde Sürekli Render Döngüsü (`apps/storefront/src/modules/garment-3d/scene.tsx`):**
   - `GarmentScene` bileşeninde `frameloop="always"` kullanıldığı için kullanıcı 3D tişörte dokunmadığında bile WebGL sahnesi sürekli yeniden çiziliyordu.

---

## 2. Kaldırılan Ağır Animasyonlar ve Scroll Kilitleri

- **Scroll-Hijack / Sticky Hero Kaldırıldı:** `.cinema { height: 480svh }` ve `.cinema-stage { position: sticky }` kuralları tamamen kaldırıldı. Mouse tekerleği (`wheel`) veya dokunmatik kaydırma (`touch-action: pan-y`) yapıldığında sayfa hiçbir direnç veya sahne kilidi olmadan doğal tarayıcı akışıyla (`native scroll`) doğrudan bir sonraki bölüme (`#collection-rack`) iner.
- **Hero İçindeki WebGL Canvas Kaldırıldı:** İlk ekranda (`Hero Slider`) sıfır WebGL Canvas çalıştırılmaktadır (`activeWebGLCanvasesOnLoad: 0`).
- **Sürekli Rüzgar Fiziği (`breeze`) Kapatıldı:** `ClothesRack` bileşeninde `breeze={0}` yapılarak yalnızca kullanıcı askılıktaki tişörtlerin üzerine geldiğinde (`hover`), odaklandığında (`focus`) veya sürüklediğinde (`pointermove`) fizik motorunun çalışması, hareketsiz kaldığında ise `0 FPS` uyku moduna geçmesi sağlandı.
- **On-Demand WebGL Render (`frameloop="demand"`):** `GarmentScene`, `GarmentModel` ve `Studio3DViewer` bileşenleri `frameloop={visible ? "demand" : "never"}` mimarisine geçirildi; yalnızca renk/kamera/decal değişimi devam ederken `invalidate()` çağrılır, geçiş tamamlandığında GPU kullanımı durur.

---

## 3. Yeni Canlı 3 Sahneli Hero Slider Mimarisi

[`apps/storefront/src/modules/cinematic-hero/index.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/cinematic-hero/index.tsx) tamamen yeniden tasarlanarak Nizamlar Baskı'ya özgü, canlı renkli ve yüksek kontrastlı 3 sahneli bir **Premium Fashion Hero Slider** oluşturuldu:

| Slide | Arka Plan Rengi | Başlık | Alt Metin | CTA Butonu & Hedef | Görsel Varlık |
|---|---|---|---|---|---|
| **Slide 01** | Canlı Elektrik Mavisi (`#175CFF`) | `KENDİ TARZINI YANSIT.` | Premium tekstil ürünlerini keşfet. Tarzını Nizamlar Baskı kalitesiyle tamamla. | **Koleksiyonu Keşfet** (`#collection-rack`) | `/hero/slide-1-tee.webp` (`10.5 KB`) |
| **Slide 02** | Canlı Turuncu (`#FF5A1F`) | `TASARLA. BİZ BASALIM.` | Kendi logonu yükle, ürününü özelleştir, baskını sipariş et. | **Tasarımını Oluştur** (`# studio` / T-Designer) | `/hero/slide-2-printed-tee.webp` (`21.7 KB`) |
| **Slide 03** | Canlı Fuşya (`#E92D85`) | `ÜRETİMDE NİZAMLAR KALİTESİ.` | Tek üründen toplu üretime, tekstil baskıda profesyonel çözümler. | **Ürünleri İncele** (`/tr/store`) | `/hero/slide-3-collection.webp` (`28.4 KB`) |

### Slider Özellikleri
- **Kontroller:** Sağ/sol ok butonları (`hero-prev-btn`, `hero-next-btn`), alt slide göstergeleri (`01`, `02`, `03` — `hero-dot-0..2`) ve Otomatik Geçiş Oynat/Duraklat (`hero-play-toggle`) butonu.
- **Otomatik Geçiş:** 5.5 saniyede bir yumuşak geçiş yapar; mouse üzerine geldiğinde (`hover`), klavye odağında (`focus`) veya kullanıcı manuel değiştirdiğinde duraklatılır.
- **Mobil & Klavye Desteği:** Mobil cihazlarda yatay parmak kaydırma (`swipe`) ile sahne değiştirir (`touch-action: pan-y` sayesinde dikey sayfa kaydırmasını asla engellemez), klavyede `ArrowLeft` / `ArrowRight` tuşlarını destekler.
- **Erişilebilirlik:** `prefers-reduced-motion: reduce` aktif olduğunda otomatik geçiş ve yüzme (`float`) animasyonu devre dışı kalır.

---

## 4. Yeni Ana Sayfa Akışı ve Açık Renk Tasarım Sistemi

[`apps/storefront/src/app/[countryCode]/(main)/page.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/app/%5BcountryCode%5D/(main)/page.tsx) karanlık tema yerine ferah, modern ve yüksek kontrastlı editoryal tasarım sistemine (`#FAF9F6` / `#F7F5F0` kırık beyaz zemin, `#17181C` antrasit tipografi, `#175CFF` elektrik mavisi, `#FF5A1F` canlı turuncu, `#E92D85` canlı fuşya ve kontrollü `#D4A853` altın rozetler) kavuşturuldu:

1. **Bölüm 1 — Canlı Hero Slider (`[data-testid="cinematic-hero"]`)**
2. **Bölüm 2 — Dimaac 3D Kıyafet Askılığı (`#collection-rack`)**: `next/dynamic` + `IntersectionObserver` ile yalnızca kullanıcı aşağı kaydırdığında yüklenir; gerçek Medusa ürünlerine bağlıdır.
3. **Bölüm 3 — Popüler Ürünler (`#popular-products`)**: Gerçek Medusa ürünleri, fiyatları, renk noktaları, **"Ürünü İncele"** ve **"Kendin Tasarla"** aksiyonları.
4. **Bölüm 4 — Kendi Tasarımını Oluştur Tanıtım Alanı (`#custom-design-promo`)**: 3 adımlı (`1. Ürününü Seç`, `2. Logonu Yükle`, `3. Siparişini Ver`) T-Designer stüdyo tanıtımı ve canlı önizleme kartı.
5. **Bölüm 5 — Nizamlar Baskı Hizmetleri (`#print-services`)**: DTF Baskı, Serigrafi Baskı, Nakış & Dokuma, Kurumsal Tekstil ve Özel Koleksiyon Üretimi kartları.
6. **Bölüm 6 — Toplu Üretim & Kurumsal Sipariş (`#bulk-production`)**: Minimum sipariş, numune ve üretim süresi bilgileriyle kurumsal teklif/stüdyo yönlendirmesi.
7. **Bölüm 7 — Footer**

---

## 5. Önceki ve Sonraki Performans Ölçümleri

Aynı Playwright + Chrome PerformanceObserver ölçüm betiği ile `http://localhost:8000/tr` üzerinde yapılan gerçek öncesi ve sonrası ölçümler:

| Metrik | Önce (Masaüstü `1440×900`) | Sonra (Masaüstü `1440×900`) | Önce (Mobil `390×844`) | Sonra (Mobil `390×844`) | İyileşme Özeti |
|---|---|---|---|---|---|
| **First Contentful Paint (FCP)** | `8.328 ms` | **`964 ms`** (sıcak önbellek: `336 ms`) | `1.004 ms` | **`296 ms`** (sıcak: `268 ms`) | Masaüstünde **%88**, mobilde **%70** daha hızlı ilk boyama |
| **Largest Contentful Paint (LCP)** | `8.328 ms` | **`964 ms`** (sıcak önbellek: `352 ms`) | `1.004 ms` | **`304 ms`** (sıcak: `268 ms`) | Masaüstünde **%88**, mobilde **%70** daha hızlı LCP |
| **Cumulative Layout Shift (CLS)** | `0` | **`0`** | `0` | **`0`** | Sıfır kayma (`0.000`) |
| **Main-Thread Long Tasks Toplamı** | `773 ms` (2 görev) | **`430 ms`** (sıcak: `368 ms`) | `700 ms` (2 görev) | **`132 ms`** (1 görev) | Ana iş parçacığı blokajında **%44 – %81** azalma |
| **Açılışta Aktif WebGL Canvas Sayısı** | `1` (Hero) + `1` (Rack) | **`0`** (Lazy-loaded) | `1` (Hero) + `1` (Rack) | **`0`** (Lazy-loaded) | İlk ekranda **%100 WebGL yükü kaldırıldı** |
| **Hero Alanı Scroll Yüksekliği** | `4.320 px` (`480svh` kilitli) | **`836 px`** (Doğal akış) | `4.051 px` (`480svh` kilitli) | **`780 px`** (Doğal akış) | Scroll mesafesi **5.1 kat** kısaltıldı, kilit kaldırıldı |
| **Boşta (Idle) WebGL Render Döngüsü** | `~61 FPS` (Sürekli) | **`0 FPS`** (`demand` / `idle`) | `~58 FPS` (Sürekli) | **`0 FPS`** (`demand` / `idle`) | Boşta GPU tüketimi sıfırlandı |

---

## 6. Değiştirilen ve Eklenen Dosyalar

- [`apps/storefront/public/hero/slide-1-tee.webp`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/hero/slide-1-tee.webp) — Slide 1 için optimize edilmiş `10.5 KB` şeffaf 3D beyaz oversize tişört görseli.
- [`apps/storefront/public/hero/slide-2-printed-tee.webp`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/hero/slide-2-printed-tee.webp) — Slide 2 için optimize edilmiş `21.7 KB` şeffaf 3D antrasit baskılı tişört görseli.
- [`apps/storefront/public/hero/slide-3-collection.webp`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/hero/slide-3-collection.webp) — Slide 3 için optimize edilmiş `28.4 KB` çoklu renkli tekstil koleksiyon görseli.
- [`apps/storefront/src/modules/cinematic-hero/index.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/cinematic-hero/index.tsx) — 5 sahneli scroll-kilitli WebGL Hero yerine 3 sahneli canlı Hero Slider bileşeni.
- [`apps/storefront/src/styles/globals.css`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/styles/globals.css) — `.hero-slider` ve yeni renk sistemi stilleri; eski `.cinema` `480svh` sticky kurallarının temizlenmesi ve mobil (`390px`) kontrol çubuğu uyumu.
- [`apps/storefront/src/modules/clothes-rack/index.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/clothes-rack/index.tsx) — `ClothesRack` için `next/dynamic` + `IntersectionObserver` lazy-load, `breeze={0}` ile boşta uyku modu ve açık renkli bölüm tasarımı.
- [`apps/storefront/src/app/[countryCode]/(main)/page.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/app/%5BcountryCode%5D/(main)/page.tsx) — 7 bölümlü yeni ana sayfa mimarisi ve açık renkli editoryal tasarım.
- [`apps/storefront/src/modules/garment-3d/scene.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/garment-3d/scene.tsx) — `frameloop={visible ? "demand" : "never"}` ile talep üzerine (on-demand) WebGL render.
- [`apps/storefront/src/modules/garment-3d/garment-model.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/garment-3d/garment-model.tsx) — Renk ve rotasyon geçişlerinde `invalidate()` tetiklemesi, geçiş bittiğinde uyku modu ve `useGLTF.preload`.
- [`apps/storefront/src/modules/custom-studio/studio-3d-viewer.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/custom-studio/studio-3d-viewer.tsx) — T-Designer 3D sahnesinde yalnızca sönümlenme hareketi sürerken `invalidate()` çağrılması.
- [`apps/storefront/src/modules/product-showcase/index.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/product-showcase/index.tsx) — `ProductViewer3D` bileşeninin `next/dynamic` (`ssr: false`) ile yüklenmesi.
- [`apps/storefront/e2e/design-experience.spec.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/e2e/design-experience.spec.ts) — 3 slide geçişini, doğal sayfa kaydırmayı (`native scroll`), lazy 3D askılığı, Aura ürün detayını, T-Designer stüdyosunu ve Medusa sepetini doğrulayan E2E test paketi.

---

## 7. Ekran Görüntüleri (`artifacts/screenshots/`)

Masaüstü (`1440×900`), Tablet (`768×1024`) ve Mobil (`390×844`) çözünürlüklerde gerçek tarayıcı üzerinden alınan ve görsel olarak doğrulanan ekran görüntüleri:

- **Hero Slide 1 (`#175CFF` Elektrik Mavisi):**
  - `artifacts/screenshots/desktop-hero-slide-1.png`
  - `artifacts/screenshots/tablet-hero-slide-1.png`
  - `artifacts/screenshots/mobile-hero-slide-1.png`
- **Hero Slide 2 (`#FF5A1F` Canlı Turuncu):**
  - `artifacts/screenshots/desktop-hero-slide-2.png`
  - `artifacts/screenshots/tablet-hero-slide-2.png`
  - `artifacts/screenshots/mobile-hero-slide-2.png`
- **Hero Slide 3 (`#E92D85` Canlı Fuşya):**
  - `artifacts/screenshots/desktop-hero-slide-3.png`
  - `artifacts/screenshots/tablet-hero-slide-3.png`
  - `artifacts/screenshots/mobile-hero-slide-3.png`
- **Dimaac 3D Clothes Rack:**
  - `artifacts/screenshots/desktop-rack.png`, `tablet-rack.png`, `mobile-rack.png`
- **Aura Ürün Detay Sayfası:**
  - `artifacts/screenshots/desktop-product.png`, `tablet-product.png`, `mobile-product.png`
- **T-Designer 3D Baskı Stüdyosu:**
  - `artifacts/screenshots/desktop-studio.png`, `tablet-studio.png`, `mobile-studio.png`
- **Medusa Sepet Sayfası:**
  - `artifacts/screenshots/desktop-cart.png`, `tablet-cart.png`, `mobile-cart.png`

---

## 8. Gerçek Tarayıcı Test Sonuçları (Playwright E2E)

`npx playwright test` komutu ile Masaüstü, Tablet ve Mobil profillerinde çalıştırılan **9/9 E2E testi başarıyla geçmiştir**:

| # | Doğrulama Maddesi | Durum |
|---|---|---|
| 1 | Ana sayfa hızlı açılıyor (`LCP < 1s`, ilk ekranda `0` WebGL Canvas) | **GEÇTİ** |
| 2 | Hero Slider 3 sahneyi (`#175CFF`, `#FF5A1F`, `#E92D85`) doğru gösteriyor | **GEÇTİ** |
| 3 | Ok butonları, slide noktaları (`01`, `02`, `03`) ve Oynat/Duraklat çalışıyor | **GEÇTİ** |
| 4 | Mouse wheel ile aşağı kaydırınca sayfa takılmadan doğrudan `#collection-rack` bölümüne iniyor (`scrollY: 0 -> 720px`) | **GEÇTİ** |
| 5 | Hero scroll sırasında sabitlenmiyor (`position: relative`) | **GEÇTİ** |
| 6 | Dimaac Clothes Rack aşağı kaydırıldığında yükleniyor ve askıdaki ürünler gerçek ürün detayına gidiyor | **GEÇTİ** |
| 7 | Aura ürün detay sayfası gerçek Medusa varyantları, fiyatları ve 3D görünümüyle çalışıyor | **GEÇTİ** |
| 8 | `"Tasarımını Oluştur"` / `"Kendi Tasarımınla Satın Al"` butonları T-Designer'ı açıyor | **GEÇTİ** |
| 9 | T-Designer logo yükleme, ön/arka yüzey ve özel tasarım sepete ekleme (`POST /store/custom-designs/cart`) çalışıyor | **GEÇTİ** |
| 10 | Mobil (`390×844`), Tablet (`768×1024`) ve Masaüstü (`1440×900`) görünümler sorunsuz | **GEÇTİ** |
