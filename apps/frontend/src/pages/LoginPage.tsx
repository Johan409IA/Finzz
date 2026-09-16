import { createSignal, onMount, type ParentProps } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { insforge } from '../lib/insforge'
import { useAuth } from '../lib/auth'

const inputClass =
  'w-full box-border rounded-md border border-finzz-border bg-finzz-bg px-3 py-2.5 text-finzz-heading'
const labelClass = 'grid gap-1.5 text-left text-sm text-finzz-heading'

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
    <div class="mx-auto w-[min(100%-2rem,1120px)] max-w-md px-4 py-16">
      <div class="mb-8 flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="Logotipo de Finzz" class="h-16 w-16 rounded-2xl object-contain" />
        <h1 class="m-0 text-4xl font-medium tracking-tight text-finzz-heading">Iniciar sesión</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        class="grid gap-4 rounded-xl border border-finzz-border bg-finzz-surface p-6"
      >
        <label class={labelClass}>
          Email
          <input
            type="email"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            required
            autocomplete="email"
            class={inputClass}
          />
        </label>
        <label class={labelClass}>
          Contraseña
          <input
            type="password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            autocomplete="current-password"
            class={inputClass}
          />
        </label>
        {error() && <p class="text-finzz-danger" role="alert">{error()}</p>}
        {info() && <p class="text-finzz-success" role="status">{info()}</p>}
        <button
          type="submit"
          disabled={loading()}
          class="rounded-md border border-transparent bg-finzz-accent px-3 py-2 text-sm text-white transition-colors hover:bg-finzz-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
        >
          {loading() ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p class="mt-4 text-center">
        ¿No tienes cuenta? <a class="underline" href="/registro">Regístrate</a>
      </p>
    </div>
  )
}

export function AuthLayout(props: ParentProps) {
  return <main>{props.children}</main>
}
