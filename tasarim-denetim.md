# Nizamlar Baskı tasarım denetimi

Tarih: 3 Kasım 2026. Kaynak: gerçek dosyalar, çalışan localhost:8000 / localhost:9000, Playwright/Chrome.

## Başlangıç ve geri dönüş

- npm 11.19.1; Next 16.3.8, storefront React 19.0.5; backend React 18.3.1.
- Storefront mevcut. Backend sağlık isteği HTTP 200.
- Başlangıç dalı: codex/design-audit-integration. Geri dönüş referansı: codex/before-reference-integration-20261103.
- Başlangıçta kullanıcıya ait tsconfig.tsbuildinfo değişikliği ve artifacts/ mevcut; korunuyor.
- Git macOS ._pack indeks yan dosyasına ilişkin uyarı veriyor. Paket/veritabanı silinmedi.

## Bulgular

| Beklenen davranış | Mevcut gerçek davranış | Dosya/bileşen ve teknik neden | Düzeltme |
|---|---|---|---|
| 3D askılık | Tarayıcıda `Cannot read properties of undefined (reading 'pattern')` | clothes-rack/index.tsx: registry `kind/colour` beklerken `garment/color/body` gönderiliyor | Doğru tipli Medusa adaptörü, gerçek ID, tekstil filtresi |
| Gerçek katalog | Ürün yokken beş uydurma ürün oluşturuluyor; pantolon ve çanta tişört gibi sunuluyor | clothes-rack/index.tsx fallback ve handle varsayımları | Demo verisini kaldır, desteklenmeyen ürünleri dışarıda tut |
| Sinematik ve görünür tişört | Gerçek GLB var ama yazı modelin üzerinde; etek ekran dışında; kamera sabit, dört metin değişimi | cinematic-hero/index.tsx sabit scale/position, üst üste katmanlar | Ortak merkezlenmiş model, responsive kamera, beş sürekli scroll sahnesi, baskı geçişi |
| Yasal model | tshirt.glb kaynağı/lisansı belgelenmemiş; referans TDesigner lisansı açık değil | public/models/tshirt.glb | Özgün, tekrar üretilebilir model ve lisans kaydı |
| Aura açık ürün deneyimi | Tamamı koyu; model kendi kendine dönüyor; renk önizleme satın alınan renkten bağımsız | product-showcase/* | Açık düzen, tek varyant durumu, kullanıcı kontrollü 360, galeri |
| Gerçek varyant ve adet | Detay sayfasında adet hep 1; stüdyo ilk varyantı seçiyor | product-actions/index.tsx; custom-studio/index.tsx: `includes(selectedSize) || true` | Seçili varyantı stüdyoya taşı, gerçek seçenekler ve stok |
| Güvenilir özel baskı fiyatı | 450/85/60 sabitleri; backend istemci basePrice değerine güveniyor; fallback da verified=true | custom-studio/index.tsx; backend lib/pricing-engine.ts; custom-designs/route.ts | Sabit satış fiyatını kaldır; doğrulanmış ödeme entegrasyonu olmadan baskılı satın almayı kapat, tasarımı kaydet |
| Tasarım referansı | API kaydından gelen design hiç kullanılmıyor, sepete düz ürün ekleniyor | custom-studio/index.tsx; lib/data/cart.ts | Tasarım kaydı ile normal ürün satın almayı ayır; fiyat uygulanmadıkça baskılı ürünü normal sepete ekleme |
| Fiziksel ölçü/önizleme | Kare 220*scale varsayımı; gerçek görsel oranı, rotasyon, üretim sınırı eşleşmiyor; preview gönderilmiyor | custom-studio/* | Ortak mm dönüşümü, resim oranı, sınır kontrolü, kalıcı önizleme |
| Tekrar kullanılabilir 3D | Üç ayrı model ve ışık kurulumu; CDN Environment bağımlılığı | hero, product-viewer, studio-3d-viewer | Ortak sahne/model/texture katmanı ve yerel aydınlatma |
| Üretim doğrulaması | next.config.js `ignoreBuildErrors: true` | Build TS hatasını gizleyebilir | Ayrı tsc ve TS build kontrolünü etkinleştir |
| Marka bütünlüğü | Footer Medusa Store, GitHub, demo linkleri ve İngilizce metinler içeriyor | layout/footer | Tek marka ve gerçek mağaza bağlantıları |

## Başlangıç kanıtı

- artifacts/screenshots/before-home.png: 1440×900, modelin altı kırpılıyor, metin model üzerinde.
- artifacts/screenshots/before-product.png: 1440×900, koyu detay, ayrı renk önizleme.
- Tarayıcı hatası acquireKind → parts → wardrobe.garment → ClothesRack.begin zincirinde tekrar üretildi.
- TypeScript başlangıç kontrolü ayrıca çalıştırılıyor; build ve çoklu cihaz sonuçları son raporda tutulacak.

## Referans incelemesi

Kaynaklar /tmp/nizamlar-references/ altında ayrı klasörlerde incelendi. VeloriQ: tek Canvas + scroll ile paylaşılan kamera/model durumu, HTML katmanı, prosedürel materyaller. Aura: ProductViewer3D, ColorSwatches, SizeSelector, AnimatedPrice, AddToCartButton, ImageGallery, StickyCartBar ve FeatureHighlights; demo cart context mağazaya taşınmayacak. TDesigner: GLTF mesh + Decal, file reader, renk ve model kontrolleri. Dimaac: resmi registry; sewn drapes, kumaş shaderı ve sönümlü komşu açılma/turn hareketi. Yerel kurulu bileşenin alan adları resmi registry ile karşılaştırıldı.

VeloriQ ve TDesigner arşivlerinde LICENSE bulunmadı. Aura README MIT diyor fakat LICENSE dosyası yok. Kod ve varlıklar bunlardan kopyalanmayacak; davranışlar özgün uygulanacak. Dimaac resmi olarak kurulum için yayımlanmış registry üzerinden zaten projede mevcut; kullanım koşulları ayrıca kaydedilecek.
