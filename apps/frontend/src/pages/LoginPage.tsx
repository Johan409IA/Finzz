import { createSignal, onMount } from 'solid-js'
import { A, useNavigate } from '@solidjs/router'
import Lock from 'lucide-solid/icons/lock'
import Mail from 'lucide-solid/icons/mail'
import {
  AuthField,
  AuthScreen,
  AuthSubmitButton,
  authErrorClass,
  authInfoClass,
  authLinkClass,
  authLinkLineClass,
  validateEmail,
} from '../components/AuthScreen'
import { insforge } from '../lib/insforge'
import { useAuth } from '../lib/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [email, setEmail] = createSignal('')
  const [password, setPassword] = createSignal('')
  const [emailError, setEmailError] = createSignal<string | null>(null)
  const [passwordError, setPasswordError] = createSignal<string | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [info, setInfo] = createSignal<string | null>(null)
  const [loading, setLoading] = createSignal(false)
  let emailInput: HTMLInputElement | undefined
  let passwordInput: HTMLInputElement | undefined

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

  function validateCredentials() {
    const emailMessage = validateEmail(email())
    const passwordMessage = password() ? null : 'Escribe tu contraseña.'
    setEmailError(emailMessage)
    setPasswordError(passwordMessage)

    if (emailMessage) {
      emailInput?.focus()
      return false
    }
    if (passwordMessage) {
      passwordInput?.focus()
      return false
    }
    return true
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    setError(null)
    setInfo(null)
    if (!validateCredentials()) return
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
    <AuthScreen
      title="Iniciar sesión"
      subtitle="Accede para controlar tus gastos personales"
      onSubmit={handleSubmit}
    >
      <AuthField
        label="Email"
        icon={<Mail size={20} strokeWidth={1.8} />}
        type="email"
        value={email()}
        onInput={(value) => {
          setEmail(value)
          setEmailError(null)
        }}
        error={emailError()}
        inputRef={(element) => (emailInput = element)}
        required
        autocomplete="email"
        placeholder="tu@email.com"
      />
      <AuthField
        label="Contraseña"
        icon={<Lock size={20} strokeWidth={1.8} />}
        type="password"
        value={password()}
        onInput={(value) => {
          setPassword(value)
          setPasswordError(null)
        }}
        error={passwordError()}
        inputRef={(element) => (passwordInput = element)}
        required
        autocomplete="current-password"
        placeholder="••••••••"
      />
      {error() && <p class={authErrorClass} role="alert">{error()}</p>}
      {info() && <p class={authInfoClass} role="status">{info()}</p>}
      <AuthSubmitButton loading={loading()} label="Entrar" loadingLabel="Entrando…" />
      <p class={authLinkLineClass}>
        ¿No tienes cuenta? <A class={authLinkClass} href="/registro">Regístrate</A>
      </p>
    </AuthScreen>
  )
}
