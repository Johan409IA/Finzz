import { For, Show, type JSX } from 'solid-js'
import CalendarIcon from 'lucide-solid/icons/calendar'
import ChartColumnIcon from 'lucide-solid/icons/chart-column'
import ChartPieIcon from 'lucide-solid/icons/chart-pie'
import ReceiptTextIcon from 'lucide-solid/icons/receipt-text'
import WalletIcon from 'lucide-solid/icons/wallet'
import { categoryChartColor, resolveDailyTotals } from '../lib/charts'
import { formatCurrency, formatDate } from '../lib/format'
import { cardClass, cardSubtitleClass, cardTitleClass } from '../lib/ui'
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

const segmentBaseClass =
  'rounded-lg px-5 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-finzz-accent lg:w-[134px] lg:py-2.5'
const segmentActiveClass = 'bg-finzz-accent font-bold text-[#03263c] shadow-[0_8px_22px_rgba(28,227,183,0.2)]'
const segmentInactiveClass = 'font-semibold text-finzz-text hover:bg-finzz-accent-bg/60 hover:text-finzz-heading'

const pickerClass =
  'relative inline-flex items-center gap-2 rounded-xl border border-finzz-border bg-finzz-bg-soft/60 px-3.5 py-2 transition-colors focus-within:border-finzz-accent lg:w-[264px] lg:justify-between'

const cardIconClass = 'grid h-8 w-8 shrink-0 place-items-center rounded-xl'

const chartAreaClass = 'h-[190px] min-h-0 lg:h-full'

const chartCardClass = `${cardClass} m-0 grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden p-4 lg:p-5`

interface MetricCardProps {
  label: string
  value: string
  icon: JSX.Element
  tone: 'accent' | 'info'
}

function MetricCard(props: MetricCardProps) {
  const badgeClass = () =>
    props.tone === 'accent' ? 'bg-finzz-accent/15 text-finzz-accent' : 'bg-finzz-info/15 text-finzz-info'

  return (
    <div class={`${cardClass} flex items-center gap-3 p-3 lg:gap-7 lg:px-5 lg:py-4`}>
      <span aria-hidden="true" class={`${cardIconClass} h-16 w-16 rounded-full ${badgeClass()}`}>
        {props.icon}
      </span>
      <span class="grid min-w-0">
        <span class="truncate text-sm text-finzz-text lg:text-base">{props.label}</span>
        <strong class="truncate text-2xl font-bold tracking-tight text-finzz-heading lg:text-4xl">{props.value}</strong>
      </span>
    </div>
  )
}

