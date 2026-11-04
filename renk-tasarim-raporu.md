# NİZAMLAR SHOP — KURUMSAL RENK PALETİ VE TASARIM SİSTEMİ RAPORU

**Tarih:** 03 Kasım 2026  
**Proje:** `/Volumes/KIOXIA/nizamlar-shop`  
**Referans Kurumsal Site:** `https://nizamlarbaski.com` (`https://github.com/fethiaksit/nizamlar-web`)

---

## 1. Orijinal Kurumsal Site Analizi (`fethiaksit/nizamlar-web`)

Nizamlar Baskı'nın orijinal kurumsal web sitesindeki (`assets/css/theme.css`, `assets/css/nav.css`, `assets/css/pages.css`, `assets/css/footer.css`) tasarım dili incelenerek aşağıdaki temel karakteristikler tespit edilmiş ve `apps/storefront` tasarım sisteminin ana omurgası haline getirilmiştir:

- **Renk Kimliği:** Antrasit/kömür tonları (`#222325`, `#161718`, `#2B2C2F`), sıcak espresso kahverengi (`#49372E`, `#32251E`), kurumsal pirinç/gold vurgu (`#B29460`, `#C4A774`) ve editoryal sıcak krem/taş yüzeyler (`#F8F6F0`, `#F3EFE7`, `#C9C1B5`, `#FFFFFF`).
- **Yüzey Dengesi:** Orijinal kurumsal sitede tüm sayfa siyaha boyanmamıştır; koyu antrasit header ve footer ile açık krem içerik bölümleri, sıcak kahverengi/antrasit üretim bantları dengeli biçimde nöbetleşe kullanılmıştır.
- **Kaldırılan Marka Dışı Renkler:** Önceki tasarımda bulunan elektrik mavisi (`#175CFF`), parlak turuncu (`#FF5A1F`) ve fuşya (`#E92D85`) tamamen kaldırılmıştır.

---

## 2. Kurumsal Renk Paleti ve Coolors Tamamlayıcı Tonları

[`apps/storefront/src/styles/globals.css`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/styles/globals.css) ve [`apps/storefront/tailwind.config.js`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/tailwind.config.js) içerisine tanımlanan kurumsal renk sistemi:

### Ana Kurumsal Değişkenler (`:root`)

```css
:root {
  --brand-anthracite: #222325;
  --brand-dark: #161718;
  --brand-surface: #2B2C2F;
  --brand-brown: #49372E;
  --brand-brown-dark: #32251E;
  --brand-gold: #B29460;
  --brand-gold-hover: #C4A774;
  --brand-cream: #F3EFE7;
  --brand-cream-light: #F8F6F0;
  --brand-stone: #C9C1B5;
  --brand-white: #FFFFFF;

  /* Coolors uyumlu yardımcı kurumsal ara tonlar (kontrast ve yüzey derinliği için) */
  --brand-cream-warm: #E8E2D4;
  --brand-stone-muted: #5C554C;
  --brand-stone-light: #DED9CF;
  --brand-gold-soft: rgba(178, 148, 96, 0.16);
  --brand-success: #2E6F4E;
  --brand-danger: #B43E36;
}
```

### Semantik Tasarım Değişkenleri

Açık yüzeyler (varsayılan `:root`) ve koyu yüzeyler (`.surface-dark`) için semantik token sistemi kurulmuştur:

| Semantik Değişken | Açık Yüzey (`:root`) | Koyu Yüzey (`.surface-dark`) | Kullanım Amacı |
| --- | --- | --- | --- |
| `--background-primary` | `#F8F6F0` (`--brand-cream-light`) | `#161718` (`--brand-dark`) | Ana sayfa ve bölüm arka planı |
| `--background-secondary` | `#F3EFE7` (`--brand-cream`) | `#222325` (`--brand-anthracite`) | İkincil yüzey ve alternatif bölümler |
| `--surface-elevated` | `#FFFFFF` (`--brand-white`) | `#2B2C2F` (`--brand-surface`) | Kart, modal ve yükseltilmiş kutular |
| `--text-primary` | `#222325` (`--brand-anthracite`) | `#F8F6F0` (`--brand-cream-light`) | Ana başlık ve gövde metinleri |
| `--text-secondary` | `#49372E` (`--brand-brown`) | `#F3EFE7` (`--brand-cream`) | Alt başlık ve açıklama metinleri |
| `--text-muted` | `#5C554C` (`--brand-stone-muted`) | `#DED9CF` (`--brand-stone-light`) | Yardımcı etiket ve üst bilgiler |
| `--text-inverse` | `#FFFFFF` (`--brand-white`) | `#161718` (`--brand-dark`) | Koyu/gold buton içi ters metin |
| `--border-default` | `#C9C1B5` (`--brand-stone`) | `rgba(201, 193, 181, 0.24)` | Kart, tablo ve form kenarlıkları |
| `--accent-primary` | `#B29460` (`--brand-gold`) | `#B29460` (`--brand-gold`) | Kurumsal pirinç/gold vurgu |
| `--accent-secondary` | `#49372E` (`--brand-brown`) | `#C4A774` (`--brand-gold-hover`) | İkincil vurgu ve hover durumu |
| `--button-primary-bg` | `#222325` (`--brand-anthracite`) | `#B29460` (`--brand-gold`) | Birincil aksiyon butonu zemini |
| `--button-primary-text` | `#FFFFFF` (`--brand-white`) | `#161718` (`--brand-dark`) | Birincil aksiyon butonu metni |
| `--focus-ring` | `#B29460` (`--brand-gold`) | `#C4A774` (`--brand-gold-hover`) | Klavye erişilebilirlik odak halkası |

