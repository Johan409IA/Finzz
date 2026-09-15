import { createEffect, createSignal, For, Show } from 'solid-js'
import type { Expense, ExpenseCategory, ExpenseInput } from '../lib/expenses'

interface ExpenseFormProps {
  categories: ExpenseCategory[]
  editingExpense: Expense | null
  saving: boolean
  error: string | null
  onSubmit: (input: ExpenseInput) => Promise<void>
  onCancelEdit: () => void
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function ExpenseForm(props: ExpenseFormProps) {
  const [amount, setAmount] = createSignal('')
  const [expenseDate, setExpenseDate] = createSignal(today())
  const [categoryId, setCategoryId] = createSignal('')
  const [description, setDescription] = createSignal('')
  const [formError, setFormError] = createSignal<string | null>(null)

  createEffect(() => {
    const expense = props.editingExpense
    setAmount(expense ? expense.amount.toFixed(2) : '')
    setExpenseDate(expense?.expenseDate ?? today())
    setCategoryId(expense?.category.id ?? props.categories[0]?.id ?? '')
    setDescription(expense?.description ?? '')
    setFormError(null)
  })

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    setFormError(null)

    const parsedAmount = Number(amount())
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Introduce un importe mayor que cero.')
      return
    }
    if (!expenseDate() || !categoryId()) {
      setFormError('Completa la fecha y la categoría.')
      return
    }

    await props.onSubmit({
      amount: parsedAmount,
      expenseDate: expenseDate(),
      categoryId: categoryId(),
      description: description().trim(),
    })
  }

  return (
    <form class="expense-form" aria-label={props.editingExpense ? 'Editar gasto' : 'Nuevo gasto'} onSubmit={handleSubmit}>
      <div class="section-heading">
        <div>
          <p class="eyebrow">Registro</p>
          <h2>{props.editingExpense ? 'Editar gasto' : 'Añadir gasto'}</h2>
        </div>
        <Show when={props.editingExpense}>
          <button type="button" class="button button-quiet" onClick={props.onCancelEdit}>
            Cancelar
          </button>
        </Show>
      </div>

      <div class="form-grid">
        <label>
          Importe
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputmode="decimal"
            value={amount()}
            onInput={(event) => setAmount(event.currentTarget.value)}
            required
          />
        </label>
        <label>
          Fecha
          <input
            type="date"
            value={expenseDate()}
            onInput={(event) => setExpenseDate(event.currentTarget.value)}
            required
          />
        </label>
        <label>
          Categoría
          <select value={categoryId()} onChange={(event) => setCategoryId(event.currentTarget.value)} required>
            <option value="" disabled>Selecciona una categoría</option>
            <For each={props.categories}>
              {(category) => <option value={category.id}>{category.name}</option>}
            </For>
          </select>
        </label>
        <label class="form-grid-wide">
          Descripción
          <input
            type="text"
            maxlength="500"
            value={description()}
            onInput={(event) => setDescription(event.currentTarget.value)}
            placeholder="Ej. Compra semanal"
          />
        </label>
      </div>

      <Show when={formError()}>
        {(message) => <p class="form-error" role="alert">{message()}</p>}
      </Show>
      <Show when={props.error}>
        {(message) => <p class="form-error" role="alert">{message()}</p>}
      </Show>

      <button class="button button-primary" type="submit" disabled={props.saving || props.categories.length === 0}>
        {props.saving ? 'Guardando…' : props.editingExpense ? 'Guardar cambios' : 'Guardar gasto'}
      </button>
    </form>
  )
}
