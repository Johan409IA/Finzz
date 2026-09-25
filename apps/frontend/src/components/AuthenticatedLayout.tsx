import type { RouteSectionProps } from '@solidjs/router'
import Sidebar from '../components/Sidebar'

export default function AuthenticatedLayout(props: RouteSectionProps) {
  return (
    <div class="relative isolate min-h-svh w-full overflow-x-hidden bg-finzz-bg text-finzz-text lg:h-svh lg:overflow-hidden">
      <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div class="absolute -left-24 -top-32 h-72 w-72 rounded-full bg-[#0b6e91]/20 blur-3xl" />
        <div class="absolute -right-28 top-1/4 h-80 w-80 rounded-full bg-[#14b8b0]/10 blur-3xl" />
        <div class="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-[#0b5c87]/20 blur-3xl" />
      </div>

      <div class="mx-auto flex min-h-svh w-full max-w-none flex-col lg:h-full lg:min-h-0 lg:flex-row">
        <Sidebar />
          <main class="min-w-0 flex-1 px-4 pb-16 pt-24 sm:px-6 lg:h-full lg:min-h-0 lg:overflow-hidden lg:pl-2 lg:pr-3.5 lg:pb-4 lg:pt-5">
          {props.children}
        </main>
      </div>
    </div>
  )
}
