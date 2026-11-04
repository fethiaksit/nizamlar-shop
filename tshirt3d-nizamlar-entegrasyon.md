# NİZAMLAR SHOP — TSHIRT3D REFERANSININ DIMAAC ALTINA BİREBİR ENTEGRASYON RAPORU

**Tarih:** 3 Kasım 2026  
**Proje:** `/Volumes/KIOXIA/nizamlar-shop`  
**Canlı Referans:** https://tshirt3d.vercel.app/  
**Kaynak Kod & Lisans:** https://github.com/accodes21/tshirt3d.git (`MIT License — Copyright (c) 2023 Aarya Chopkar`)

---

## 1. KAYNAK KOD ANALİZİ VE TESPİTLER

Referans repo (`accodes21/tshirt3d`) geçici dizine klonlanarak tüm bileşenleri (`App.jsx`, `Home.jsx`, `Customizer.jsx`, `Shirt.jsx`, `CameraRig.jsx`, `Backdrop.jsx`, `canvas/index.jsx`, `store/index.js`, `config/motion.js`, `config/helpers.js`, `index.css`, `shirt_baked.glb`) incelendi ve canlı referansın masaüstü/mobil ekran görüntüleri (`artifacts/screenshots/tshirt3d/ref-*.png`) alındı:

1. **Tipografi & Kompozisyon (`Home.jsx`, `index.css`):**
   - Sol tarafta Google Fonts **Bodoni Moda** serif ailesiyle çok büyük editorial başlık (`LET'S DO IT`, ikinci satırdaki vurgu kelimesi *bold italic*), altında açıklama paragrafı ve renk durumuna duyarlı dolgulu CTA butonu.
   - Sağ tarafta `fov: 25` kamera açısı ve `CameraRig` (`intro` modunda `[-0.36, 0, 2]`, `customizer` modunda `[0, 0, 2]`) ile konumlandırılan gerçek `shirt_baked.glb` (`T_Shirt_male` mesh, `lambert1` materyal) 3D tişört modeli.
2. **Geçiş & Customizer Arayüzü (`Customizer.jsx`, `config/motion.js`):**
   - CTA butonuna basıldığında sayfa yenilenmeden ve 3D Canvas sökülmeden (`AnimatePresence` + `slideAnimation` / `fadeAnimation`) sol metin alanı kayarak çıkar, 3D tişört merkeze kayar, solda dikey cam efektli (`glassmorphism`) 3 editör sekmesi (`colorpicker`, `filepicker`, `aipicker`), sağ üstte `Go Back` (`Geri Dön`) butonu ve altta 3 yuvarlak filtre/aksiyon butonu (`logoShirt`, `stylishShirt`, `download`) belirir.
3. **Referanstaki Performans Sorunları ve Çözümleri (`Shirt.jsx`, `Backdrop.jsx`, `helpers.js`):**
   - **Sorun 1:** Referans `Shirt.jsx` içinde `useFrame` döngüsünde her karede React `setModelRotation` (`useState`) çağrılıyor ve `<group key={stateString}>` ile her durum değişiminde mesh yeniden oluşturuluyordu.
   - **Çözüm:** `useFrame` içindeki tüm React `setState` çağrıları ve `key={stateString}` tamamen kaldırıldı. Renk geçişi (`shirtMaterial.color.lerp`) ve dönüş hareketleri doğrudan Three.js `meshRef` üzerinden delta-time kontrollü (`THREE.MathUtils.damp`) olarak uygulandı.
   - **Sorun 2:** Referans `downloadCanvasToImage()` fonksiyonu `document.querySelector("canvas")` kullandığı için sayfada birden fazla WebGL Canvas olduğunda (ör. Dimaac Clothes Rack) yanlış Canvas'ı indirebiliyordu.
   - **Çözüm:** `downloadCanvasElementToPng(canvasRef.current)` ile yalnızca `Tshirt3dCanvas`'a ait WebGL `<canvas>` referansı dışa aktarılacak şekilde izole edildi.
   - **Sorun 3:** Görünmeyen bölümlerde sürekli çalışan WebGL render döngüsü.
   - **Çözüm:** `IntersectionObserver` ile bölüm görünür alana yaklaştığında 3D sahne yüklenir (`hasEnteredViewport`) ve bölüm ekran dışına çıktığında `frameloop={isVisible ? "always" : "never"}` ile GPU/CPU tüketimi `0 FPS` olarak duraklatılır.

---

## 2. ANA SAYFA KONUMU VE AKIŞI

