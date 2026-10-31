import { Personel, Planlayici, Roles, Yonetici } from '../auth/roles'
import { GENEL_TOUR_ID, type FaqItem, type TourDef, type TourStepDef } from './tourModel'

/**
 * Tanıtım turları ve yardım merkezi bu tek listeden üretilir.
 * Hedefler sayfalardaki data-tour="…" nitelikleridir; ekranda olmayan hedefin adımı ortada gösterilir.
 * Yeni bir özellik eklerken ilgili turun adımlarını da güncelleyin.
 */

const Ogrenci = [Roles.Ogrenci]
/** Öğrenci olmayan ama planlama yetkisi de olmayan personel (görevli ve akademik personel) */
const SadecePersonel = [Roles.GorevliPersonel, Roles.AkademikPersonel]

const anaSayfaAdimlari: TourStepDef[] = [
  {
    target: 'dashboard-roles',
    title: 'Rolleriniz',
    description:
      'Adınızın altında hesabınızın rolleri görünür. Menüde ve ekranlarda gördükleriniz bu rollere göre değişir. Rolünüz eksik ya da yanlışsa sistem yöneticinize başvurun.',
  },
  {
    target: 'dashboard-setup',
    title: 'Kurulum adımları',
    description:
      'Sınav planlamaya başlamadan önce tanımlar bu sırayla girilmelidir: bölümler, derslikler, dersler, akademik personel, ders atamaları ve öğrenciler. Eksik olan adım mavi görünür; adıma tıklayınca o ekrana gidersiniz. Bütün adımlar tamamlanınca bu kart kendiliğinden kaybolur.',
    roles: Planlayici,
  },
  {
    target: 'dashboard-stats',
    title: 'Özet kartları',
    description:
      'Bu haftaki sınav sayısı ile bölüm, ders, derslik, personel ve öğrenci sayıları. Bir karta tıklayınca ilgili listeye gidersiniz.',
    roles: Planlayici,
  },
  {
    target: 'dashboard-alerts',
    title: 'Uyarılar',
    description:
      'Öğretim elemanı atanmamış dersler ve önümüzdeki 14 günde gözetmeni olmayan derslikler burada uyarı olarak çıkar. Uyarıdaki bağlantı sorunu çözeceğiniz ekrana götürür.',
    roles: Planlayici,
  },
  {
    target: 'dashboard-mine',
    title: 'Sınav görevlerim',
    description:
      'Önümüzdeki 14 günde dersini verdiğiniz sınavlar ("Dersin hocası") ve gözetmen olduğunuz sınavlar ("Gözetmen · derslik") gün gün listelenir. Personel kaydı olmayan yöneticiler burada yaklaşan tüm sınavları ve gözetmeni eksik derslikleri görür.',
    roles: Personel,
  },
  {
    target: 'dashboard-mine',
    title: 'Yaklaşan sınavlarım',
    description:
      'Bölümünüzün önümüzdeki 30 gündeki sınavları gün, saat ve derslikleriyle listelenir. "Bugün" ve "Yarın" etiketleri yakın sınavları öne çıkarır. Tüm takvim için sağ üstteki "Takvim" bağlantısını kullanın.',
    roles: Ogrenci,
  },
  {
    target: 'dashboard-announcements',
    title: 'Duyurular',
    description:
      'Size yönelik, yayında olan duyurular. Uzun duyurularda "devamı" ile tamamını açabilirsiniz. Önemli duyurular girişte ayrıca açılır pencerede de gösterilir; "Okudum" dediğinizde bir daha açılmaz.',
  },
]

