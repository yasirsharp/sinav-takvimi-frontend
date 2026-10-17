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
  features/   ekranlar: bolum, ders, derslik, akademikPersonel (sayfa + React Query hook'ları)
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

- Listeler tek seferde alınır; arama, sıralama ve sayfalama tarayıcıda yapılır. Arama Türkçe harflere duyarlıdır
  ve ı/i farkını yok sayar (ör. "ins" → `INS101`, "inş" → "İnşaat").
- Bölüm görevlisi, Ders ve Derslik sayfalarını kendi bölümleriyle filtrelenmiş olarak açar (filtre değiştirilebilir).
- Yetkisi olmayan kullanıcı ekleme/düzenleme/silme düğmelerini görmez; asıl kontrol backend'dedir.
- Silinemeyen kayıtlarda (ör. ilişkili ders-bölüm-personel eşleştirmesi) backend'in mesajı olduğu gibi gösterilir.

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
- [ ] Sınav takvimi: liste, takvim görünümü, çakışma uyarılı ekleme/düzenleme, PDF raporlar
- [ ] Müsaitlik takvimi
- [ ] Kullanıcı ve yetki yönetimi, duyurular, bildirimler
