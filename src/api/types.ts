/** Backend'deki IResult / IDataResult yanıt biçimi */
export interface ApiResult<T = unknown> {
  success: boolean
  message?: string | null
  data: T
}

/** POST /api/Auth/login başarılı yanıtındaki data alanı */
export interface AccessToken {
  token: string
  expiration: string
}

/** ExceptionMiddleware'in FluentValidation hatası için döndürdüğü biçim */
export interface ValidationErrorResponse {
  Message?: string
  StatusCode?: number
  Errors?: { PropertyName: string; ErrorMessage: string }[]
}

export interface LoginRequest {
  email?: string
  userName?: string
  password: string
}
