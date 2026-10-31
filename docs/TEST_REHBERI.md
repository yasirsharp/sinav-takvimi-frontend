# Test rehberi

Sınav Takvimi Sistemi'nin test sürümüne hoş geldiniz. Bu belge, rolünüze göre neleri denemenizi istediğimizi ve
sorunları nasıl bildireceğinizi anlatır.

## Giriş

- Adres: test için size iletilen adres (ör. `https://sinav-test.duzce.edu.tr`).
- Kullanıcı adınız ve geçici parolanız size ayrıca iletilir. Öğrenciler için kullanıcı adı **öğrenci
  numarasıdır**. E-posta adresinizle de giriş yapabilirsiniz.
- İlk girişte yeni bir parola belirlemeniz istenir (en az 8 karakter; büyük harf, küçük harf ve rakam içermeli).
- Aynı hesapla 5 kez yanlış parola girilirse hesap 15 dakika kilitlenir.

## Tanıtım turu ve yardım

Sistemi daha önce hiç kullanmadıysanız kimseye sormanıza gerek yok:

- **İlk girişte** (parolanızı değiştirdikten sonra) ana sayfada kısa bir **tanıtım turu** açılır. Menüyü,
  bildirimleri, hesap menüsünü ve ana sayfayı adım adım gösterir. "Turu kapat" veya çarpı ile istediğiniz an
  kapatabilirsiniz; kapatılan tur bir daha kendiliğinden açılmaz.
- Bir ekranı **ilk kez açtığınızda** o ekranın turu kendiliğinden başlar (ör. Sınav Takvimi: filtreler, yeni
  sınav, sürükleyerek taşıma, PDF raporlar).
- Sayfa başlığının yanındaki turkuaz **?** düğmesi o ekranın turunu istediğiniz zaman tekrar açar.
- Üst menüdeki **Yardım** (veya sağ üstteki **?** düğmesi) **Yardım merkezi**ni açar. "sınav taşı", "parola
  sıfırla", "Excel", "müsait değilim" gibi yazarak özelliği bulun; açıklamasını okuyun ya da **Sayfaya git ve
  turu başlat** ile ekranına gidip adım adım görün. Sık sorulanlar da burada.
- Hesap menüsündeki **Tanıtım turunu başlat** genel turu yeniden açar. Yardım merkezindeki **Turları yeniden
  göster** tüm ekran turlarını ilk ziyaretteki gibi tekrar açılır yapar.

Turdaki bir açıklama ekranla uyuşmuyorsa veya bir özelliği yardımda bulamadıysanız bunu da sorun olarak bildirin.

## Sorun bildirme

Bir hata gördüğünüz anda, **o ekrandayken**:

- **Bilgisayarda:** **Alt + Shift + H** (Mac'te Option + Shift + H) tuşlarına basın,
- **veya** sağ alttaki **böcek düğmesine** tıklayın,
- **Telefonda:** telefonu birkaç kez hızlıca **sallayın**. iPhone'da önce hesap menüsünden "Sallayınca hata bildir"i
  açmanız gerekir (telefon bir kez izin sorar).

Açılan pencerede o anki ekranın görüntüsü hazırdır. Şunları yazıp **Gönder**'e basın:

1. Ne yapmaya çalıştığınızı,
2. Ne olmasını beklediğinizi ve ne olduğunu.

Sayfa adresi, sürüm, tarayıcı ve son hata kayıtları otomatik eklenir; size bir bildirim numarası verilir.
Görüntüde paylaşmak istemediğiniz bir bilgi varsa "Ekran görüntüsünü ekle" anahtarını kapatın. Parola alanları
görüntüye hiç girmez. Sayfanın altında yazan sürüm (ör. `v0.11.0 (a1b2c3d)`) hangi sürümü denediğinizi gösterir.

## Rolünüze göre denenecekler

### Öğrenci

- [ ] İlk girişte parolanızı değiştirin, açılan tanıtım turunu sonuna kadar izleyin.
- [ ] Bir kez **Alt + Shift + H** (telefonda sallayarak) deneme amaçlı hata bildirimi gönderin.
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
