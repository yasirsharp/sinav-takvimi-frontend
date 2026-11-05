# Sunum rehberi: Sınav Takvimi Sistemi

Bu belge, sistemi yöneticilere tanıtmak için hazırlanan **demo verisini** ve yaklaşık 20 dakikalık bir tanıtım
akışını anlatır.

Demo verisindeki kişiler, öğrenciler ve e-posta adresleri **uydurmadır** (`@demo.duzce.edu.tr`).

## 1. Demo verisini kurma (bir kez)

1. Actions → **Test sitesine yükle** ile son sürümü yükleyin.
2. Sunucudaki `web.config` dosyasında `</environmentVariables>` satırının hemen üstüne iki satır ekleyin:

   ```xml
   <environmentVariable name="Seed__DemoData" value="true" />
   <environmentVariable name="Seed__DemoPassword" value="SUNUM_PAROLASI" />
   ```

   - `SUNUM_PAROLASI` en az 8 karakter olmalı.
   - Bütün demo hesapları bu parolayla giriş yapar ve parola değiştirmeleri istenmez.
3. Kaydedin; site yeniden başlar ve demo verisi birkaç saniyede kurulur. Logda şu satır görünür:
   `Demo verisi kuruldu: 4 bölüm, 12 derslik, 29 ders, 24 personel, 160 öğrenci, 43 sınav`.
4. Kurulduktan sonra `Seed__DemoData` satırını silebilirsiniz.
   - Silmezseniz de veri ikinci kez kurulmaz; "zaten kurulu" diye atlanır.
   - `Seed__DemoPassword` satırı sunumdan sonra da kalabilir; bu satır yalnızca kurulumda kullanılır.

> **Demo verisini bu sürümden önce kurduysanız** veri yeniden kurulmaz. İki şeyi elle yapın:
> - `fakulte.sekreteri`'nin bölümlerini seçin: Yönetim → Kullanıcılar → Roller → altta Bilgisayar ve
>   Elektrik-Elektronik.
> - Bekleyen bir talep için sunumdan önce `mehmet.demir` ile bir sınavda **Değişiklik iste** deyin.

Mevcut kayıtlarınız korunur. Aynı adlı bölüm, derslik ve dersler (ör. "Bilgisayar Mühendisliği", "BLM201")
yeniden kullanılır, yenileri eklenir.

## 2. Demo verisinde ne var?

| Ne | İçerik |
|---|---|
| Bölümler | Bilgisayar, Elektrik-Elektronik, İnşaat, Makine Mühendisliği |
| Derslikler | 12 derslik: bölümlere ait sınıflar, ortak AMFI-1 (150) ve AMFI-2 (120), BLM-LAB1, iki bölümün ortak kullandığı MF-B202 ve pasif MF-Z01 (tadilatta) |
| Dersler | 29 ders: her bölümden 5–7 ders, iki bölümde okutulan MUH201 ve 5 ortak ders (Matematik I, Fizik I, Türk Dili I, Atatürk İlkeleri I, İngilizce I) |
| Akademik personel | 24 kişi (Prof. Dr. → Arş. Gör.), her biri giriş yapabilir |
| Bölüm görevlileri | Her bölümde bir doçent bölüm görevlisi |
| Ders atamaları | 43 atama. **BLM403 ve EEM401 bilerek atanmadı**: ana sayfada ve Ders Atamaları ekranında uyarı görünür |
| Öğrenciler | 160 öğrenci (her bölüm, her sınıf 10 kişi); her 4. sınıftan biri pasif |
| Sınav takvimi | 43 ara sınav. Bu haftanın pazartesisinden başlayarak 3 hafta sürer; günde 4 oturum vardır |
| Gözetmenler | Görevler 24 kişiye 1–2 görev olarak dağıtıldı. **İki derslik bilerek gözetmensiz bırakıldı** (uyarı) |
| Müsaitlik | Haftalık ders saati, konferans günü, yıllık izin, aylık bölüm kurulu ve bir "müsaitim (tercih)" kaydı |
| Duyurular | 5 duyuru: girişte açılan takvim duyurusu, öğrencilere sınav kuralları, personele gözetmenlik ve acil klima duyurusu, yalnızca Bilgisayar Mühendisliği'ne lab bakımı |
| Bildirimler | Her hoca ve gözetmenin zilinde kendi sınav görevleri |

Sınav takvimi yerleştirilirken şu kurallar korunur, yani sistemin çakışma kontrolünü hiçbir sınav ihlal etmez:
- Aynı bölümün aynı oturumda iki sınavı olmaz.
- Bir bölümün bir günde en fazla 2 sınavı olur.
- Aynı derslik, hoca veya gözetmen aynı saatte iki yerde olmaz.
- "Müsait değil" işaretlenen saatlere gözetmen atanmaz.

