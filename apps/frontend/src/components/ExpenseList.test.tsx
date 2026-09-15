import { render, screen } from 'solid-testing-library'
import { describe, expect, test, vi } from 'vitest'
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
    render(() => (
      <ExpenseList
        expenses={[]}
        loading
        error={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />
    ))

    expect(screen.getByLabelText('Cargando gastos')).toBeTruthy()
  })

  test('muestra el estado vacío', () => {
    render(() => (
      <ExpenseList
        expenses={[]}
        loading={false}
        error={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />
    ))

    expect(screen.getByText('Aún no tienes gastos')).toBeTruthy()
  })

  test('muestra gasto y acciones accesibles', () => {
    render(() => (
      <ExpenseList
        expenses={[expense]}
        loading={false}
        error={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        deletingId={null}
      />
    ))

    expect(screen.getByText('Café')).toBeTruthy()
    expect(screen.getByText((text) => text.includes('12,50'))).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeTruthy()
  })
})
