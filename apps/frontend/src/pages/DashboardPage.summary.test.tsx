import { fireEvent, render, screen, waitFor } from 'solid-testing-library'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import DashboardPage from './DashboardPage'
import type { Expense, ExpensePage, ExpensePeriod, ExpenseSummary } from '../lib/expenses'

const mocks = vi.hoisted(() => ({
  listExpenses: vi.fn(),
  listExpensesPage: vi.fn(),
  listCategories: vi.fn(),
  getExpenseSummary: vi.fn(),
  createExpense: vi.fn(),
}))

vi.mock('../lib/expenses', () => mocks)

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: () => ({ email: 'test@example.com', profile: { name: 'Test' } }),
    signOut: vi.fn(),
  }),
}))

vi.mock('@solidjs/router', () => ({
  useNavigate: () => vi.fn(),
}))

const categories = [{ id: 'cat-1', slug: 'alimentacion', name: 'Alimentación' }]

const summarySeptember: ExpenseSummary = {
  period: 'month',
  periodKey: '2026-09',
  month: '2026-09',
  periodStart: '2026-09-01',
  periodEnd: '2026-09-30',
  totalAmount: 100,
  expenseCount: 2,
  categories: [
    { categoryId: 'cat-1', slug: 'alimentacion', name: 'Alimentación', amount: 100, expenseCount: 2, percentage: 100 },
  ],
}

const summaryAugust: ExpenseSummary = {
  period: 'month',
  periodKey: '2026-08',
  month: '2026-08',
  periodStart: '2026-08-01',
  periodEnd: '2026-08-31',
  totalAmount: 0,
  expenseCount: 0,
  categories: [],
}

const summaryWeek: ExpenseSummary = {
  period: 'week',
  periodKey: '2026-09-08',
  weekStart: '2026-09-08',
  periodStart: '2026-09-08',
  periodEnd: '2026-09-14',
  totalAmount: 45.5,
  expenseCount: 2,
  categories: [
    { categoryId: 'cat-1', slug: 'alimentacion', name: 'Alimentación', amount: 45.5, expenseCount: 2, percentage: 100 },
  ],
}

const existingExpense: Expense = {
  id: 'expense-1',
  amount: 25.5,
  expenseDate: '2026-09-12',
  description: 'Almuerzo',
  category: categories[0]!,
  createdAt: '2026-09-12T10:00:00.000Z',
  updatedAt: '2026-09-12T10:00:00.000Z',
}

function periodKey(period: ExpensePeriod): string {
  return period.type === 'month' ? period.month : period.weekStart
}

function mockInitial(summary = summarySeptember) {
  mocks.listExpenses.mockResolvedValue([])
  mocks.listExpensesPage.mockResolvedValue({ items: [], total: 0, page: 1, limit: 5, totalPages: 1 } as ExpensePage)
  mocks.listCategories.mockResolvedValue(categories)
  mocks.getExpenseSummary.mockImplementation(async (period: ExpensePeriod) => {
    if (periodKey(period) === '2026-08' || periodKey(period).startsWith('2026-08')) return summaryAugust
    return { ...summary, periodKey: periodKey(period) }
  })
  mocks.createExpense.mockResolvedValue({
    id: 'new-1',
    amount: 50,
    expenseDate: '2026-09-12',
    description: 'Compra',
    category: categories[0],
    createdAt: '2026-09-12T10:00:00.000Z',
    updatedAt: '2026-09-12T10:00:00.000Z',
  } as Expense)
}

async function waitForSummary() {
  await waitFor(() => {
    expect(screen.getByText('Total del mes')).toBeTruthy()
  })
}

