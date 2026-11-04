# Nizamlar dört deneyim entegrasyonu

Kullanıcının ekli ayrıntılı şartnamesi ve doğrudan uygulama isteği yürütme kapsamıdır. Mevcut Next.js korunacak, ürün kaynağı yalnızca Medusa olacak. Tasarım kararları: koyu ve metinle çakışmayan beş sahneli hero, açık Aura düzeni, resmi mevcut askılık, ortak model ve güvenilir fiyat olmadığı durumda kaydetmeye açık fakat baskılı satın almaya kapalı stüdyo.

1. Denetim raporu, branch, gerçek tarayıcı hatalarının kaydı.
2. Yanlış registry adaptörünün gerçek ürün ID ve kind/colour ile düzeltilmesi. Boş katalog ve desteklenmeyen tekstil testi.
3. Tek, lisansı açık ve tekrar üretilebilir tişört GLB; ortak mesh, kumaş materyali ve 3D sahne. Responsive beş aşamalı scroll, baskı, kamera ve reduced-motion.
4. Aura: seçili varyantın model rengine bağlanması, gerçek seçenek/adet/stok/fiyat, hata/success durumu ve sticky satın alma.
5. Stüdyo: gerçek varyantı koruma, ön/arka ve logo transformlarını mm ile eşleme, önizleme ve tasarım kaydı. Doğrulanmamış baskı fiyatının normal ürün gibi sepete eklenmesini engelleme.
6. Backend mevcut dosya/kayıtlarını koruma; güvenilir olmayan fiyatı verified olarak sunmama. Yerel kayıt ve güvenlik kontrolleri.
7. 1440×900, 390×844, 768×1024 Playwright senaryoları, gerçek ekran görüntüleri; tsc, build, lint, uygun testler. Son raporda eksikleri açıkça belirtme.

Kontroller: boş katalog, geçersiz varyant, stok yokluğu, kare olmayan logo/taşma, WebGL ve reduced-motion, kaydetme hatası ve güvensiz fiyat. Her bileşen tarayıcıda çalışmadan sonraki aşamaya geçilmez.
