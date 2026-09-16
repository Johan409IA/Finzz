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

const inputClass =
  'w-full box-border rounded-md border border-finzz-border bg-finzz-bg px-3 py-2.5 text-finzz-heading'
const labelClass = 'grid gap-1.5 text-left text-sm text-finzz-heading'

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
    <form
      aria-label={props.editingExpense ? 'Editar gasto' : 'Nuevo gasto'}
      onSubmit={handleSubmit}
      class="rounded-xl border border-finzz-border bg-finzz-surface p-5 text-left"
    >
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <p class="m-0 text-xs font-bold uppercase tracking-[0.1em] text-finzz-accent">Registro</p>
          <h2 class="mb-0 mt-1 text-xl text-finzz-heading">
            {props.editingExpense ? 'Editar gasto' : 'Añadir gasto'}
          </h2>
        </div>
        <Show when={props.editingExpense}>
          <button
            type="button"
            onClick={props.onCancelEdit}
            class="rounded-md border border-finzz-border bg-transparent px-3 py-2 text-sm text-finzz-heading transition-colors hover:bg-finzz-accent-bg"
          >
            Cancelar
          </button>
        </Show>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class={labelClass}>
          Importe
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputmode="decimal"
            value={amount()}
            onInput={(event) => setAmount(event.currentTarget.value)}
            required
            class={inputClass}
          />
        </label>
        <label class={labelClass}>
          Fecha
          <input
            type="date"
            value={expenseDate()}
            onInput={(event) => setExpenseDate(event.currentTarget.value)}
            required
            class={inputClass}
          />
        </label>
        <label class={labelClass}>
          Categoría
          <select
            value={categoryId()}
            onChange={(event) => setCategoryId(event.currentTarget.value)}
            required
            class={inputClass}
          >
            <option value="" disabled>Selecciona una categoría</option>
            <For each={props.categories}>
              {(category) => <option value={category.id}>{category.name}</option>}
            </For>
          </select>
        </label>
        <label class={`${labelClass} sm:col-span-2`}>
          Descripción
          <input
            type="text"
            maxlength="500"
            value={description()}
            onInput={(event) => setDescription(event.currentTarget.value)}
            placeholder="Ej. Compra semanal"
            class={inputClass}
          />
        </label>
      </div>

      <Show when={formError()}>
        {(message) => <p class="mt-4 text-sm text-finzz-danger" role="alert">{message()}</p>}
      </Show>
      <Show when={props.error}>
        {(message) => <p class="mt-4 text-sm text-finzz-danger" role="alert">{message()}</p>}
      </Show>

      <button
        type="submit"
        disabled={props.saving || props.categories.length === 0}
        class="mt-5 w-full rounded-md border border-transparent bg-finzz-accent px-3 py-2 text-sm text-white transition-colors hover:bg-finzz-accent-strong disabled:cursor-not-allowed disabled:opacity-55"
      >
        {props.saving ? 'Guardando…' : props.editingExpense ? 'Guardar cambios' : 'Guardar gasto'}
      </button>
    </form>
  )
}
