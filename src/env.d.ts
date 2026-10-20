/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** "Sorun bildir" e-postasının gideceği adres; boşsa düğme gösterilmez */
  readonly VITE_FEEDBACK_EMAIL?: string
}

declare const __APP_VERSION__: string
declare const __APP_COMMIT__: string
declare const __APP_BUILD_DATE__: string
