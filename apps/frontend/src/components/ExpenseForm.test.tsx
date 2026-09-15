import { fireEvent, render, screen } from 'solid-testing-library'
import { describe, expect, test, vi } from 'vitest'
import ExpenseForm from './ExpenseForm'
import type { ExpenseCategory } from '../lib/expenses'

const categories: ExpenseCategory[] = [
  { id: 'category-1', slug: 'alimentacion', name: 'Alimentación' },
]

describe('ExpenseForm', () => {
  test('muestra validación para importe inválido', () => {
    const onSubmit = vi.fn()

    render(() => (
      <ExpenseForm
        categories={categories}
        editingExpense={null}
        saving={false}
        error={null}
        onSubmit={onSubmit}
        onCancelEdit={vi.fn()}
      />
    ))

    fireEvent.submit(screen.getByRole('form', { name: 'Nuevo gasto' }))

    expect(screen.getByRole('alert').textContent).toContain('Introduce un importe mayor que cero.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('expone los campos etiquetados del formulario', () => {
    render(() => (
      <ExpenseForm
        categories={categories}
        editingExpense={null}
        saving={false}
        error={null}
        onSubmit={vi.fn()}
        onCancelEdit={vi.fn()}
      />
    ))

    expect(screen.getByLabelText('Importe')).toBeTruthy()
    expect(screen.getByLabelText('Fecha')).toBeTruthy()
    expect(screen.getByLabelText('Categoría')).toBeTruthy()
    expect(screen.getByLabelText('Descripción')).toBeTruthy()
  })
})
