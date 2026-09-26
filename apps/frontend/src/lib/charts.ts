import { formatCurrency, formatDate } from './format'

export interface DailyTotal {
  date: string
  total: number
}

export interface DonutCategory {
  name: string
  amount: number
  percentage: number
  slug?: string
}

export const WEEKDAY_SHORT_LABELS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'] as const

export const FINZZ_CHART_PRIMARY = '#1ce3b7'

const CATEGORY_COLORS: Record<string, string> = {
  alimentacion: '#34d399',
  transporte: '#38bdf8',
  vivienda: '#fbbf24',
  servicios: '#a78bfa',
  salud: '#fb7185',
  ocio: '#e879f9',
  educacion: '#818cf8',
}

export const CATEGORY_CHART_COLORS = [
  '#34d399',
  '#38bdf8',
  '#fbbf24',
  '#a78bfa',
  '#fb7185',
  '#e879f9',
  '#818cf8',
  '#94a3b8',
]

export function categoryChartColor(slug: string | undefined, fallbackIndex = 0): string {
  if (slug) {
    const known = CATEGORY_COLORS[slug]
    if (known) return known
  }
  return CATEGORY_CHART_COLORS[fallbackIndex % CATEGORY_CHART_COLORS.length] ?? '#94a3b8'
}

const SURFACE = '#062b49'

const TOOLTIP_STYLE = {
  backgroundColor: '#041b31',
  borderColor: '#17618b',
  borderWidth: 1,
  padding: [8, 12] as unknown as number,
  textStyle: { color: '#f4f7fb', fontSize: 12 },
}

const AXIS_STYLE = {
  axisLine: { lineStyle: { color: 'rgba(145, 175, 208, 0.3)' } },
  axisTick: { show: false },
  axisLabel: { color: '#91afd0', fontSize: 11 },
  splitLine: { lineStyle: { color: 'rgba(145, 175, 208, 0.14)' } },
}

const BASE_ANIMATION = {
  animationDuration: 600,
  animationEasing: 'cubicOut' as const,
}

export function enumerateDates(periodStart: string, periodEnd: string): string[] {
  const dates: string[] = []
  const current = new Date(`${periodStart}T00:00:00Z`)
  const end = new Date(`${periodEnd}T00:00:00Z`)
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

export function getWeekDays(weekStart: string): string[] {
  const [year, month, day] = weekStart.split('-').map(Number)
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(year!, month! - 1, day! + index))
    return [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(2, '0'),
      String(date.getUTCDate()).padStart(2, '0'),
    ].join('-')
  })
}

export function aggregateDailyTotals(
  dates: string[],
  expenses: Array<{ expenseDate: string; amount: number }>,
): DailyTotal[] {
  const totals = new Map<string, number>()
  for (const expense of expenses) {
    if (!dates.includes(expense.expenseDate)) continue
    totals.set(expense.expenseDate, Number(((totals.get(expense.expenseDate) ?? 0) + expense.amount).toFixed(2)))
  }
  return dates.map((date) => ({ date, total: totals.get(date) ?? 0 }))
}

export function resolveDailyTotals(
  summary: { periodStart: string; periodEnd: string; dailyTotals?: DailyTotal[] },
  fallbackExpenses: Array<{ expenseDate: string; amount: number }> = [],
): DailyTotal[] {
  if (summary.dailyTotals && summary.dailyTotals.length > 0) return summary.dailyTotals
  return aggregateDailyTotals(enumerateDates(summary.periodStart, summary.periodEnd), fallbackExpenses)
}

