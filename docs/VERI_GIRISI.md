# Veri girişi (ilk kurulum)

Sistem boş bir veritabanıyla açılır. Sınav planlamaya başlamadan önce tanımlar **aşağıdaki sırayla** girilmelidir;
her adım bir öncekinin verisini kullanır. Ana sayfadaki "Kurulum adımları" kartı hangi adımda olduğunuzu gösterir.

Her ekranda **Excel'den aktar** düğmesi vardır: şablonu indirin, doldurun, yükleyin. Önizlemede hatalı satırlar
kırmızı işaretlenir ve aktarılmaz; düzeltip aynı dosyayı tekrar yükleyebilirsiniz (zaten eklenmiş satırlar
"zaten kayıtlı" olarak atlanır).

| # | Ekran | Şablon sütunları | Notlar |
|---|---|---|---|
| 1 | Tanımlar → Bölümler | Bölüm adı | Ad benzersizdir. |
| 2 | Tanımlar → Derslikler | Derslik adı, Kapasite, Ortak derslik, Bölümler | Kapasite sınav düzenindeki öğrenci sayısıdır. Ortak derslik (Evet) tüm bölümlerce kullanılır; değilse bölüm adlarını virgülle yazın. |
| 3 | Tanımlar → Dersler | Ders kodu, Ders adı, Ortak ders, Bölümler | Kod büyük harf + rakam (ör. `BLM201`; "blm 201" yazılırsa düzeltilir). Ortak ders (ör. Türk Dili) her bölümde verilebilir. |
| 4 | Tanımlar → Akademik Personel | Unvan, Ad Soyad, E-posta | Her personele hesap açılır. E-posta verilirse kullanıcı adı e-postanın @ öncesidir. |
| 5 | Tanımlar → Bölümler → (satırı aç) Görevliler | — | Bölüm görevlilerini atayın (kişiye "Bölüm Görevlisi" rolü verilir). Elle yapılır. |
| 6 | Tanımlar → Ders Atamaları | Ders kodu, Bölüm, Öğretim elemanı | Dersi o bölümde kimin verdiği. Öğretim elemanı ad soyadla eşleşir (unvan yazılabilir). **Ataması olmayan dersin sınavı eklenemez.** |
| 7 | Tanımlar → Öğrenciler | Öğrenci No, Ad, Soyad, Bölüm, Sınıf, E-posta | Kullanıcı adı öğrenci numarasıdır. E-posta boşsa `<no>@ogr.duzce.edu.tr`. |
| 8 | Sınav Takvimi | — | Sınavlar takvimden eklenir (saat aralığı seçerek veya "Yeni sınav"). |

Bölüm adları dosyalarda sistemdekiyle aynı yazılmalıdır (büyük/küçük harf ve ı/i farkı önemli değildir).

## Hesaplar ve geçici parolalar

- Personel ve öğrenci aktarımının **sonuç dosyası kullanıcı adlarını ve geçici parolaları içerir.** Bu bilgiler
  bir daha gösterilmez; dosyayı indirip güvenli bir yerde saklayın, parolaları kişilere ilettikten sonra silin.
- Geçici parolayla giren herkes önce kendi parolasını belirler (en az 8 karakter, büyük harf, küçük harf, rakam).
- Parolasını unutan kullanıcı için: Yönetim → Kullanıcılar → anahtar simgesi (parola sıfırla).

## Excel ipuçları

- `.xlsx` veya `.csv` yükleyin. Eski `.xls` dosyalarını Excel'de **Farklı kaydet → Excel Çalışma Kitabı (.xlsx)**
  ile dönüştürün.
- İlk satır sütun başlıkları olmalı; fazladan sütunlar yok sayılır.
- Öğrenci numaraları Excel'de sayı olarak saklanabilir; sorun değildir.
