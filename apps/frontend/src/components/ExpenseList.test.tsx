import { render, screen } from 'solid-testing-library'
import { describe, expect, test } from 'vitest'
import ExpenseList from './ExpenseList'
import type { Expense } from '../lib/expenses'

const expense: Expense = {
  id: 'expense-1',
  amount: 12.5,
  expenseDate: '2026-09-12',
  description: 'Café',
  category: { id: 'category-1', slug: 'alimentacion', name: 'Alimentación' },
  createdAt: '2026-09-12T10:00:00.000Z',
  updatedAt: '2026-09-12T10:00:00.000Z',
}

describe('ExpenseList', () => {
  test('muestra skeleton durante la carga', () => {
    render(() => <ExpenseList expenses={[]} loading error={null} />)

    expect(screen.getByLabelText('Cargando gastos')).toBeTruthy()
  })

  test('muestra el estado vacío', () => {
    render(() => <ExpenseList expenses={[]} loading={false} error={null} />)

    expect(screen.getByText('Aún no tienes gastos')).toBeTruthy()
  })

  test('muestra el gasto en modo lectura, sin acciones de edición ni eliminación', () => {
    render(() => <ExpenseList expenses={[expense]} loading={false} error={null} />)

    expect(screen.getByText('Café')).toBeTruthy()
    expect(screen.getByText((text) => text.includes('S/ 12.50'))).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Editar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).toBeNull()
  })

  test('muestra el título y el subtítulo personalizados', () => {
    render(() => (
      <ExpenseList
        expenses={[expense]}
        loading={false}
        error={null}
        title="Últimos 5 gastos"
        subtitle="Tus gastos más recientes"
      />
    ))

    expect(screen.getByText('Últimos 5 gastos')).toBeTruthy()
    expect(screen.getByText('Tus gastos más recientes')).toBeTruthy()
  })
})
