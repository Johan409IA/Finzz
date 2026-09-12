import { createSignal, onMount } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useAuth } from '../lib/auth'
import { getApiUrl, insforge } from '../lib/insforge'

interface AuthUserResponse {
  usuarioId: string
  email: string
  role: string
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [me, setMe] = createSignal<AuthUserResponse | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  onMount(async () => {
    try {
      const token = await insforge.getHttpClient().getValidAccessToken()
      if (!token) {
        setError('No hay sesión activa')
        return
      }
      const res = await fetch(`${getApiUrl()}/api/auth/me`, {
        headers: { authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setError(`Error del servidor: ${res.status}`)
        return
      }
      const body = await res.json()
      setMe(body.user)
    } catch {
      setError('No se pudo verificar la sesión con el backend')
    }
  })

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div>
      <header>
        <h1>Finzz</h1>
        <button type="button" onClick={handleSignOut}>Cerrar sesión</button>
      </header>
      <main>
        <p>Hola, {user()?.profile?.name || user()?.email}</p>
        {me() ? (
          <p>
            Identidad verificada en el backend: {me()!.usuarioId} ({me()!.email})
          </p>
        ) : (
          <p>{error() ?? 'Verificando sesión…'}</p>
        )}
      </main>
    </div>
  )
}