## 3. Demo hesapları

Parola: hepsi için `web.config`'teki **`Seed__DemoPassword`**.

| Kullanıcı adı | Kim | Ne göstermek için |
|---|---|---|
| `demo.yonetici` | Yönetici | Her şey: tanımlar, kullanıcılar, duyurular, hata bildirimleri |
| `elif.kaya` | Doç. Dr., Bilgisayar Müh. **bölüm görevlisi** | Kendi bölümünün sınavlarını planlama, bölüme duyuru |
| `ayse.sahin` / `fatma.ozdemir` / `merve.dogan` | Diğer bölümlerin görevlileri | Aynı rol, farklı bölüm |
| `mehmet.demir` | Dr. Öğr. Üyesi (BLM) | Hoca görünümü: yalnızca kendi sınavları, bildirimler, bekleyen bir değişiklik talebi; her çarşamba 13–17 "müsait değil" |
| `okan.yavuz` | Matematik I'i 4 bölümde veren hoca | "Sadece benim sınavlarım" filtresi |
| `selin.aydin` | Arş. Gör. (BLM) | Konferans günü müsait değil; gözetmenlik görevleri |
| `fakulte.sekreteri` | Görevli personel (Bilgisayar ve Elektrik-Elektronik) | Yalnızca bu iki bölümün her şeyini görür, değiştiremez |
| `2025010101` | Bilgisayar Müh. 1. sınıf öğrencisi | Yalnızca kendi bölümünün sınavları; girişte duyuru |
| `2023020301` | Elektrik-Elektronik 3. sınıf öğrencisi | Farklı bölümün öğrencisi farklı takvim görür |
| `2022010410` | **Pasif** öğrenci | Giriş yapamaz |

Diğer hocalar `ad.soyad` biçimindedir (Türkçe karakter olmadan, ör. `ahmet.yilmaz`, `hasan.ozturk`).

Öğrenci numarası şöyle kurulur: giriş yılı + bölüm sırası (01 BLM, 02 EEM, 03 İNŞ, 04 MAK) + sınıf + sıra.
Örnek: `2024030205` = İnşaat, 2. sınıf, 5. öğrenci.

Sitede aynı kullanıcı adı önceden varsa sonuna rakam eklenir. Hesapları Yönetim → Kullanıcılar ekranından
kontrol edebilirsiniz.

## 4. Önerilen tanıtım akışı (~20 dk)

**1. Öğrenci gözüyle (2 dk).** `2025010101` ile girin.
- Girişte takvim duyurusu açılır.
- Ana sayfada yaklaşan sınavlar listelenir.
- Sınav Takvimi'nde yalnızca Bilgisayar Mühendisliği sınavları görünür.
- PDF rapor → Resmi sınav takvimi indirilir.
- Telefonda aynı ekranı açarsanız liste görünümüyle başlar.

**2. Hoca gözüyle (3 dk).** `mehmet.demir` ile girin.
- Menü sade: Ana Sayfa · Sınavlarım · Müsaitliğim · Taleplerim.
- Ana sayfada "Sınav görevlerim": dersinin sınavı ve gözetmenlik görevleri.
- Sınavlarım: yalnızca dersini verdiği ve gözetmen olduğu sınavlar. Bir sınava tıklayıp **Değişiklik iste** deyin.
- Taleplerim: demo verisindeki bekleyen talep ve az önce açtığınız talep.
- Zil: görev bildirimleri.
- Müsaitliğim: her çarşamba 13–17 kaydı. Takvimde bir gün seçip yeni bir "müsait değilim" kaydı ekleyin.

**3. Bölüm görevlisi (5 dk).** `elif.kaya` ile girin.
- Ana sayfa: uyarılar (atanmamış BLM403, gözetmeni eksik derslik).
- Sınav Takvimi:
  - Boş bir saat aralığını seçip yeni sınav ekleyin.
  - Bir sınavı sürükleyip başka saate taşıyın.
  - Dolu bir dersliğe ya da hocanın başka sınavı olan saate taşımayı deneyin. Sistem çakışmayı yakalar ve sınavı eski yerine döndürür.
  - Çarşamba 13:30'a yeni bir sınav koyup gözetmen olarak Mehmet Demir'i seçin; "müsait değil" uyarısı çıkar.
  - **Bölüm izolasyonu:** takvimde yalnızca Bilgisayar Mühendisliği sınavları (ve Elif Kaya'nın gözetmen olduğu
    sınavlar) görünür. Dersler ve Derslikler'de ortak kayıtların (ör. MAT101, AMFI-1) yanında kilit vardır; bunları
    yalnızca yönetici değiştirir. Öğrenciler ekranında yalnızca kendi bölümünün öğrencileri listelenir.
