import { For, Show, type JSX } from 'solid-js'
import ClockIcon from 'lucide-solid/icons/clock'
import CategoryBadge, { categoryIcon } from './CategoryBadge'
import { categoryChartColor } from '../lib/charts'
import { formatCurrency, formatDate } from '../lib/format'
import { cardClass, cardSubtitleClass, cardTitleClass, tableHeadClass } from '../lib/ui'
import type { Expense } from '../lib/expenses'

interface ExpenseListProps {
  expenses: Expense[]
  loading: boolean
  error: string | null
  title?: string
  subtitle?: string
  action?: JSX.Element
}

export default function ExpenseList(props: ExpenseListProps) {
  return (
    <section aria-labelledby="expense-list-title" class={`dashboard-list-card ${cardClass} p-3 text-left lg:px-5 lg:pt-4 lg:pb-4`}>
      <header class="mb-2 flex flex-wrap items-start justify-between gap-2 lg:mb-0">
        <div class="flex items-start gap-3 lg:gap-7">
          <span
            aria-hidden="true"
            class="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-finzz-info/15 text-finzz-info lg:h-12 lg:w-12"
          >
            <ClockIcon size={20} strokeWidth={2} />
          </span>
          <div class="min-w-0">
            <h2 id="expense-list-title" class={cardTitleClass}>
              {props.title ?? 'Tus gastos'}
            </h2>
            <Show when={props.subtitle}>
              <p class={cardSubtitleClass}>{props.subtitle}</p>
            </Show>
          </div>
        </div>
        <Show when={props.action}>{props.action}</Show>
      </header>

      <Show when={props.loading}>
        <div class="grid gap-2" aria-busy="true" aria-label="Cargando gastos">
          <For each={[1, 2, 3, 4, 5]}>
            {() => <div class="h-12 animate-pulse rounded-xl bg-finzz-code/70" />}
          </For>
        </div>
      </Show>

      <Show when={!props.loading && props.error}>
        {(message) => <p class="m-0 text-sm text-finzz-danger" role="alert">{message()}</p>}
      </Show>

      <Show when={!props.loading && !props.error && props.expenses.length === 0}>
        <div class="grid justify-items-center gap-2 px-4 py-10 text-center" role="status">
          <span
            aria-hidden="true"
            class="grid h-10 w-10 place-items-center rounded-full border border-finzz-accent-border/60 bg-finzz-accent/15 text-sm font-bold text-finzz-accent"
          >
            S/
          </span>
          <h3 class="mb-0 mt-2 text-finzz-heading">Aún no tienes gastos</h3>
          <p class="m-0 max-w-[22rem]">Registra tu primer gasto para empezar a entender tus hábitos.</p>
        </div>
      </Show>

      <Show when={!props.loading && !props.error && props.expenses.length > 0}>
        <div class="-mx-2 overflow-x-auto">
          <table class="w-full min-w-[560px] border-collapse text-left text-sm">
            <colgroup>
              <col style={{ width: '36.5%' }} />
              <col style={{ width: '22.5%' }} />
              <col style={{ width: '32%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead>
              <tr class="border-b border-finzz-border/80">
                <th scope="col" class={`px-2 py-1.5 ${tableHeadClass}`}>Descripción</th>
                <th scope="col" class={`px-2 py-1.5 ${tableHeadClass}`}>Categoría</th>
                <th scope="col" class={`px-2 py-1.5 ${tableHeadClass}`}>Fecha</th>
                <th scope="col" class={`px-2 py-1.5 text-right ${tableHeadClass}`}>Importe</th>
              </tr>
            </thead>
            <tbody>
              <For each={props.expenses}>
                {(expense) => (
                  <tr class="border-b border-finzz-border/50 last:border-b-0">
                    <td class="dashboard-list-row-cell px-2 py-1.5 lg:py-2.5">
                      <div class="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          class="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-finzz-border/70 bg-finzz-code/70"
                          style={{ color: categoryChartColor(expense.category.slug) }}
                        >
                          {categoryIcon(expense.category.slug, 16)}
                        </span>
                        <span class="flex min-w-0 items-baseline gap-2">
                          <strong class="truncate font-semibold text-finzz-heading">
                            {expense.description || expense.category.name}
                          </strong>
                          <span class="hidden truncate text-xs text-finzz-text sm:inline">{expense.category.name}</span>
                        </span>
                      </div>
                    </td>
                    <td class="dashboard-list-row-cell px-2 py-1.5 lg:py-2.5">
                      <CategoryBadge slug={expense.category.slug} name={expense.category.name} />
                    </td>
                    <td class="dashboard-list-row-cell whitespace-nowrap px-2 py-1.5 text-finzz-text lg:py-2.5">{formatDate(expense.expenseDate)}</td>
                    <td class="dashboard-list-row-cell whitespace-nowrap px-2 py-1.5 text-right lg:py-2.5">
                      <strong class="font-semibold tabular-nums text-finzz-heading">
                        {formatCurrency(expense.amount)}
                      </strong>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </section>
  )
}
