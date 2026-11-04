import { Client } from "pg"

export async function setupAdminTables() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://medusa:medusa_dev_password@localhost:5434/nizamlar_shop"

  const pg = new Client({ connectionString })
  await pg.connect()

  console.log("Creating Nizamlar Admin management tables...")

  // 1. site_settings
  await pg.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id VARCHAR(64) PRIMARY KEY,
      site_title VARCHAR(255) NOT NULL,
      tagline TEXT,
      announcement_text TEXT,
      announcement_link TEXT,
      contact_email VARCHAR(255),
      contact_phone VARCHAR(64),
      whatsapp_number VARCHAR(64),
      address TEXT,
      social_instagram VARCHAR(255),
      social_linkedin VARCHAR(255),
      footer_copyright TEXT,
      navigation_items JSONB DEFAULT '[]'::jsonb,
      footer_columns JSONB DEFAULT '[]'::jsonb,
      is_published BOOLEAN DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // 2. hero_slides
  await pg.query(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      id VARCHAR(64) PRIMARY KEY,
      rank INT NOT NULL DEFAULT 0,
      theme VARCHAR(32) NOT NULL DEFAULT 'light',
      eyebrow TEXT NOT NULL,
      title_line1 TEXT NOT NULL,
      title_line2 TEXT NOT NULL,
      subtitle TEXT NOT NULL,
      cta_label VARCHAR(128) NOT NULL,
      cta_href TEXT NOT NULL,
      secondary_label VARCHAR(128),
      secondary_href TEXT,
      image_url TEXT NOT NULL,
      image_alt TEXT NOT NULL,
      badges JSONB DEFAULT '[]'::jsonb,
      garment_tag VARCHAR(255),
      shirt_color VARCHAR(32) DEFAULT '#232528',
      shirt_rotation NUMERIC DEFAULT 0,
      model_3d_path TEXT DEFAULT '/models/nizamlar-tee.glb',
      is_active BOOLEAN DEFAULT true,
      is_published BOOLEAN DEFAULT true,
      autoplay_duration_ms INT DEFAULT 4400,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // 3. homepage_sections
  await pg.query(`
    CREATE TABLE IF NOT EXISTS homepage_sections (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      badge_text VARCHAR(128),
      title TEXT NOT NULL,
      subtitle TEXT,
      rank INT NOT NULL DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      is_published BOOLEAN DEFAULT true,
      config JSONB DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // 4. garment_display_config (Dimaac Clothes Rack)
  await pg.query(`
    CREATE TABLE IF NOT EXISTS garment_display_config (
      id VARCHAR(64) PRIMARY KEY,
      product_id VARCHAR(128),
      product_handle VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      garment_kind VARCHAR(64) NOT NULL DEFAULT 'tee',
      colour VARCHAR(32) NOT NULL DEFAULT '#232528',
      show_nizamlar_logo BOOLEAN DEFAULT true,
      logo_scale NUMERIC DEFAULT 0.22,
      logo_pos_x NUMERIC DEFAULT 0.35,
      logo_pos_y NUMERIC DEFAULT 0.58,
      logo_style VARCHAR(64) DEFAULT 'screenprint',
      model_3d_file TEXT DEFAULT '/models/nizamlar-tee.glb',
      rank INT NOT NULL DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      is_published BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // 5. customizer_settings (tshirt3d)
  await pg.query(`
    CREATE TABLE IF NOT EXISTS customizer_settings (
      id VARCHAR(64) PRIMARY KEY,
      section_title TEXT NOT NULL,
      section_subtitle TEXT NOT NULL,
      badge_text VARCHAR(128) NOT NULL,
      default_model_path TEXT NOT NULL DEFAULT '/models/nizamlar-tee.glb',
      default_shirt_color VARCHAR(32) NOT NULL DEFAULT '#202020',
      color_palette JSONB DEFAULT '["#202020","#F4F1EA","#DED9CF","#D4AF37","#2E382E","#3B2820"]'::jsonb,
      default_logo_url TEXT DEFAULT '/tshirt3d/nizamlar-logo-decal.png',
      default_full_url TEXT DEFAULT '/tshirt3d/nizamlar-full-pattern.png',
      logo_pos_x NUMERIC DEFAULT 0,
      logo_pos_y NUMERIC DEFAULT 0.04,
      logo_pos_z NUMERIC DEFAULT 0.15,
      logo_scale NUMERIC DEFAULT 0.15,
      max_file_size_mb INT DEFAULT 50,
      allowed_formats JSONB DEFAULT '["png","jpg","jpeg","webp","svg","pdf"]'::jsonb,
      cta_button_text VARCHAR(128) DEFAULT 'Tasarımını Sepete Ekle',
      secondary_button_text VARCHAR(128) DEFAULT '3D İncele',
      is_published BOOLEAN DEFAULT true,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // 6. site_media (Central Media Library)
  await pg.query(`
    CREATE TABLE IF NOT EXISTS site_media (
      id VARCHAR(64) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_url TEXT NOT NULL,
      file_type VARCHAR(64) NOT NULL,
      mime_type VARCHAR(128),
      file_size INT DEFAULT 0,
      category VARCHAR(64) DEFAULT 'product',
      is_public BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // SEED INITIAL DATA IF EMPTY
  console.log("Seeding initial data if empty...")

  // site_settings seed
  const settingsCount = await pg.query("SELECT COUNT(*) FROM site_settings WHERE id = 'default'")
  if (parseInt(settingsCount.rows[0].count) === 0) {
    await pg.query(`
      INSERT INTO site_settings (
        id, site_title, tagline, announcement_text, announcement_link,
        contact_email, contact_phone, whatsapp_number, address,
        social_instagram, social_linkedin, footer_copyright,
        navigation_items, footer_columns, is_published
      ) VALUES (
        'default',
        'Nizamlar Baskı & Tekstil',
        'DTF ve Serigrafi Baskı Teknolojisiyle Yüksek Kaliteli Tekstil Çözümleri',
        'Kurumsal ve Toplu Siparişlerde Özel İskonto Oranları İçin İletişime Geçin',
        '/store',
        'info@nizamlarbaski.com',
        '+90 (212) 555 01 23',
        '+90 (532) 555 01 23',
        'Tekstil İhtisas Organize Sanayi Bölgesi, İstanbul / Türkiye',
        'https://instagram.com/nizamlarbaski',
        'https://linkedin.com/company/nizamlarbaski',
        '© 2026 Nizamlar Baskı Tekstil San. ve Tic. Ltd. Şti. Tüm Hakları Saklıdır.',
        '[
          {"title": "Koleksiyon", "href": "/store"},
          {"title": "3D Stüdyo", "href": "/#tshirt3d-experience"},
          {"title": "Askılık", "href": "/#collection-rack"},
          {"title": "Baskı Çözümleri", "href": "/#print-services"},
          {"title": "Kurumsal", "href": "/#bulk-production"}
        ]'::jsonb,
        '[
          {"title": "Ürünler", "links": [
            {"title": "Oversize Tişörtler", "href": "/store"},
            {"title": "Kapüşonlu Sweatshirt", "href": "/store"},
            {"title": "Essential Kazaklar", "href": "/store"},
            {"title": "Kanvas Bez Çantalar", "href": "/store"}
          ]},
          {"title": "Baskı Teknolojileri", "links": [
            {"title": "Yüksek Çözünürlüklü DTF", "href": "/#print-services"},
            {"title": "Endüstriyel Serigrafi", "href": "/#print-services"},
            {"title": "Özel Nakış & Flok", "href": "/#print-services"}
          ]},
          {"title": "Kurumsal", "links": [
            {"title": "Hakkımızda", "href": "/about"},
            {"title": "Toplu Üretim", "href": "/#bulk-production"},
            {"title": "İletişim", "href": "/contact"}
          ]}
        ]'::jsonb,
        true
      );
    `)
  }

  // hero_slides seed
  const slidesCount = await pg.query("SELECT COUNT(*) FROM hero_slides")
  if (parseInt(slidesCount.rows[0].count) === 0) {
    await pg.query(`
      INSERT INTO hero_slides (
        id, rank, theme, eyebrow, title_line1, title_line2, subtitle,
        cta_label, cta_href, secondary_label, secondary_href,
        image_url, image_alt, badges, garment_tag, shirt_color,
        is_active, is_published, autoplay_duration_ms
      ) VALUES
      (
        'slide-1',
        0,
        'light',
        '01 / PREMİUM KOLEKSİYON · 240 GSM PENYE',
        'KENDİ TARZINI',
        'YANSIT.',
        'Premium tekstil ürünlerini keşfet. Tarzını Nizamlar Baskı kalitesiyle tamamla.',
        'Koleksiyonu Keşfet',
        '#collection-rack',
        'Tüm Koleksiyonu Gör',
        '/store',
        '/hero/slide-1-tee.webp',
        'Siyah Antrasit 240 GSM Premium Oversize Penye Tişört',
        '["240 GSM %100 Penye Pamuk", "Oversize Kalıp · Çift İğne Dikiş"]'::jsonb,
        'PREMIUM OVERSIZE TEE · ANTRASİT SİYAH',
        '#232528',
        true,
        true,
        4400
      ),
      (
        'slide-2',
        1,
        'dark',
        '02 / 3D DESIGN LAB · KENDİ TASARIMINI OLUŞTUR',
        'TASARLA.',
        'BİZ BASALIM.',
        'Kendi logonu yükle, ürününü özelleştir, baskını sipariş et.',
        'Tasarımını Oluştur',
        '/products/premium-oversize-penye-t-shirt?studio=1',
        '3D Deneyimi Başlat',
        '#tshirt3d-experience',
        '/hero/slide-2-printed-tee.webp',
        'Krem Beyaz Tişört Üzerinde Renkli Özel DTF Baskı Örneği',
        '["Yüksek Çözünürlüklü DTF & Serigrafi", "320 × 400 mm Ön & Arka Baskı Alanı"]'::jsonb,
        'CUSTOM PRINT LAB · KREM & RENKLİ DTF',
        '#F4F1EA',
        true,
        true,
        4400
      ),
      (
        'slide-3',
        2,
        'brown',
        '03 / NİZAMLAR ÜRETİM · PERAKENDE & KURUMSAL',
        'ÜRETİMDE',
        'NİZAMLAR KALİTESİ.',
        'Tek üründen toplu üretime, tekstil baskıda profesyonel çözümler.',
        'Ürünleri İncele',
        '/store',
        'Toplu Üretim & Kurumsal Sipariş',
        '#bulk-production',
        '/hero/slide-3-collection.webp',
        'Nizamlar Baskı Tişört, Sweatshirt ve Kurumsal Tekstil Koleksiyonu',
        '["Tişört · Sweatshirt · Hoodie · Bez Çanta", "1 Adetten Toplu Üretime Kalite Garantisi"]'::jsonb,
        'NİZAMLAR ATÖLYE · ÇOKLU TEKSTİL SERİSİ',
        '#32251E',
        true,
        true,
        4400
      );
    `)
  }

  // homepage_sections seed
  const sectionsCount = await pg.query("SELECT COUNT(*) FROM homepage_sections")
  if (parseInt(sectionsCount.rows[0].count) === 0) {
    await pg.query(`
      INSERT INTO homepage_sections (
        id, name, badge_text, title, subtitle, rank, is_active, is_published, config
      ) VALUES
      (
        'hero',
        'Hero Slider',
        'NİZAMLAR VİTRİN',
        'Ana Sayfa Hero Slider',
        'Dinamik 3 sahneli görsel slider',
        0,
        true,
        true,
        '{"autoplay": true, "speedMs": 4400}'::jsonb
      ),
      (
        'clothes_rack',
        'Dimaac Clothes Rack',
        '01 / İNTERAKTİF ASKILIK',
        'Tişört, Sweatshirt ve Kazak Koleksiyonu',
        'Askılıktaki ürünleri 360° döndürün, gerçek kumaş dokularını ve kurumsal Nizamlar logolarını inceleyin.',
        1,
        true,
        true,
        '{"showPedestal": true, "interactive": true}'::jsonb
      ),
      (
        'tshirt3d',
        '3D T-Shirt Studio',
        '02 / 3D TASARIM STÜDYOSU',
        'Kendi Tişörtünü Tasarla',
        'Logonu veya görselini yükle, 3D tişört üzerinde canlı konumlandır ve sipariş ver.',
        2,
        true,
        true,
        '{"showAiTab": true, "showPalette": true}'::jsonb
      ),
      (
        'popular_products',
        'Popüler Ürünler',
        '03 / SEÇKİN KATALOG',
        'En Çok Tercih Edilen Ürünler',
        'Yüksek gramajlı %100 pamuk penye tişörtler, sweatshirtler ve özel tekstil ürünleri.',
        3,
        true,
        true,
        '{"limit": 6}'::jsonb
      ),
      (
        'print_services',
        'Baskı Teknolojileri',
        '04 / ATÖLYE & TEKNOLOJİ',
        'Endüstriyel Tekstil Baskı Çözümleri',
        'DTF, Serigrafi ve Nakış teknolojilerimizle her kumaşa uygun kalıcı çözümler.',
        4,
        true,
        true,
        '{}'::jsonb
      );
    `)
  }

  // garment_display_config seed (Dimaac Clothes Rack)
  const garmentCount = await pg.query("SELECT COUNT(*) FROM garment_display_config")
  if (parseInt(garmentCount.rows[0].count) === 0) {
    await pg.query(`
      INSERT INTO garment_display_config (
        id, product_id, product_handle, name, garment_kind, colour,
        show_nizamlar_logo, logo_scale, logo_pos_x, logo_pos_y, logo_style,
        model_3d_file, rank, is_active, is_published
      ) VALUES
      (
        'rack-1',
        'prod_01M6GP9DMYQ1Z62JTV01V1BGT2',
        'premium-oversize-penye-t-shirt',
        'Nizamlar Premium Tişört · Beyaz',
        'tee',
        '#F4F1EA',
        true,
        0.22,
        0.35,
        0.58,
        'screenprint',
        '/models/nizamlar-tee.glb',
        0,
        true,
        true
      ),
      (
        'rack-2',
        'prod_01M6H8CQ4FYC5BEYG5NPJYHAS1',
        'nizamlar-signature-sweatshirt',
        'Nizamlar Signature Sweatshirt · Antrasit',
        'crewneck',
        '#232528',
        true,
        0.26,
        0.50,
        0.55,
        'puff',
        '/models/nizamlar-tee.glb',
        1,
        true,
        true
      ),
      (
        'rack-3',
        'prod_01M6H8CQ4FHKG97E9SM3Y05QFZ',
        'nizamlar-essential-kazak',
        'Nizamlar Essential Kazak · Taş Krem',
        'sweater',
        '#DED9CF',
        true,
        0.20,
        0.50,
        0.52,
        'embroidery',
        '/models/nizamlar-tee.glb',
        2,
        true,
        true
      ),
      (
        'rack-4',
        'prod_01M6GP9DMYEQV47FQGQ8Z09FB0',
        'ozel-baskili-kapusonlu-sweatshirt-hoodie',
        'Nizamlar Koyu Kahve Hoodie',
        'crewneck',
        '#3B2820',
        true,
        0.24,
        0.50,
        0.55,
        'screenprint',
        '/models/nizamlar-tee.glb',
        3,
        true,
        true
      );
    `)
  }

  // customizer_settings seed
  const customizerCount = await pg.query("SELECT COUNT(*) FROM customizer_settings WHERE id = 'default'")
  if (parseInt(customizerCount.rows[0].count) === 0) {
    await pg.query(`
      INSERT INTO customizer_settings (
        id, section_title, section_subtitle, badge_text,
        default_model_path, default_shirt_color, color_palette,
        default_logo_url, default_full_url, logo_pos_x, logo_pos_y, logo_pos_z, logo_scale,
        max_file_size_mb, allowed_formats, cta_button_text, secondary_button_text, is_published
      ) VALUES (
        'default',
        'Kendi Tarzını Oluştur. Gerçek 3D Önizlemeyle Sipariş Ver.',
        'Logonuzu veya illüstrasyonunuzu yükleyin, milimetre hassasiyetli baskı alanında ön ve arka yüzeye yerleştirin, kumaş rengini seçip anında sepete ekleyin.',
        'T-DESIGNER 3D STUDIO',
        '/models/nizamlar-tee.glb',
        '#202020',
        '["#202020", "#F4F1EA", "#DED9CF", "#D4AF37", "#2E382E", "#3B2820", "#1E2A38", "#4A3B32"]'::jsonb,
        '/tshirt3d/nizamlar-logo-decal.png',
        '/tshirt3d/nizamlar-full-pattern.png',
        0,
        0.04,
        0.15,
        0.15,
        50,
        '["png", "jpg", "jpeg", "webp", "svg", "pdf"]'::jsonb,
        'Tasarımı Sepete Ekle',
        '3D Modeli Döndür',
        true
      );
    `)
  }

  // site_media seed
  const mediaCount = await pg.query("SELECT COUNT(*) FROM site_media")
  if (parseInt(mediaCount.rows[0].count) === 0) {
    await pg.query(`
      INSERT INTO site_media (
        id, title, file_name, file_url, file_type, mime_type, file_size, category, is_public
      ) VALUES
      (
        'media-1',
        'Nizamlar Kurumsal Amblem Logo (SVG)',
        'nizamlar-logo.svg',
        '/brand/nizamlar-logo.svg',
        'logo',
        'image/svg+xml',
        14200,
        'logo',
        true
      ),
      (
        'media-2',
        'Hero Slide 1 Antrasit Penye Tişört',
        'slide-1-tee.webp',
        '/hero/slide-1-tee.webp',
        'image',
        'image/webp',
        245000,
        'slider',
        true
      ),
      (
        'media-3',
        'Hero Slide 2 DTF Baskılı Tişört',
        'slide-2-printed-tee.webp',
        '/hero/slide-2-printed-tee.webp',
        'image',
        'image/webp',
        228000,
        'slider',
        true
      ),
      (
        'media-4',
        'Hero Slide 3 Koleksiyon Görseli',
        'slide-3-collection.webp',
        '/hero/slide-3-collection.webp',
        'image',
        'image/webp',
        261000,
        'slider',
        true
      ),
      (
        'media-5',
        '3D Tişört GLB Modeli (Yüksek Doğruluk)',
        'nizamlar-tee.glb',
        '/models/nizamlar-tee.glb',
        '3d_model',
        'model/gltf-binary',
        4250000,
        'model3d',
        true
      ),
      (
        'media-6',
        'T-Shirt 3D Varsayılan Logo Decal',
        'nizamlar-logo-decal.png',
        '/tshirt3d/nizamlar-logo-decal.png',
        'logo',
        'image/png',
        84200,
        'logo',
        true
      ),
      (
        'media-7',
        'T-Shirt 3D Tam Desen (Full Texture Pattern)',
        'nizamlar-full-pattern.png',
        '/tshirt3d/nizamlar-full-pattern.png',
        'texture',
        'image/png',
        312000,
        'fabric',
        true
      );
    `)
  }

  await pg.end()
  console.log("Nizamlar Admin tables setup and seed completed successfully!")
}

setupAdminTables()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err)
    process.exit(1)
  })
