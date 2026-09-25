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

const activeLinkClass = 'border border-finzz-border/70 bg-finzz-surface-2 text-finzz-heading'
const inactiveLinkClass =
  'border border-transparent text-finzz-text hover:bg-finzz-accent-bg/60 hover:text-finzz-heading'

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
      <header class="fixed inset-x-0 top-0 z-30 border-b border-finzz-border/80 bg-finzz-bg/95 backdrop-blur lg:hidden">
        <div class="flex items-center gap-3 px-4 py-3">
          <img src="/logo.png" alt="Finzz" class="h-10 w-auto object-contain" />
          <nav aria-label="Principal" class="ml-auto flex items-center gap-1">
            <For each={NAV_ITEMS}>
              {(item) => (
                <A
                  href={item.href}
                  aria-label={item.label}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  class={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                    isActive(item.href)
                      ? 'border border-finzz-border/70 bg-finzz-surface-2 text-finzz-accent'
                      : 'border border-transparent text-finzz-muted hover:bg-finzz-accent-bg/60 hover:text-finzz-heading'
                  }`}
                >
                  {item.icon(isActive(item.href) ? activeIconClass : inactiveIconClass)}
                </A>
              )}
            </For>
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            class="rounded-xl border border-finzz-border-strong/80 px-3 py-2 text-xs font-medium text-finzz-heading"
          >
            Salir
          </button>
        </div>
      </header>

        <aside class="hidden lg:sticky lg:top-0 lg:flex lg:h-full lg:w-[15.5rem] lg:shrink-0 lg:p-2">
        <div class="flex min-h-0 flex-1 flex-col rounded-2xl border border-finzz-border/80 bg-gradient-to-b from-finzz-surface-2/70 to-finzz-bg-soft/40 p-3">
          <div class="flex items-center justify-center px-2 pb-4 pt-2">
            <img src="/logo.png" alt="Finzz" class="h-14 w-auto object-contain" />
          </div>

          <nav aria-label="Principal" class="grid content-start gap-1.5">
            <For each={NAV_ITEMS}>
              {(item) => (
                <A
                  href={item.href}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  class={`relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
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