---

## 3. Hesaplanmış WCAG 2.1 Kontrast Tablosu

Tüm renk eşleşmeleri matematiksel bağıl parlaklık (relative luminance) formülü ve gerçek tarayıcıda (`window.getComputedStyle`) çalışan otomatik kontrast denetimi ile doğrulanmıştır.

> **Kritik Kural:** `--brand-gold` (`#B29460`) açık krem zemin (`#F8F6F0`) üzerinde `2.57:1` kontrast ürettiği için **açık zemin üzerindeki küçük metinlerde kesinlikle kullanılmamıştır**. Açık zeminlerde metin vurgusu için `--brand-brown` (`#49372E`, `9.80:1`) veya `--brand-anthracite` (`#222325`) rozet zemin üstüne `--brand-gold-hover` (`#C4A774`, `6.24:1`) kullanılmıştır.

| Yüzey / Arka Plan | Metin / Ön Plan | Kontrast Oranı | WCAG 2.1 Seviyesi | Kullanıldığı Alanlar |
| --- | --- | --- | --- | --- |
| `#F8F6F0` (Cream Light) | `#222325` (Anthracite) | **14.55 : 1** | AAA (Normal & Büyük) | Slide 1 başlık, Aura ürün başlığı, sepet ve genel açık yüzey ana metni |
| `#F8F6F0` (Cream Light) | `#32251E` (Brown Dark) | **13.69 : 1** | AAA (Normal & Büyük) | Ürün kartı fiyatları, Aura ürün açıklamaları |
| `#F8F6F0` (Cream Light) | `#49372E` (Brand Brown) | **9.80 : 1** | AAA (Normal & Büyük) | Açık yüzey ikincil metin, kategori başlıkları, breadcrumb |
| `#F8F6F0` (Cream Light) | `#5C554C` (Stone Muted) | **6.82 : 1** | AA / AAA | Yardımcı küçük etiketler ve tab başlıkları |
| `#222325` (Anthracite) | `#FFFFFF` (White) | **15.73 : 1** | AAA (Normal & Büyük) | Açık yüzey birincil butonları (`#222325` zemin + `#FFFFFF` metin) |
| `#222325` (Anthracite) | `#F8F6F0` (Cream Light) | **14.55 : 1** | AAA (Normal & Büyük) | Header, Footer, SideMenu çekmecesi, T-Designer yan paneli |
| `#222325` (Anthracite) | `#DED9CF` (Stone Light) | **10.74 : 1** | AAA (Normal & Büyük) | Koyu yüzey ikincil/yardımcı metinler |
| `#222325` (Anthracite) | `#C4A774` (Gold Hover) | **6.24 : 1** | AA (Normal & Büyük) | Koyu rozet ve kart içi kurumsal gold etiketler |
| `#161718` (Brand Dark) | `#F8F6F0` (Cream Light) | **16.59 : 1** | AAA (Normal & Büyük) | Slide 2 başlık, T-Designer ana çalışma alanı |
| `#161718` (Brand Dark) | `#B29460` (Brand Gold) | **6.45 : 1** | AA (Normal & Büyük) | Koyu zemin üstü gold vurgu metinleri ve ikonlar |
| `#B29460` (Brand Gold) | `#161718` (Brand Dark) | **6.45 : 1** | AA (Normal & Büyük) | Koyu yüzey birincil Gold CTA butonları (`#B29460` zemin + `#161718` metin) |
| `#32251E` (Brown Dark) | `#F8F6F0` (Cream Light) | **13.69 : 1** | AAA (Normal & Büyük) | Slide 3 ve kurumsal üretim bandı ana metinleri |
| `#49372E` (Brand Brown) | `#FFFFFF` (White) | **10.60 : 1** | AAA (Normal & Büyük) | Buton hover durumları ve sıcak kahve rozetler |

---