[`apps/storefront/src/app/[countryCode]/(main)/page.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/app/[countryCode]/(main)/page.tsx) içinde ana sayfa sıralaması:

1. **Mevcut Hero Slider** (`CinematicHero`)
2. **Dimaac Clothes Rack** (`NizamlarClothesRackSection`)
3. **Yeni TSHIRT3D Experience** (`Tshirt3dExperience` — Dimaac Clothes Rack'in hemen altında, arada hiçbir ek banner veya boşluk olmadan)
4. **Popüler Ürünler** (`#popular-products`)
5. **Diğer Mağaza Bölümleri** (T-Designer Tanıtım, Baskı Hizmetleri, Kurumsal Kademeli İskonto)
6. **Footer**

Bölüm iframe veya harici Vite uygulaması kullanmadan doğrudan Next.js sayfasının gerçek bir React bileşeni olarak çalışır ve `touch-action: pan-y` ile sayfanın doğal aşağı/yukarı kaymasını hiçbir şekilde kilitlemez.

---

## 3. NİZAMLAR BASKI UYARLAMASI VE ÖZELLİKLER

1. **Açılış Ekranı (`intro === true`):**
   - Sol üstte yabancı `threejs.png` üçgen logosu kaldırılarak resmi **Nizamlar Baskı** kurumsal logosu (`/brand/logo.svg`) ve `3D T-SHIRT STUDIO` rozeti yerleştirildi.
   - Büyük Bodoni Moda serif başlık: **"HAYDİ *TASARLA.*"**
   - Alt açıklama: *"Hayalindeki tişörtü tasarla. Rengini seç, logonu yükle ve **Nizamlar Baskı** kalitesiyle gerçeğe dönüştür."*
   - Güçlü CTA butonu: **"Tasarımını Oluştur"**
   - Sağ tarafta havada duran 3D tişört üzerinde varsayılan olarak Nizamlar Baskı kurumsal göğüs arması (`/tshirt3d/nizamlar-logo-decal.png`) yer alır.
2. **3D Customizer Arayüzü (`intro === false`):**
   - **Renk Seçici (`colorpicker`):** Nizamlar kurumsal renk paleti (`#B29460` Gold, `#222325` Antrasit, `#F4F1EA` Kırık Beyaz, `#E6DFD2` Krem Taş, `#49372E` Kahverengi, `#18191B` Siyah, `#C9C1B5` Taş Bej, `#666D4F` Haki, `#242F4A` Lacivert, `#703443` Bordo) + serbest renk seçici ve Hex girişi.
   - **Dosya Yükleyici (`filepicker`):** PNG, JPG ve WebP yükleme (maks. 25 MB), **"Logo"** (göğüs baskısı) ve **"Full"** (tam yüzey desen) uygulama butonları.
   - **Hazır Kurumsal Şablon & Güvenli AI Sekmesi (`aipicker`):** Eski güvensiz harici demo API'ye bağlanmaz; frontend'de hiçbir API anahtarı barındırmaz. Kullanıcılara tek tıkla Nizamlar Atelier Arma, NB 1994 Monogram ve Tam Yüzey Nizamlar Monogram Deseni uygulama imkânı sunar.
   - **Alt Filtre & PNG İndirme Barı:** `logoShirt` (Göğüs Logo aç/kapat), `stylishShirt` (Tam Yüzey Desen aç/kapat), `download` (`nizamlar-3d-tasarim.png` olarak yalnızca bu tişörtün 3D renderını indirir) ve 3D döndürme/yakınlaştırma (`↺`, `360°`, `↻`, `+`, `−`) kontrolleri.

---

## 4. ORTAK MEDUSA VE T-DESIGNER ENTEGRASYONU

Mevcut `CustomPrintStudio` (`apps/storefront/src/modules/custom-studio/index.tsx`) ile yeni `Tshirt3dExperience` (`apps/storefront/src/modules/tshirt3d-experience/index.tsx`) arasında kod ve mantık tekrarını önlemek için ortak servis modülü oluşturuldu:

- [`apps/storefront/src/modules/custom-studio/design-order-service.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/custom-studio/design-order-service.ts):
  - `calculateClientPrintPricing`: Adet bazlı otomatik kademeli iskonto (%5 – %30), baskı tekniği (`DTF Dijital` / `Serigrafi`) ve baskı alanı çarpanı.
  - `saveCustomDesignSurface`: Orijinal raster dosyayı (`originalFileBase64`), `createProductionPreview` ile üretilen 2D üretim önizlemesini ve fiziksel milimetre ölçülerini (`torso-mm-v1`, `widthMm`, `heightMm`, `areaCm2`) mevcut `POST /store/custom-designs` endpoint'ine kaydeder ve `des_...` kimliği döner.
  - `addSavedDesignsToMedusaCart`: Doğrulanmış (`checkoutEnabled: true`) tasarımı mevcut `addCustomDesignToCart` aksiyonuyla gerçek Medusa sepetine ekler ve `notifyCartUpdated()` tetikler.
- Varsayılan tişört, Medusa veritabanındaki gerçek **`Premium Oversize Penye T-Shirt`** (`handle: "premium-oversize-penye-t-shirt"`) ürünü ve varyantlarıyla (`Renk`, `Beden`, `Adet`) doğrudan eşleşir.

---

## 5. DEĞİŞEN VE EKLENEN DOSYALAR

- [`apps/storefront/public/tshirt3d/`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/tshirt3d/) — `shirt_baked.glb`, `nizamlar-logo-decal.png`, `nizamlar-full-pattern.png`, editör/filtre ikonları ve `LICENSE` (MIT).
- [`apps/storefront/public/models/LICENSE.md`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/public/models/LICENSE.md) — `accodes21/tshirt3d` MIT lisans ve kaynak atfı eklendi.
- [`apps/storefront/src/modules/custom-studio/design-order-service.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/custom-studio/design-order-service.ts) — Ortak Medusa `custom_design` kayıt, fiyatlandırma ve sepet servisi.
- [`apps/storefront/src/modules/custom-studio/index.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/custom-studio/index.tsx) — Ortak `design-order-service` kullanacak şekilde güncellendi.
- [`apps/storefront/src/modules/tshirt3d-experience/motion.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/tshirt3d-experience/motion.ts) — Framer Motion animasyon varyantları, kurumsal renk paleti ve PNG dışa aktarma yardımcıları.
- [`apps/storefront/src/modules/tshirt3d-experience/tshirt3d-canvas.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/tshirt3d-experience/tshirt3d-canvas.tsx) — Performans optimize 3D `shirt_baked.glb` sahnesi (`CameraRig`, `BackdropHalo`, `ShirtMesh`).
- [`apps/storefront/src/modules/tshirt3d-experience/index.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/tshirt3d-experience/index.tsx) — TSHIRT3D açılış ekranı, 3D Customizer araçları ve kompakt Medusa canlı sipariş paneli.
- [`apps/storefront/src/app/[countryCode]/(main)/page.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/app/[countryCode]/(main)/page.tsx) — `Tshirt3dExperience` bileşeninin Dimaac Clothes Rack hemen altına entegrasyonu.
- [`apps/storefront/src/app/layout.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/app/layout.tsx) & [`apps/storefront/src/styles/globals.css`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/styles/globals.css) — `Bodoni Moda` editorial serif fontu ve `.tshirt3d-*` cam/tipografi stilleri.
- [`apps/storefront/e2e/design-experience.spec.ts`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/e2e/design-experience.spec.ts) — Masaüstü (`1440×900`), Tablet (`768×1024`) ve Mobil (`390×844`) 16 adımlı uçtan uca tarayıcı testi.

---

## 6. GÖRSEL SADAKAT VE TARAYICI TEST KANITLARI (`artifacts/screenshots/tshirt3d/`)

### Canlı Referans Ekran Görüntüleri (`https://tshirt3d.vercel.app/`)
- [`ref-desktop-intro.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/ref-desktop-intro.png)
- [`ref-desktop-customizer.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/ref-desktop-customizer.png)
- [`ref-mobile-intro.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/ref-mobile-intro.png)
- [`ref-mobile-customizer.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/ref-mobile-customizer.png)

### Nizamlar Shop Entegrasyon Ekran Görüntüleri
- **Masaüstü (`1440×900`):**
  - [`desktop-01-intro.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/desktop-01-intro.png) — Editorial açılış (`HAYDİ TASARLA.`) ve sağda 3D Nizamlar tişörtü
  - [`desktop-02-customizer.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/desktop-02-customizer.png) — "Tasarımını Oluştur" geçişi sonrası merkezde 3D tişört, sol editör sekmeleri, alt filtreler ve sağ Medusa sipariş paneli
  - [`desktop-03-color-change.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/desktop-03-color-change.png) — Antrasit (`#222325`) renk seçimi ve varyant senkronizasyonu
  - [`desktop-04-custom-logo.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/desktop-04-custom-logo.png) — Kullanıcı tarafından yüklenen özel logonun 3D tişörte uygulanması
  - [`desktop-05-full-pattern.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/desktop-05-full-pattern.png) — Tam yüzey desen (`Full`) modunun aktif edilmesi
  - [`desktop-06-saved-and-added.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/desktop-06-saved-and-added.png) — Kalıcı tasarım kaydı (`des_...`) ve Medusa sepetine ekleme onayı
- **Tablet (`768×1024`):**
  - [`tablet-01-intro.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/tablet-01-intro.png), [`tablet-02-customizer.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/tablet-02-customizer.png), [`tablet-03-color-change.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/tablet-03-color-change.png), [`tablet-04-custom-logo.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/tablet-04-custom-logo.png), [`tablet-05-full-pattern.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/tablet-05-full-pattern.png), [`tablet-06-saved-and-added.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/tablet-06-saved-and-added.png)
- **Mobil (`390×844`):**
  - [`mobile-01-intro.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/mobile-01-intro.png), [`mobile-02-customizer.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/mobile-02-customizer.png), [`mobile-03-color-change.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/mobile-03-color-change.png), [`mobile-04-custom-logo.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/mobile-04-custom-logo.png), [`mobile-05-full-pattern.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/mobile-05-full-pattern.png), [`mobile-06-saved-and-added.png`](file:///Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/tshirt3d/mobile-06-saved-and-added.png)
