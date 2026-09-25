import { createEffect, createSignal, For, Show } from 'solid-js'
import LoaderCircleIcon from 'lucide-solid/icons/loader-circle'
import { cardClass, cardTitleClass, eyebrowClass, fieldClass, fieldLabelClass, ghostButtonClass, primaryButtonClass } from '../lib/ui'
import type { Expense, ExpenseCategory, ExpenseInput } from '../lib/expenses'

interface ExpenseFormProps {
  categories: ExpenseCategory[]
  editingExpense: Expense | null
  saving: boolean
  error: string | null
  onSubmit: (input: ExpenseInput) => Promise<void>
  onCancelEdit: () => void
}

const dateFieldClass = `${fieldClass} [color-scheme:dark]`

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
      class={`${cardClass} scroll-mt-24 p-5 text-left`}
    >
      <div class="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class={eyebrowClass}>Registro</p>
          <h2 class={`${cardTitleClass} mt-1`}>
            {props.editingExpense ? 'Editar gasto' : 'Registrar gasto'}
          </h2>
        </div>
        <Show when={props.editingExpense}>
          <button type="button" onClick={props.onCancelEdit} class={ghostButtonClass}>
            Cancelar
          </button>
        </Show>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class={fieldLabelClass}>
          Importe
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputmode="decimal"
            value={amount()}
            onInput={(event) => setAmount(event.currentTarget.value)}
            required
            class={fieldClass}
          />
        </label>
        <label class={fieldLabelClass}>
          Fecha
          <input
            type="date"
            value={expenseDate()}
            onInput={(event) => setExpenseDate(event.currentTarget.value)}
            required
            class={dateFieldClass}
          />
        </label>
        <label class={`${fieldLabelClass} sm:col-span-2`}>
          Categoría
          <select
            value={categoryId()}
            onChange={(event) => setCategoryId(event.currentTarget.value)}
            required
            class={`${fieldClass} [color-scheme:dark]`}
          >
            <option value="" disabled>Selecciona una categoría</option>
            <For each={props.categories}>
              {(category) => <option value={category.id}>{category.name}</option>}
            </For>
          </select>
        </label>
        <label class={`${fieldLabelClass} sm:col-span-2`}>
          Descripción
          <input
            type="text"
            maxlength="500"
            value={description()}
            onInput={(event) => setDescription(event.currentTarget.value)}
            placeholder="Ej. Compra semanal"
            class={fieldClass}
          />
        </label>
      </div>

      <Show when={formError()}>
        {(message) => <p class="mb-0 mt-4 text-sm text-finzz-danger" role="alert">{message()}</p>}
      </Show>
      <Show when={props.error}>
        {(message) => <p class="mb-0 mt-4 text-sm text-finzz-danger" role="alert">{message()}</p>}
      </Show>

      <button
        type="submit"
        disabled={props.saving || props.categories.length === 0}
        class={`${primaryButtonClass} mt-5 w-full`}
      >
        <Show when={props.saving}>
          <LoaderCircleIcon size={16} strokeWidth={2.4} class="animate-spin" aria-hidden="true" />
        </Show>
        {props.saving ? 'Guardando…' : props.editingExpense ? 'Guardar cambios' : 'Guardar gasto'}
      </button>
    </form>
  )
}
