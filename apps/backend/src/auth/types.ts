import type { JWTPayload } from 'jose'

export interface AuthUser {
  usuarioId: string
  email: string
  role: string
}

export interface AuthContext {
  user: AuthUser
  token: string
  tokenPayload: JWTPayload
}