describe('DashboardPage expense summary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('carga inicial con el mes actual y muestra datos', async () => {
    mockInitial()
    const expectedMonth = new Date().toISOString().slice(0, 7)

    render(() => <DashboardPage />)

    expect(screen.getByText(/cargando resumen/i)).toBeTruthy()
    await waitForSummary()
    expect(periodKey(mocks.getExpenseSummary.mock.calls[0][0] as ExpensePeriod)).toBe(expectedMonth)
    expect(screen.getAllByText('Alimentación').length).toBeGreaterThan(0)
  })

  test('cambia de mes y consulta el resumen del nuevo periodo', async () => {
    mockInitial()

    render(() => <DashboardPage />)

    await waitForSummary()
    mocks.getExpenseSummary.mockClear()

    const monthInput = screen.getByLabelText('Mes del resumen') as HTMLInputElement
    fireEvent.input(monthInput, { target: { value: '2026-08' } })

    await waitFor(() => {
      expect(
        mocks.getExpenseSummary.mock.calls.some(
          (call) => periodKey(call[0] as ExpensePeriod) === '2026-08',
        ),
      ).toBe(true)
    })
    await waitFor(() => {
      expect(screen.getByText(/no hay gastos en el periodo seleccionado/i)).toBeTruthy()
    })
  })

  test('el registro de gasto vive en un modal que abre el botón Registrar gasto', async () => {
    mockInitial()

    render(() => <DashboardPage />)

    await waitForSummary()
    expect(screen.queryByRole('form', { name: 'Nuevo gasto' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Registrar gasto' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Registrar gasto' })).toBeTruthy()
    })
    expect(screen.getByRole('form', { name: 'Nuevo gasto' })).toBeTruthy()
  })

  test('refresca el resumen tras crear un gasto desde el modal', async () => {
    const updatedSummary: ExpenseSummary = {
      ...summarySeptember,
      totalAmount: 150,
      expenseCount: 3,
    }
    mocks.listExpenses.mockResolvedValue([])
    mocks.listExpensesPage.mockResolvedValue({ items: [], total: 0, page: 1, limit: 5, totalPages: 1 } as ExpensePage)
    mocks.listCategories.mockResolvedValue(categories)
    mocks.getExpenseSummary.mockResolvedValueOnce(summarySeptember).mockResolvedValueOnce(updatedSummary)
    mocks.createExpense.mockResolvedValue({
      id: 'new-1',
      amount: 50,
      expenseDate: '2026-09-12',
      description: 'Compra',
      category: categories[0],
      createdAt: '2026-09-12T10:00:00.000Z',
      updatedAt: '2026-09-12T10:00:00.000Z',
    } as Expense)

    render(() => <DashboardPage />)

    await waitForSummary()
    const initialCalls = mocks.getExpenseSummary.mock.calls.length

    fireEvent.click(screen.getByRole('button', { name: 'Registrar gasto' }))
    await waitFor(() => {
      expect(screen.getByRole('form', { name: 'Nuevo gasto' })).toBeTruthy()
    })

    fireEvent.input(screen.getByLabelText('Importe'), { target: { value: '50' } })
    fireEvent.input(screen.getByLabelText('Descripción'), { target: { value: 'Compra' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Nuevo gasto' }))

    await waitFor(() => {
      expect(mocks.createExpense).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(mocks.getExpenseSummary.mock.calls.length).toBeGreaterThan(initialCalls)
    })
    await waitFor(() => {
      expect(screen.getByText(/gasto guardado correctamente/i)).toBeTruthy()
    })
  })

  test('la lista de últimos gastos es de solo lectura: sin editar ni eliminar', async () => {
    mockInitial()
    mocks.listExpensesPage.mockResolvedValue({
      items: [existingExpense],
      total: 1,
      page: 1,
      limit: 5,
      totalPages: 1,
    } as ExpensePage)

    render(() => <DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText('Almuerzo')).toBeTruthy()
    })
    expect(screen.getByRole('heading', { name: 'Últimos 5 gastos' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
    expect(screen.queryByRole('link', { name: /ver historial/i })).toBeNull()
  })

  test('cambia a periodo semanal y consulta con weekStart', async () => {
    mockInitial()
    mocks.getExpenseSummary.mockImplementation(async (period: ExpensePeriod) => {
      if (period.type === 'week') return summaryWeek
      if (periodKey(period) === '2026-08') return summaryAugust
      return summarySeptember
    })

    render(() => <DashboardPage />)

    await waitForSummary()
    mocks.getExpenseSummary.mockClear()
    mocks.listExpenses.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Semanal' }))

    await waitFor(() => {
      expect(screen.getByText('Total semanal')).toBeTruthy()
    })
    await waitFor(() => {
      const weekCalls = mocks.getExpenseSummary.mock.calls.filter(
        (call) => (call[0] as ExpensePeriod).type === 'week',
      )
      expect(weekCalls.length).toBeGreaterThan(0)
      const period = weekCalls[0][0] as ExpensePeriod
      expect(period.type).toBe('week')
      if (period.type === 'week') {
        expect(period.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      }
    })
    expect(screen.getByLabelText('Semana del resumen')).toBeTruthy()
  })

  test('muestra los últimos 5 gastos sin depender del periodo activo', async () => {
    mockInitial()

    render(() => <DashboardPage />)

    await waitForSummary()
    expect(mocks.listExpensesPage).toHaveBeenCalledWith({ page: 1, limit: 5 })
    const callsBefore = mocks.listExpensesPage.mock.calls.length

    fireEvent.click(screen.getByRole('button', { name: 'Semanal' }))

    await waitFor(() => {
      expect(screen.getByText('Total semanal')).toBeTruthy()
    })
    expect(mocks.listExpensesPage.mock.calls.length).toBe(callsBefore)
  })

  test('sincroniza listExpenses y getExpenseSummary con el mismo periodo', async () => {
    mockInitial()

    render(() => <DashboardPage />)

    await waitForSummary()

    expect(mocks.listExpenses).toHaveBeenCalled()
    expect(mocks.getExpenseSummary).toHaveBeenCalled()
    expect(mocks.listExpenses.mock.calls[0][0]).toEqual(mocks.getExpenseSummary.mock.calls[0][0])
    expect((mocks.listExpenses.mock.calls[0][0] as ExpensePeriod).type).toBe('month')
  })

  test('muestra la moneda en soles y mantiene la accesibilidad del resumen', async () => {
    mockInitial()

    render(() => <DashboardPage />)

    await waitForSummary()
    expect(screen.getAllByText((text) => text.includes('S/')).length).toBeGreaterThan(0)
    expect(screen.getByRole('region', { name: 'Resumen del periodo' })).toBeTruthy()
    expect(screen.getByRole('progressbar', { name: 'Porcentaje de Alimentación' })).toBeTruthy()
    expect(
      screen.getByRole('progressbar', { name: 'Porcentaje de Alimentación' }).getAttribute('aria-valuenow'),
    ).toBe('100')
  })
})
