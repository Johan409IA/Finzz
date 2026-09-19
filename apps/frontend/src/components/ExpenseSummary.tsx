import { For, Show } from 'solid-js'
import { formatCurrency, formatDate } from '../lib/format'
import { resolveDailyTotals } from '../lib/charts'
import { CategoryDonutChart, MonthlyTrendChart, WeeklyBarChart } from './charts/SummaryCharts'
import type { ExpensePeriodType, ExpenseSummary as ExpenseSummaryData } from '../lib/expenses'

interface ExpenseSummaryProps {
  periodType: ExpensePeriodType
  month: string
  week: string
  onPeriodTypeChange: (periodType: ExpensePeriodType) => void
  onMonthChange: (month: string) => void
  onWeekChange: (week: string) => void
  summary: ExpenseSummaryData | undefined
  loading: boolean
  error: string | null
  expenses?: Array<{ expenseDate: string; amount: number }>
}

const inputClass =
  'w-full box-border min-w-36 rounded-md border border-finzz-border bg-finzz-bg px-3 py-2.5 text-finzz-heading'

const toggleActiveClass = 'bg-finzz-heading text-finzz-bg'
const toggleInactiveClass = 'bg-transparent text-finzz-heading hover:bg-finzz-accent-bg'

export default function ExpenseSummary(props: ExpenseSummaryProps) {
  const dailyTotals = () =>
    props.summary ? resolveDailyTotals(props.summary, props.expenses ?? []) : []
  const donutCategories = () =>
    (props.summary?.categories ?? []).map((category) => ({
      name: category.name,
      amount: category.amount,
      percentage: category.percentage,
    }))

  return (
    <section
      aria-labelledby="expense-summary-title"
      class="grid gap-5 rounded-xl border border-finzz-border bg-finzz-surface p-5 text-left"
    >
      <div class="flex items-start justify-between gap-4 max-lg:flex-col max-lg:items-stretch">
        <div>
          <p class="m-0 text-xs font-bold uppercase tracking-[0.1em] text-finzz-accent">Lectura financiera</p>
          <h2 id="expense-summary-title" class="mb-0 mt-0 text-2xl leading-tight text-finzz-heading">
            Resumen del periodo
          </h2>
          <Show when={props.periodType === 'week' && props.summary}>
            {(summary) => <p class="mt-1">{formatDate(summary().periodStart)} – {formatDate(summary().periodEnd)}</p>}
          </Show>
        </div>
        <fieldset class="grid gap-1.5 text-xs text-finzz-heading">
          <legend>Periodo</legend>
          <div role="group" aria-label="Tipo de periodo" class="flex gap-1 rounded-lg border border-finzz-border bg-finzz-bg p-1">
            <button
              type="button"
              aria-pressed={props.periodType === 'month'}
              onClick={() => props.onPeriodTypeChange('month')}
              class={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${props.periodType === 'month' ? toggleActiveClass : toggleInactiveClass}`}
            >
              Mensual
            </button>
            <button
              type="button"
              aria-pressed={props.periodType === 'week'}
              onClick={() => props.onPeriodTypeChange('week')}
              class={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${props.periodType === 'week' ? toggleActiveClass : toggleInactiveClass}`}
            >
              Semanal
            </button>
          </div>
          <Show
            when={props.periodType === 'month'}
            fallback={
              <label class="grid gap-1.5">
                Semana del resumen
                <input
                  aria-label="Semana del resumen"
                  type="week"
                  value={props.week}
                  onInput={(event) => props.onWeekChange(event.currentTarget.value)}
                  class={inputClass}
                />
              </label>
            }
          >
            <label class="grid gap-1.5">
              Mes del resumen
              <input
                aria-label="Mes del resumen"
                type="month"
                value={props.month}
                onInput={(event) => props.onMonthChange(event.currentTarget.value)}
                class={inputClass}
              />
            </label>
          </Show>
        </fieldset>
      </div>

      <Show when={props.loading}>
        <div aria-busy="true" role="status">Cargando resumen…</div>
      </Show>

      <Show when={!props.loading && props.error}>
        {(message) => <p class="mt-4 text-sm text-finzz-danger" role="alert">{message()}</p>}
      </Show>

      <Show when={!props.loading && !props.error && props.summary}>
        {(summary) => (
          <>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-lg bg-finzz-accent-bg p-4">
                <span class="block text-xs">{props.periodType === 'week' ? 'Total semanal' : 'Total del mes'}</span>
                <strong class="mt-1 block text-2xl text-finzz-heading">{formatCurrency(summary().totalAmount)}</strong>
              </div>
              <div class="rounded-lg bg-finzz-accent-bg p-4">
                <span class="block text-xs">Gastos registrados</span>
                <strong class="mt-1 block text-2xl text-finzz-heading">{summary().expenseCount}</strong>
              </div>
            </div>

            <Show
              when={summary().categories.length > 0}
              fallback={<p role="status">No hay gastos en el periodo seleccionado.</p>}
            >
              <Show
                when={props.periodType === 'month'}
                fallback={
                  <figure class="m-0 rounded-lg bg-finzz-bg p-4">
                    <figcaption class="mb-2 text-sm font-semibold text-finzz-heading">Gasto de la semana</figcaption>
                    <WeeklyBarChart
                      data={dailyTotals()}
                      label={`Gasto de la semana del ${formatDate(summary().periodStart)} al ${formatDate(summary().periodEnd)}`}
                    />
                  </figure>
                }
              >
                <figure class="m-0 rounded-lg bg-finzz-bg p-4">
                  <figcaption class="mb-2 text-sm font-semibold text-finzz-heading">Evolución del gasto del mes</figcaption>
                  <MonthlyTrendChart
                    data={dailyTotals()}
                    label={`Evolución del gasto de ${summary().periodKey}`}
                  />
                </figure>
              </Show>

              <figure class="m-0 rounded-lg bg-finzz-bg p-4">
                <figcaption class="mb-2 text-sm font-semibold text-finzz-heading">Gastos por categoría</figcaption>
                <CategoryDonutChart
                  categories={donutCategories()}
                  total={summary().totalAmount}
                  label={`Gastos por categoría, total ${formatCurrency(summary().totalAmount)}`}
                />
              </figure>

              <div class="grid gap-4" aria-label="Gasto por categoría">
                <For each={summary().categories}>
                  {(category) => (
                    <div>
                      <div class="flex justify-between gap-4 text-sm">
                        <strong>{category.name}</strong>
                        <span class="text-right">{formatCurrency(category.amount)} · {category.percentage.toFixed(2)}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`Porcentaje de ${category.name}`}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow={category.percentage}
                        class="mt-1.5 h-2 overflow-hidden rounded-full bg-finzz-code"
                      >
                        <span
                          class="block h-full rounded-[inherit] bg-finzz-accent"
                          style={{ width: `${Math.min(category.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </>
        )}
      </Show>
    </section>
  )
}
