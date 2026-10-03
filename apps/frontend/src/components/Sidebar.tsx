import { A, useLocation, useNavigate } from '@solidjs/router'
import { For, Show } from 'solid-js'
import LayoutDashboardIcon from 'lucide-solid/icons/layout-dashboard'
import ListIcon from 'lucide-solid/icons/list'
import LogOutIcon from 'lucide-solid/icons/log-out'
import { getInitials } from '../lib/history'
import { ghostButtonClass } from '../lib/ui'
import { useAuth } from '../lib/auth'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (iconClass: string) => (
      <LayoutDashboardIcon size={18} strokeWidth={2} class={iconClass} aria-hidden="true" />
    ),
  },
  {
    href: '/historial',
    label: 'Historial',
    icon: (iconClass: string) => <ListIcon size={18} strokeWidth={2} class={iconClass} aria-hidden="true" />,
  },
]

const activeLinkClass =
  'border border-finzz-border/70 bg-finzz-surface-2 text-finzz-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-finzz-accent'
const inactiveLinkClass =
  'border border-transparent text-finzz-text transition-[background-color,color,border-color,transform] hover:bg-finzz-accent-bg/60 hover:text-finzz-heading active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-finzz-accent'

const activeIconClass = 'text-finzz-accent'
const inactiveIconClass = 'text-finzz-muted'

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
      <header class="fixed inset-x-0 top-0 z-30 border-b border-finzz-border/80 bg-finzz-bg/95 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
          <img src="/logo.png" alt="Finzz" class="h-9 w-auto shrink-0 object-contain" />
          <span class="hidden min-w-0 truncate text-sm font-semibold text-finzz-heading sm:block">
            {displayName()}
          </span>
          <nav aria-label="Principal" class="ml-auto hidden items-center gap-1 sm:flex">
            <For each={NAV_ITEMS}>
              {(item) => (
                <A
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  class={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-finzz-accent ${
                    isActive(item.href)
                      ? 'border-finzz-border/70 bg-finzz-surface-2 text-finzz-accent'
                      : 'border-transparent text-finzz-text hover:bg-finzz-accent-bg/60 hover:text-finzz-heading'
                  }`}
                >
                  {item.icon(isActive(item.href) ? activeIconClass : inactiveIconClass)}
                  {item.label}
                </A>
              )}
            </For>
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Cerrar sesión"
            class="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-finzz-border-strong/80 text-finzz-heading transition-colors hover:border-finzz-accent/60 hover:bg-finzz-accent-bg active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-finzz-accent sm:w-auto sm:px-3"
          >
            <LogOutIcon size={17} strokeWidth={2} aria-hidden="true" />
            <span class="hidden text-xs font-medium sm:inline">Cerrar sesión</span>
          </button>
        </div>
        <nav aria-label="Principal" class="grid grid-cols-2 gap-2 border-t border-finzz-border/50 px-4 py-2 sm:hidden">
          <For each={NAV_ITEMS}>
            {(item) => (
              <A
                href={item.href}
                aria-current={isActive(item.href) ? 'page' : undefined}
                class={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-finzz-accent ${
                  isActive(item.href)
                    ? 'border-finzz-border/70 bg-finzz-surface-2 text-finzz-accent'
                    : 'border-transparent text-finzz-text hover:bg-finzz-accent-bg/60 hover:text-finzz-heading'
                }`}
              >
                {item.icon(isActive(item.href) ? activeIconClass : inactiveIconClass)}
                {item.label}
              </A>
            )}
          </For>
        </nav>
      </header>

        <aside class="hidden lg:sticky lg:top-0 lg:flex lg:h-full lg:w-[15.5rem] lg:shrink-0 lg:p-2">
        <div class="flex min-h-0 flex-1 flex-col rounded-2xl border border-finzz-border/80 bg-finzz-surface/80 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
          <div class="flex items-center justify-center px-2 pb-4 pt-2">
            <img src="/logo.png" alt="Finzz" class="h-14 w-auto object-contain" />
          </div>

          <nav aria-label="Principal" class="grid content-start gap-1.5">
            <For each={NAV_ITEMS}>
              {(item) => (
                <A
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  class={`relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-[background-color,color,border-color,transform] active:scale-[0.98] ${
                    isActive(item.href) ? activeLinkClass : inactiveLinkClass
                  }`}
                >
                  <span
                    aria-hidden="true"
                    class={`absolute inset-y-2 left-0 w-1 rounded-r-full bg-finzz-accent transition-opacity ${
                      isActive(item.href) ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {item.icon(isActive(item.href) ? activeIconClass : inactiveIconClass)}
                  {item.label}
                </A>
              )}
            </For>
          </nav>

          <div class="mt-auto grid gap-3 border-t border-finzz-border/70 pt-4">
            <div class="flex items-center gap-3 px-1">
              <span
                aria-hidden="true"
                class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-finzz-accent-border/60 bg-finzz-accent/15 text-sm font-bold text-finzz-accent"
              >
                {getInitials(user()?.profile?.name, user()?.email)}
              </span>
              <span class="grid min-w-0">
                <span class="truncate text-sm font-semibold text-finzz-heading">{displayName()}</span>
                <Show when={user()?.email && user()?.profile?.name}>
                  <span class="truncate text-xs text-finzz-text">{user()?.email}</span>
                </Show>
              </span>
            </div>
            <button type="button" onClick={handleSignOut} class={`${ghostButtonClass} w-full`}>
              <LogOutIcon size={16} strokeWidth={2} aria-hidden="true" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
