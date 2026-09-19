import type { RouteSectionProps } from '@solidjs/router'
import Sidebar from '../components/Sidebar'

export default function AuthenticatedLayout(props: RouteSectionProps) {
  return (
    <div class="min-h-svh w-full bg-finzz-bg text-finzz-text lg:mx-auto lg:flex lg:max-w-[1126px] lg:border-x lg:border-finzz-border">
      <Sidebar />
      <main class="min-w-0 flex-1 px-4 pb-16 pt-20 lg:px-8 lg:pt-8">{props.children}</main>
    </div>
  )
}
