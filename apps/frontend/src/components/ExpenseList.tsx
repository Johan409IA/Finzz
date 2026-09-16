import { For, Show } from 'solid-js'
import { formatCurrency, formatDate } from '../lib/format'
import type { Expense } from '../lib/expenses'

interface ExpenseListProps {
  expenses: Expense[]
  loading: boolean
  error: string | null
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => Promise<void>
  deletingId: string | null
}

export default function ExpenseList(props: ExpenseListProps) {
  return (
    <section
      aria-labelledby="expense-list-title"
      class="rounded-xl border border-finzz-border bg-finzz-surface p-5 text-left"
    >
      <div class="mb-5 flex items-start justify-between gap-4">
        <div>
          <p class="m-0 text-xs font-bold uppercase tracking-[0.1em] text-finzz-accent">Actividad</p>
          <h2 id="expense-list-title" class="mb-0 mt-1 text-xl text-finzz-heading">Tus gastos</h2>
        </div>
        <Show when={!props.loading && props.expenses.length > 0}>
          <span class="rounded-full bg-finzz-accent-bg px-2.5 py-1.5 text-xs text-finzz-heading">
            {props.expenses.length}
          </span>
        </Show>
      </div>

      <Show when={props.loading}>
        <div class="grid gap-3" aria-busy="true" aria-label="Cargando gastos">
          <For each={[1, 2, 3]}>{() => <div class="h-14 animate-pulse rounded-md bg-finzz-code" />}</For>
        </div>
      </Show>

      <Show when={!props.loading && props.error}>
        {(message) => <p class="mt-4 text-sm text-finzz-danger" role="alert">{message()}</p>}
      </Show>

      <Show when={!props.loading && !props.error && props.expenses.length === 0}>
        <div class="grid justify-items-center gap-2 px-4 py-12 text-center" role="status">
          <span
            aria-hidden="true"
            class="grid h-9 w-9 place-items-center rounded-lg bg-finzz-accent-bg font-bold text-finzz-accent"
          >
            S/
          </span>
          <h3 class="mb-0 mt-2 text-finzz-heading">Aún no tienes gastos</h3>
          <p class="max-w-[22rem]">Registra tu primer gasto para empezar a entender tus hábitos.</p>
        </div>
      </Show>

      <Show when={!props.loading && !props.error && props.expenses.length > 0}>
        <ul class="m-0 grid list-none gap-2 p-0" role="list">
          <For each={props.expenses}>
            {(expense) => (
              <li class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-finzz-border py-3 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
                <div aria-hidden="true" class="grid h-9 w-9 place-items-center rounded-lg bg-finzz-accent-bg font-bold text-finzz-accent">
                  {expense.category.name.slice(0, 1)}
                </div>
                <div class="min-w-0">
                  <strong class="block overflow-hidden text-ellipsis whitespace-nowrap text-finzz-heading">
                    {expense.description || expense.category.name}
                  </strong>
                  <span class="mt-0.5 block overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                    {expense.category.name} · {formatDate(expense.expenseDate)}
                  </span>
                </div>
                <strong class="col-start-3 row-start-1 text-finzz-heading sm:col-auto sm:row-auto">
                  {formatCurrency(expense.amount)}
                </strong>
                <div class="col-span-2 col-start-2 flex justify-end gap-1 sm:col-auto sm:col-start-auto">
                  <button
                    type="button"
                    onClick={() => props.onEdit(expense)}
                    class="rounded-md border border-finzz-border bg-transparent px-3 py-2 text-sm text-finzz-heading transition-colors hover:bg-finzz-accent-bg"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={props.deletingId === expense.id}
                    onClick={() => props.onDelete(expense)}
                    class="rounded-md border border-transparent bg-transparent px-3 py-2 text-sm text-finzz-danger transition-colors hover:border-finzz-danger-border hover:bg-finzz-danger-bg disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {props.deletingId === expense.id ? 'Eliminando…' : 'Eliminar'}
                  </button>
                </div>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </section>
  )
}
