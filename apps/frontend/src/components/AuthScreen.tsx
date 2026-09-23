import type { JSX } from 'solid-js'

const labelClass = 'grid gap-2 text-left text-base font-medium text-[#f4f7fb]'

const inputClass =
  'h-12 w-full box-border rounded-xl border border-[#416184] bg-[#0a2948]/70 pl-12 pr-4 text-base text-white outline-none placeholder:text-[#7690ad] transition focus:border-[#23e4b4] focus:ring-2 focus:ring-[#23e4b4]/20'

const iconClass = 'pointer-events-none absolute inset-y-0 left-4 grid w-5 place-items-center text-[#91afd0]'

export const authSubmitClass =
  'mt-1 h-12 rounded-xl border border-transparent bg-[#1ce3b7] px-3 text-base font-bold text-[#03263c] shadow-[0_8px_22px_rgba(28,227,183,0.18)] transition hover:bg-[#35efc5] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#69f8d7] disabled:cursor-not-allowed disabled:opacity-55'

export const authLinkClass =
  'font-semibold text-[#19e6be] underline decoration-[#19e6be]/60 underline-offset-4 transition hover:text-[#6cf6d3] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-[#69f8d7]'

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
    <main class="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-[#041b31] px-4 py-10 text-[#dbe7f4] sm:px-6">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div class="absolute -left-20 -top-24 h-80 w-80 rounded-full bg-[#0b6e91]/20 blur-3xl" />
        <div class="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#0b5c87]/20 blur-3xl" />
        <div class="absolute -right-20 -top-36 h-96 w-96 rounded-full bg-[#14b8b0]/15 blur-3xl" />
        <svg class="absolute inset-x-0 top-[34%] h-52 w-full min-w-[900px] text-[#1bcfbd]/45" viewBox="0 0 1440 220" fill="none" preserveAspectRatio="none">
          <path d="M-40 146C94 252 169 28 330 100S583 247 765 125 1023 16 1166 98s204 50 314-22" stroke="currentColor" stroke-width="1.2" />
          <path d="M-40 160C94 266 169 42 330 114S583 261 765 139 1023 30 1166 112s204 50 314-22" stroke="currentColor" stroke-opacity=".14" stroke-width="18" />
          <circle cx="199" cy="103" r="6" fill="#20e1ba" />
          <circle cx="1326" cy="76" r="6" fill="#20e1ba" />
        </svg>
      </div>

      <div class="relative z-10 flex w-full max-w-[514px] flex-col items-center text-center">
        <div class="mb-7 flex flex-col items-center gap-5 sm:mb-8">
          <img src="/logo.png" alt="Logotipo de Finzz" class="h-auto w-[138px] object-contain drop-shadow-[0_0_24px_rgba(18,182,194,0.18)] sm:w-[145px]" />
          <div>
            <h1 class="m-0 text-[2.15rem] font-bold leading-tight tracking-[-0.035em] text-white sm:text-[2.35rem]">{props.title}</h1>
            <p class="m-0 mt-2 text-base text-[#afc0d4] sm:text-lg">{props.subtitle}</p>
          </div>
        </div>

        <form
          onSubmit={props.onSubmit}
          class="grid w-full gap-5 rounded-2xl border border-[#17618b] bg-[#062b49]/75 p-7 shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-8"
        >
          {props.children}
        </form>

        <div class="mt-24 flex w-full items-center gap-5 text-[0.68rem] font-medium uppercase tracking-[0.34em] text-[#859ab3] sm:mt-28">
          <span class="h-px flex-1 bg-[#547089]/50" />
          <span>Finanzas más simples, una vida mejor</span>
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
  required?: boolean
  autocomplete?: string
  placeholder?: string
  minLength?: number
}

export function AuthField(props: AuthFieldProps) {
  return (
    <label class={labelClass}>
      {props.label}
      <span class="relative block">
        <span class={iconClass}>{props.icon}</span>
        <input
          type={props.type}
          value={props.value}
          onInput={(event) => props.onInput(event.currentTarget.value)}
          required={props.required}
          autocomplete={props.autocomplete}
          placeholder={props.placeholder}
          minLength={props.minLength}
          class={inputClass}
        />
      </span>
    </label>
  )
}
