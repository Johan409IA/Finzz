import { fireEvent, render, screen, waitFor } from 'solid-testing-library'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import HistoryPage from './HistoryPage'
import type { Expense, ExpensePage } from '../lib/expenses'

const mocks = vi.hoisted(() => ({
  listExpensesPage: vi.fn(),
  listCategories: vi.fn(),
  createExpense: vi.fn(),
  updateExpense: vi.fn(),
  deleteExpense: vi.fn(),
}))

vi.mock('../lib/expenses', () => mocks)

const categories = [
  { id: 'cat-1', slug: 'alimentacion', name: 'Alimentación' },
  { id: 'cat-2', slug: 'transporte', name: 'Transporte' },
]

function makeExpense(index: number): Expense {
  return {
    id: `expense-${index}`,
    amount: 10 + index,
    expenseDate: `2026-09-${String(index + 1).padStart(2, '0')}`,
    description: `Gasto ${index + 1}`,
    category: categories[index % 2]!,
    createdAt: `2026-09-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
    updatedAt: `2026-09-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
  }
}

const allExpenses = Array.from({ length: 12 }, (_, index) => makeExpense(index))

function pageOf(items: Expense[], page: number, limit: number): ExpensePage {
  return {
    items: items.slice((page - 1) * limit, page * limit),
    total: items.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
  }
}

function mockHistory(items = allExpenses) {
  mocks.listCategories.mockResolvedValue(categories)
  mocks.listExpensesPage.mockImplementation(async (params: { page: number; limit: number; search?: string }) => {
    const term = params.search?.trim().toLowerCase()
    const filtered = term
      ? items.filter((item) => item.description.toLowerCase().includes(term))
      : items
    return pageOf(filtered, params.page, params.limit)
  })
  mocks.createExpense.mockResolvedValue(allExpenses[0]!)
  mocks.updateExpense.mockResolvedValue(allExpenses[0]!)
  mocks.deleteExpense.mockResolvedValue(undefined)
}

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('muestra encabezado, fecha y botón de registro', async () => {
    mockHistory()

    render(() => <HistoryPage />)

    expect(screen.getByRole('heading', { name: 'Historial' })).toBeTruthy()
    expect(screen.getByText(/consulta, busca y administra/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Registrar gasto' })).toBeTruthy()
    await waitFor(() => {
      expect(screen.getByText(/12 gastos registrados en total/)).toBeTruthy()
    })
  })

  test('muestra 10 registros por página con tabla y rango', async () => {
    mockHistory()

    render(() => <HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Mostrando 1–10 de 12 gastos')).toBeTruthy()
    })
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(10)
    expect(screen.getByRole('columnheader', { name: 'Descripción' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Categoría' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Fecha' })).toBeTruthy()
    expect(screen.getByRole('columnheader', { name: 'Importe' })).toBeTruthy()
    expect(screen.getAllByText((text) => text.includes('S/')).length).toBeGreaterThan(0)
  })

  test('la búsqueda filtra por nombre sin recargar', async () => {
    mockHistory()

    render(() => <HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Mostrando 1–10 de 12 gastos')).toBeTruthy()
    })
    mocks.listExpensesPage.mockClear()

    fireEvent.input(screen.getByPlaceholderText('Buscar por nombre del gasto...'), {
      target: { value: 'Gasto 1' },
    })

    await waitFor(() => {
      const calls = mocks.listExpensesPage.mock.calls as Array<{ search?: string }[]>
      expect(calls.some((call) => call[0]?.search === 'Gasto 1')).toBe(true)
    })
    await waitFor(() => {
      expect(screen.getByText(/coinciden con/)).toBeTruthy()
    })
  })

  test('muestra estado de búsqueda sin resultados', async () => {
    mockHistory()

    render(() => <HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Mostrando 1–10 de 12 gastos')).toBeTruthy()
    })

    fireEvent.input(screen.getByPlaceholderText('Buscar por nombre del gasto...'), {
      target: { value: 'inexistente-xyz' },
    })

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron gastos con ese nombre/i)).toBeTruthy()
    })
  })

  test('muestra estado vacío sin búsqueda', async () => {
    mockHistory([])

    render(() => <HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText(/no tienes gastos registrados/i)).toBeTruthy()
    })
  })

  test('paginación avanza y deshabilita extremos', async () => {
    mockHistory()

    render(() => <HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Mostrando 1–10 de 12 gastos')).toBeTruthy()
    })
    expect(screen.getByRole('button', { name: 'Anterior' })).toHaveProperty('disabled', true)

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    await waitFor(() => {
      expect(screen.getByText('Mostrando 11–12 de 12 gastos')).toBeTruthy()
    })
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: 'Anterior' })).toHaveProperty('disabled', false)
    expect(screen.getByRole('button', { name: 'Ir a la página 2' })).toBeTruthy()
  })

  test('eliminar pide confirmación y actualiza la tabla', async () => {
    mockHistory()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(() => <HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Mostrando 1–10 de 12 gastos')).toBeTruthy()
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[0])

    await waitFor(() => {
      expect(mocks.deleteExpense).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(screen.getByText(/gasto eliminado correctamente/i)).toBeTruthy()
    })
    confirmSpy.mockRestore()
  })

  test('editar reutiliza el formulario y actualiza el registro', async () => {
    mockHistory()

    render(() => <HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Mostrando 1–10 de 12 gastos')).toBeTruthy()
    })

    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0])

    await waitFor(() => {
      expect(screen.getByRole('form', { name: 'Editar gasto' })).toBeTruthy()
    })
    fireEvent.submit(screen.getByRole('form', { name: 'Editar gasto' }))

    await waitFor(() => {
      expect(mocks.updateExpense).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(screen.getByText(/gasto actualizado correctamente/i)).toBeTruthy()
    })
  })

  test('registrar gasto usa el mismo formulario', async () => {
    mockHistory()

    render(() => <HistoryPage />)

    await waitFor(() => {
      expect(screen.getByText('Mostrando 1–10 de 12 gastos')).toBeTruthy()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Registrar gasto' }))

    await waitFor(() => {
      expect(screen.getByRole('form', { name: 'Nuevo gasto' })).toBeTruthy()
    })
    fireEvent.input(screen.getByLabelText('Importe'), { target: { value: '25' } })
    fireEvent.input(screen.getByLabelText('Descripción'), { target: { value: 'Mercado' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Nuevo gasto' }))

    await waitFor(() => {
      expect(mocks.createExpense).toHaveBeenCalled()
    })
    await waitFor(() => {
      expect(screen.getByText(/gasto guardado correctamente/i)).toBeTruthy()
    })
  })
})
