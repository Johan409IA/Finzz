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
      />
    ))

    fireEvent.submit(screen.getByRole('form', { name: 'Nuevo gasto' }))

    expect(screen.getByRole('alert').textContent).toContain('Introduce un importe mayor que cero.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  test('distingue el error de carga de categorías y permite reintentar', () => {
    const onRetryCategories = vi.fn()

    render(() => (
      <ExpenseForm
        categories={[]}
        editingExpense={null}
        saving={false}
        error={null}
        categoriesError
        onRetryCategories={onRetryCategories}
        onSubmit={vi.fn()}
      />
    ))

    expect(screen.getByRole('alert').textContent).toContain('No se pudieron cargar las categorías.')
    expect(screen.getByRole('button', { name: 'Reintentar categorías' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Guardar gasto' }) as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar categorías' }))
    expect(onRetryCategories).toHaveBeenCalledOnce()
  })

  test('usa la fecha local de hoy como valor predeterminado', () => {
    render(() => (
      <ExpenseForm
        categories={categories}
        editingExpense={null}
        saving={false}
        error={null}
        onSubmit={vi.fn()}
      />
    ))

    const date = new Date()
    const expected = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    expect((screen.getByLabelText('Fecha') as HTMLInputElement).value).toBe(expected)
  })

  test('expone los campos etiquetados del formulario', () => {
    render(() => (
      <ExpenseForm
        categories={categories}
        editingExpense={null}
        saving={false}
        error={null}
        onSubmit={vi.fn()}
      />
    ))

    expect(screen.getByLabelText('Importe')).toBeTruthy()
    expect(screen.getByLabelText('Fecha')).toBeTruthy()
    expect(screen.getByLabelText('Categoría')).toBeTruthy()
    expect(screen.getByLabelText('Descripción')).toBeTruthy()
  })
})
