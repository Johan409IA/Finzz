import { createSignal, onMount, type ParentProps } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { insforge } from '../lib/insforge'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [info, setInfo] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(false)

  onMount(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('insforge_status')
    const type = params.get('insforge_type')
    const verificationError = params.get('insforge_error')

    if (type === 'verify_email' && status === 'success') {
      setInfo('Email verificado correctamente. Ahora inicia sesión con tu email y contraseña.')
    } else if (type === 'verify_email' && status === 'error') {
      setError(verificationError || 'No se pudo verificar el email. Solicita un nuevo enlace.')
    }

    if (status || type || verificationError) {
      window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.hash}`)
    }
  })

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const { error: authError } = await insforge.auth.signInWithPassword({
        email: email(),
        password: password(),
      })
      if (authError) {
        setError(
          authError.statusCode === 403
            ? 'Tu email aún no está verificado. Revisa el enlace de verificación.'
            : 'Credenciales incorrectas. Inténtalo de nuevo.',
        )
        return
      }
      await refresh()
      navigate('/dashboard', { replace: true })
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div class="auth-container">
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            required
            autocomplete="email"
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            autocomplete="current-password"
          />
        </label>
        {error() && <p class="auth-error" role="alert">{error()}</p>}
        {info() && <p class="auth-info" role="status">{info()}</p>}
        <button type="submit" disabled={loading()}>
          {loading() ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p>
        ¿No tienes cuenta? <a href="/registro">Regístrate</a>
      </p>
    </div>
  )
}

export function AuthLayout(props: ParentProps) {
  return <main>{props.children}</main>
}
