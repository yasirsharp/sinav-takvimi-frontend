import { apiClient } from './client'
import { unwrap, unwrapData } from './result'
import type { ApiResult } from './types'
import type { CreatedAccount } from './account'

export interface UserWithRoles {
  id: number
  firstName: string
  lastName: string
  email: string
  userName: string
  status: boolean
  mustChangePassword: boolean
  createdDate: string
  roles: string[]
}

export interface UserUpdateValues {
  firstName: string
  lastName: string
  email: string
  userName: string
  status: boolean
}

export interface OperationClaim {
  id: number
  name: string
}

export interface UserOperationClaim {
  id: number
  userId: number
  operationClaimId: number
}

export const userApi = {
  listWithRoles: () => unwrapData(apiClient.get<ApiResult<UserWithRoles[]>>('/api/User/with-roles')),
  update: (id: number, values: UserUpdateValues) =>
    unwrap(apiClient.put<ApiResult<null>>('/api/User', { id, ...values })),
  remove: (id: number) => unwrap(apiClient.delete<ApiResult<null>>(`/api/User/${id}`)),
  resetPassword: (id: number) =>
    unwrapData(apiClient.post<ApiResult<CreatedAccount>>(`/api/User/${id}/reset-password`)),
}

export const roleApi = {
  /** Sistemdeki roller (veritabanında sabit tohum verisi) */
  list: () => unwrapData(apiClient.get<ApiResult<OperationClaim[]>>('/api/OperationClaim')),
  userClaims: (userId: number) =>
    unwrapData(apiClient.get<ApiResult<UserOperationClaim[]>>(`/api/UserOperationClaim/user/${userId}`)),
  add: (userId: number, operationClaimId: number) =>
    unwrap(apiClient.post<ApiResult<null>>('/api/UserOperationClaim', { userId, operationClaimId })),
  remove: (claim: UserOperationClaim) =>
    unwrap(apiClient.delete<ApiResult<null>>('/api/UserOperationClaim', { data: claim })),
}
