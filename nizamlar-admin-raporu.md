# NİZAMLAR SHOP — MEDUSA ADMİN YÖNETİM SİSTEMİ RAPORU

**Tarih:** 4 Kasım 2026  
**Erişim Adresi:** [http://localhost:9000/app](http://localhost:9000/app)  
**Yönetici E-Posta:** `admin` (veya `admin@admin.com`)  
**Yönetici Şifre:** `admin`  
**Proje Konumu:** `/Volumes/KIOXIA/nizamlar-shop`

---

## 1. YÖNETİCİ ÖZETİ

Nizamlar Shop e-ticaret platformu için harici hiçbir CMS (Directus, Strapi, WordPress vb.) kullanılmadan, mevcut **Medusa v2 Admin SDK**, **Admin UI Routes**, **Admin Widgets** ve **Custom PostgreSQL Veritabanı Modülü** mimarisi kullanılarak tam teşekküllü, yerli ve bağımsız bir yönetim paneli inşa edilmiştir.

Bu sistem ile mağaza yöneticisi;
1. **Hero Slider:** Slayt ekleme, silme, metin, buton, arka plan gradienti, 3D model renk/tip seçimi, aktif/taslak yönetimi ve sürükle/sıralama işlemlerini gerçekleştirebilir.
2. **Dimaac Ürün Askılığı:** Askılıktaki 3D/2D ürünleri, kumaş gramaj etiketlerini, logo baskı türünü, tişört/sweatshirt/hoodie varyasyonlarını ve sıralamalarını anlık olarak yönetebilir.
3. **3D Tasarım Stüdyosu (tshirt3d):** Varsayılan kumaş renkleri, renk paleti havuzu, başlangıç logo ve desenleri, milimetre baskı alanı limitleri ve 3D kamera açılarını özelleştirebilir.
4. **Baskı & Fiyatlandırma:** DTF, Serigrafi, Nakış baskı birim maliyetlerini, adet bazlı barem indirimlerini, tasarım dosya doğrulama kurallarını ve KDV oranlarını yönetebilir.
5. **Özel Tasarım Kayıtları:** Müşterilerin 3D stüdyodan oluşturduğu siparişlere ait ön/arka yüzey baskı dosyalarını, DPI ve çözünürlük kontrollerini inceleyip orijinal baskı dosyasını tek tıkla indirebilir.
6. **Medusa Sipariş & Ürün Detayı Entegrasyonu (Widgets):**
   - Sipariş detayında otomatik baskı iş emri kartı, ERP senkronizasyon durumu ve üretim barkodu.
   - Ürün detayında Aura 3D GLB model bağlama ve vitrin sunum rozetleri.
7. **Tek Tıkla Yayınlama (Draft / Publish Flow):** Yapılan değişiklikler önce taslak olarak incelenebilir; "Değişiklikleri Canlıya Al" butonu ile mağaza arayüzüne anında (`/store/site-content`) senkronize olur.

---

## 2. VERİTABANI MİMARİSİ (POSTGRESQL)

Mevcut Medusa e-ticaret tablolarına (`product`, `order`, `cart`, `customer` vb.) kesinlikle dokunulmadan, site yönetimi ve 3D stüdyo için 6 adet optimize edilmiş indeksli tablo oluşturulmuştur:

| Tablo Adı | Açıklama | Kayıt Örneği / Başlıca Alanlar |
|---|---|---|
| `site_settings` | Site geneli ayarlar, iletişim, duyuru ve navigasyon | `store_name`, `announcement_text`, `header_nav`, `footer_sections` |
| `hero_slides` | Hero Slider slayt kayıtları, 3D model ve metinler | `title_line1`, `badge_text`, `model_type`, `model_color`, `rank` |
| `homepage_sections` | Ana sayfa bloklarının görünürlük ve sıralaması | `section_key`, `title`, `is_visible`, `rank` |
| `garment_display_config` | Dimaac askılığındaki ürünlerin 3D/2D sunum ayarları | `product_id`, `model_type`, `fabric_badge`, `hex_color`, `rank` |
| `customizer_settings` | 3D stüdyo konfigürasyonu, palet ve baskı sınırları | `default_color`, `palette`, `print_areas`, `camera_config` |
| `site_media` | Görsel, logo, desen ve 3D GLB model medya kütüphanesi | `title`, `file_type`, `file_path`, `file_size`, `tags` |

---

## 3. OLUŞTURULAN MEDUSA ADMİN MENÜLERİ VE ARAYÜZLERİ

Medusa v2 Admin SDK (`defineRouteConfig`) kullanılarak sol menüye 2 ana kategori ve 13 özel yönetim sayfası eklenmiştir:

### A. Site Yönetimi Menüsü
1. **Genel Bakış (`/app/site-hub`):** Hızlı istatistikler, tek tıkla canlıya alma (Publish), sistem sağlık durumu ve modül kısayolları.
2. **Hero Slider (`/app/site-hero`):** 3D tişörtlü slaytların tam CRUD yönetimi, canlı önizleme kartları, sürükle-bırak/ok tuşları ile sıralama, gradient ve model rengi ayarları.
3. **Dimaac Askılık Vitrini (`/app/site-rack`):** Askılıktaki giysi modelleri, kumaş gramajı (240 GSM Penye vb.), renk kartelası, Medusa ürün kataloğu bağlantısı ve askılık sırası.
4. **3D Tasarım Stüdyosu (`/app/site-customizer`):** Varsayılan kumaş rengi, renk seçici paleti, ön/arka baskı sınır koordinatları (maksimum baskı genişlik ve yükseklikleri).
5. **Kampanyalar & Bloklar (`/app/site-sections`):** Ana sayfa bileşenlerinin (Hero, Dimaac Rack, T-Designer, VeloriQ, Bestsellers) anlık açılıp kapatılması ve sıralanması.
6. **Görsel Kütüphanesi (`/app/site-media`):** Logo, desen, doku, mockup ve 3D GLB modelleri için 50 MB kota kontrollü medya yöneticisi.
7. **Menü ve Footer (`/app/site-navigation`):** Header ana menü bağlantıları, sosyal medya linkleri ve footer sütun içerikleri.
8. **Site Ayarları (`/app/site-settings`):** Mağaza adı, sloganı, duyuru barı metni, WhatsApp sipariş hattı ve iletişim e-postası.

### B. 3D ve Baskı Yönetimi Menüsü
1. **3D Ürün Modelleri (`/app/print-models`):** `nizamlar-tee.glb`, `shirt_baked.glb` ve özel GLB modellerinin dosya yolu, poligon sayısı, UV haritası ve animasyon ayarları.
2. **Varsayılan Tişörtler (`/app/print-tshirts`):** 3D stüdyoda müşteriye sunulan temel kalıplar (Oversize, Regular, Slim Fit vb.) ve kumaş kartelaları.
3. **Baskı Alanları (`/app/print-placements`):** Göğüs, sırt, cep, kol baskı alanlarının milimetrik ölçüleri ve güvenli alan sınırları.
4. **Tasarım Kayıtları (`/app/print-designs`):** Müşterilerin siparişlerinde oluşturdukları baskı dosyaları, çözünürlük kontrolleri ve orijinal dosyayı doğrudan indirme.
5. **Baskı Fiyatlandırması (`/app/print-pricing`):** DTF, Serigrafi ve Nakış metotları için taban fiyatlar, adet bazlı kademeli iskonto baremleri ve KDV oranı.

---

## 4. OLUŞTURULAN MEDUSA ADMİN WIDGET'LARI

Medusa v2 Admin Widget sistemi (`defineWidgetConfig`) ile çekirdek Medusa sayfalarına eklenen kurumsal kartlar:

1. **Sipariş Detayı (`order.details.before`):**
   - **Bileşen:** `apps/backend/src/admin/widgets/order-erp-sync.tsx`
   - **İşlev:** Müşterinin 3D stüdyoda tasarladığı ön ve arka yüzey logonun görselini, milimetre ölçülerini, kumaş rengini gösterir; ERP / Atölye aktarımı için iş emri barkodu üretir ve tek tıkla orijinal vektör/PNG dosyasını indirmeyi sağlar.

2. **Ürün Detayı (`product.details.after`):**
   - **Bileşen:** `apps/backend/src/admin/widgets/product-aura-3d.tsx`
   - **İşlev:** Ürüne özel Aura 3D GLB model dosyası atama, vitrin rozeti belirleme ve Dimaac askılığında öne çıkarılma durumunu yönetme.

---

## 5. GELİŞTİRİLEN BACKEND API ROTLARI

Tüm API uçları Medusa v2 standartlarına tam uyumlu olarak yazılmıştır:

### Admin API (Yetkilendirilmiş - Bearer JWT veya Admin Session Zorunlu):
- `GET/POST /admin/site-management/settings` — Site ayarları okuma ve güncelleme
- `GET/POST /admin/site-management/hero-slides` — Slayt listesi ve yeni slayt ekleme / sıralama
- `GET/PUT/DELETE /admin/site-management/hero-slides/[id]` — Tekil slayt okuma, düzenleme ve silme
- `GET/POST /admin/site-management/garments` — Askılık giysi listesi ve yeni giysi tanımlama
- `GET/PUT/DELETE /admin/site-management/garments/[id]` — Giysi silme ve güncelleme
- `GET/POST /admin/site-management/customizer` — 3D stüdyo parametreleri
- `GET/POST /admin/site-management/media` — Medya yükleme ve kütüphane listesi
- `DELETE /admin/site-management/media/[id]` — Medya silme
- `GET /admin/site-management/homepage-sections` — Blok sıralaması
- `GET /admin/site-management/designs` — Müşteri tasarım kayıtları
- `GET /admin/site-management/models-3d` — 3D GLB modelleri
- `POST /admin/site-management/publish` — Canlıya alma tetikleyicisi

### Store API (Public / Mağaza Arayüzü - `AUTHENTICATE = false`):
- `GET /store/site-content` — Mağazanın ihtiyaç duyduğu tüm ayarları, yayınlanmış slaytları, askılık ürünlerini ve 3D stüdyo konfigürasyonunu tek bir optimize JSON ile döndürür. (Önizleme için `?preview=1` parametresini destekler).

---

## 6. MAĞAZA (STOREFRONT) ENTEGRASYONU

- **Veri Katmanı:** `apps/storefront/src/lib/data/site-content.ts` üzerinden `getSiteContent()` fonksiyonu ile sunucu taraflı (SSR) dinamik veri çekimi sağlanmıştır.
- **Hero Slider:** `CinematicHero` bileşeni, yönetim panelinden girilen slaytları, başlıkları, 3D model renklerini ve slayt hızını dinamik olarak okur; veri tabanı boş olsa dahi yedek güvenli verilerle çalışmayı sürdürür.
- **Dimaac Rack:** `ClothesRackSection` bileşeni, paneldeki askılık modelleriyle beslenir.
- **Görsel Bütünlük:** Mevcut 3D Canvas, OrbitControls, kumaş dokuları ve animasyonlar eksiksiz korunmuştur.

---

## 7. DOĞRULAMA VE TEST SONUÇLARI

Uygulanan tüm özellikler `tests/admin-verification.ts` test paketiyle uçtan uca test edilmiş ve 14 testin tamamından başarıyla geçmiştir:

```text
=== NİZAMLAR MEDUSA YÖNETİM PANELİ TEST PAKETİ ===

✅ [GEÇTİ] #1  Yönetici Girişi (Auth API & JWT): Giriş başarılı, Token alındı (Kullanıcı: yonetici@nizamlarbaski.com)
✅ [GEÇTİ] #2  Yetkisiz Kullanıcı Güvenlik Engeli (RBAC): Yetkisiz erişim yanıtı: HTTP 401 (Beklenen: 401 Unauthorized)
✅ [GEÇTİ] #3  Slider Başlığı ve Açıklaması Değiştirme: Slide 1 güncellendi: KENDİ TARZINI YANSIT.
✅ [GEÇTİ] #4  Slider Sıralamasını Değiştirme (Rank Reordering): 3 slaytın sıralaması başarıyla teyit edildi.
✅ [GEÇTİ] #5  Slider ve Vitrin Yayınlama (Store API Live Sync): Yayınlanan slayt adedi: 3, Canlı Senkronizasyon Başarılı
✅ [GEÇTİ] #6  Dimaac Askılığına Model Ekleme: Askılık modeli başarıyla eklendi
✅ [GEÇTİ] #7  Dimaac Ürün Sıralamasını Değiştirme: Askılık sıralaması güncellendi (Toplam: 5)
✅ [GEÇTİ] #8  tshirt3d Varsayılan Rengi ve Palet Yönetimi: Varsayılan renk: #202020, Palet boyutu: 6
✅ [GEÇTİ] #9  3D GLB Model Kütüphanesi ve Yönetimi: Kayıtlı 3D modeller: nizamlar-tee.glb, shirt_baked.glb
✅ [GEÇTİ] #10 Baskı Fiyatlandırması ve Maliyet Baremleri: DTF: 85.00 TL, Serigrafi: 60.00 TL, KDV: %20.00
✅ [GEÇTİ] #11 Özel Tasarım Kayıtları ve Güvenli Dosya Erişimi: Kayıtlı özel tasarım adedi: 44, Güvenli indirme rotası aktif
✅ [GEÇTİ] #12 Medusa Admin Panel UI Erişilebilirliği (http://localhost:9000/app): Admin SPA Yanıt Kodu: HTTP 200 OK
✅ [GEÇTİ] #13 Storefront Canlı İçerik Senkronizasyon Bütünlüğü: Site Başlığı: "Nizamlar Baskı & Tekstil", Slaytlar: 3, Askılık: 4
✅ [GEÇTİ] #14 Mevcut Sepet ve Fiyat Hesaplama Akışı Bütünlüğü: Baskılı Ürün Hesaplama: 642 TL, Doğrulama: true

Özet: 14/14 Test Başarıyla Tamamlandı (%100 Başarı).
```

---

## 8. SİSTEM GİRİŞ VE KULLANIM TALİMATI

Yönetim paneline erişmek için aşağıdaki adımları izleyebilirsiniz:

1. Tarayıcınızda **[http://localhost:9000/app](http://localhost:9000/app)** adresine gidin.
2. Giriş ekranında aşağıdaki kimlik bilgilerini kullanın:
   - **E-Posta / Kullanıcı Adı:** `admin` (veya `admin@admin.com`)
   - **Şifre:** `admin`
3. Sol menüde **"Site Yönetimi"** ve **"3D ve Baskı Yönetimi"** başlıkları altında tüm yönetim modüllerine erişebilirsiniz.
4. Yaptığınız değişiklikleri canlı sitede anında görmek için sağ üstteki veya Genel Bakış sayfasındaki **"Değişiklikleri Canlıya Al (Yayınla)"** butonuna tıklayabilirsiniz.
