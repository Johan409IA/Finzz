import { createSignal } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { insforge } from '../lib/insforge'
import { useAuth } from '../lib/auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [name, setName] = createSignal('')
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [error, setError] = createSignal<string | null>(null)
  const [info, setInfo] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(false)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const { data, error: authError } = await insforge.auth.signUp({
        email: email(),
        password: password(),
        name: name() || undefined,
        redirectTo: `${window.location.origin}/login`,
      })
      if (authError) {
        setError(authError.message)
        return
      }
      if (data?.requireEmailVerification) {
        setInfo('Te enviamos un enlace de verificación a tu email. Ábrelo para confirmar tu cuenta.')
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
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Nombre
          <input
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            autocomplete="name"
          />
        </label>
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
            minLength={6}
            autocomplete="new-password"
          />
        </label>
        {error() && <p class="auth-error" role="alert">{error()}</p>}
        {info() && <p class="auth-info" role="status">{info()}</p>}
        <button type="submit" disabled={loading()}>
          {loading() ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
      <p>
        ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
      </p>
    </div>
  )
}