export default function ExpenseSummary(props: ExpenseSummaryProps) {
  const dailyTotals = () =>
    props.summary ? resolveDailyTotals(props.summary, props.expenses ?? []) : []
  const donutCategories = () =>
    (props.summary?.categories ?? []).map((category) => ({
      name: category.name,
      amount: category.amount,
      percentage: category.percentage,
      slug: category.slug,
    }))

  const trendTitle = () =>
    props.periodType === 'week' ? 'Gasto de la semana' : 'Evolución del gasto del mes'
  const trendSubtitle = () =>
    props.periodType === 'week'
      ? 'Total gastado por día durante la semana seleccionada.'
      : 'Total gastado por día durante el mes seleccionado.'
  const pickerText = () => {
    if (props.periodType === 'week') {
      const match = /^(\d{4})-W(\d{2})$/.exec(props.week)
      return match ? `Semana ${Number(match[2])}, ${match[1]}` : ''
    }

    const [year, month] = props.month.split('-').map(Number)
    if (!year || !month) return ''
    const label = new Intl.DateTimeFormat('es-PE', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)))
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  return (
    <section
      aria-labelledby="expense-summary-title"
      class="dashboard-summary grid gap-4 lg:flex lg:flex-none lg:flex-col lg:gap-4"
    >
      <h2 id="expense-summary-title" class="sr-only">Resumen del periodo</h2>

      <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between lg:mx-5 lg:shrink-0">
        <fieldset class="flex flex-wrap items-center gap-3 lg:gap-9">
          <legend class="sr-only">Periodo</legend>
          <div
            role="group"
            aria-label="Tipo de periodo"
            class="inline-flex gap-1 rounded-xl border border-finzz-border bg-finzz-bg-soft/60 p-1"
          >
            <button
              type="button"
              aria-pressed={props.periodType === 'month'}
              onClick={() => props.onPeriodTypeChange('month')}
              class={`${segmentBaseClass} ${props.periodType === 'month' ? segmentActiveClass : segmentInactiveClass}`}
            >
              Mensual
            </button>
            <button
              type="button"
              aria-pressed={props.periodType === 'week'}
              onClick={() => props.onPeriodTypeChange('week')}
              class={`${segmentBaseClass} ${props.periodType === 'week' ? segmentActiveClass : segmentInactiveClass}`}
            >
              Semanal
            </button>
          </div>

          <Show
            when={props.periodType === 'month'}
            fallback={
              <label class={pickerClass}>
                <CalendarIcon size={16} strokeWidth={2} class="text-finzz-accent" aria-hidden="true" />
                <input
                  aria-label="Semana del resumen"
                  type="week"
                  value={props.week}
                  onInput={(event) => props.onWeekChange(event.currentTarget.value)}
                  class="min-w-0 flex-1 bg-transparent text-center text-sm font-semibold text-transparent outline-none [caret-color:transparent] [color-scheme:dark]"
                />
                <span aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-semibold text-finzz-heading">
                  {pickerText()}
                </span>
              </label>
            }
          >
            <label class={pickerClass}>
              <CalendarIcon size={16} strokeWidth={2} class="text-finzz-accent" aria-hidden="true" />
              <input
                aria-label="Mes del resumen"
                type="month"
                value={props.month}
                onInput={(event) => props.onMonthChange(event.currentTarget.value)}
                class="min-w-0 flex-1 bg-transparent text-center text-sm font-semibold text-transparent outline-none [caret-color:transparent] [color-scheme:dark]"
              />
              <span aria-hidden="true" class="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-sm font-semibold text-finzz-heading">
                {pickerText()}
              </span>
            </label>
          </Show>
        </fieldset>

        <Show when={props.periodType === 'week' && props.summary}>
          {(summary) => (
            <p class="m-0 text-sm text-finzz-text">
              {formatDate(summary().periodStart)} – {formatDate(summary().periodEnd)}
            </p>
          )}
        </Show>
      </div>

      <Show when={props.loading}>
        <div role="status" aria-busy="true" class="grid gap-4 lg:min-h-0 lg:flex-1">
          <span class="sr-only">Cargando resumen…</span>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="h-24 animate-pulse rounded-2xl bg-finzz-code/70" />
            <div class="h-24 animate-pulse rounded-2xl bg-finzz-code/70" />
          </div>
          <div class="grid h-[220px] gap-4 lg:h-auto xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
            <div class="animate-pulse rounded-2xl bg-finzz-code/70" />
            <div class="animate-pulse rounded-2xl bg-finzz-code/70" />
          </div>
        </div>
      </Show>

      <Show when={!props.loading && props.error}>
        {(message) => <p class="m-0 text-sm text-finzz-danger" role="alert">{message()}</p>}
      </Show>

      <Show when={!props.loading && !props.error && props.summary}>
        {(summary) => (
          <>
                <div class="dashboard-metrics grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,0.97fr)_minmax(0,1fr)] lg:shrink-0">
              <MetricCard
                label={props.periodType === 'week' ? 'Total semanal' : 'Total del mes'}
                value={formatCurrency(summary().totalAmount)}
                tone="accent"
                icon={<WalletIcon size={20} strokeWidth={2} />}
              />
              <MetricCard
                label="Gastos registrados"
                value={String(summary().expenseCount)}
                tone="info"
                icon={<ReceiptTextIcon size={20} strokeWidth={2} />}
              />
            </div>

            <Show
              when={summary().categories.length > 0}
              fallback={
                <p
                  role="status"
                  class="m-0 rounded-2xl border border-finzz-border/70 bg-finzz-surface/60 p-5 text-sm text-finzz-text"
                >
                  No hay gastos en el periodo seleccionado.
                </p>
              }
            >
                <div class="dashboard-chart-grid grid min-h-0 gap-4 lg:h-[345px] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                <figure class={chartCardClass}>
                  <figcaption class="flex items-start gap-3">
                    <span aria-hidden="true" class={`${cardIconClass} bg-finzz-info/15 text-finzz-info`}>
                      <ChartColumnIcon size={20} strokeWidth={2} />
                    </span>
                    <span class="min-w-0">
                      <span class={cardTitleClass}>{trendTitle()}</span>
                      <span class={`${cardSubtitleClass} block`}>{trendSubtitle()}</span>
                    </span>
                  </figcaption>

                  <div class={chartAreaClass}>
                    <Show
                      when={props.periodType === 'month'}
                      fallback={
                        <WeeklyBarChart
                          data={dailyTotals()}
                          fill
                          label={`Gasto de la semana del ${formatDate(summary().periodStart)} al ${formatDate(summary().periodEnd)}`}
                        />
                      }
                    >
                      <MonthlyTrendChart
                        data={dailyTotals()}
                        fill
                        label={`Evolución del gasto de ${summary().periodKey}`}
                      />
                    </Show>
                  </div>
                </figure>

                <figure class={chartCardClass}>
                  <figcaption class="flex items-start gap-3">
                    <span aria-hidden="true" class={`${cardIconClass} bg-finzz-info/15 text-finzz-info`}>
                      <ChartPieIcon size={20} strokeWidth={2} />
                    </span>
                    <span class="min-w-0">
                      <span class={cardTitleClass}>Gastos por categoría</span>
                      <span class={`${cardSubtitleClass} block`}>Distribución de tus gastos en el periodo.</span>
                    </span>
                  </figcaption>

                    <div class="dashboard-category-content grid min-h-0 gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] lg:min-h-0">
                      <div class={chartAreaClass}>
                      <CategoryDonutChart
                        categories={donutCategories()}
                        total={summary().totalAmount}
                        fill
                        label={`Gastos por categoría, total ${formatCurrency(summary().totalAmount)}`}
                      />
                    </div>

                    <div class="grid min-h-0 content-start gap-2" aria-label="Gasto por categoría">
                      <For each={summary().categories}>
                        {(category, index) => (
                          <div>
                            <div class="flex items-center justify-between gap-3 text-sm">
                              <span class="flex min-w-0 items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  class="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ 'background-color': categoryChartColor(category.slug, index()) }}
                                />
                                <span class="truncate font-medium text-finzz-heading">{category.name}</span>
                              </span>
                              <span class="shrink-0 tabular-nums text-finzz-text">
                                {formatCurrency(category.amount)} · {category.percentage.toFixed(2)}%
                              </span>
                            </div>
                            <div
                              role="progressbar"
                              aria-label={`Porcentaje de ${category.name}`}
                              aria-valuemin="0"
                              aria-valuemax="100"
                              aria-valuenow={category.percentage}
                              class="mt-1 h-1 overflow-hidden rounded-full bg-finzz-code"
                            >
                              <span
                                class="block h-full rounded-[inherit]"
                                style={{
                                  width: `${Math.min(category.percentage, 100)}%`,
                                  'background-color': categoryChartColor(category.slug, index()),
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </figure>
              </div>
            </Show>
          </>
        )}
      </Show>
    </section>
  )
}