export const tours: TourDef[] = [
  {
    id: GENEL_TOUR_ID,
    path: '/',
    title: 'Sisteme genel bakış',
    summary: 'İlk girişte açılan tanıtım: menü, bildirimler, hesap menüsü, yardım ve ana sayfa.',
    keywords: ['başlangıç', 'tanıtım', 'ilk giriş', 'menü', 'nasıl kullanılır'],
    alsoMarks: ['ana-sayfa'],
    steps: [
      {
        title: 'Sınav Takvimi Sistemine hoş geldiniz',
        description:
          'Bu kısa tur ekranları ve en sık kullanılan işlemleri tanıtır. "Sonraki" ile ilerleyin, istediğiniz an sağ üstteki çarpı ile kapatabilirsiniz. Turu daha sonra üst menüdeki "Yardım" sayfasından veya her sayfa başlığının yanındaki "?" düğmesinden tekrar açabilirsiniz.',
      },
      {
        target: 'menu',
        title: 'Ana menü',
        description: 'Tüm ekranlara buradan ulaşırsınız. Menüde yalnızca rolünüzün kullanabileceği ekranlar görünür.',
        bullets: [
          'Sınav Takvimi: tüm sınavların haftalık, aylık ve liste görünümü.',
          'Tanımlar: bölüm, ders, derslik, akademik personel, ders atamaları ve öğrenciler.',
          'Müsaitlik: sınav görevi almak istemediğiniz zamanlar.',
          'Yönetim: kullanıcılar ve duyurular.',
        ],
        roles: Personel,
      },
      {
        target: 'menu',
        title: 'Ana menü',
        description:
          'Ana sayfa ve Sınav Takvimi ekranlarına buradan ulaşırsınız. Takvimde yalnızca kendi bölümünüzün sınavlarını görürsünüz.',
        roles: Ogrenci,
      },
      {
        target: 'bell',
        title: 'Bildirimler',
        description:
          'Sizi ilgilendiren bir sınav eklendiğinde, değiştiğinde ya da silindiğinde (dersini verdiğiniz veya gözetmen olduğunuz sınavlar) buraya bildirim düşer. Kırmızı sayı okunmamış bildirimleri gösterir; bildirime tıklayınca okundu olur.',
        roles: Personel,
      },
      {
        target: 'bell',
        title: 'Bildirimler',
        description: 'Size gönderilen bildirimler burada görünür. Kırmızı sayı okunmamış bildirimleri gösterir.',
        roles: Ogrenci,
      },
      {
        target: 'user-menu',
        title: 'Hesap menüsü',
        description: 'Adınıza tıklayınca açılır.',
        bullets: [
          'Rolleriniz en üstte yazar.',
          'Parolamı değiştir: parolanızı istediğiniz zaman yenileyebilirsiniz.',
          'Tanıtım turu ve Yardım merkezi: bu turu tekrar başlatır veya yardım sayfasını açar.',
          'Sorun bildir: hata bildirimi penceresini açar (aşağıda anlatılıyor).',
          'Çıkış yap: ortak bilgisayarda işiniz bitince mutlaka çıkış yapın.',
        ],
      },
      {
        target: 'help',
        title: 'Yardım merkezi',
        description:
          'Uzun süre kullanmadığınız bir özelliği unuttuysanız buraya tıklayın. Yardım merkezinde tüm özellikleri arayabilir, açıklamasını okuyabilir ve "Sayfaya git ve turu başlat" ile o ekranın turunu açabilirsiniz.',
      },
      ...anaSayfaAdimlari,
      {
        target: 'bug-report',
        title: 'Hata bildir',
        description:
          'Beklemediğiniz bir şey olursa sağ alttaki böcek düğmesine basın. O anki ekranın görüntüsü alınır; ne yapmaya çalıştığınızı ve ne olduğunu bir iki cümleyle yazıp gönderin. Sayfa, sürüm ve son hata kayıtları otomatik eklenir.',
        bullets: [
          'Bilgisayarda her ekranda: Alt + Shift + H (Mac: Option + Shift + H).',
          'Telefonda: telefonu birkaç kez hızlıca sallayın. iPhone\'da önce hesap menüsünden "Sallayınca hata bildir"i açın.',
          'Görüntüde kişisel bilgi varsa göndermeden önce görüntü ekini kapatabilirsiniz; parola alanları görüntüye hiç girmez.',
        ],
      },
      {
        title: 'Hazırsınız',
        description:
          'Bir ekranı ilk kez açtığınızda o ekranın kısa turu kendiliğinden başlar. Daha sonra tekrar görmek için sayfa başlığının yanındaki "?" düğmesine tıklayın.',
      },
    ],
  },
  {
    id: 'ana-sayfa',
    path: '/',
    title: 'Ana sayfa',
    summary: 'Rolleriniz, kurulum adımları, özet kartları, uyarılar, sınav görevleriniz ve duyurular.',
    keywords: ['anasayfa', 'özet', 'görevlerim', 'gözetmenlik', 'yaklaşan sınav', 'kurulum'],
    steps: anaSayfaAdimlari,
  },
  {
    id: 'sinav-takvimi',
    path: '/sinav-takvimi',
    title: 'Sınav Takvimi',
    summary: 'Sınavları görüntüleme, filtreleme, yeni sınav ekleme, sürükleyerek taşıma, gözetmen atama ve PDF raporlar.',
    keywords: ['sınav ekle', 'sınav taşı', 'sürükle', 'gözetmen', 'derslik', 'çakışma', 'rapor', 'pdf', 'yazdır', 'takvim', 'sadece benim'],
    steps: [
      {
        selector: '.du-calendar .fc-toolbar-chunk:first-child',
        title: 'Tarih gezinme',
        description: 'Oklarla önceki veya sonraki haftaya ya da aya geçin. "Bugün" sizi içinde bulunduğunuz haftaya geri getirir.',
      },
      {
        selector: '.du-calendar .fc-toolbar-chunk:last-child',
        title: 'Görünüm',
        description:
          'Hafta: saat saat ızgara. Ay: tüm ay tek bakışta. Liste: sınavlar alt alta (telefonda varsayılan). Sayfa başlığında görünen aralıktaki sınav sayısı yazar.',
      },
      {
        target: 'sinav-filters',
        title: 'Filtreler',
        description:
          'Bölüm ve derslik seçerek takvimi daraltın. Birden çok bölüm seçebilirsiniz. Bölüm görevlilerinde kendi bölümleri hazır seçili gelir. Filtreler PDF raporlara da uygulanır.',
        roles: Personel,
      },
      {
        target: 'sinav-filters',
        title: 'Derslik filtresi',
        description: 'Takvimde yalnızca bölümünüzün sınavları görünür. Belirli bir dersliğin sınavlarını görmek için derslik seçin.',
        roles: Ogrenci,
      },
      {
        target: 'sinav-mine',
        title: 'Sadece benim sınavlarım',
        description:
          'Açınca yalnızca dersini verdiğiniz veya gözetmen olduğunuz sınavlar görünür. Kendi görev programınızı görmenin en hızlı yolu budur.',
        roles: Personel,
      },
      {
        target: 'sinav-calendar',
        title: 'Sınav ayrıntısı',
        description:
          'Bir sınava tıklayınca sağda ayrıntısı açılır: tarih, saat, öğretim elemanı, derslikler, her dersliğin gözetmeni ve toplam kapasite. Renkler bölümleri ayırt eder.',
      },
      {
        target: 'add',
        title: 'Yeni sınav',
        description: 'Sınav eklemek için bu düğmeyi kullanın ya da takvimde boş bir saat aralığını fareyle seçin; seçtiğiniz saat forma hazır gelir.',
        bullets: [
          'Bölüm ve ders seçin. Ders listesi "Ders atamaları" ekranındaki ders–öğretim elemanı eşleşmelerinden gelir; ataması olmayan dersin sınavı eklenemez.',
          'Tarih ve saat aralığını girin.',
          'Bir veya daha fazla derslik ekleyin, her dersliğe gözetmen seçin. Toplam kapasite altta hesaplanır.',
        ],
        roles: Planlayici,
      },
      {
        target: 'sinav-calendar',
        title: 'Çakışma kontrolü',
        description: 'Kaydederken sistem aynı gün kesişen saatlerde şunları kontrol eder ve çakışma varsa kaydetmez:',
        bullets: [
          'Derslik başka bir sınavda kullanılıyor mu?',
          'Gözetmen başka bir sınavda gözetmen mi ya da o saatte kendi dersinin sınavı mı var?',
          'Dersin öğretim elemanının o saatte başka sınavı veya gözetmenliği var mı?',
          'Gözetmen o saati "Müsait değilim" olarak işaretlemiş mi?',
        ],
        roles: Planlayici,
      },
      {
        target: 'sinav-calendar',
        title: 'Sürükleyerek taşıma',
        description:
          'Haftalık görünümde bir sınavı sürükleyip başka bir saate veya güne bırakabilir, alt kenarından çekerek süresini değiştirebilirsiniz. Çakışma varsa sınav eski yerine döner ve nedeni yazılır. Düzenleme ve silme için sınava tıklayıp açılan paneli kullanın.',
        roles: Planlayici,
      },
      {
        target: 'sinav-calendar',
        title: 'Bildirimler',
        description:
          'Sınav eklendiğinde, değiştiğinde veya silindiğinde dersin öğretim elemanına ve gözetmenlere otomatik bildirim gider.',
        roles: Planlayici,
      },
      {
        target: 'sinav-report',
        title: 'PDF raporlar',
        description: 'Takvimde görünen tarih aralığı ve seçili bölümler için yazdırılabilir PDF indirir.',
        bullets: [
          'Resmi sınav takvimi: ilan edilecek sınav listesi.',
          'Gözetmen görevlendirme: kim, hangi gün, hangi derslikte görevli (personel).',
          'Derslik kullanımı: dersliklerin gün gün doluluğu (personel).',
        ],
      },
    ],
  },
  {
    id: 'bolumler',
    path: '/tanimlar/bolumler',
    title: 'Bölümler',
    summary: 'Bölüm ekleme, Excel ile toplu aktarma ve bölüm görevlisi atama.',
    keywords: ['bölüm ekle', 'bölüm görevlisi', 'görevli ata', 'yetki'],
    roles: Personel,
    steps: [
      {
        target: 'add',
        title: 'Yeni bölüm',
        description: 'Bölüm adını yazıp kaydedin. Aynı ada sahip ikinci bölüm eklenemez.',
        roles: Yonetici,
      },
      {
        target: 'import',
        title: "Excel'den aktar",
        description:
          'Çok sayıda kaydı tek seferde girmek için şablonu indirip doldurun ve dosyayı bırakın. Aktarmadan önce satır satır önizleme gösterilir; hatalı satırlar aktarılmaz ve nedenleri yazılır. Sonuç CSV olarak indirilebilir.',
        roles: Yonetici,
      },
      { target: 'search', title: 'Arama', description: 'Yazdıkça liste süzülür. Türkçe harfler ve büyük/küçük harf fark etmez.' },
      {
        target: 'table',
        title: 'Bölüm görevlileri',
        description:
          'Satırın solundaki "+" ile bölümü genişletin. Açılan panelde bölümün görevlileri listelenir; yönetici "Görevli ekle" ile bir akademik personeli bölüm görevlisi yapabilir. Görevli, o bölümün ders, derslik, ders ataması ve sınavlarını planlayabilir; rolü otomatik verilir.',
      },
      {
        target: 'table',
        title: 'Düzenle ve sil',
        description: 'Satır sonundaki kalem ile adı düzeltin, çöp kutusu ile silin. Bölüme bağlı ders veya sınav varsa silme engellenir ve neden yazılır.',
        roles: Yonetici,
      },
    ],
  },
  {
    id: 'dersler',
    path: '/tanimlar/dersler',
    title: 'Dersler',
    summary: 'Ders kodu ve adı, dersin verildiği bölümler, ortak dersler ve Excel ile aktarma.',
    keywords: ['ders ekle', 'ders kodu', 'ortak ders'],
    roles: Personel,
    steps: [
      {
        target: 'add',
        title: 'Yeni ders',
        description:
          'Ders kodu (ör. BLM201) ve adı girilir. Dersin verildiği bölümleri seçin. "Ortak ders" işaretlenen dersler (ör. Türk Dili) tüm bölümlerde kullanılabilir.',
        roles: Planlayici,
      },
      {
        target: 'import',
        title: "Excel'den aktar",
        description: 'Şablondaki sütunlar: Ders kodu, Ders adı, Ortak ders (Evet/Hayır), Bölümler (virgülle). Kodlar büyük harfe çevrilir ve boşlukları silinir.',
        roles: Planlayici,
      },
      { target: 'search', title: 'Arama ve bölüm filtresi', description: 'Kod veya ada göre arayın, bölüm seçerek listeyi daraltın.' },
      {
        target: 'table',
        title: 'Liste',
        description: 'Sütun başlıklarına tıklayarak sıralayabilirsiniz. Ders bir sınavda veya ders atamasında kullanılıyorsa silinemez.',
      },
    ],
  },
  {
    id: 'derslikler',
    path: '/tanimlar/derslikler',
    title: 'Derslikler',
    summary: 'Sınav yapılabilecek derslikler, kapasiteleri, ortak derslikler ve Excel ile aktarma.',
    keywords: ['derslik ekle', 'sınıf', 'salon', 'kapasite', 'ortak derslik'],
    roles: Personel,
    steps: [
      {
        target: 'add',
        title: 'Yeni derslik',
        description:
          'Derslik adı ve kapasitesi girilir. Dersliği kullanabilecek bölümleri seçin ya da "Ortak derslik" işaretleyin. Kullanılmayan derslikleri silmek yerine pasif yapabilirsiniz.',
        roles: Planlayici,
      },
      {
        target: 'import',
        title: "Excel'den aktar",
        description: 'Şablondaki sütunlar: Derslik adı, Kapasite, Ortak derslik (Evet/Hayır), Bölümler (virgülle).',
        roles: Planlayici,
      },
      { target: 'search', title: 'Arama ve bölüm filtresi', description: 'Derslik adına göre arayın, bölüme göre daraltın.' },
      {
        target: 'table',
        title: 'Kapasite',
        description: 'Sayfa başlığında listelenen aktif dersliklerin toplam kapasitesi yazar. Sınav formunda seçilen dersliklerin kapasitesi toplanır.',
      },
    ],
  },
  {
    id: 'akademik-personel',
    path: '/tanimlar/akademik-personel',
    title: 'Akademik Personel',
    summary: 'Öğretim elemanı ve gözetmen ekleme, otomatik kullanıcı hesabı ve geçici parola.',
    keywords: ['hoca', 'öğretim elemanı', 'personel ekle', 'gözetmen', 'hesap', 'geçici parola'],
    roles: Personel,
    steps: [
      {
        target: 'add',
        title: 'Yeni personel',
        description:
          'Unvan, ad soyad ve e-posta girilir. E-posta verilirse kişiye otomatik bir kullanıcı hesabı açılır ve geçici parola bir kez gösterilir. Bu bilgiyi kişiye iletin; ilk girişte parolasını değiştirmesi istenir.',
        roles: Yonetici,
      },
      {
        target: 'import',
        title: "Excel'den aktar",
        description:
          'Şablondaki sütunlar: Unvan, Ad Soyad, E-posta. Aktarma bitince indirilen sonuç dosyasında her kişinin kullanıcı adı ve geçici parolası bulunur. Dosyayı güvenli saklayın, parolaları ilettikten sonra silin.',
        roles: Yonetici,
      },
      { target: 'search', title: 'Arama', description: 'Ad veya unvana göre arayın.' },
      {
        target: 'table',
        title: 'Liste',
        description: 'Sınav formunda öğretim elemanı ve gözetmen seçenekleri bu listeden gelir. Müsaitlikleri "Müsaitlik" ekranında görülür.',
      },
    ],
  },
  {
    id: 'ders-atamalari',
    path: '/tanimlar/ders-atamalari',
    title: 'Ders Atamaları',
    summary: 'Hangi dersi hangi bölümde kimin verdiği. Sınavlar bu atamalar üzerinden eklenir.',
    keywords: ['dbap', 'atama', 'öğretim elemanı ata', 'dersi veren', 'hoca ata'],
    roles: Personel,
    steps: [
      {
        title: 'Ders ataması nedir?',
        description:
          'Bir ders ataması "şu ders, şu bölümde, şu öğretim elemanı tarafından veriliyor" bilgisidir. Sınav eklerken ders bu listeden seçilir; ataması olmayan dersin sınavı eklenemez.',
      },
      {
        target: 'missing',
        title: 'Ataması eksik dersler',
        description: 'Öğretim elemanı atanmamış dersler burada uyarı olarak listelenir. "Dersleri göster" ile tamamını açın.',
      },
      {
        target: 'add',
        title: 'Yeni atama',
        description: 'Bölüm, ders ve öğretim elemanını seçin. Aynı ders aynı bölümde birden çok öğretim elemanına atanabilir (ör. şubeler).',
        roles: Planlayici,
      },
      {
        target: 'import',
        title: "Excel'den aktar",
        description: 'Şablondaki sütunlar: Ders kodu, Bölüm, Öğretim elemanı. Öğretim elemanı unvanlı veya unvansız yazılabilir.',
        roles: Planlayici,
      },
      { target: 'search', title: 'Arama ve filtreler', description: 'Ders, bölüm veya öğretim elemanına göre arayın; bölüm ve öğretim elemanı seçerek daraltın.' },
    ],
  },
  {
    id: 'ogrenciler',
    path: '/tanimlar/ogrenciler',
    title: 'Öğrenciler',
    summary: 'Öğrenci ekleme, Excel ile toplu aktarma, kullanıcı hesabı ve sınıf filtresi.',
    keywords: ['öğrenci ekle', 'öğrenci no', 'sınıf', 'hesap', 'geçici parola'],
    roles: Personel,
    steps: [
      {
        target: 'add',
        title: 'Yeni öğrenci',
        description:
          'Öğrenci numarası, ad, soyad, bölüm ve sınıf girilir. Öğrenciye otomatik hesap açılır: kullanıcı adı öğrenci numarasıdır, geçici parola bir kez gösterilir. Öğrenci yalnızca kendi bölümünün sınav takvimini görür.',
        roles: Yonetici,
      },
      {
        target: 'import',
        title: "Excel'den aktar",
        description:
          'Şablondaki sütunlar: Öğrenci No, Ad, Soyad, Bölüm, Sınıf, E-posta. Sonuç dosyasında her öğrencinin geçici parolası bulunur. Aynı numara ikinci kez eklenemez.',
        roles: Yonetici,
      },
      { target: 'search', title: 'Arama ve filtreler', description: 'Öğrenci no veya ada göre arayın; bölüm ve sınıf seçerek daraltın.' },
      { target: 'table', title: 'Pasif öğrenciler', description: 'Gri satırlar pasif öğrencilerdir; giriş yapamazlar.' },
    ],
  },
  {
    id: 'musaitlik',
    path: '/musaitlik',
    title: 'Müsaitlik',
    summary: 'Sınav görevi verilmemesi gereken zamanları işaretleme; tek seferlik, haftalık ve aylık tekrar.',
    keywords: ['müsait değilim', 'izin', 'mazeret', 'tekrar', 'her hafta', 'gözetmenlik istemiyorum'],
    roles: Personel,
    steps: [
      {
        title: 'Müsaitlik neden önemli?',
        description:
          '"Müsait değilim" olarak işaretlediğiniz saatlerde size gözetmenlik verilemez; planlayıcı sizi seçmeye çalışırsa sistem engeller. Ders saatlerinizi, toplantılarınızı ve izinlerinizi buraya girin.',
      },
      {
        target: 'musaitlik-personel',
        title: 'Personel seçimi',
        description: 'Planlayıcılar buradan herhangi bir personelin müsaitliğini görüp düzenleyebilir.',
        roles: Planlayici,
      },
      {
        target: 'musaitlik-view',
        title: 'Takvim ve liste',
        description: 'Takvim görünümü kayıtları ay veya hafta üzerinde gösterir. Liste görünümünde kayıtları toplu seçip silebilirsiniz.',
      },
      {
        target: 'musaitlik-legend',
        title: 'Renkler',
        description: 'Kırmızı: müsait değil. Yeşil: müsait (tercih) - bu saatlerde görev almayı tercih ettiğinizi belirtir.',
      },
      {
        target: 'add',
        title: 'Yeni kayıt',
        description: 'Düğmeyle ya da takvimde gün veya saat aralığı seçerek kayıt ekleyin. Formda:',
        bullets: [
          'Durum: Müsait değilim / Müsaitim (tercih).',
          'Tekrar: Tek sefer, Her hafta veya Her ay. Haftalık kayıt başlangıç gününün haftanın gününde tekrarlanır; bitiş boşsa süresizdir.',
          'Tüm gün ya da saat aralığı.',
          'Neden ve açıklama (isteğe bağlı).',
        ],
      },
      {
        target: 'musaitlik-calendar',
        title: 'Düzenleme',
        description: 'Takvimde bir kayda tıklayınca düzenleme penceresi açılır; oradan silebilirsiniz de.',
      },
    ],
  },
  {
    id: 'kullanicilar',
    path: '/yonetim/kullanicilar',
    title: 'Kullanıcılar',
    summary: 'Hesapları düzenleme, rol verme, pasifleştirme ve parola sıfırlama.',
    keywords: ['rol', 'yetki', 'parola sıfırla', 'şifre unuttum', 'pasif', 'hesap', 'admin'],
    roles: Yonetici,
    steps: [
      {
        title: 'Hesaplar nereden gelir?',
        description:
          'Akademik personel ve öğrenci eklendiğinde hesapları otomatik açılır. Bu ekranda yeni hesap açılmaz; mevcut hesapların rolleri, durumu ve parolası yönetilir.',
      },
      {
        target: 'users-roles',
        title: 'Roller hakkında',
        description: 'Her rolün neler yapabildiğinin kısa açıklaması. Bir role birden çok kişi, bir kişiye birden çok rol verilebilir.',
      },
      { target: 'search', title: 'Arama ve durum', description: 'Ad, kullanıcı adı veya e-postaya göre arayın; Tümü / Aktif / Pasif ile süzün.' },
      {
        target: 'table',
        title: 'Satır işlemleri',
        description: 'Her satırın sonunda:',
        bullets: [
          'Aktif anahtarı: kapatılan hesap giriş yapamaz. Kendi hesabınızı kapatamazsınız.',
          'Kalem: ad, soyad, e-posta ve kullanıcı adını düzeltir.',
          'Kalkan: rolleri düzenler. Süper yönetici rollerini yalnızca süper yönetici değiştirebilir.',
          'Anahtar: parolayı sıfırlar. Yeni geçici parola bir kez gösterilir; kişi ilk girişte değiştirmek zorundadır. Parolasını unutan kullanıcılar için bunu kullanın.',
        ],
      },
    ],
  },
  {
    id: 'duyurular',
    path: '/yonetim/duyurular',
    title: 'Duyurular',
    summary: 'Duyuru yayınlama, hedef kitle ve bölüm seçimi, yayın tarihleri ve girişte açılır pencere.',
    keywords: ['duyuru ekle', 'ilan', 'popup', 'açılır pencere', 'hedef kitle'],
    roles: Planlayici,
    steps: [
      {
        target: 'add',
        title: 'Yeni duyuru',
        description: 'Formda:',
        bullets: [
          'Başlık ve içerik.',
          'Tür (Genel, Acil, Bakım, Etkinlik) ve öncelik.',
          'Kime: herkes, öğrenciler, personel veya yöneticiler. Bölüm seçilirse yalnızca o bölüme gider. Bölüm görevlileri yalnızca kendi bölümlerine duyuru yapabilir.',
          'Yayın ve bitiş tarihi: duyuru bu aralıkta görünür, bitiş boşsa süresizdir.',
          'Girişte açılır pencerede göster: kullanıcı "Okudum" diyene kadar her girişte açılır.',
          'Aktif: kapatılan duyuru silinmeden yayından kalkar.',
        ],
      },
      { target: 'search', title: 'Arama', description: 'Başlık veya içerikte arayın.' },
      {
        target: 'table',
        title: 'Liste',
        description: 'Hedef sütununda kime gittiği, yayın sütununda tarihleri ve durumu görünür. Kalem ile düzenleyin, çöp kutusu ile silin.',
      },
    ],
  },
  {
    id: 'hata-bildirimleri',
    path: '/yonetim/hata-bildirimleri',
    title: 'Hata bildirimleri',
    summary: 'Kullanıcıların gönderdiği ekran görüntülü hata bildirimlerini inceleme ve takip etme.',
    keywords: ['bug', 'hata', 'sorun', 'geri bildirim', 'ekran görüntüsü'],
    roles: Yonetici,
    steps: [
      {
        title: 'Hata bildirimleri nereden gelir?',
        description:
          'Kullanıcılar Alt + Shift + H, telefonu sallama veya sağ alttaki böcek düğmesiyle bildirim gönderir. Her bildirimde açıklama, ekran görüntüsü, sayfa, sürüm, tarayıcı ve son hata kayıtları bulunur. Sunucuda e-posta ayarlandıysa her yeni bildirim ayrıca e-postayla gelir.',
      },
      { target: 'search', title: 'Arama ve durum', description: 'Yeni, İnceleniyor, Çözüldü veya Tümü ile süzün; açıklama, kişi veya sayfaya göre arayın.' },
      {
        target: 'table',
        title: 'Ayrıntı ve takip',
        description:
          'Bir satıra tıklayınca sağda ayrıntı açılır: ekran görüntüsü (tıklayınca büyür), teknik bilgiler ve istemci günlüğü. Durumu değiştirip not ekleyerek takibini yapın. Menüdeki sayı yeni bildirimleri gösterir.',
      },
    ],
  },
  {
    id: 'parola',
    path: '/parola-degistir',
    title: 'Parola değiştirme',
    summary: 'Parolanızı değiştirme ve parola kuralları.',
    keywords: ['şifre', 'parola değiştir', 'geçici parola', 'şifre unuttum'],
    steps: [
      {
        target: 'password-form',
        title: 'Parolanızı değiştirin',
        description: 'Mevcut (veya size verilen geçici) parolanızı, ardından yeni parolanızı iki kez yazın.',
      },
      {
        target: 'password-rules',
        title: 'Parola kuralları',
        description: 'Yazdıkça kurallar yeşile döner. Hepsi sağlanmadan parola kaydedilmez. Yeni parola eskisiyle aynı olamaz.',
      },
    ],
  },
]