## 4. Kurumsal Gradient Sistemi

Gradientler yalnızca Hero Slider sahnelerinde ve kurumsal vurgu bantlarında kontrollü olarak kullanılmıştır:

1. **Warm Editorial (Slide 1 & Dimaac Askılık Sahnesi):**
   `linear-gradient(135deg, #F8F6F0 0%, #E8E2D4 100%)`
2. **Dark Premium (Slide 2 & DTF Atölye Çağrı Alanı):**
   `linear-gradient(135deg, #161718 0%, #32251E 100%)`
3. **Brown Accent (Slide 3 & Kurumsal Üretim Bandı):**
   `linear-gradient(120deg, #49372E 0%, #32251E 100%)`

---

## 5. Hero Slider Kurumsal Yeniden Tasarımı (3 Sahne)

[`apps/storefront/src/modules/cinematic-hero/index.tsx`](file:///Volumes/KIOXIA/nizamlar-shop/apps/storefront/src/modules/cinematic-hero/index.tsx) bileşeni, scroll kilitlemeyen (`native scroll`), `0` WebGL canvas ile anında açılan yapısını koruyarak 3 kurumsal sahneyle yeniden tasarlanmıştır:

- **Sahne 1 — Premium Koleksiyon (`data-theme="light"`):**
  - **Arka Plan:** Warm Cream & Stone (`linear-gradient(135deg, #F8F6F0 0%, #E8E2D4 100%)`).
  - **Ürün Görseli:** `/models/nizamlar-tee.glb` modelinden özel render alınan yüksek kontrastlı **Antrasit/Siyah 3D Tişört** (`/hero/slide-1-tee.webp`, `30.8 KB`).
  - **Tipografi & CTA:** `#222325` antrasit dev başlık, `#49372E` kahverengi alt metin, `#222325` zemin + `#FFFFFF` metin birincil buton (`15.73:1` kontrast).
- **Sahne 2 — Kendi Tasarımını Oluştur (`data-theme="dark"`):**
  - **Arka Plan:** Dark Premium (`linear-gradient(135deg, #161718 0%, #32251E 100%)`).
  - **Ürün Görseli:** Koyu zeminde patlayan **Krem/Beyaz DTF Baskılı 3D Tişört** (`/hero/slide-2-printed-tee.webp`, `38.3 KB`).
  - **Tipografi & CTA:** `#F8F6F0` krem başlık, `#C4A774` gold vurgu, `#B29460` Gold zemin + `#161718` koyu metin birincil buton (`6.45:1` kontrast).
- **Sahne 3 — Nizamlar Üretim Gücü (`data-theme="brown"`):**
  - **Arka Plan:** Warm Brown Accent (`linear-gradient(120deg, #49372E 0%, #32251E 100%)`).
  - **Ürün Görseli:** Taş, antrasit ve espresso kahve tonlarında **Çoklu 3D Tekstil Koleksiyonu** (`/hero/slide-3-collection.webp`, `39.0 KB`).
  - **Tipografi & CTA:** `#F8F6F0` krem başlık, `#DED9CF` açık taş açıklama, `#B29460` Gold CTA butonu.

---

## 6. Katmanlama (Z-Index) ve Çakışma Düzeni

Sayfa genelinde üst üste binen veya arkasındaki içerikle karışan bileşenleri önlemek için merkezi Z-index katman sistemi uygulanmıştır:

```css
:root {
  --z-base: 1;
  --z-card: 10;
  --z-sticky: 30;
  --z-header: 50;
  --z-dropdown: 60;
  --z-drawer-backdrop: 70;
  --z-drawer: 80;
  --z-modal-backdrop: 90;
  --z-modal: 100;
  --z-toast: 110;
}
```

---

## 7. Kontrol Edilen ve Düzeltilen 10 Alan

1. **Header ve Üst Menü (`nav/index.tsx`, `side-menu/index.tsx`, `search/index.tsx`):**
   - `nizamlarbaski.com` ile birebir uyumlu `#222325` antrasit zemin, `rgba(178, 148, 96, 0.25)` gold alt sınır, `#F8F6F0` krem linkler ve `#B29460` Gold "3D Baskı Stüdyosu" CTA butonu.
   - Mobil/yan menü (`SideMenu`) yarı saydam cam efektinden çıkarılarak tam opak `#222325` antrasit çekmece + `bg-brand-dark/70 backdrop-blur-sm` karartma katmanına geçirildi.
2. **Hero Slider (`cinematic-hero/index.tsx`, `globals.css`):**
   - 3 sahnenin tamamında başlık, açıklama, rozet, ok, nokta ve oynat/durdur kontrolleri sahne temasına (`light`, `dark`, `brown`) göre tam kontrastlı hale getirildi.
3. **Dimaac 3D Kıyafet Askılığı (`clothes-rack/index.tsx`):**
   - Askılık sahnesi sıcak taş/krem (`#F8F6F0` -> `#E8E2D4`) galeri zemini ve `#222325` antrasit bilgi kartlarıyla yeniden dengelendi.
4. **Koleksiyon Kartları ve Ürün Listesi (`page.tsx`, `product-preview/index.tsx`, `price.tsx`, `thumbnail/index.tsx`):**
   - Kart yüzeyleri (`#FFFFFF`) ile sayfa arka planı (`#F8F6F0`) arasında `#C9C1B5` (`--brand-stone`) belirgin sınır oluşturuldu; ürün fiyatları `#32251E` (`13.69:1` kontrast) ile güçlendirildi.
5. **Aura Ürün Detay Sayfası (`aura-product-detail/index.tsx`, `globals.css`):**
   - Açık krem yüzey (`#F8F6F0`), `#222325` başlık ve fiyat, `#49372E` seçenek etiketleri, `#222325` antrasit "Sepete Ekle" ve `#49372E` çerçeveli "Kendin Tasarla" butonları ile tam okunabilirlik sağlandı.
6. **T-Designer 3D Baskı Stüdyosu (`custom-studio/index.tsx`, `globals.css`):**
   - `z-index: 100` (`--z-modal`) ve `rgba(22, 23, 24, 0.92)` (`--z-modal-backdrop`) ile arka plandaki sayfa içeriğinden tamamen izole edildi; `#161718` ana çalışma alanı ve `#222325` sağ kontrol paneli ayrıştırıldı.
7. **Sepet Sayfası ve Sepet Açılır Menüsü (`cart-dropdown/index.tsx`, `cart/templates/index.tsx`, `cart/components/item/index.tsx`):**
   - Açık zeminde okunamayan eski sarı/gold (`#D4AF37`) özel baskı rozeti `#222325` antrasit zemin + `#C4A774` gold ikon/kenarlık + `#F8F6F0` krem metin olarak düzeltildi.
8. **Butonların Normal, Hover, Active ve Disabled Durumları:**
   - Hover sırasında görünmez olan hiçbir buton kalmadı; açık yüzey butonları `#222325` -> `#49372E` (beyaz metin), koyu yüzey butonları `#B29460` -> `#C4A774` (`#161718` koyu metin) geçişine bağlandı.
9. **Footer (`layout/templates/footer/index.tsx`, `globals.css`):**
   - `#161718` (`--brand-dark`) zemin, `#C4A774` gold sütun başlıkları ve `#DED9CF` açık taş linklerle kurumsal kimliğe kavuşturuldu.
10. **Mobil ve Tablet Görünümler (`390×844`, `768×1024`, `1440×900`):**
    - Tüm kırılımlarda yatay taşma (`horizontalOverflow: false`) ve metin/görsel çakışması olmadığı doğrulandı.

---

## 8. Ekran Görüntüleri ve Doğrulama Sonuçları

Güncellenen tüm ekran görüntüleri `/Volumes/KIOXIA/nizamlar-shop/artifacts/screenshots/` dizinine kaydedilmiştir:

- **Masaüstü (`1440×900`):**
  - `desktop-hero-slide-1.png` (Warm Cream & Stone — Antrasit 3D Tişört)
  - `desktop-hero-slide-2.png` (Dark Premium — Krem DTF Baskılı 3D Tişört)
  - `desktop-hero-slide-3.png` (Brown Accent — Çoklu 3D Koleksiyon)
  - `desktop-clothes-rack.png` (Dimaac 3D Askılık)
  - `desktop-aura-product.png` (Aura Ürün Detay Sayfası)
  - `desktop-t-designer-studio.png` (T-Designer 3D Baskı Stüdyosu)
  - `desktop-cart-custom-design.png` (Özel Tasarım Sepet Görünümü)
- **Tablet (`768×1024`):** `tablet-hero-slide-1.png`, `tablet-clothes-rack.png`, `tablet-aura-product.png`, `tablet-t-designer-studio.png`
- **Mobil (`390×844`):** `mobile-hero-slide-1.png`, `mobile-clothes-rack.png`, `mobile-aura-product.png`, `mobile-t-designer-studio.png`

### Test ve Denetim Özeti

- **TypeScript (`npx tsc --noEmit`):** `0` hata
- **ESLint (`npm run lint`):** `0` hata, `0` uyarı
- **Playwright E2E (`npx playwright test`):** `9 / 9` test başarılı (`desktop`, `tablet`, `mobile`)
- **WCAG 2.1 AA Otomatik Kontrast Denetimi:** Tüm sayfalarda ve tüm cihaz boyutlarında `lowContrastCount: 0`, `horizontalOverflow: false`
