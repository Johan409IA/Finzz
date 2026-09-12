import { createContext, useContext, createSignal, onMount, type ParentProps } from 'solid-js'
import type { UserSchema } from '@insforge/sdk'
import { insforge } from './insforge'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthContextValue {
  status: () => AuthStatus
  user: () => UserSchema | null
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>()
const SESSION_TIMEOUT_MS = 3_000

async function getCurrentUserWithTimeout() {
  let timeoutId: number | undefined
  try {
    return await Promise.race([
      insforge.auth.getCurrentUser(),
      new Promise<null>((resolve) => {
        timeoutId = window.setTimeout(() => resolve(null), SESSION_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  }
}

export function AuthProvider(props: ParentProps) {
  const [status, setStatus] = createSignal<AuthStatus>('loading')
  const [user, setUser] = createSignal<UserSchema | null>(null)

  async function refresh() {
    setStatus('loading')

    try {
      const result = await getCurrentUserWithTimeout()
      const currentUser = result?.data?.user ?? null
      setUser(currentUser)
      setStatus(currentUser ? 'authenticated' : 'anonymous')
    } catch {
      setUser(null)
      setStatus('anonymous')
    }
  }

  async function signOut() {
    await insforge.auth.signOut()
    setUser(null)
    setStatus('anonymous')
  }

  onMount(() => {
    void refresh()
  })

  return (
    <AuthContext.Provider value={{ status, user, refresh, signOut }}>
      {props.children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
