import { describe, expect, test } from 'vitest'
import { currentIsoWeek, currentMonth, formatCurrency, formatDate, isoWeekToMonday } from './format'

describe('format', () => {
  test('formatea la moneda en soles', () => {
    expect(formatCurrency(100)).toContain('S/')
    expect(formatCurrency(45.5)).toContain('S/')
  })

  test('formatea fechas en español', () => {
    expect(formatDate('2026-09-08')).toContain('2026')
  })

  test('convierte semana ISO a lunes', () => {
    expect(isoWeekToMonday('2026-W37')).toBe('2026-09-07')
  })

  test('rechaza semanas inválidas', () => {
    expect(() => isoWeekToMonday('no-valida')).toThrow('La semana no es válida')
    expect(() => isoWeekToMonday('2026-W54')).toThrow('La semana no es válida')
  })

  test('expone el mes y la semana actuales con formato válido', () => {
    expect(currentMonth()).toMatch(/^\d{4}-\d{2}$/)
    expect(currentIsoWeek()).toMatch(/^\d{4}-W\d{2}$/)
  })
})
