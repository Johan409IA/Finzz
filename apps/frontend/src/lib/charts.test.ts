import { describe, expect, test } from 'vitest'
import {
  aggregateDailyTotals,
  buildDonutOption,
  buildMonthlyLineOption,
  buildWeeklyBarOption,
  enumerateDates,
  getWeekDays,
  WEEKDAY_SHORT_LABELS,
} from './charts'

describe('enumerateDates', () => {
  test('incluye todos los días del mes aunque tengan 0', () => {
    expect(enumerateDates('2026-09-01', '2026-09-30')).toHaveLength(30)
    expect(enumerateDates('2026-09-01', '2026-09-30')[0]).toBe('2026-09-01')
    expect(enumerateDates('2026-09-01', '2026-09-30')[29]).toBe('2026-09-30')
  })

  test('incluye febrero bisiesto completo', () => {
    expect(enumerateDates('2024-02-01', '2024-02-29')).toHaveLength(29)
  })

  test('cruza meses y años', () => {
    expect(enumerateDates('2025-12-29', '2026-01-04')).toEqual([
      '2025-12-29',
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
    ])
  })
})

describe('getWeekDays', () => {
  test('devuelve siempre 7 días desde el lunes', () => {
    expect(getWeekDays('2026-09-07')).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ])
  })

  test('la semana puede cruzar mes y año', () => {
    expect(getWeekDays('2025-12-29')).toEqual([
      '2025-12-29',
      '2025-12-30',
      '2025-12-31',
      '2026-01-01',
      '2026-01-02',
      '2026-01-03',
      '2026-01-04',
    ])
  })

  test('etiquetas fijas LU..DO en orden', () => {
    expect(WEEKDAY_SHORT_LABELS).toEqual(['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'])
  })
})

describe('aggregateDailyTotals', () => {
  test('rellena con 0 los días sin gastos', () => {
    const result = aggregateDailyTotals(
      ['2026-09-07', '2026-09-08', '2026-09-09'],
      [
        { expenseDate: '2026-09-08', amount: 100 },
        { expenseDate: '2026-09-08', amount: 50.5 },
      ],
    )
    expect(result).toEqual([
      { date: '2026-09-07', total: 0 },
      { date: '2026-09-08', total: 150.5 },
      { date: '2026-09-09', total: 0 },
    ])
  })

  test('ignora gastos fuera del rango', () => {
    const result = aggregateDailyTotals(['2026-09-07'], [{ expenseDate: '2026-09-08', amount: 10 }])
    expect(result).toEqual([{ date: '2026-09-07', total: 0 }])
  })
})

describe('buildMonthlyLineOption', () => {
  test('serie con todos los días del mes y área suave', () => {
    const option = buildMonthlyLineOption([
      { date: '2026-09-01', total: 0 },
      { date: '2026-09-02', total: 600 },
    ])
    const series = (option.series as Array<{ type: string; data: number[]; smooth: boolean; areaStyle: unknown }>)[0]
    expect(series.type).toBe('line')
    expect(series.smooth).toBe(true)
    expect(series.data).toEqual([0, 600])
    expect(series.areaStyle).toBeTruthy()
    expect((option.xAxis as { data: string[] }).data).toHaveLength(2)
    expect(option.backgroundColor).toBe('transparent')
  })
})

describe('buildWeeklyBarOption', () => {
  test('siete posiciones fijas con ceros representados', () => {
    const option = buildWeeklyBarOption([
      { date: '2026-09-07', total: 1450 },
      { date: '2026-09-08', total: 820 },
      { date: '2026-09-09', total: 0 },
      { date: '2026-09-10', total: 610 },
      { date: '2026-09-11', total: 530 },
      { date: '2026-09-12', total: 420 },
      { date: '2026-09-13', total: 1150 },
    ])
    expect((option.xAxis as { data: string[] }).data).toEqual(['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'])
    const series = (option.series as Array<{ type: string; data: number[] }>)[0]
    expect(series.type).toBe('bar')
    expect(series.data).toEqual([1450, 820, 0, 610, 530, 420, 1150])
  })
})

describe('buildDonutOption', () => {
  test('total en el centro y un segmento por categoría', () => {
    const option = buildDonutOption(
      [
        { name: 'Alimentación', amount: 60, percentage: 60 },
        { name: 'Transporte', amount: 30, percentage: 30 },
        { name: 'Ocio', amount: 10, percentage: 10 },
      ],
      100,
    )
    const series = (
      option.series as Array<{ type: string; data: Array<{ name: string; value: number }>; radius: string[] }>
    )[0]
    expect(series.type).toBe('pie')
    expect(series.radius).toEqual(['58%', '80%'])
    expect(series.data.map((item) => item.name)).toEqual(['Alimentación', 'Transporte', 'Ocio'])
    expect(JSON.stringify(option)).toContain('S/')
  })

  test('categorías vacías devuelven serie vacía', () => {
    const option = buildDonutOption([], 0)
    const series = (option.series as Array<{ data: unknown[] }>)[0]
    expect(series.data).toEqual([])
  })
})
