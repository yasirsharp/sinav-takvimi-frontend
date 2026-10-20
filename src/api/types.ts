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

/**
 * ExceptionMiddleware'in FluentValidation hatası için döndürdüğü biçim.
 * Güncel backend camelCase döner ({ success, message, errors }); eski sürüm PascalCase dönüyordu.
 */
export interface ValidationErrorResponse {
  success?: false
  message?: string
  errors?: { propertyName: string; errorMessage: string }[]
  Message?: string
  StatusCode?: number
  Errors?: { PropertyName: string; ErrorMessage: string }[]
}

export interface LoginRequest {
  email?: string
  userName?: string
  password: string
}
