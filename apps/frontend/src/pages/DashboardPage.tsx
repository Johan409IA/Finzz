import { createResource, createSignal, Show } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'
import ExpenseSummary from '../components/ExpenseSummary'
import {
  createExpense,
  deleteExpense,
  getExpenseSummary,
  listCategories,
  listExpenses,
  updateExpense,
  type Expense,
  type ExpenseInput,
  type ExpensePeriod,
  type ExpensePeriodType,
} from '../lib/expenses'
import { currentIsoWeek, currentMonth, formatCurrency, isoWeekToMonday } from '../lib/format'
import { useAuth } from '../lib/auth'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [periodType, setPeriodType] = createSignal<ExpensePeriodType>('month')
  const [selectedMonth, setSelectedMonth] = createSignal(currentMonth())
  const [selectedWeek, setSelectedWeek] = createSignal(currentIsoWeek())
  const selectedPeriod = (): ExpensePeriod =>
    periodType() === 'month'
      ? { type: 'month', month: selectedMonth() }
      : { type: 'week', weekStart: isoWeekToMonday(selectedWeek()) }
  const [expenses, { refetch: refetchExpenses }] = createResource(selectedPeriod, listExpenses)
  const [categories] = createResource(listCategories)
  const [summary, { refetch: refetchSummary }] = createResource(selectedPeriod, getExpenseSummary)
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
      await Promise.all([refetchExpenses(), refetchSummary()])
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'No se pudo guardar el gasto.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(expense: Expense) {
    if (!window.confirm(`¿Eliminar el gasto de ${formatCurrency(expense.amount)}?`)) return

    setDeletingId(expense.id)
    setMutationError(null)
    setSuccessMessage(null)
    try {
      await deleteExpense(expense.id)
      if (editingExpense()?.id === expense.id) setEditingExpense(null)
      await Promise.all([refetchExpenses(), refetchSummary()])
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
    <div class="mx-auto w-[min(100%-2rem,1120px)] pb-16">
      <header class="flex flex-col items-start gap-4 border-b border-finzz-border py-8 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <img src="/apple-touch-icon.png" alt="Logotipo de Finzz" class="h-11 w-11 rounded-xl object-contain" />
          <div>
            <p class="m-0 text-xs font-bold uppercase tracking-[0.1em] text-finzz-accent">Finanzas personales</p>
            <h1 class="mb-0 mt-0.5 text-3xl tracking-tight text-finzz-heading">Finzz</h1>
          </div>
        </div>
        <div class="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
          <span class="rounded-full bg-finzz-accent-bg px-2.5 py-1.5 text-xs text-finzz-heading">
            {user()?.profile?.name || user()?.email}
          </span>
          <button
            type="button"
            onClick={handleSignOut}
            class="rounded-md border border-finzz-border bg-transparent px-3 py-2 text-sm text-finzz-heading transition-colors hover:bg-finzz-accent-bg"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <main class="grid gap-6 pt-8">
        <section class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="m-0 text-xs font-bold uppercase tracking-[0.1em] text-finzz-accent">Resumen</p>
            <h2 class="mb-2 mt-1.5 max-w-[38rem] text-3xl leading-none tracking-tight text-finzz-heading sm:text-5xl">
              Controla tus gastos con claridad.
            </h2>
            <p class="max-w-[38rem]">Registra cada movimiento y mantén una visión sencilla de tus finanzas.</p>
          </div>
          <div class="w-fit min-w-36 rounded-xl border border-finzz-border bg-finzz-surface p-4">
            <span class="block text-xs">Gastos registrados</span>
            <strong class="mt-1 block text-3xl text-finzz-heading">{expenses()?.length ?? 0}</strong>
          </div>
        </section>

        <Show when={successMessage()}>
          {(message) => <p class="mt-4 text-sm text-finzz-success" role="status">{message()}</p>}
        </Show>

        <Show when={categories.error}>
          <p class="mt-4 text-sm text-finzz-danger" role="alert">No se pudieron cargar las categorías.</p>
        </Show>

        <ExpenseSummary
          periodType={periodType()}
          month={selectedMonth()}
          week={selectedWeek()}
          onPeriodTypeChange={setPeriodType}
          onMonthChange={setSelectedMonth}
          onWeekChange={setSelectedWeek}
          summary={summary()}
          loading={summary.loading}
          error={summary.error ? 'No se pudo cargar el resumen del periodo.' : null}
        />

        <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.4fr)]">
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
