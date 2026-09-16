import { createSignal } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { insforge } from '../lib/insforge'
import { useAuth } from '../lib/auth'

const inputClass =
  'w-full box-border rounded-md border border-finzz-border bg-finzz-bg px-3 py-2.5 text-finzz-heading'
const labelClass = 'grid gap-1.5 text-left text-sm text-finzz-heading'

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
    <div class="mx-auto w-[min(100%-2rem,1120px)] max-w-md px-4 py-16">
      <div class="mb-8 flex flex-col items-center gap-3 text-center">
        <img src="/logo.png" alt="Logotipo de Finzz" class="h-16 w-16 rounded-2xl object-contain" />
        <h1 class="m-0 text-4xl font-medium tracking-tight text-finzz-heading">Crear cuenta</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        class="grid gap-4 rounded-xl border border-finzz-border bg-finzz-surface p-6"
      >
        <label class={labelClass}>
          Nombre
          <input
            type="text"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
            autocomplete="name"
            class={inputClass}
          />
        </label>
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
            minLength={6}
            autocomplete="new-password"
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
          {loading() ? 'Creando…' : 'Crear cuenta'}
        </button>
      </form>
      <p class="mt-4 text-center">
        ¿Ya tienes cuenta? <a class="underline" href="/login">Inicia sesión</a>
      </p>
    </div>
  )
}