- **Talepler** (menüde sayı): Mehmet Demir'in talebini açın, **Sınavı aç** ile sınavı taşıyın, **Kabul et** deyin.
  Mehmet Demir'e bildirim gider.
- PDF rapor → Gözetmen görevlendirme.

**4. Yönetici (5 dk).** `demo.yonetici` ile girin.
- Tanımlar → **Excel'den aktar** ile canlı veri girişi (bkz. bölüm 5).
- Kullanıcılar: rol verme, parola sıfırlama (geçici parola bir kez gösterilir), pasifleştirme.
- Duyurular: hedef kitle + bölüm, açılır pencere.
- Görevli personelin bölümleri: Kullanıcılar → `fakulte.sekreteri` → Roller. Altta seçili bölümler görünür.

**Süper yönetici: kullanıcı olarak gir (2 dk).** Süper yönetici hesabıyla girin (demo verisinde yoktur; sitenin
ilk yöneticisi süper yöneticidir).
- Kullanıcılar'da `elif.kaya` satırında **⋯ → Bu kullanıcı olarak gir**. Sistem Elif Kaya girmiş gibi açılır:
  bölüm görevlisi menüsü, yalnızca Bilgisayar Mühendisliği. Üstte turuncu şerit görünür.
- Elif Kaya olarak bir işlem yapın (ör. talebi yanıtlayın).
- Hesap menüsü → **Kullanıcı değiştir → Kendi hesabıma dön**. Aynı menüde Elif Kaya artık "son kullanılanlar"
  arasındadır; tek tıkla tekrar geçebilirsiniz.
- Yapılan değişiklikler sunucu logunda "Kişi olarak işlem: (süper yönetici) → Elif Kaya" diye görünür.

**5. Destek araçları (3 dk).**
- **Tanıtım turu:** hesap menüsü → "Tanıtım turunu başlat". Her sayfa başlığında **?** düğmesi var.
- **Yardım merkezi:** ör. "parola sıfırla" diye arayın.
- **Hata bildirimi:** herhangi bir ekranda **Alt + Shift + H** (telefonda sallama). Ekran görüntüsü otomatik eklenir. Yönetim → Hata bildirimleri ekranında görünür ve e-postayla gelir.

## 5. Canlı Excel içe aktarma (`sunum-excel/` klasörü)

Yeni bir "Endüstri Mühendisliği" bölümünü sıfırdan kurar. `demo.yonetici` ile dosyaları **bu sırayla**, her
ekranın **Excel'den aktar** düğmesiyle yükleyin.

Her dosyada önizlemenin hatalı satırı nasıl yakaladığını göstermek için **bilerek yanlış bir satır** var. Hatalı
satır aktarılmaz, diğerleri eklenir.

| Dosya | Ekran | Sonuç | Bilerek hatalı satır |
|---|---|---|---|
| `1-bolumler.xlsx` | Bölümler | 1 eklenir | "Bilgisayar Mühendisliği" zaten kayıtlı |
| `2-derslikler.xlsx` | Derslikler | 2 eklenir | END-LAB: kapasite "kırk" yazılmış |
| `3-dersler.xlsx` | Dersler | 5 eklenir | BLM201 zaten kayıtlı |
| `4-akademik-personel.xlsx` | Akademik Personel | 4 eklenir, **kullanıcı adı ve geçici parolalar gösterilir** | Unvanı boş satır |
| `5-ders-atamalari.xlsx` | Ders Atamaları | 6 eklenir (ortak TDL101 dahil) | XYZ999 diye bir ders yok |
| `6-ogrenciler.xlsx` | Öğrenciler | 20 eklenir, hesaplar açılır | Bölüm "Tıp Fakültesi" sistemde yok |

Sonuç ekranındaki **Sonuç dosyasını indir (CSV)** düğmesi, eklenen kişilerin geçici parolalarını içerir.

Bu paketi bir kez yükleyebilirsiniz. İkinci kez yüklerseniz kayıtlar "zaten kayıtlı" diye reddedilir; bu da ayrıca
gösterilebilir.

## 6. Sunumdan sonra

- Demo verisini silmenin otomatik bir yolu yoktur.
- Gerçek kullanıma geçerken sitenin veritabanını sıfırlayın: phpMyAdmin'de tüm tabloları silip siteyi yeniden başlatın. Şema ve ilk yönetici yeniden kurulur.
- `Seed__DemoData` satırının silinmiş olduğundan emin olun.
