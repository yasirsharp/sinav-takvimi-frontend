import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App as AntApp, ConfigProvider } from 'antd'
import trTR from 'antd/locale/tr_TR'
import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import '@fontsource/raleway/400.css'
import '@fontsource/raleway/400-italic.css'
import '@fontsource/raleway/500.css'
import '@fontsource/raleway/600.css'
import '@fontsource/raleway/700.css'
import { AuthProvider } from './auth/AuthContext'
import { theme } from './theme'
import App from './App'
import './index.css'

dayjs.locale('tr')

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={trTR} theme={theme}>
      <AntApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
