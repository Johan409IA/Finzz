import { fireEvent, render, screen } from 'solid-testing-library'
import { describe, expect, test, vi } from 'vitest'
import ExpenseSummary from './ExpenseSummary'
import type { ExpenseSummary as ExpenseSummaryData } from '../lib/expenses'

const summary: ExpenseSummaryData = {
  period: 'month',
  periodKey: '2026-09',
  month: '2026-09',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  totalAmount: 100,
  expenseCount: 4,
  categories: [
    { categoryId: 'cat-food', slug: 'alimentacion', name: 'Alimentación', amount: 60, expenseCount: 2, percentage: 60 },
    { categoryId: 'cat-transport', slug: 'transporte', name: 'Transporte', amount: 30, expenseCount: 1, percentage: 30 },
    { categoryId: 'cat-leisure', slug: 'ocio', name: 'Ocio', amount: 10, expenseCount: 1, percentage: 10 },
  ],
}

const emptySummary: ExpenseSummaryData = {
  period: 'month',
  periodKey: '2026-08',
  month: '2026-08',
  periodStart: '2026-08-01',
  periodEnd: '2026-08-31',
  totalAmount: 0,
  expenseCount: 0,
  categories: [],
}

const weeklySummary: ExpenseSummaryData = {
  period: 'week',
  periodKey: '2026-09-08',
  weekStart: '2026-09-08',
  periodStart: '2026-09-08',
  periodEnd: '2026-09-14',
  totalAmount: 45.5,
  expenseCount: 2,
  categories: [
    { categoryId: 'cat-food', slug: 'alimentacion', name: 'Alimentación', amount: 45.5, expenseCount: 2, percentage: 100 },
  ],
}

function defaultProps(overrides: Record<string, unknown> = {}) {
  return {
    periodType: 'month' as const,
    month: '2026-09',
    week: '2026-W37',
    onPeriodTypeChange: vi.fn(),
    onMonthChange: vi.fn(),
    onWeekChange: vi.fn(),
    ...overrides,
  }
}

describe('ExpenseSummary', () => {
  test('muestra carga inicial', () => {
    render(() => (
      <ExpenseSummary {...defaultProps()} summary={undefined} loading error={null} />
    ))

    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText(/cargando resumen/i)).toBeTruthy()
  })

  test('muestra métricas y distribución con representación accesible', () => {
    render(() => (
      <ExpenseSummary {...defaultProps()} summary={summary} loading={false} error={null} />
    ))

    expect(screen.getByText('Total del mes')).toBeTruthy()
    expect(screen.getByText('Gastos registrados')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('Alimentación')).toBeTruthy()
    expect(screen.getByText('Transporte')).toBeTruthy()
    expect(screen.getByText('Ocio')).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Porcentaje de Alimentación' })).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Porcentaje de Transporte' })).toBeTruthy()
    expect(
      screen.getByRole('progressbar', { name: 'Porcentaje de Alimentación' }).getAttribute('aria-valuenow'),
    ).toBe('60')
  })

  test('muestra estado vacío sin reemplazar el selector', () => {
    render(() => (
      <ExpenseSummary {...defaultProps({ month: '2026-08' })} summary={emptySummary} loading={false} error={null} />
    ))

    expect(screen.getByText(/no hay gastos en el periodo seleccionado/i)).toBeTruthy()
    expect(screen.getByLabelText('Mes del resumen')).toBeTruthy()
  })

  test('muestra error accesible', () => {
    render(() => (
      <ExpenseSummary
        {...defaultProps()}
        summary={undefined}
        loading={false}
        error="No se pudo cargar el resumen del periodo."
      />
    ))

    expect(screen.getByRole('alert').textContent).toContain('No se pudo cargar el resumen')
  })

  test('notifica el cambio de mes desde el selector', () => {
    const onMonthChange = vi.fn()
    render(() => (
      <ExpenseSummary {...defaultProps({ onMonthChange })} summary={summary} loading={false} error={null} />
    ))

    const input = screen.getByLabelText('Mes del resumen') as HTMLInputElement
    expect(input.value).toBe('2026-09')
    fireEvent.input(input, { target: { value: '2026-08' } })

    expect(onMonthChange).toHaveBeenCalledWith('2026-08')
  })

  test('no muestra métricas mientras carga', () => {
    render(() => (
      <ExpenseSummary {...defaultProps()} summary={summary} loading error={null} />
    ))

    expect(screen.queryByText('Total del mes')).toBeNull()
    expect(screen.getByRole('status')).toBeTruthy()
    expect(screen.getByText(/cargando resumen/i)).toBeTruthy()
  })

  test('muestra el modo semanal con rango de fechas y selector de semana', () => {
    render(() => (
      <ExpenseSummary
        {...defaultProps({ periodType: 'week', week: '2026-W37' })}
        summary={weeklySummary}
        loading={false}
        error={null}
      />
    ))

    expect(screen.getByText('Total del periodo semanal')).toBeTruthy()
    expect(screen.getByLabelText('Semana del resumen')).toBeTruthy()
    expect(screen.queryByLabelText('Mes del resumen')).toBeNull()
    expect(screen.getByRole('progressbar', { name: 'Porcentaje de Alimentación' })).toBeTruthy()
  })

  test('notifica el cambio de tipo de periodo', () => {
    const onPeriodTypeChange = vi.fn()
    render(() => (
      <ExpenseSummary {...defaultProps({ onPeriodTypeChange })} summary={summary} loading={false} error={null} />
    ))

    fireEvent.click(screen.getByLabelText('Semana'))

    expect(onPeriodTypeChange).toHaveBeenCalledWith('week')
  })

  test('notifica el cambio de semana desde el selector', () => {
    const onWeekChange = vi.fn()
    render(() => (
      <ExpenseSummary
        {...defaultProps({ periodType: 'week', onWeekChange })}
        summary={weeklySummary}
        loading={false}
        error={null}
      />
    ))

    const input = screen.getByLabelText('Semana del resumen') as HTMLInputElement
    expect(input.value).toBe('2026-W37')
    fireEvent.input(input, { target: { value: '2026-W36' } })

    expect(onWeekChange).toHaveBeenCalledWith('2026-W36')
  })

  test('muestra la moneda en soles y conserva la accesibilidad', () => {
    render(() => (
      <ExpenseSummary {...defaultProps()} summary={summary} loading={false} error={null} />
    ))

    expect(screen.getAllByText((text) => text.includes('S/')).length).toBeGreaterThan(0)
    expect(screen.getByRole('region', { name: 'Resumen del periodo' })).toBeTruthy()
    const progressbar = screen.getByRole('progressbar', { name: 'Porcentaje de Alimentación' })
    expect(progressbar.getAttribute('aria-valuemin')).toBe('0')
    expect(progressbar.getAttribute('aria-valuemax')).toBe('100')
    expect(screen.getByText('Periodo')).toBeTruthy()
    expect(screen.getByLabelText('Mes')).toBeTruthy()
    expect(screen.getByLabelText('Semana')).toBeTruthy()
  })
})
