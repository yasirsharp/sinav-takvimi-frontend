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
- Sağ üstteki **?** düğmesi (veya hesap menüsündeki **Yardım merkezi**) **Yardım merkezi**ni açar. "sınav taşı", "parola
  sıfırla", "Excel", "müsait değilim" gibi yazarak özelliği bulun; açıklamasını okuyun ya da **Sayfaya git ve
  turu başlat** ile ekranına gidip adım adım görün. Sık sorulanlar da burada.
- Hesap menüsündeki **Tanıtım turunu başlat** genel turu yeniden açar. Yardım merkezindeki **Turları yeniden
  göster** tüm ekran turlarını ilk ziyaretteki gibi tekrar açılır yapar.

Turdaki bir açıklama ekranla uyuşmuyorsa veya bir özelliği yardımda bulamadıysanız bunu da sorun olarak bildirin.

## Sorun bildirme

Bir hata gördüğünüz anda, **o ekrandayken**:

- **Bilgisayarda:** **Alt + Shift + H** (Mac'te Option + Shift + H) tuşlarına basın,
- **veya** sol alttaki **böcek düğmesine** tıklayın,
- **Telefonda:** telefonu birkaç kez hızlıca **sallayın**. iPhone'da önce hesap menüsünden "Sallayınca hata bildir"i
  açmanız gerekir (telefon bir kez izin sorar).

Açılan pencerede o anki ekranın görüntüsü hazırdır. Şunları yazıp **Gönder**'e basın:

1. Ne yapmaya çalıştığınızı,
2. Ne olmasını beklediğinizi ve ne olduğunu.

Sayfa adresi, sürüm, tarayıcı ve son hata kayıtları otomatik eklenir; size bir bildirim numarası verilir.

Bir işlem hata mesajıyla sonuçlanırsa mesajın yanındaki **"Bu bir hata mı? Bildir"** bağlantısına tıklayın; pencere
mesajla önceden doldurulmuş açılır. Sayfa çökmeleri ve beklenmeyen sunucu hataları zaten kendiliğinden kaydedilir;
yine de ne yaptığınızı bir iki cümleyle bildirmeniz düzeltmeyi hızlandırır.
Görüntüde paylaşmak istemediğiniz bir bilgi varsa "Ekran görüntüsünü ekle" anahtarını kapatın. Parola alanları
görüntüye hiç girmez. Sayfanın altında yazan sürüm (ör. `v0.11.0 (a1b2c3d)`) hangi sürümü denediğinizi gösterir.

## Rolünüze göre denenecekler

Menü role göre sadedir; yalnızca işinize yarayan ekranlar görünür:

| Rol | Menü |
|---|---|
| Öğrenci | Ana Sayfa · Sınavlarım |
| Akademik personel | Ana Sayfa · Sınavlarım · Müsaitliğim · Taleplerim |
| Görevli personel | Ana Sayfa · Sınav Takvimi · Bölümüm |
| Bölüm görevlisi | Ana Sayfa · Sınav Takvimi · Talepler · Bölümüm · Duyurular |
| Yönetici | Ana Sayfa · Sınav Takvimi · Talepler · Tanımlar · Yönetim |

"Bölümüm" ve "Tanımlar" altında dersler, derslikler, personel, ders atamaları, öğrenciler ve müsaitlikler bulunur.

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
- [ ] **Sınavlarım**: yalnızca dersini verdiğiniz ve gözetmen olduğunuz sınavlar görünmeli; başka sınav görünmemeli.
- [ ] Bir sınava tıklayıp **Değişiklik iste** deyin: nedenini ve uygun gün/saati yazın. **Taleplerim**'de "Yanıt
      bekliyor" görünmeli. Görevli yanıtlayınca zile bildirim gelmeli.
- [ ] Üstteki zil: size atanan sınav görevleri bildirim olarak gelmeli; tıklayınca takvime gitmeli.
- [ ] **Müsaitliğim**: sınav görevi verilmemesini istediğiniz zamanları girin (tek sefer, her hafta, her ay;
      tüm gün veya saat aralığı). Takvimde ve listede doğru görünüyor mu?
- [ ] Kullanıcı menüsü → **Parolamı değiştir**.

### Görevli personel

- [ ] Ana sayfada atandığınız bölüm(ler)in özeti görünmeli. Bölüm atanmadıysanız "Size henüz bölüm atanmamış"
      uyarısı çıkmalı.
- [ ] **Sınav Takvimi** ve **Bölümüm** altındaki ekranlarda yalnızca atandığınız bölümlerin kayıtları görünmeli.
- [ ] Hiçbir ekranda ekle, düzenle veya sil düğmesi olmamalı.

### Bölüm görevlisi

Akademik personelin denediklerine ek olarak:

- [ ] Tanımlar: yalnızca bölümünüzün dersleri, derslikleri, ders atamaları ve öğrencileri görünmeli (ortak ders ve
      derslikler de görünür). Ortak veya başka bölümü de içeren satırlarda düzenle yerine **kilit** simgesi olmalı.
- [ ] Başka bölümün sınavını göremediğinizi kontrol edin. Gözetmen olduğunuz başka bölüm sınavı görünür ama
      taşınamaz.
- [ ] **Sınav ekleme**: takvimde saat aralığı seçin veya "Yeni sınav". Ders, derslik(ler), gözetmen(ler) seçin.
      - Aynı saatte dolu derslik, başka sınavdaki gözetmen veya hocası başka sınavda olan ders için uyarı çıkmalı.
      - "Müsait değil" kaydı olan personel o saat için gözetmen seçilememeli.
- [ ] Sınavı sürükleyerek başka güne/saate taşıyın, süresini uzatın; çakışma varsa eski yerine dönmeli.
- [ ] Sınavı düzenleyin ve silin; ilgili hocaya ve gözetmenlere bildirim gitmeli.
- [ ] **Talepler**: hocaların değişiklik isteklerini görün (menüdeki sayı bekleyenleri gösterir). **Sınavı aç** ile
      sınavı takvimde düzenleyin, sonra **Kabul et**. Reddederken gerekçe istenmeli. Hocaya bildirim gitmeli.
- [ ] **Duyurular**: bölümünüze duyuru yayınlayın (açılır pencere seçeneğiyle de).
- [ ] PDF raporlar: resmi takvim, gözetmen görevlendirme, derslik kullanımı.

### Yönetici

- [ ] Ana sayfa özeti: sayılar, öğretim elemanı atanmamış ders uyarısı.
- [ ] Tanımlar ekranlarında **Excel'den aktar** (bkz. [VERI_GIRISI.md](VERI_GIRISI.md)).
- [ ] **Yönetim → Kullanıcılar**: arama ve filtreler, rol ekleme/kaldırma, parola sıfırlama, pasifleştirme.
- [ ] Öğrenci ekleme/düzenleme/pasifleştirme; pasif öğrencinin giriş yapamadığını doğrulayın.
- [ ] Bölüm görevlisi atama (Bölümler → satırı aç).
- [ ] Görevli personele bölüm atama: Kullanıcılar → **Roller** → "Görevli Personel" işaretliyken altta bir veya
      birden çok bölüm seçin.
- [ ] Yalnızca **süper yönetici**: Kullanıcılar veya Akademik Personel satırında **⋯ → Bu kullanıcı olarak gir**.
      - Sistem o kişi girmiş gibi açılmalı; üstte turuncu "… olarak kullanıyorsunuz" şeridi görünmeli.
      - Menü o kişinin rolüne göre değişmeli; o kişinin işlemlerini yapabilmelisiniz.
      - **Kendi hesabıma dön** (şerit veya hesap menüsü → **Kullanıcı değiştir**) sizi parolasız geri getirmeli.
      - Kullanıcı değiştir menüsünde son girdiğiniz kişiler listelenmeli; tek tıkla geçebilmelisiniz.
      - Başka bir süper yöneticiye geçilememeli; kişi olarak girilmişken "Parolamı değiştir" görünmemeli.
- [ ] Duyurular: farklı hedef kitleler (öğrenciler, personel, belirli bölüm) ve tarih aralıkları.

## Bilinen kısıtlar

- Oturum 4 saat sonra kapanır; tekrar giriş yapmanız gerekir.
- Pasifleştirilen veya parolası sıfırlanan bir hesabın açık oturumu, süresi dolana kadar (en fazla 4 saat)
  çalışmaya devam eder.
- Bildirimler dakikada bir yenilenir.
- Sınav saatleri Türkiye saatine göredir.
