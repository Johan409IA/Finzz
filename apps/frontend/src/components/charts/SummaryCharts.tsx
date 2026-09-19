import EChartsBase from './EChartsBase'
import { buildDonutOption, buildMonthlyLineOption, buildWeeklyBarOption } from '../../lib/charts'
import type { DailyTotal, DonutCategory } from '../../lib/charts'

interface TrendProps {
  data: DailyTotal[]
  label: string
}

export function MonthlyTrendChart(props: TrendProps) {
  return <EChartsBase option={buildMonthlyLineOption(props.data) as never} label={props.label} height={260} />
}

export function WeeklyBarChart(props: TrendProps) {
  return <EChartsBase option={buildWeeklyBarOption(props.data) as never} label={props.label} height={260} />
}

interface DonutProps {
  categories: DonutCategory[]
  total: number
  label: string
}

export function CategoryDonutChart(props: DonutProps) {
  return <EChartsBase option={buildDonutOption(props.categories, props.total) as never} label={props.label} height={260} />
}
