export type ExpensePeriodType = 'month' | 'week'

export type ExpensePeriod =
  | { type: 'month'; month: string }
  | { type: 'week'; weekStart: string }

export interface ExpensePeriodBounds {
  periodStart: string
  periodEnd: string
}

export function isValidMonth(value: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return false

  const [yearText, monthText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  return year >= 1900 && year <= 9999 && Number.isInteger(year) && Number.isInteger(month)
}

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (year < 1900 || year > 9999 || !Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false
  }

  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

export function isMonday(value: string): boolean {
  if (!isValidDate(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day!)).getUTCDay() === 1
}

export function getMonthBounds(month: string): ExpensePeriodBounds {
  if (!isValidMonth(month)) throw new Error('El mes no es válido')

  const [yearText, monthText] = month.split('-')
  const year = Number(yearText)
  const monthNumber = Number(monthText)
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
  return {
    periodStart: `${month}-01`,
    periodEnd: `${month}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function getWeekBounds(weekStart: string): ExpensePeriodBounds {
  if (!isMonday(weekStart)) throw new Error('La semana debe comenzar en lunes')

  const [year, month, day] = weekStart.split('-').map(Number)
  const periodEndDate = new Date(Date.UTC(year!, month! - 1, day! + 6))
  const periodEnd = [
    periodEndDate.getUTCFullYear(),
    String(periodEndDate.getUTCMonth() + 1).padStart(2, '0'),
    String(periodEndDate.getUTCDate()).padStart(2, '0'),
  ].join('-')
  return { periodStart: weekStart, periodEnd }
}

export function getPeriodBounds(period: ExpensePeriod): ExpensePeriodBounds {
  return period.type === 'month' ? getMonthBounds(period.month) : getWeekBounds(period.weekStart)
}
