export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return `S/ ${formatted}`
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export function formatTodayLong(): string {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(new Date())
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function currentIsoWeek(): string {
  const date = new Date()
  const day = date.getUTCDay() || 7
  const thursday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  thursday.setUTCDate(thursday.getUTCDate() + 4 - day)
  const year = thursday.getUTCFullYear()
  const firstDay = new Date(Date.UTC(year, 0, 1))
  const week = Math.ceil((((thursday.getTime() - firstDay.getTime()) / 86400000) + 1) / 7)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function isoWeekToMonday(value: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(value)
  if (!match) throw new Error('La semana no es válida')

  const year = Number(match[1])
  const week = Number(match[2])
  if (week < 1 || week > 53) throw new Error('La semana no es válida')

  const januaryFourth = new Date(Date.UTC(year, 0, 4))
  const day = januaryFourth.getUTCDay() || 7
  const monday = new Date(Date.UTC(year, 0, 4 - day + 1 + (week - 1) * 7))
  return [
    monday.getUTCFullYear(),
    String(monday.getUTCMonth() + 1).padStart(2, '0'),
    String(monday.getUTCDate()).padStart(2, '0'),
  ].join('-')
}
