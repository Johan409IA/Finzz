import { createSignal } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import Lock from 'lucide-solid/icons/lock'
import Mail from 'lucide-solid/icons/mail'
import User from 'lucide-solid/icons/user'
import { AuthField, AuthScreen, authErrorClass, authInfoClass, authLinkClass, authLinkLineClass, authSubmitClass } from '../components/AuthScreen'
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
    <AuthScreen
      title="Crear cuenta"
      subtitle="Crea tu cuenta para empezar a controlar tus gastos personales"
      onSubmit={handleSubmit}
    >
      <AuthField
        label="Nombre"
        icon={<User size={20} strokeWidth={1.8} />}
        type="text"
        value={name()}
        onInput={setName}
        autocomplete="name"
        placeholder="Tu nombre"
      />
      <AuthField
        label="Email"
        icon={<Mail size={20} strokeWidth={1.8} />}
        type="email"
        value={email()}
        onInput={setEmail}
        required
        autocomplete="email"
        placeholder="tu@email.com"
      />
      <AuthField
        label="Contraseña"
        icon={<Lock size={20} strokeWidth={1.8} />}
        type="password"
        value={password()}
        onInput={setPassword}
        required
        autocomplete="new-password"
        placeholder="••••••••"
        minLength={6}
      />
      {error() && <p class={authErrorClass} role="alert">{error()}</p>}
      {info() && <p class={authInfoClass} role="status">{info()}</p>}
      <button type="submit" disabled={loading()} class={authSubmitClass}>
        {loading() ? 'Creando…' : 'Crear cuenta'}
      </button>
      <p class={authLinkLineClass}>
        ¿Ya tienes una cuenta? <a class={authLinkClass} href="/login">Inicia sesión</a>
      </p>
    </AuthScreen>
  )
}
