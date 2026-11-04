# NİZAMLAR SHOP — ANTIGRAVITY DEVRALMA VE MEVCUT DURUM RAPORU

**Tarih:** 3 Kasım 2026  
**Proje Dizini:** `/Volumes/KIOXIA/nizamlar-shop`  
**Mevcut Git Dalı:** `codex/design-audit-integration` (Son commit: `67b328b`)  
**Geri Dönüş Referansı:** `codex/before-reference-integration-20261103` (`6391d18`) / `main` (`5e6896a`)

---

## 1. Codex Çalışmasının Analizi

Proje dizini, `git status`, `git diff`, son commitler, `tasarim-denetim.md`, `tasarim-entegrasyon-raporu.md`, `docs/superpowers/plans/2026-11-03-reference-integration.md` ve `artifacts/` klasörü incelenmiştir:

1. **Altyapı ve Servisler:**
   - Paket yöneticisi `npm@11.19.1` olarak yapılandırılmıştır (`package-lock.json` mevcut).
   - PostgreSQL (`:5434`), Medusa.js v2 Backend (`:9000`, `/health` -> `OK`) ve Next.js 16.3.8 Storefront (`:8000`, `/tr` -> `HTTP 200`) çalışır durumdadır.
2. **Codex Tarafından Tamamlanan / İlerletilen Çalışmalar:**
   - **Ortak 3D Model ve Lisans:** `scripts/export-shirt-entry.ts` ile ticari kullanıma açık DiMaac askılık modelinden `public/models/nizamlar-tee.glb` üretilmiş ve `public/models/LICENSE.md` ile belgelenmiştir.
   - **Ortak 3D Sahne Katmanı:** `src/modules/garment-3d/scene.tsx` (`IntersectionObserver`, WebGL hata sınırı, yerel ışıklandırma) ve `garment-model.tsx` (kumaş rengi `lerp`, `Decal` ile milimetrik ön/arka baskı katmanı) oluşturulmuştur.
   - **Dimaac Askılık Adaptörü:** `src/lib/3d/product.ts` içindeki `buildRackProducts` ile `kind` ve `colour` alanları düzeltilmiş, `Cannot read properties of undefined (reading 'pattern')` tarayıcı hatası giderilmiştir.
   - **Aura Ürün Detay Sayfası:** `src/modules/product-showcase/` ve `src/modules/products/components/product-actions/index.tsx` açık renkli kurumsal düzene kavuşturulmuş; 3D/Galeri sekmeleri, varyant-renk senkronizasyonu, gerçek stok kontrolü, adet seçimi ve sticky satın alma çubuğu eklenmiştir.
   - **T-Designer 3D Stüdyo (Kısmen):** `src/modules/custom-studio/index.tsx` ve `preview.ts` ile milimetrik konumlandırma (`320 × 400 mm` baskı alanı), resim en-boy oranı koruma, 2D üretim önizlemesi ve `POST /store/custom-designs` ile tasarım kaydı hazırlanmıştır.
3. **Codex'in Yarım Bıraktığı Noktalar ve Tespit Edilen Hatalar:**
   - **T-Designer Sepete Ekleme Devre Dışı:** `apps/storefront/src/modules/custom-studio/index.tsx` satır 514'te `"Baskılı Sepete Ekle · Fiyat Onayı Bekliyor"` butonu sabit olarak `disabled` bırakılmış ve sepete ekleme fonksiyonu kaldırılmıştır. Bu durum, tamamlama kriterlerindeki *"13. Baskılı ürün sepete eklenir. 14. Sepette iki ürün de doğru bilgilerle görünür."* akışını engellemektedir.
   - **Stage 3 Test Paketi Hatası (14/15):** `apps/backend/src/lib/pricing-engine.ts` içinde `calculatePriceAsync` metodunun `isPriceVerified: false` döndürmesi ve `surfaceCount: 0` (baskısız ürün) durumunda `Math.max(1, input.surfaceCount || 1)` nedeniyle baskı ücreti eklemesi yüzünden `POST /store/stage3-test-suite` çağrısında **Test #1 (Baskısız ürün sipariş fiyatlama)** başarısız olmaktadır.
   - **Sunucu Tarafı Baz Fiyat ve Sepet Fiyatlandırması:** `POST /store/custom-designs` içinde ürünün baz fiyatı istemciden gelen `pricingInput.basePrice` alanından okunmaktadır; Medusa veritabanındaki gerçek varyant fiyatından sorgulanmalı ve özel baskılı ürün sepete eklendiğinde Medusa `addToCartWorkflow` üzerinden doğrulanmış baskılı birim fiyat (`unit_price`) + `metadata` (`design_id`, `print_mode: "custom"`) ile sepete yazılmalıdır.
   - **TypeScript Hatası (`tsc --noEmit`):** `apps/storefront/e2e/design-experience.spec.ts:231:28` satırında `original.equals(artwork)` çağrısı Node 26 / TS 5.9 tip tanımlarında `TS2345: Argument of type 'Buffer' is not assignable to parameter of type 'Uint8Array<ArrayBufferLike>'` hatası vermektedir.
   - **Ana Sayfa ve Askılık Ürün Önceliklendirmesi:** Ana sayfadaki `products.find(isTshirt)` ilk sırada İngilizce demo ürünü olan `t-shirt` (`Medusa T-Shirt`) ürününü bulduğu için Hero'daki *"Kendi Tasarımını Oluştur"* butonu `premium-oversize-penye-t-shirt` yerine `t-shirt` sayfasına gitmektedir. Askılıkta da Nizamlar Türkçe ürünleri önceliklendirilmelidir.
   - **Harici Disk (`._*`) ve Playwright E2E Hatası:** macOS'un harici exFAT diskte oluşturduğu `._design-experience.spec.ts` dosyası Playwright koşusunu `SyntaxError: Unexpected character '\u0000'` ile kırmıştır; ayrıca ekran görüntüsü yazımlarında dev sunucusunun yeniden tetiklenmemesi için watch ayarları iyileştirilmelidir.

