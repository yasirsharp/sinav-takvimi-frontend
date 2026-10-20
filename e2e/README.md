# Uçtan uca testler

Playwright testleri **gerçek backend'e** ve **boş bir test veritabanına** karşı çalışır. Testler sırayla
çalışır: `01-kurulum` ilk yöneticiyle giriş yapar ve tanımları Excel/CSV ile içe aktarır, sonraki testler bu
verileri kullanır. Bu yüzden her çalıştırmadan önce veritabanı sıfırlanmalıdır.

> Gerçek veya paylaşılan bir veritabanında **çalıştırmayın**: testler kullanıcıların parolalarını sıfırlar.

## Hazırlık

1. Boş bir SQL Server veritabanı (Docker ile örnek):

   ```bash
   docker run -d --name mssql -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='Test_Sifre_2026!' -p 1433:1433 \
     mcr.microsoft.com/mssql/server:2022-latest
   ```

2. Backend klasöründe şemayı sıfırdan kurun ve API'yi ilk yönetici ayarlarıyla başlatın:

   ```bash
   export ConnectionStrings__DefaultConnection='Server=localhost,1433;Database=SinavTakvimiTest;User Id=sa;Password=Test_Sifre_2026!;TrustServerCertificate=True'
   dotnet tool restore
   dotnet ef database drop -f --project DataAccess --startup-project DataAccess
   dotnet ef database update --project DataAccess --startup-project DataAccess

   cd API
   export TokenOptions__SecurityKey='test-anahtari-0123456789-0123456789-0123456789-0123456789-abcdef'
   export Seed__AdminEmail='admin@duzce.edu.tr' Seed__AdminPassword='IlkParola2026'
   export ASPNETCORE_URLS=http://localhost:8081 ASPNETCORE_ENVIRONMENT=Development
   dotnet run --no-launch-profile
   ```

3. Bu klasörde:

   ```bash
   npm ci
   npx playwright install chromium   # bir kez
   npm run test:e2e
   ```

Vite geliştirme sunucusu otomatik başlatılır (`/api` → `http://localhost:8081`). Rapor: `e2e-report/index.html`.

## Ayarlar

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `E2E_BASE_URL` | (Vite başlatılır) | Hazır bir arayüze karşı çalıştırmak için, ör. yayın paketi `http://localhost:8081` |
| `E2E_API_URL` | `http://localhost:8081` | Testlerin doğrudan çağırdığı API |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | `admin@duzce.edu.tr` / `IlkParola2026` | Backend'in `Seed__AdminEmail` / `Seed__AdminPassword` değerleri |
| `PLAYWRIGHT_CHROMIUM_PATH` | — | Kurulu bir Chromium kullanmak için |

## Kapsam

| Dosya | Senaryo |
|---|---|
| `01-kurulum` | Açık kayıt kapalı; ilk yönetici zorunlu parola değişimi (arayüz + API 403); bölüm, derslik, ders, personel, öğrenci ve ders atamalarının Excel/CSV ile içe aktarılması (hatalı satırlar dahil), sonuç dosyasında geçici parolalar |
| `02-hesaplar` | Öğrenci ekleme ve geçici parola, pasif öğrencinin giriş yapamaması; rol ekleme, parola sıfırlama, kendi hesabını koruma |
| `03-musaitlik` | Haftalık müsaitlik kaydı, backend'in o saati "meşgul" sayması, toplu silme |
| `04-sinav-bildirim` | Sınav ve çakışma kontrolü, gözetmene bildirim (zil), görevlerim; öğrencide açılır duyuru (bir kez) ve mobil ana sayfa; yönetici özeti |
| `05-yetki` | Öğrencinin sadece kendi bölümünün sınavlarını ve resmi raporunu alabilmesi; `/health`, bilinmeyen API adresi |
| `06-sinav-takvimi` | Formdan sınav ekleme, takvimde görme, silme |
