import { For, Show } from 'solid-js'
import type { Expense } from '../lib/expenses'

interface ExpenseListProps {
  expenses: Expense[]
  loading: boolean
  error: string | null
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => Promise<void>
  deletingId: string | null
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  )
}

export default function ExpenseList(props: ExpenseListProps) {
  return (
    <section class="expense-list" aria-labelledby="expense-list-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Actividad</p>
          <h2 id="expense-list-title">Tus gastos</h2>
        </div>
        <Show when={!props.loading && props.expenses.length > 0}>
          <span class="count-badge">{props.expenses.length}</span>
        </Show>
      </div>

      <Show when={props.loading}>
        <div class="expense-skeleton" aria-busy="true" aria-label="Cargando gastos">
          <For each={[1, 2, 3]}>{() => <div class="skeleton-row" />}</For>
        </div>
      </Show>

      <Show when={!props.loading && props.error}>
        {(message) => <p class="status-message status-error" role="alert">{message()}</p>}
      </Show>

      <Show when={!props.loading && !props.error && props.expenses.length === 0}>
        <div class="empty-state" role="status">
          <span class="empty-icon" aria-hidden="true">€</span>
          <h3>Aún no tienes gastos</h3>
          <p>Registra tu primer gasto para empezar a entender tus hábitos.</p>
        </div>
      </Show>

      <Show when={!props.loading && !props.error && props.expenses.length > 0}>
        <ul class="expense-items" role="list">
          <For each={props.expenses}>
            {(expense) => (
              <li class="expense-item">
                <div class="expense-category" aria-hidden="true">{expense.category.name.slice(0, 1)}</div>
                <div class="expense-detail">
                  <strong>{expense.description || expense.category.name}</strong>
                  <span>{expense.category.name} · {formatDate(expense.expenseDate)}</span>
                </div>
                <strong class="expense-amount">{formatAmount(expense.amount)}</strong>
                <div class="expense-actions">
                  <button type="button" class="button button-quiet" onClick={() => props.onEdit(expense)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    class="button button-danger"
                    disabled={props.deletingId === expense.id}
                    onClick={() => props.onDelete(expense)}
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