---

## 2. Bileşen Bazlı Durum Tablosu

| Bileşen | Mevcut Durum | Eksikler | Yapılacak İş |
|---|---|---|---|
| **VeloriQ Hero** | 5 sahneli scroll-driven 3D tişört (`nizamlar-tee.glb`), renk ve `Decal` baskı geçişleri, `prefers-reduced-motion` desteği mevcut. | `"Kendi Tasarımını Oluştur"` butonu katalog sırası nedeniyle İngilizce demo ürününe (`t-shirt`) yönlendiriyor; 3. ve 4. sahnelerde ön/arka baskı dönüş açıları netleştirilmeli. | Nizamlar Türkçe tişört ürününü (`premium-oversize-penye-t-shirt`) önceliklendir; sahne dönüş açılarını ön/sırt baskısını tam gösterecek şekilde iyileştir. |
| **Dimaac Clothes Rack** | Resmi Dimaac 3D askılık bileşeni ve `buildRackProducts` adaptörü çalışıyor; sahte ürünler kaldırıldı, kumaş fiziği aktif. | İngilizce demo ürünleri Nizamlar ürünlerinden önce diziliyor; Nizamlar sweatshirt/hoodie ürünü filtreleniyor. | Nizamlar tekstil ürünlerini askılıkta ilk sıralara yerleştir; ürün detay sayfasına varyant parametresiyle (`?v_id=`) geçişi doğrula. |
| **Aura Ürün Detayı** | Açık kurumsal tema, 360° 3D model ve fotoğraf galerisi sekmeleri, canlı renk geçişi, beden/stok/adet kontrolü ve sticky bar aktif. | Harici diskteki dosya yazımları sırasında dev sunucusu yenilenmesi `Failed to fetch` hatasına yol açabiliyor. | `next.config.js` dosya izleme istisnalarını ekle; baskısız sepete ekleme ve stüdyoya varyant/adet aktarımını uçtan uca doğrula. |
| **T-Designer** | 3D `Decal` önizleme, 2D üretim önizlemesi, mm cinsinden boyut/konum/rotasyon, taşma kontrolü ve `POST /store/custom-designs` kaydı çalışıyor. | `"Baskılı Sepete Ekle"` butonu sabit `disabled` bırakılmış; canlı fiyat dökümü gösterilmiyor; kaydedilen tasarım sepete eklenemiyor. | Sunucu onaylı canlı fiyat hesaplamasını göster; tasarım kaydedildikten sonra `design_id` ve doğrulanmış baskılı fiyatla Medusa sepetine ekleme akışını tamamla. |
| **Medusa Entegrasyonu** | `custom_design` tablosu, dosya imzası doğrulaması, önizleme servisi ve ERP senkronizasyon altyapısı mevcut. | `pricing-engine.ts` içinde `surfaceCount: 0` ve `isPriceVerified: false` nedeniyle Stage 3 Test #1 başarısız (14/15); baz fiyat istemciden alınıyor. | `pricing-engine.ts` içinde `surfaceCount === 0` ve `isPriceVerified` mantığını düzelt; varyant baz fiyatını sunucuda Medusa'dan oku; Stage 3 testlerini 15/15 yap. |
| **Sepet Sistemi** | Sepet satırında `Özel Baskılı Sipariş (des_...)` rozeti mevcut; baskısız ürünler standart Medusa akışıyla ekleniyor. | `addToCart` özel baskı `metadata` ve baskı dahil birim fiyatı (`unit_price`) desteklemiyor; sepette baskı yüzeyi/tekniği detayı eksik. | `POST /store/custom-designs/cart` ve `addToCartWithDesign` ile `addToCartWorkflow` üzerinden `metadata` (`design_id`, `print_mode: "custom"`) ve doğrulanmış `unit_price` ile sepete eklemeyi sağla; sepette hem baskısız hem baskılı ürünü birlikte doğrula. |
| **Mobil Tasarım** | Hero, Aura ve Studio için temel responsive CSS kuralları (`@media (max-width: 767px)`) mevcut. | `._*` dosyaları nedeniyle Playwright çoklu cihaz (`1440×900`, `768×1024`, `390×844`) testleri ve ekran görüntüleri tamamlanmamış. | AppleDouble (`._*`) dosyalarını temizle/yoksay; Masaüstü, Tablet ve Mobil görünümleri gerçek tarayıcıda test ederek tüm ekran görüntülerini `artifacts/screenshots/` altına kaydet. |
