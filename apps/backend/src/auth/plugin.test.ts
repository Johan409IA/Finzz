import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { SignJWT, generateKeyPair, exportJWK } from 'jose'
import { createApp } from '../index'

const HS256_SECRET = 'hs256-test-secret-1234567890'

let privateKey!: CryptoKey
let otherPrivateKey!: CryptoKey
let jwks!: Record<string, unknown>
let jwksServer!: ReturnType<typeof Bun.serve>

beforeAll(async () => {
  const { publicKey, privateKey: priv } = await generateKeyPair('RS256')
  privateKey = priv

  const { privateKey: otherPriv } = await generateKeyPair('RS256')
  otherPrivateKey = otherPriv

  const jwk = await exportJWK(publicKey)
  jwks = {
    keys: [
      {
        ...jwk,
        kid: 'test-kid',
        alg: 'RS256',
        use: 'sig',
      },
    ],
  }

  jwksServer = Bun.serve({
    port: 0,
    fetch() {
      return new Response(JSON.stringify(jwks), {
        headers: { 'content-type': 'application/json' },
      })
    },
  })
})

afterAll(() => {
  jwksServer.stop()
})

async function signRs256(claims: Record<string, unknown>, opts?: { private?: CryptoKey; kid?: string; expired?: boolean }) {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'RS256', kid: opts?.kid ?? 'test-kid' })
    .setIssuedAt()
    .setExpirationTime(opts?.expired ? '-1h' : '1h')
    .sign(opts?.private ?? privateKey)
}

async function signHs256(claims: Record<string, unknown>) {
  return new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(new TextEncoder().encode(HS256_SECRET))
}

function makeApp(opts?: { hs256Secret?: string }) {
  return createApp({
    jwksUrl: `http://127.0.0.1:${jwksServer.port}/.well-known/jwks.json`,
    hs256Secret: opts?.hs256Secret,
    corsOrigin: ['http://localhost:5173'],
    port: 0,
  })
}

const validClaims = {
  sub: '4e7a0f3e-232e-4e3a-bda2-495b1324b266',
  email: 'user@example.com',
  role: 'authenticated',
}

describe('auth plugin (RS256 vía JWKS de InsForge)', () => {
  test('permite acceso a rutas públicas sin token', async () => {
    const app = makeApp()
    const res = await app.inject({ method: 'GET', url: '/api/health' })
    expect(res.statusCode).toBe(200)
    await app.close()
  })

  test('rechaza request sin token en ruta protegida con 401', async () => {
    const app = makeApp()
    const res = await app.inject({ method: 'GET', url: '/api/auth/me' })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  test('acepta token RS256 válido y expone usuarioId desde sub', async () => {
    const app = makeApp()
    const token = await signRs256(validClaims)
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.user.usuarioId).toBe('4e7a0f3e-232e-4e3a-bda2-495b1324b266')
    expect(body.user.email).toBe('user@example.com')
    expect(body.user.role).toBe('authenticated')
    await app.close()
  })

  test('rechaza token RS256 con firma de otra clave', async () => {
    const app = makeApp()
    const token = await signRs256(validClaims, { private: otherPrivateKey })
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  test('rechaza token RS256 expirado', async () => {
    const app = makeApp()
    const token = await signRs256(validClaims, { expired: true })
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  test('rechaza token sin claims obligatorios (sin role)', async () => {
    const app = makeApp()
    const token = await signRs256({ sub: 'user-123', email: 'user@example.com' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  test('rechaza token con kid desconocido', async () => {
    const app = makeApp()
    const token = await signRs256(validClaims, { kid: 'kid-desconocido' })
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  test('acepta token HS256 como fallback cuando se configura el secreto', async () => {
    const app = makeApp({ hs256Secret: HS256_SECRET })
    const token = await signHs256(validClaims)
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json().user.usuarioId).toBe(validClaims.sub)
    await app.close()
  })

  test('rechaza token HS256 cuando no se configura el secreto', async () => {
    const app = makeApp()
    const token = await signHs256(validClaims)
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(401)
    await app.close()
  })

  test('ignora usuario_id enviado por el cliente y usa el sub del token', async () => {
    const app = makeApp()
    const token = await signRs256(validClaims)
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me?usuario_id=attacker-id',
      headers: {
        authorization: `Bearer ${token}`,
        'x-usuario-id': 'attacker-id',
      },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.user.usuarioId).toBe(validClaims.sub)
    expect(body.user.usuarioId).not.toBe('attacker-id')
    await app.close()
  })
})
