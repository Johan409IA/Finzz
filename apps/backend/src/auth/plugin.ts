import type { FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { AuthContext, AuthUser } from './types'

export interface AuthPluginOptions {
  /** JWKS URL pública del proyecto InsForge (tokens RS256). */
  jwksUrl: string
  /** Secreto HS256 opcional: fallback para tokens legacy/internos. */
  hs256Secret?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    auth?: AuthContext
  }

  interface FastifyContextConfig {
    public?: boolean
  }
}

const REQUIRED_CLAIMS = ['sub', 'role', 'exp'] as const

function unauthorized(message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number }
  error.statusCode = 401
  return error
}

function parseAuthorizationHeader(request: FastifyRequest): string | null {
  const header = request.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

function hasRequiredClaims(payload: JWTPayload): payload is JWTPayload & {
  sub: string
  role: string
  exp: number
} {
  return REQUIRED_CLAIMS.every((claim) => {
    const value = payload[claim]
    if (value === undefined || value === null) return false
    if (claim === 'exp' && typeof value !== 'number') return false
    return typeof value === 'string' || typeof value === 'number'
  })
}

export default fp<AuthPluginOptions>(async (fastify, options) => {
  const jwks = createRemoteJWKSet(new URL(options.jwksUrl))

  fastify.decorateRequest('auth', undefined)

  fastify.addHook('preHandler', async (request, reply: FastifyReply) => {
    if (!request.routeOptions.config.public) {
      const token = parseAuthorizationHeader(request)

      if (!token) {
        throw unauthorized('Falta el token de autenticación')
      }

      let payload: JWTPayload

      try {
        ;({ payload } = await jwtVerify(token, jwks, { algorithms: ['RS256'] }))
      } catch (rs256Error) {
        if (!options.hs256Secret) throw unauthorized('Token inválido o expirado')

        try {
          ;({ payload } = await jwtVerify(token, new TextEncoder().encode(options.hs256Secret), {
            algorithms: ['HS256'],
          }))
        } catch {
          throw unauthorized('Token inválido o expirado')
        }
      }

      if (!hasRequiredClaims(payload)) {
        throw unauthorized('El token no contiene todos los claims requeridos')
      }

      const user: AuthUser = {
        usuarioId: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : '',
        role: payload.role,
      }

      request.auth = { user, tokenPayload: payload }
    }
  })
})
