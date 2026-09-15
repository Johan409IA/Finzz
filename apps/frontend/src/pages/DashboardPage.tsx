import { createResource, createSignal, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'
import {
  createExpense,
  deleteExpense,
  listCategories,
  listExpenses,
  updateExpense,
  type Expense,
  type ExpenseInput,
} from '../lib/expenses'
import { useAuth } from '../lib/auth'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [expenses, { refetch: refetchExpenses }] = createResource(listExpenses)
  const [categories] = createResource(listCategories)
  const [editingExpense, setEditingExpense] = createSignal<Expense | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [deletingId, setDeletingId] = createSignal<string | null>(null)
  const [mutationError, setMutationError] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  async function handleExpenseSubmit(input: ExpenseInput) {
    setSaving(true)
    setMutationError(null)
    setSuccessMessage(null)

    try {
      const currentExpense = editingExpense()
      if (currentExpense) {
        await updateExpense(currentExpense.id, input)
        setEditingExpense(null)
        setSuccessMessage('Gasto actualizado correctamente.')
      } else {
        await createExpense(input)
        setSuccessMessage('Gasto guardado correctamente.')
      }
      await refetchExpenses()
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'No se pudo guardar el gasto.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(expense: Expense) {
    if (!window.confirm(`¿Eliminar el gasto de ${expense.amount.toFixed(2)} €?`)) return

    setDeletingId(expense.id)
    setMutationError(null)
    setSuccessMessage(null)
    try {
      await deleteExpense(expense.id)
      if (editingExpense()?.id === expense.id) setEditingExpense(null)
      await refetchExpenses()
      setSuccessMessage('Gasto eliminado correctamente.')
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'No se pudo eliminar el gasto.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div class="dashboard-shell">
      <header class="dashboard-header">
        <div>
          <p class="eyebrow">Finanzas personales</p>
          <h1>Finzz</h1>
        </div>
        <div class="header-actions">
          <span class="user-chip">{user()?.profile?.name || user()?.email}</span>
          <button type="button" class="button button-quiet" onClick={handleSignOut}>Cerrar sesión</button>
        </div>
      </header>

      <main class="dashboard-content">
        <section class="dashboard-intro">
          <div>
            <p class="eyebrow">Resumen</p>
            <h2>Controla tus gastos con claridad.</h2>
            <p class="intro-copy">Registra cada movimiento y mantén una visión sencilla de tus finanzas.</p>
          </div>
          <div class="total-card">
            <span>Gastos registrados</span>
            <strong>{expenses()?.length ?? 0}</strong>
          </div>
        </section>

        <Show when={successMessage()}>
          {(message) => <p class="status-message status-success" role="status">{message()}</p>}
        </Show>

        <Show when={categories.error}>
          <p class="status-message status-error" role="alert">No se pudieron cargar las categorías.</p>
        </Show>

        <div class="dashboard-grid">
          <ExpenseForm
            categories={categories() ?? []}
            editingExpense={editingExpense()}
            saving={saving()}
            error={mutationError()}
            onSubmit={handleExpenseSubmit}
            onCancelEdit={() => setEditingExpense(null)}
          />
          <ExpenseList
            expenses={expenses() ?? []}
            loading={expenses.loading}
            error={expenses.error ? 'No se pudieron cargar tus gastos.' : null}
            onEdit={setEditingExpense}
            onDelete={handleDelete}
            deletingId={deletingId()}
          />
        </div>
      </main>
    </div>
  )
}
