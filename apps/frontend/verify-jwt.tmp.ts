import { createClient } from '@insforge/sdk'
import { jwtVerify } from 'jose'

const client = createClient({
  baseUrl: 'https://t6jpeshp.us-west.insforge.app',
  anonKey: 'anon_eac2f720b027ef3fe8331ff40ae9596016b5d166d6edd3135b8755d60cd3b75c',
  isServerMode: true,
})

const { data, error } = await client.auth.signInWithPassword({
  email: 'test-1787845808749@finzz.test',
  password: 'FinzzTest123',
})

if (error || !data?.accessToken) {
  console.log(JSON.stringify({ error: error?.message ?? 'no token' }))
  process.exit(1)
}

const token = data.accessToken
const secret = new TextEncoder().encode('dd57c323a599f2f60690c1e4ba8a84659199f058')

const [, payload] = token.split('.')
const header = JSON.parse(Buffer.from(token.split('.')[0]!, 'base64url').toString('utf8'))
console.log(JSON.stringify({ header, claims: JSON.parse(Buffer.from(payload!, 'base64url').toString('utf8')) }))

try {
  const { payload: verified } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
  console.log(JSON.stringify({ verifyNoConstraints: 'OK', sub: verified.sub }))
} catch (e) {
  console.log(JSON.stringify({ verifyNoConstraints: 'FAIL', message: (e as Error).message }))
}

try {
  await jwtVerify(token, secret, {
    algorithms: ['HS256'],
    issuer: 'insforge',
    audience: 'insforge-api',
  })
  console.log(JSON.stringify({ verifyWithCurrentBackendConfig: 'OK' }))
} catch (e) {
  console.log(JSON.stringify({ verifyWithCurrentBackendConfig: 'FAIL', message: (e as Error).message }))
}