/** Yardım merkezindeki sık sorulanlar (tur gerektirmeyen konular) */
export const faq: FaqItem[] = [
  {
    question: 'Parolamı unuttum, ne yapmalıyım?',
    answer:
      'Giriş ekranında parola sıfırlama yoktur. Sistem yöneticinize başvurun; Kullanıcılar ekranından parolanızı sıfırlayıp size geçici bir parola verir. İlk girişte yeni parola belirlersiniz.',
    keywords: ['şifre', 'giriş yapamıyorum'],
  },
  {
    question: 'Hesabım kilitlendi / "çok fazla deneme" uyarısı alıyorum.',
    answer: '15 dakika içinde 5 kez yanlış parola girilirse hesap yaklaşık 15 dakika kilitlenir. Bekleyip tekrar deneyin ya da yöneticinizden parola sıfırlamasını isteyin.',
    keywords: ['kilit', 'deneme', 'giriş'],
  },
  {
    question: 'Bir hata buldum, nasıl bildiririm?',
    answer:
      'Hatayı gördüğünüz ekranda Alt + Shift + H tuşlarına basın, sağ alttaki böcek düğmesine tıklayın veya telefonu birkaç kez hızlıca sallayın. Ekran görüntüsü kendiliğinden eklenir; ne yapmaya çalıştığınızı ve ne olduğunu yazıp Gönder deyin. Size bir bildirim numarası verilir.',
    keywords: ['hata', 'bug', 'geri bildirim', 'sorun', 'kısayol', 'alt shift h', 'salla', 'ekran görüntüsü'],
  },
  {
    question: 'Sınavı kaydederken "çakışan bir sınav bulunmaktadır" hatası alıyorum.',
    answer:
      'Aynı gün kesişen saatte derslik, gözetmen ya da dersin öğretim elemanı başka bir sınavda görünüyor veya gözetmen o saati müsait değil olarak işaretlemiş. Takvimde "Sadece benim" yerine derslik filtresini kullanarak çakışan sınavı bulabilir, saati veya dersliği değiştirebilirsiniz.',
    keywords: ['çakışma', 'kaydedilmiyor', 'hata'],
    roles: Planlayici,
  },
  {
    question: 'Sınav eklerken dersim listede çıkmıyor.',
    answer: 'Ders listesi "Ders atamaları" ekranından gelir. Dersi seçtiğiniz bölümde bir öğretim elemanına atayın, ardından sınav formunda görünür.',
    keywords: ['ders yok', 'atama'],
    roles: Planlayici,
  },
  {
    question: "Excel'den aktarırken satırlar kırmızı görünüyor.",
    answer:
      'Önizlemede kırmızı satırların nedeni yanında yazar (eksik zorunlu alan, bilinmeyen bölüm, tekrar eden kayıt…). Bu satırlar aktarılmaz; diğerleri aktarılır. Dosyayı düzeltip yalnızca hatalı satırlarla tekrar aktarabilirsiniz. İlk satır şablondaki sütun başlıkları olmalıdır.',
    keywords: ['excel', 'içe aktar', 'şablon', 'csv'],
    roles: Planlayici,
  },
  {
    question: 'Takvimde bazı sınavları göremiyorum.',
    answer:
      'Bölüm veya derslik filtresi ya da "Sadece benim sınavlarım" açık olabilir; filtreleri temizleyin. Öğrenciler yalnızca kendi bölümlerinin sınavlarını görür.',
    keywords: ['görünmüyor', 'filtre', 'eksik'],
  },
  {
    question: 'Bildirimler ne zaman gelir?',
    answer: 'Dersini verdiğiniz veya gözetmen olduğunuz bir sınav eklendiğinde, tarihi, saati, dersliği veya gözetmeni değiştiğinde ya da silindiğinde.',
    keywords: ['bildirim', 'zil'],
    roles: Personel,
  },
  {
    question: 'Müsaitlik girdiğim halde gözetmen yapıldım.',
    answer:
      'Yalnızca "Müsait değilim" kayıtları gözetmen atamasını engeller; "Müsaitim (tercih)" engellemez. Kayıt sınav atandıktan sonra girildiyse planlayıcıya haber verin.',
    keywords: ['müsaitlik', 'gözetmen'],
    roles: SadecePersonel,
  },
  {
    question: 'Telefonda kullanabilir miyim?',
    answer: 'Evet. Menü sol üstteki düğmeyle açılır; sınav takvimi telefonda liste görünümüyle başlar.',
    keywords: ['mobil', 'telefon', 'tablet'],
  },
]
