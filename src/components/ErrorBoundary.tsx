import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, Result } from 'antd'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** Yeni sürüm yayınlandıktan sonra eski sayfanın artık olmayan bir parçayı indirmeye çalışması */
const isChunkLoadError = (error: Error) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    error.message,
  )

/**
 * Bir sayfa çökerse tüm uygulama yerine sadece içerik alanında dostça bir hata gösterir.
 * AppLayout'ta sayfa adresiyle anahtarlanır; başka sayfaya geçince sıfırlanır.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Sayfa hatası:', error, info.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    if (isChunkLoadError(error)) {
      return (
        <Result
          status="info"
          title="Uygulama güncellendi"
          subTitle="Yeni sürümü yüklemek için sayfayı yenileyin."
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Sayfayı yenile
            </Button>
          }
        />
      )
    }

    return (
      <Result
        status="error"
        title="Bu sayfa görüntülenirken bir hata oluştu"
        subTitle="Sayfayı yenilemeyi deneyin. Sorun devam ederse alt bilgideki “Sorun bildir” bağlantısıyla bildirin."
        extra={[
          <Button key="reload" type="primary" onClick={() => window.location.reload()}>
            Sayfayı yenile
          </Button>,
          <Button key="home" onClick={() => (window.location.href = '/')}>
            Ana sayfa
          </Button>,
        ]}
      />
    )
  }
}
