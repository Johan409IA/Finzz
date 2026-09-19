import { formatCurrency, formatDate } from './format'

export interface DailyTotal {
  date: string
  total: number
}

export interface DonutCategory {
  name: string
  amount: number
  percentage: number
}

export const WEEKDAY_SHORT_LABELS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'] as const

export const FINZZ_CHART_PRIMARY = '#10b981'

const DONUT_PALETTE = [
  '#10b981',
  '#0d9488',
  '#34d399',
  '#14b8a6',
  '#059669',
  '#6ee7b7',
  '#047857',
  '#a7f3d0',
]

const TOOLTIP_STYLE = {
  backgroundColor: '#08060d',
  borderWidth: 0,
  padding: [8, 12] as unknown as number,
  textStyle: { color: '#fffaf3', fontSize: 12 },
}

const AXIS_STYLE = {
  axisLine: { lineStyle: { color: 'rgba(8, 6, 13, 0.15)' } },
  axisTick: { show: false },
  axisLabel: { color: '#6b6375', fontSize: 11 },
  splitLine: { lineStyle: { color: 'rgba(8, 6, 13, 0.06)' } },
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
    grid: { left: 8, right: 8, top: 24, bottom: 0, containLabel: true },
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis' as const,
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
    yAxis: { type: 'value' as const, ...AXIS_STYLE },
    series: [
      {
        type: 'line' as const,
        data: values,
        smooth: true,
        symbolSize: 6,
        lineStyle: { width: 2.5, color: FINZZ_CHART_PRIMARY },
        itemStyle: { color: FINZZ_CHART_PRIMARY, borderWidth: 2, borderColor: '#fff' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.04)' },
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
    grid: { left: 8, right: 8, top: 24, bottom: 0, containLabel: true },
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'axis' as const,
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
    yAxis: { type: 'value' as const, ...AXIS_STYLE },
    series: [
      {
        type: 'bar' as const,
        data: values,
        itemStyle: { color: FINZZ_CHART_PRIMARY, borderRadius: [6, 6, 0, 0] },
        barWidth: '55%',
        emphasis: { focus: 'series' as const },
      },
    ],
  }
}

export function buildDonutOption(categories: DonutCategory[], total: number) {
  return {
    backgroundColor: 'transparent',
    ...BASE_ANIMATION,
    color: DONUT_PALETTE,
    title: {
      text: formatCurrency(total),
      subtext: 'Total del período',
      left: 'center',
      top: '38%',
      textStyle: { fontSize: 20, fontWeight: 700, color: '#08060d' },
      subtextStyle: { fontSize: 11, color: '#6b6375' },
      itemGap: 4,
    },
    tooltip: {
      ...TOOLTIP_STYLE,
      trigger: 'item' as const,
      formatter: (params: { name: string; value: number; percent?: number }) =>
        `${params.name}\n${formatCurrency(Number(params.value))} · ${Number(params.percent ?? 0).toFixed(2)}%`,
    },
    series: [
      {
        type: 'pie' as const,
        radius: ['58%', '80%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        emphasis: { scale: true, scaleSize: 4 },
        data: categories.map((category) => ({ name: category.name, value: category.amount })),
      },
    ],
  }
}
