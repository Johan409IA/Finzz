import EChartsBase from './EChartsBase'
import { buildDonutOption, buildMonthlyLineOption, buildWeeklyBarOption } from '../../lib/charts'
import type { DailyTotal, DonutCategory } from '../../lib/charts'
import { formatCurrency } from '../../lib/format'

interface TrendProps {
  data: DailyTotal[]
  label: string
  fill?: boolean
}

export function MonthlyTrendChart(props: TrendProps) {
  return (
    <EChartsBase
      option={buildMonthlyLineOption(props.data) as never}
      label={props.label}
      height={260}
      fill={props.fill}
    />
  )
}

export function WeeklyBarChart(props: TrendProps) {
  return (
    <EChartsBase
      option={buildWeeklyBarOption(props.data) as never}
      label={props.label}
      height={260}
      fill={props.fill}
    />
  )
}

interface DonutProps {
  categories: DonutCategory[]
  total: number
  label: string
  fill?: boolean
}

export function CategoryDonutChart(props: DonutProps) {
  return (
    <div
      class="dashboard-donut relative h-full min-h-0 w-full"
      style={{ height: props.fill ? '100%' : '260px' }}
    >
      <EChartsBase
        option={buildDonutOption(props.categories) as never}
        label={props.label}
        height={260}
        fill
      />
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <strong class="dashboard-donut-center-value text-finzz-heading">{formatCurrency(props.total)}</strong>
        <span class="dashboard-donut-center-label text-finzz-muted">Total</span>
      </div>
    </div>
  )
}
