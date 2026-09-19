import { A, useLocation, useNavigate } from '@solidjs/router'
import { For, Show } from 'solid-js'
import { getInitials } from '../lib/history'
import { useAuth } from '../lib/auth'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '▦' },
  { href: '/historial', label: 'Historial', icon: '🕘' },
]

const activeLinkClass = 'bg-emerald-500/15 font-semibold text-emerald-700'
const inactiveLinkClass = 'text-finzz-text hover:bg-finzz-accent-bg hover:text-finzz-heading'

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const isActive = (href: string) => location.pathname === href || location.pathname.startsWith(`${href}/`)
  const displayName = () => user()?.profile?.name || user()?.email || 'Usuario'

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header class="fixed inset-x-0 top-0 z-20 border-b border-finzz-border bg-finzz-surface lg:hidden">
        <div class="flex items-center gap-2 px-4 py-3">
          <img src="/apple-touch-icon.png" alt="Logotipo de Finzz" class="h-8 w-8 rounded-lg object-contain" />
          <span class="text-lg font-bold tracking-tight text-finzz-heading">Finzz</span>
          <nav aria-label="Principal" class="ml-2 flex flex-1 items-center gap-1">
            <For each={NAV_ITEMS}>
              {(item) => (
                <A
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  class={`rounded-md px-3 py-2 text-sm transition-colors ${isActive(item.href) ? activeLinkClass : inactiveLinkClass}`}
                >
                  {item.label}
                </A>
              )}
            </For>
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            class="rounded-md border border-finzz-border bg-transparent px-2.5 py-2 text-xs text-finzz-heading"
          >
            Salir
          </button>
        </div>
      </header>

      <aside class="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-finzz-border bg-finzz-surface lg:flex">
        <div class="flex items-center gap-3 px-5 pb-6 pt-7">
          <img src="/apple-touch-icon.png" alt="Logotipo de Finzz" class="h-10 w-10 rounded-xl object-contain" />
          <div>
            <p class="m-0 text-xs font-bold uppercase tracking-[0.1em] text-finzz-accent">Finanzas personales</p>
            <p class="m-0 text-xl font-bold tracking-tight text-finzz-heading">Finzz</p>
          </div>
        </div>
        <nav aria-label="Principal" class="grid flex-1 content-start gap-1 px-3">
          <For each={NAV_ITEMS}>
            {(item) => (
              <A
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                class={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors ${isActive(item.href) ? activeLinkClass : inactiveLinkClass}`}
              >
                <span aria-hidden="true" class="grid h-7 w-7 place-items-center rounded-md bg-finzz-accent-bg text-base">
                  {item.icon}
                </span>
                {item.label}
              </A>
            )}
          </For>
        </nav>
        <div class="border-t border-finzz-border p-4">
          <div class="flex items-center gap-3">
            <span
              aria-hidden="true"
              class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-700"
            >
              {getInitials(user()?.profile?.name, user()?.email)}
            </span>
            <span class="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold text-finzz-heading">
              {displayName()}
            </span>
          </div>
          <Show when={user()?.email && user()?.profile?.name}>
            <p class="m-0 mt-1 overflow-hidden text-ellipsis whitespace-nowrap pl-[3.25rem] text-xs">{user()?.email}</p>
          </Show>
          <button
            type="button"
            onClick={handleSignOut}
            class="mt-3 w-full rounded-md border border-finzz-border bg-transparent px-3 py-2 text-sm text-finzz-heading transition-colors hover:bg-finzz-accent-bg"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
