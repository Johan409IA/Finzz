import CalendarIcon from 'lucide-solid/icons/calendar'
import PlusIcon from 'lucide-solid/icons/plus'
import { formatTodayLong } from '../lib/format'
import { pageHeaderClass, primaryButtonClass } from '../lib/ui'

interface PageHeaderProps {
  title: string
  subtitle: string
  onCreate: () => void
  class?: string
}

export default function PageHeader(props: PageHeaderProps) {
  return (
    <section class={`${pageHeaderClass} ${props.class ?? ''}`}>
      <div>
        <h1 class="mb-1.5 mt-0 text-2xl font-bold leading-none tracking-tight text-finzz-heading sm:text-4xl">
          {props.title}
        </h1>
        <p class="m-0 text-finzz-text">{props.subtitle}</p>
      </div>
      <div
        class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end"
      >
        <span class="inline-flex items-center gap-2 text-sm text-finzz-text">
          <CalendarIcon size={16} strokeWidth={2} class="text-finzz-accent" aria-hidden="true" />
          <span class="capitalize">{formatTodayLong()}</span>
        </span>
        <button type="button" onClick={props.onCreate} class={`${primaryButtonClass} w-full sm:w-auto`}>
          <PlusIcon size={16} strokeWidth={2.4} aria-hidden="true" />
          Registrar gasto
        </button>
      </div>
    </section>
  )
}
