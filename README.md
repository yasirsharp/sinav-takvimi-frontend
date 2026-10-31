# Sınav Takvimi — Frontend

Düzce Üniversitesi Sınav Takvimi sisteminin web arayüzü.
Backend: [yasirsharp/Backend](https://github.com/yasirsharp/Backend) (ASP.NET Core 8 Web API).

**Teknolojiler:** React 19, TypeScript, Vite, Ant Design 6, React Router 7, TanStack Query, Axios.

## Kurulum

```bash
npm install
npm run dev          # http://localhost:5173
```

Geliştirmede `/api` istekleri Vite proxy ile `http://localhost:8081` adresindeki backend'e gider, bu yüzden
CORS ayarı gerekmez. Farklı bir adres için `.env.example` dosyasını `.env` olarak kopyalayıp
`VITE_DEV_API_PROXY_TARGET` değerini değiştirin.

Backend'in açılması için JWT anahtarının tanımlı olması gerekir (Backend README'sine bakın):

```bash
cd ../Backend/API
dotnet user-secrets set "TokenOptions:SecurityKey" "<en az 64 karakter rastgele değer>"
dotnet run
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Tip kontrolü + production build (`dist/`) |
| `npm run lint` | oxlint |
| `npm test` | Vitest birim testleri |
| `npm run test:e2e` | Playwright uçtan uca testleri — gerçek backend + boş test veritabanı gerekir ([e2e/README.md](e2e/README.md)) |

CI (`.github/workflows/ci.yml`): lint, tip kontrolü, build ve birim testleri.

## Belgeler

- [docs/TEST_REHBERI.md](docs/TEST_REHBERI.md): test kullanıcıları için rol bazında senaryolar ve sorun bildirme
- [docs/VERI_GIRISI.md](docs/VERI_GIRISI.md): ilk kurulumda veri giriş sırası ve Excel şablonları
- Sunucu kurulumu (IIS, veritabanı, ayarlar): backend reposunda `docs/KURULUM.md`

## Production

Önerilen kurulum: frontend backend'in `scripts/publish.ps1` betiğiyle derlenip API'nin `wwwroot` klasörüne konur
ve API ile aynı adresten sunulur (bkz. backend `docs/KURULUM.md`). Bu durumda `VITE_API_BASE_URL` boş kalır.
Test dönemi için `VITE_FEEDBACK_EMAIL` ile "Sorun bildir" adresi verilebilir.

Frontend ayrı bir sunucudan yayınlanacaksa build alırken `VITE_API_BASE_URL` ile backend adresi verilir:

```bash
VITE_API_BASE_URL=https://api.sinav.duzce.edu.tr npm run build
```

- Frontend'in adresi, backend'deki `Cors:AllowedOrigins` listesine eklenmelidir.
- `VITE_API_BASE_URL` boş bırakılırsa frontend ve API aynı alan adından sunulmalıdır (örneğin reverse proxy ile `/api` → backend).
- Uygulama tek sayfalık (SPA) olduğu için web sunucusu bilinmeyen tüm yolları `index.html`'e yönlendirmelidir.

## Yapı

```
src/
  api/        axios istemcisi (Bearer token, 401'de otomatik çıkış), hata mesajları,
              unwrap (success=false → hata) ve kaynak başına tipli API modülleri
  auth/       token saklama, JWT çözme, roller, AuthProvider, ProtectedRoute
  components/ PageHeader, TableToolbar, BolumSelect, DeleteButton (onaylı silme)
  features/   ekranlar: bolum, ders, derslik, akademikPersonel, dbap, sinav (sayfa + React Query hook'ları)
  hooks/      useCan (rol kontrolü), useDefaultBolumFilter
  layout/     ana iskelet, navigation.tsx (menü/rota tanımları), lazyPages.ts (kod bölme)
  pages/      Login, Ana Sayfa, Yardım merkezi, 403, 404, "yakında" sayfası
  tour/       tanıtım turları: tur kaydı (tours.ts), TourProvider, "?" düğmesi
  utils/      Türkçe arama/sıralama, ders kodu normalizasyonu, geçici parola ayrıştırma
```

### Tanım ekranları

| Ekran | Görüntüleme | Ekle / düzenle / sil | Notlar |
|---|---|---|---|
| Bölümler | Personel | Yonetici | Satır genişletilince bölüm görevlileri listelenir; görevli atamak kişiye otomatik olarak `bolum.gorevlisi` rolü verir |
| Dersler | Personel | Planlayici | Ders kodu büyük harfe çevrilir ve benzersizliği yazarken kontrol edilir; ortak derslerin bölümü yoktur |
| Derslikler | Personel | Planlayici | Kapasite, ortak derslik ve aktif/pasif durumu |
| Akademik Personel | Personel | Yonetici | Eklenen personel için oluşturulan kullanıcı adı ve geçici parola bir kez gösterilir |
| Ders Atamaları | Personel | Planlayici | Hangi dersi hangi bölümde kimin verdiği (DBAP). Ders listesi seçilen bölümün dersleri + ortak derslerle sınırlıdır; aynı atama tekrar eklenemez; öğretim elemanı atanmamış dersler uyarıyla listelenir (bu derslerin sınavı eklenemez) |
| Öğrenciler | Personel | Yonetici | Bölüm ve sınıf filtresi. Eklenen öğrenci için kullanıcı hesabı açılır (kullanıcı adı öğrenci no) ve geçici parola bir kez gösterilir. Pasifleştirilen öğrenci giriş yapamaz |

- Listeler tek seferde alınır; arama, sıralama ve sayfalama tarayıcıda yapılır. Arama Türkçe harflere duyarlıdır
  ve ı/i farkını yok sayar (ör. "ins" → `INS101`, "inş" → "İnşaat").
- Bölüm görevlisi, Ders ve Derslik sayfalarını kendi bölümleriyle filtrelenmiş olarak açar (filtre değiştirilebilir).
- Yetkisi olmayan kullanıcı ekleme/düzenleme/silme düğmelerini görmez; asıl kontrol backend'dedir.
- Silinemeyen kayıtlarda (ör. ilişkili ders-bölüm-personel eşleştirmesi) backend'in mesajı olduğu gibi gösterilir.

### Excel'den içe aktarma

Bölümler, Derslikler, Dersler, Akademik Personel, Ders Atamaları ve Öğrenciler sayfalarında **Excel'den aktar**
(sadece ekleme yetkisi olanlara):

1. **Dosya:** Excel (.xlsx) veya CSV şablonu indirilir. Sütun başlıkları büyük/küçük harf ve Türkçe karakter
   farkı gözetmeden eşleşir; fazla sütunlar yok sayılır.
2. **Önizleme:** her satır doğrulanır. Boş/yanlış alanlar, sistemde zaten kayıtlı olanlar (bölüm adı, derslik
   adı, ders kodu, öğrenci no, aynı atama), bulunamayan bölüm/ders/personel ve dosyada tekrar eden satırlar
   işaretlenir. Hatalı satırlar aktarılmaz.
3. **Sonuç:** satır satır sonuç ve CSV olarak indirilebilen rapor. Personel ve öğrencide rapor kullanıcı adlarını
   ve **geçici parolaları** içerir; bu bilgiler bir daha gösterilmez.

Öğrenci ve personel backend'in toplu uçlarıyla (200'er satırlık parçalar), diğerleri satır satır kaydedilir.
Excel/CSV kütüphaneleri (read-excel-file, write-excel-file, papaparse; MIT) sadece sihirbaz kullanılınca indirilir.
Önerilen veri giriş sırası: bölümler → derslikler → dersler → akademik personel → ders atamaları → öğrenciler.

### Yönetim

- **Kullanıcılar** (Yonetici): ad, kullanıcı adı veya e-postayla arama; rol ve durum filtresi; düzenleme,
  aktif/pasif, rol ekleme/kaldırma (değişiklik hemen kaydedilir), parola sıfırlama (geçici parola bir kez
  gösterilir) ve silme. Süper yönetici hesaplarını yalnızca süper yönetici değiştirebilir. Kişi kendi hesabını
  pasifleştiremez, silemez ve kendi yönetici rolünü kaldıramaz. Rol açıklamaları "Roller hakkında" panelindedir.
- **Duyurular** (Planlayici): başlık, içerik, tür, öncelik, hedef kitle (herkes/öğrenciler/personel/yöneticiler),
  hedef bölüm, yayın ve bitiş tarihi, açılır pencere. Bölüm görevlisi sadece kendi bölümlerine duyuru yayınlar.

### Sınav takvimi

`/sinav-takvimi` — FullCalendar 6 (MIT lisanslı `daygrid`, `timegrid`, `list`, `interaction` eklentileri) ile:

- **Görünümler:** Hafta (08:00–22:00 saat ızgarası), Ay ve Liste. Telefonda liste görünümüyle açılır.
- **Filtreler:** bölüm (bölüm görevlisi için varsayılan kendi bölümleri), derslik, "Sadece benim sınavlarım"
  (dersini verdiğim veya gözetmen olduğum). Öğrenciler yalnızca kendi bölümlerinin sınavlarını görür.
- Sınavlar bölüme göre renklenir; tıklayınca derslik, kapasite ve gözetmen bilgileri açılır.
- **Planlama (Planlayici):** "Yeni sınav" veya takvimde saat aralığı seçerek ekleme; düzenleme, silme;
  sınavı sürükleyerek başka gün/saate taşıma veya süresini uzatma (çakışma varsa backend reddeder, sınav eski
  yerine döner).
- **Sınav formu:** bölüm → ders ataması (dersi veren öğretim elemanıyla), tarih, saat aralığı, birden fazla
  derslik ve her derslik için gözetmen. Toplam kapasite gösterilir. Aynı gündeki sınavlara göre **canlı çakışma
  uyarısı** verir (derslik dolu, gözetmen başka sınavda, dersin öğretim elemanı başka sınavda). Müsaitlik
  takviminde o saatte müsait olmadığını bildiren personel gözetmen olarak seçilemez.
- **PDF raporlar:** resmi sınav takvimi, gözetmen görevlendirme ve derslik kullanımı; görünen tarih aralığı
  ve seçili bölümler için backend'den indirilir. Öğrenciler sadece kendi bölümlerinin resmi takvimini indirebilir.
- Öğrenciler sınavları `/api/SinavDetay/daterange-bolum` ucundan alır (bölüm backend'de token'dan belirlenir).

### Müsaitlik

`/musaitlik` (Personel): akademik personel kendi kayıtlarını, planlayıcılar seçtikleri personelin kayıtlarını
yönetir. Hesabına bağlı personel kaydı olmayan kullanıcıya açıklama gösterilir.

- Ay/hafta takvimi ve liste görünümü; listede toplu silme. Takvimde gün veya saat aralığı seçerek kayıt açılır.
- Kayıt: müsait değil / müsait (tercih), tek sefer / her hafta / her ay, tarih aralığı (tekrarlarda bitiş
  boşsa süresiz), tüm gün veya saat aralığı, neden ve açıklama.
- Tekrarlar takvimde istemcide açılır (`musaitlikUtils.ts`); kurallar backend'deki `TarihGecerliMi` ile aynıdır
  (haftalıkta başlangıç gününün haftanın günü, aylıkta ayın günü; ay kısaysa ayın son günü).
- "Müsait değil" kaydı olan personel, sınav formunda o saat için gözetmen seçilemez. Sınav formunda müsaitlik
  takvimine bağlantı vardır.

### Tema

Görünüm [duzce.edu.tr](https://www.duzce.edu.tr/) ile uyumludur. Renkler sitenin ekran görüntüsünden ve logodan
ölçülmüştür; tüm değerler `src/theme.ts` içindedir:

| Renk | Değer | Kullanım |
|---|---|---|
| Lacivert | `#003366` | Logo yazısı, menü metni, menü altı kalın çizgi, birincil düğmeler, alt bilgi |
| Turkuaz | `#33cccc` | Logodaki kanat, üst bandın başlangıcı, vurgular |
| Mavi | `#208fc7` → `#166fc7` | Üst bandın geçişi, menüde seçili/üzerine gelinen öğe |
| Gri | `#bbbbbb` / `#77716a` | Logo altı ayırıcı çizgi / italik slogan |

Yazı tipi **Raleway**'dir (`@fontsource/raleway` ile pakete gömülü; Google Fonts'a istek atılmaz).
Düzen sitedeki gibidir: alt köşeleri yuvarlak turkuaz→mavi üst bant, logo ve italik slogan,
"İLETİŞİM" düğmesi gibi gri çerçeveli yuvarlak kullanıcı düğmesi, ince gri ayırıcı, büyük harfli lacivert
ana menü ve altında kalın lacivert çizgi. Mobilde menü soldan açılan panele dönüşür.

Logo dosyaları `src/assets/` altındadır (`duzce-logo.png`, amblem: `duzce-mark.png`, favicon: `public/favicon.png`).

### Roller

`src/auth/roles.ts`, backend'deki `Business/Constants/Roles.cs` ile aynı tutulmalıdır:

| Grup | Roller | Görebildiği menüler |
|---|---|---|
| (herkes) | Giriş yapmış her kullanıcı | Ana Sayfa, Sınav Takvimi |
| `Personel` | Planlayici + gorevli.personel + akademik.personel | Tanımlar, Müsaitlik |
| `Planlayici` | Yonetici + bolum.gorevlisi | Sınav/ders düzenleme (sonraki aşama) |
| `Yonetici` | super.admin, Admin | Yönetim |

Yeni bir ekran eklemek için `src/layout/navigation.tsx` dosyasına öğe eklemek yeterlidir; menü ve rota oradan üretilir.
Menüdeki rol kontrolü sadece kullanıcı deneyimi içindir; asıl yetki kontrolü backend'de yapılır.

### Parola

- Yöneticinin açtığı hesaplar ve parolası sıfırlanan hesaplar geçici parolayla gelir (token'da `pwd_change`).
  Bu kullanıcı hangi sayfayı açarsa açsın `/parola-degistir` sayfasına yönlendirilir; menü gizlenir, sadece
  çıkış yapabilir. Backend de parola değişene kadar diğer API isteklerini 403 ile reddeder.
- Parola kuralı backend ile aynıdır (`src/utils/passwordPolicy.ts`): en az 8 karakter, büyük harf, küçük harf,
  rakam. Kurallar yazarken tek tek işaretlenir.
- Herkes kullanıcı menüsündeki **Parolamı değiştir** ile parolasını değiştirebilir. Başarılı değişiklikte
  backend yeni bir token döner.

### Ana sayfa, bildirimler, duyurular

- **Ana sayfa role göre değişir:**
  - Öğrenci: bölümünün önümüzdeki 30 gündeki sınavları (gün gün, "Bugün/Yarın" işaretli).
  - Akademik personel: 14 gün içinde dersini verdiği ve gözetmen olduğu sınavlar, müsaitlik kısayolu.
  - Planlayıcı/yönetici: kurulum adımları (tanımlar boşsa), sayılar, öğretim elemanı atanmamış ders ve
    gözetmensiz derslik uyarıları; personel kaydı yoksa yaklaşan tüm sınavlar.
  - Herkes: kendisine yönelik yayındaki duyurular.
- **Bildirim zili:** okunmamış sayısı, son 20 bildirim, tıklayınca ilgili sayfaya gider ve okundu sayılır,
  "Tümünü okundu say". 60 saniyede bir yenilenir. Backend sınav ekleme/değişiklik/iptalinde öğretim elemanına
  ve gözetmenlere bildirim üretir.
- **Açılır duyurular:** "açılır pencere" seçilmiş ve okunmamış duyurular girişte sırayla gösterilir. "Okudum"
  denince bir daha gösterilmez, "Sonra hatırlat" bir sonraki girişte tekrar gösterir.

### Test dönemi yardımcıları

- **Sorun bildir:** `VITE_FEEDBACK_EMAIL` tanımlıysa alt bilgide ve kullanıcı menüsünde görünür; sayfa adresi,
  sürüm, roller ve tarayıcı bilgisiyle doldurulmuş bir e-posta açar.
- **Sürüm:** alt bilgide `package.json` sürümü ve derlemenin commit'i gösterilir (ör. `v0.9.0 (bda1513)`).
- **Hata sınırı:** bir sayfa çökerse uygulama yerine sadece içerik alanında hata ve "yenile" düğmesi
  gösterilir. Yeni sürüm yayınlandıktan sonra eski sekmede sayfa parçası yüklenemezse yenileme önerilir.
- Tarayıcı sekmesi başlığı açık sayfanın adını gösterir.

### Tanıtım turları ve yardım merkezi

- Turlar ve yardım merkezi tek bir kayıttan üretilir: `src/tour/tours.ts`. Her tur bir sayfaya (`path`) bağlıdır;
  adımlar sayfadaki `data-tour="…"` niteliklerini (veya `selector` ile bir CSS seçicisini) hedefler. Adımlara
  `roles` verilirse yalnızca o rollere gösterilir.
- Hedefi ekranda olmayan adım atlanır (yetki yok, liste boş, mobil düzen). Hedefsiz adım ekranın ortasında açılır.
- İlk girişte (parola değiştirildikten sonra) ana sayfada genel tur, bir sayfaya ilk girişte o sayfanın turu bir kez
  kendiliğinden açılır. Girişteki duyuru penceresi kapanana kadar beklenir. "Görüldü" bilgisi tarayıcıda,
  kullanıcıya göre tutulur (`sinav-takvimi.tour.<kullanıcıId>.<turId>`).
- Sayfa başlığındaki "?" (`PageHeader` içindeki `TourButton`) sayfanın turunu açar. `<sayfa>?tur=<turId>`
  bağlantısı da o turu başlatır (yardım merkezi bunu kullanır).
- `/yardim`: başlık, özet, anahtar kelime ve adım metinlerinde Türkçe arama; sık sorulanlar (`faq`).
- `localStorage['sinav-takvimi.tour.disabled'] = '1'` turların kendiliğinden açılmasını kapatır (e2e testleri
  böyle çalışır; tur testi `e2e/07-tur.spec.ts`).
- **Yeni ekran veya özellik eklerken** `tours.ts`'e turunu/adımını ve hedef öğeye `data-tour` ekleyin. Her menü
  sayfasının bir turu olduğu birim testte kontrol edilir.

### Hata bildirimi

- **Alt + Shift + H** (Mac: Option + Shift + H), sağ alttaki böcek düğmesi, hesap menüsündeki "Sorun bildir" veya
  telefonu sallama (`src/bugReport/shake.ts`; iOS'ta hesap menüsünden açılır, hareket izni ister) aynı pencereyi açar.
- Pencere açılmadan önce görünen ekranın görüntüsü `html-to-image` ile alınır (`capture.ts`; parola alanları ve
  `data-private` işaretli öğeler çizilmez, en fazla ~1,2 MB JPEG). Kullanıcı görüntüyü kaldırabilir.
- `clientLog.ts` son 30 konsol hatasını, yakalanmamış hatayı ve başarısız API isteğini (sorgu parametresi ve gövde
  olmadan) tutar; bildirimle gönderilir.
- `POST /api/BugReport` (multipart) kaydeder; sunucuda SMTP ayarlıysa yöneticilere e-posta gider. Yönetim →
  **Hata bildirimleri** (`/yonetim/hata-bildirimleri`, Yonetici) listeler; menüde yeni bildirim sayısı görünür.

### Oturum

- Kullanıcı bilgisi (ad, e-posta, roller, bölüm) JWT'den çözülür; token `localStorage`'da tutulur.
- Token süresi dolunca veya herhangi bir istek 401 dönünce otomatik olarak çıkış yapılır; giriş sayfasında
  "oturumunuzun süresi doldu" uyarısı gösterilir ve tekrar girişte kalınan sayfaya dönülür.
- Kullanıcı kendisi çıkış yaptıysa kaldığı sayfa hatırlanmaz (aynı bilgisayarda başka biri giriş yapabilir).
- **Güvenlik notu:** `localStorage` XSS saldırılarına açıktır. Backend'e refresh token + httpOnly cookie
  desteği eklendiğinde bu yapıya geçilmesi önerilir.

## Yol haritası

- [x] Giriş, oturum yönetimi, rol bazlı menü ve ana iskelet
- [x] Tanım ekranları: Bölüm (görevli atama dahil), Ders, Derslik, Akademik Personel
- [x] Ders atamaları (ders–bölüm–öğretim elemanı)
- [x] Sınav takvimi: haftalık/aylık/liste görünüm, çakışma uyarılı ekleme/düzenleme, sürükle-bırak, PDF raporlar
- [x] Müsaitlik takvimi
- [x] Kullanıcı yönetimi (roller, parola sıfırlama), öğrenciler, duyurular
- [x] Excel/CSV ile toplu içe aktarma
- [x] Bildirim zili, duyuru açılır penceresi, role göre ana sayfa, sorun bildirme
- [x] Tanıtım turları (ilk giriş, sayfa başına "?") ve aranabilir yardım merkezi