function formatWeekdayLong(date: string): string {
  const weekday = new Intl.DateTimeFormat('es-PE', { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  )
  return weekday.charAt(0).toUpperCase() + weekday.slice(1)
}

export function buildMonthlyLineOption(dailyTotals: DailyTotal[]) {
  const dates = dailyTotals.map((item) => item.date)
  const values = dailyTotals.map((item) => item.total)
  return {
    backgroundColor: 'transparent',
    ...BASE_ANIMATION,
    grid: { left: 8, right: 12, top: 28, bottom: 0, containLabel: true },
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis' as const,
      axisPointer: {
        type: 'line' as const,
        lineStyle: { color: 'rgba(28, 227, 183, 0.55)', type: 'dashed' as const, width: 1 },
      },
      formatter: (params: Array<{ axisValue: string; data: number }>) => {
        const point = params[0]
        if (!point) return ''
        return `${formatDate(point.axisValue)}\n${formatCurrency(Number(point.data))}`
      },
    },
    xAxis: {
      type: 'category' as const,
      data: dates,
      boundaryGap: false,
      ...AXIS_STYLE,
      axisLabel: {
        ...AXIS_STYLE.axisLabel,
        hideOverlap: true,
        formatter: (value: string) => value.slice(8, 10),
      },
    },
    yAxis: {
      type: 'value' as const,
      ...AXIS_STYLE,
      minInterval: 1,
      splitNumber: 4,
      axisLabel: { ...AXIS_STYLE.axisLabel, hideOverlap: true },
    },
    series: [
      {
        type: 'line' as const,
        data: values,
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 2.5, color: FINZZ_CHART_PRIMARY },
        itemStyle: { color: FINZZ_CHART_PRIMARY, borderWidth: 2, borderColor: SURFACE },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(28, 227, 183, 0.34)' },
              { offset: 1, color: 'rgba(28, 227, 183, 0.02)' },
            ],
          },
        },
        emphasis: { focus: 'series' as const },
      },
    ],
  }
}

export function buildWeeklyBarOption(dailyTotals: DailyTotal[]) {
  const values = dailyTotals.map((item) => item.total)
  const dates = dailyTotals.map((item) => item.date)
  return {
    backgroundColor: 'transparent',
    ...BASE_ANIMATION,
    grid: { left: 8, right: 12, top: 36, bottom: 0, containLabel: true },
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis' as const,
      axisPointer: { type: 'shadow' as const },
      formatter: (params: Array<{ dataIndex: number; data: number }>) => {
        const point = params[0]
        if (!point) return ''
        const date = dates[point.dataIndex] ?? ''
        const amount = Number(point.data)
        const lines = [`${formatWeekdayLong(date)}, ${formatDate(date)}`, formatCurrency(amount)]
        if (amount === 0) lines.push('Sin gastos registrados')
        return lines.join('\n')
      },
    },
    xAxis: {
      type: 'category' as const,
      data: [...WEEKDAY_SHORT_LABELS],
      ...AXIS_STYLE,
    },
    yAxis: {
      type: 'value' as const,
      ...AXIS_STYLE,
      minInterval: 1,
      splitNumber: 4,
      axisLabel: { ...AXIS_STYLE.axisLabel, hideOverlap: true },
    },
    series: [
      {
        type: 'bar' as const,
        data: values,
        barWidth: '52%',
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3cf0c4' },
              { offset: 1, color: 'rgba(28, 227, 183, 0.22)' },
            ],
          },
        },
        label: {
          show: true,
          position: 'top' as const,
          color: '#afc0d4',
          fontSize: 10,
          formatter: (params: { value: number }) =>
            Number(params.value) > 0 ? formatCurrency(Number(params.value)) : '',
        },
        emphasis: { focus: 'series' as const },
      },
    ],
  }
}

export function buildDonutOption(categories: DonutCategory[]) {
  return {
    backgroundColor: 'transparent',
    ...BASE_ANIMATION,
    color: CATEGORY_CHART_COLORS,
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'item' as const,
      confine: true,
      formatter: (params: { name: string; value: number; percent?: number }) =>
        `${params.name}\n${formatCurrency(Number(params.value))} · ${Number(params.percent ?? 0).toFixed(2)}%`,
    },
    series: [
      {
        type: 'pie' as const,
          radius: ['64%', '80%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: { borderRadius: 6, borderColor: SURFACE, borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scale: true, scaleSize: 4 },
        data: categories.map((category, index) => ({
          name: category.name,
          value: category.amount,
          itemStyle: { color: categoryChartColor(category.slug, index) },
        })),
      },
    ],
  }
}
