import type { ThemeConfig } from 'antd'

/**
 * Düzce Üniversitesi web sitesinden (duzce.edu.tr) alınan kurumsal renkler.
 * Değerler sitenin ekran görüntüsü ve logodan ölçülmüştür.
 */
export const brand = {
  /** Logo yazısı, menü metni ve menü altındaki kalın çizgi */
  navy: '#003366',
  /** Logodaki turkuaz kanat, üst bandın başlangıç rengi */
  turquoise: '#33cccc',
  /** Üst bandın orta tonu */
  blue: '#208fc7',
  /** Üst bandın bitiş rengi */
  blueDeep: '#166fc7',
  /** Logo altındaki ince ayırıcı çizgi */
  divider: '#bbbbbb',
  /** Slogan metni */
  muted: '#77716a',
  /** Üst band: turkuazdan maviye yatay geçiş */
  gradient: 'linear-gradient(90deg, #33cccc 0%, #208fc7 55%, #166fc7 100%)',
  fontFamily: "'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const

export const theme: ThemeConfig = {
  token: {
    colorPrimary: brand.navy,
    colorInfo: brand.blue,
    colorLink: brand.navy,
    colorLinkHover: brand.blue,
    colorTextBase: '#1f2a37',
    colorBorderSecondary: '#e6e9ee',
    fontFamily: brand.fontFamily,
    borderRadius: 8,
    borderRadiusLG: 16,
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f4f6f9',
      headerHeight: 'auto',
      headerPadding: 0,
    },
    Menu: {
      // Sitedeki ana menü: büyük harf, lacivert, kalın
      itemColor: brand.navy,
      itemHoverColor: brand.blue,
      itemSelectedColor: brand.blue,
      horizontalItemSelectedColor: brand.blue,
      horizontalItemHoverColor: brand.blue,
      fontSize: 15,
      itemBg: 'transparent',
      itemSelectedBg: '#e8f4fb',
      subMenuItemBg: 'transparent',
    },
    Button: {
      fontWeight: 600,
    },
    Card: {
      headerFontSize: 17,
    },
  },
}

/** Alt bilgideki telif yılı (render sırasında Date çağırmamak için modül yüklenirken hesaplanır) */
export const currentYear = new Date().getFullYear()
