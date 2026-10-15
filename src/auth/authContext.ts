import { createContext } from 'react'
import type { CurrentUser } from './jwt'

export interface AuthContextValue {
  user: CurrentUser | null
  login: (identifier: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
