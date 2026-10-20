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

## Production

Build alırken `VITE_API_BASE_URL` ortam değişkeniyle backend adresi verilir:

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
  pages/      Login, Ana Sayfa, 403, 404, "yakında" sayfası
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

- Listeler tek seferde alınır; arama, sıralama ve sayfalama tarayıcıda yapılır. Arama Türkçe harflere duyarlıdır
  ve ı/i farkını yok sayar (ör. "ins" → `INS101`, "inş" → "İnşaat").
- Bölüm görevlisi, Ders ve Derslik sayfalarını kendi bölümleriyle filtrelenmiş olarak açar (filtre değiştirilebilir).
- Yetkisi olmayan kullanıcı ekleme/düzenleme/silme düğmelerini görmez; asıl kontrol backend'dedir.
- Silinemeyen kayıtlarda (ör. ilişkili ders-bölüm-personel eşleştirmesi) backend'in mesajı olduğu gibi gösterilir.

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
  ve seçili bölümler için backend'den indirilir.

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
- [ ] Müsaitlik takvimi
- [ ] Kullanıcı ve yetki yönetimi, duyurular, bildirimler
