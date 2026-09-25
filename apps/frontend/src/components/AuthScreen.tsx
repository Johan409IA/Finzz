import { Show, type JSX } from 'solid-js'
import LoaderCircle from 'lucide-solid/icons/loader-circle'

const labelClass = 'grid gap-2 text-left text-base font-medium text-[#f4f7fb]'

const inputClass =
  'h-12 w-full box-border rounded-xl border border-[#416184] bg-[#0a2948]/70 pl-12 pr-4 text-base text-white outline-none transition placeholder:text-[#7690ad] hover:border-[#517a9f] focus:border-[#23e4b4] focus:ring-2 focus:ring-[#23e4b4]/20'

const invalidInputClass =
  'h-12 w-full box-border rounded-xl border border-[#ff8c9b] bg-[#0a2948]/70 pl-12 pr-4 text-base text-white outline-none transition placeholder:text-[#7690ad] focus:border-[#ff8c9b] focus:ring-2 focus:ring-[#ff8c9b]/25'

export function validateEmail(value: string): string | null {
  if (!value.trim()) return 'Escribe tu email.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Escribe un email válido.'
  return null
}

const iconClass = 'pointer-events-none absolute inset-y-0 left-4 grid w-5 place-items-center text-[#91afd0]'

export const authSubmitClass =
  'mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-transparent bg-[#1ce3b7] px-3 text-base font-bold text-[#03263c] shadow-[0_8px_22px_rgba(28,227,183,0.18)] transition touch-manipulation hover:bg-[#35efc5] active:bg-[#12cf9f] active:shadow-[0_4px_14px_rgba(28,227,183,0.12)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#69f8d7] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-[#1ce3b7]'

export const authLinkClass =
  'inline-block py-3 font-semibold text-[#19e6be] underline decoration-[#19e6be]/60 underline-offset-4 transition hover:text-[#6cf6d3] active:text-[#0fd3ad] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[#69f8d7]'

export const authLinkLineClass = 'm-0 text-center text-base text-[#a7bad0]'

export const authErrorClass = 'm-0 text-left text-sm text-[#ff8c9b]'

export const authInfoClass = 'm-0 text-left text-sm text-[#55e3b8]'

interface AuthScreenProps {
  title: string
  subtitle: string
  onSubmit: (event: SubmitEvent) => void
  children: JSX.Element
}

export function AuthScreen(props: AuthScreenProps) {
  return (
    <main class="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[#041b31] px-4 py-8 text-[#dbe7f4] sm:px-6 sm:py-10">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div class="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-[#0b6e91]/20 blur-3xl sm:-left-20 sm:-top-24 sm:h-80 sm:w-80" />
        <div class="absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-[#0b5c87]/20 blur-3xl sm:-bottom-40 sm:-left-32 sm:h-96 sm:w-96" />
        <div class="absolute -right-16 -top-28 h-64 w-64 rounded-full bg-[#14b8b0]/10 blur-3xl sm:-right-20 sm:-top-36 sm:h-96 sm:w-96 sm:bg-[#14b8b0]/15" />
        <svg class="absolute inset-x-0 top-[30%] h-36 w-full min-w-[900px] text-[#1bcfbd]/30 sm:top-[34%] sm:h-52 sm:text-[#1bcfbd]/45" viewBox="0 0 1440 220" fill="none" preserveAspectRatio="none">
          <path d="M-40 146C94 252 169 28 330 100S583 247 765 125 1023 16 1166 98s204 50 314-22" stroke="currentColor" stroke-width="1.2" />
          <path d="M-40 160C94 266 169 42 330 114S583 261 765 139 1023 30 1166 112s204 50 314-22" stroke="currentColor" stroke-opacity=".14" stroke-width="18" />
          <circle cx="199" cy="103" r="6" fill="#20e1ba" />
          <circle cx="1326" cy="76" r="6" fill="#20e1ba" />
        </svg>
      </div>

      <div class="relative z-10 flex w-full max-w-[514px] flex-col items-center text-center">
        <div class="mb-6 flex flex-col items-center gap-4 sm:mb-8 sm:gap-5">
          <img src="/logo.png" alt="Logotipo de Finzz" class="h-auto w-[112px] object-contain drop-shadow-[0_0_24px_rgba(18,182,194,0.18)] sm:w-[138px] lg:w-[145px]" />
          <div>
            <h1 class="m-0 text-[1.75rem] font-bold leading-tight tracking-[-0.035em] text-white sm:text-[2.15rem] lg:text-[2.35rem]">{props.title}</h1>
            <p class="m-0 mt-2 text-base text-[#afc0d4] sm:text-lg">{props.subtitle}</p>
          </div>
        </div>

        <form
          noValidate
          onSubmit={props.onSubmit}
          class="grid w-full gap-4 rounded-2xl border border-[#17618b] bg-[#062b49]/75 p-5 shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:gap-5 sm:p-8"
        >
          {props.children}
        </form>

        <div class="mt-8 flex w-full items-center gap-3 text-[0.6rem] font-medium uppercase tracking-[0.14em] text-[#859ab3] sm:mt-24 sm:gap-5 sm:text-[0.68rem] sm:tracking-[0.34em]">
          <span class="h-px flex-1 bg-[#547089]/50" />
          <span class="min-w-0">Finanzas más simples, una vida mejor</span>
          <span class="h-px flex-1 bg-[#547089]/50" />
        </div>
      </div>
    </main>
  )
}

interface AuthFieldProps {
  label: string
  icon: JSX.Element
  type: 'text' | 'email' | 'password'
  value: string
  onInput: (value: string) => void
  error?: string | null
  inputRef?: (element: HTMLInputElement) => void
  required?: boolean
  autocomplete?: string
  placeholder?: string
  minLength?: number
}

export function AuthField(props: AuthFieldProps) {
  const errorId = () => `${props.label.toLowerCase().replace(/\s+/g, '-')}-error`

  return (
    <label class={labelClass}>
      {props.label}
      <span class="relative block">
        <span class={iconClass}>{props.icon}</span>
        <input
          ref={props.inputRef}
          type={props.type}
          value={props.value}
          onInput={(event) => props.onInput(event.currentTarget.value)}
          required={props.required}
          autocomplete={props.autocomplete}
          placeholder={props.placeholder}
          minLength={props.minLength}
          aria-invalid={props.error ? 'true' : undefined}
          aria-describedby={props.error ? errorId() : undefined}
          class={props.error ? invalidInputClass : inputClass}
        />
      </span>
      <Show when={props.error}>
        {(message) => <span id={errorId()} class="text-left text-sm text-[#ff8c9b]">{message()}</span>}
      </Show>
    </label>
  )
}

interface AuthSubmitButtonProps {
  loading: boolean
  label: string
  loadingLabel: string
}

export function AuthSubmitButton(props: AuthSubmitButtonProps) {
  return (
    <button type="submit" disabled={props.loading} aria-busy={props.loading} class={authSubmitClass}>
      <Show when={props.loading}>
        <LoaderCircle size={18} strokeWidth={2.4} class="animate-spin" aria-hidden="true" />
      </Show>
      <span>{props.loading ? props.loadingLabel : props.label}</span>
    </button>
  )
}
