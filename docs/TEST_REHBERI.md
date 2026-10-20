# Test rehberi

Sınav Takvimi Sistemi'nin test sürümüne hoş geldiniz. Bu belge, rolünüze göre neleri denemenizi istediğimizi ve
sorunları nasıl bildireceğinizi anlatır.

## Giriş

- Adres: test için size iletilen adres (ör. `https://sinav-test.duzce.edu.tr`).
- Kullanıcı adınız ve geçici parolanız size ayrıca iletilir. Öğrenciler için kullanıcı adı **öğrenci
  numarasıdır**. E-posta adresinizle de giriş yapabilirsiniz.
- İlk girişte yeni bir parola belirlemeniz istenir (en az 8 karakter; büyük harf, küçük harf ve rakam içermeli).
- Aynı hesapla 5 kez yanlış parola girilirse hesap 15 dakika kilitlenir.

## Sorun bildirme

Sayfanın altındaki veya kullanıcı menüsündeki **Sorun bildir** bağlantısı, sayfa adresi ve sürüm bilgisi
doldurulmuş bir e-posta açar. Lütfen:

1. Ne yapmaya çalıştığınızı,
2. Ne olmasını beklediğinizi ve ne olduğunu,
3. Mümkünse ekran görüntüsünü

yazın. Teknik bilgiler bölümünü silmeyin.

## Rolünüze göre denenecekler

### Öğrenci

- [ ] İlk girişte parolanızı değiştirin.
- [ ] Ana sayfada **Yaklaşan sınavlarım** listesini kontrol edin: tarih, saat, derslik doğru mu?
- [ ] **Sınav Takvimi**: haftalık, aylık ve liste görünümleri; sadece kendi bölümünüzün sınavları görünmeli.
- [ ] **PDF rapor → Resmi sınav takvimi** indirin.
- [ ] Duyurular: açılır pencere çıktıysa "Okudum" deyin; tekrar girişte çıkmamalı.
- [ ] Telefonunuzdan da deneyin.

### Akademik personel

- [ ] Ana sayfada **Sınav görevlerim**: dersinizin sınavları ve gözetmenlik görevleriniz.
- [ ] Üstteki zil: size atanan sınav görevleri bildirim olarak gelmeli; tıklayınca takvime gitmeli.
- [ ] **Müsaitlik**: sınav görevi verilmemesini istediğiniz zamanları girin (tek sefer, her hafta, her ay;
      tüm gün veya saat aralığı). Takvimde ve listede doğru görünüyor mu?
- [ ] Sınav takviminde "Sadece benim sınavlarım" filtresi.
- [ ] Kullanıcı menüsü → **Parolamı değiştir**.

### Bölüm görevlisi

Akademik personelin denediklerine ek olarak:

- [ ] Tanımlar: bölümünüzün dersleri, derslikleri ve ders atamaları (varsayılan filtre kendi bölümünüz).
- [ ] **Sınav ekleme**: takvimde saat aralığı seçin veya "Yeni sınav". Ders, derslik(ler), gözetmen(ler) seçin.
      - Aynı saatte dolu derslik, başka sınavdaki gözetmen veya hocası başka sınavda olan ders için uyarı çıkmalı.
      - "Müsait değil" kaydı olan personel o saat için gözetmen seçilememeli.
- [ ] Sınavı sürükleyerek başka güne/saate taşıyın, süresini uzatın; çakışma varsa eski yerine dönmeli.
- [ ] Sınavı düzenleyin ve silin; ilgili hocaya ve gözetmenlere bildirim gitmeli.
- [ ] **Yönetim → Duyurular**: bölümünüze duyuru yayınlayın (açılır pencere seçeneğiyle de).
- [ ] PDF raporlar: resmi takvim, gözetmen görevlendirme, derslik kullanımı.

### Yönetici

- [ ] Ana sayfa özeti: sayılar, öğretim elemanı atanmamış ders uyarısı.
- [ ] Tanımlar ekranlarında **Excel'den aktar** (bkz. [VERI_GIRISI.md](VERI_GIRISI.md)).
- [ ] **Yönetim → Kullanıcılar**: arama ve filtreler, rol ekleme/kaldırma, parola sıfırlama, pasifleştirme.
- [ ] Öğrenci ekleme/düzenleme/pasifleştirme; pasif öğrencinin giriş yapamadığını doğrulayın.
- [ ] Bölüm görevlisi atama (Bölümler → satırı aç).
- [ ] Duyurular: farklı hedef kitleler (öğrenciler, personel, belirli bölüm) ve tarih aralıkları.

## Bilinen kısıtlar

- Oturum 4 saat sonra kapanır; tekrar giriş yapmanız gerekir.
- Pasifleştirilen veya parolası sıfırlanan bir hesabın açık oturumu, süresi dolana kadar (en fazla 4 saat)
  çalışmaya devam eder.
- Bildirimler dakikada bir yenilenir.
- Sınav saatleri Türkiye saatine göredir.
