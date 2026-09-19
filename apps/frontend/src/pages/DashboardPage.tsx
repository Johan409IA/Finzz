import { createResource, createSignal, Show } from 'solid-js'
import { A } from '@solidjs/router'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'
import ExpenseSummary from '../components/ExpenseSummary'
import {
  createExpense,
  deleteExpense,
  getExpenseSummary,
  listCategories,
  listExpenses,
  listExpensesPage,
  updateExpense,
  type Expense,
  type ExpenseInput,
  type ExpensePeriod,
  type ExpensePeriodType,
} from '../lib/expenses'
import { currentIsoWeek, currentMonth, formatCurrency, isoWeekToMonday } from '../lib/format'

const RECENT_LIMIT = 5

export default function DashboardPage() {
  const [periodType, setPeriodType] = createSignal<ExpensePeriodType>('month')
  const [selectedMonth, setSelectedMonth] = createSignal(currentMonth())
  const [selectedWeek, setSelectedWeek] = createSignal(currentIsoWeek())
  const selectedPeriod = (): ExpensePeriod =>
    periodType() === 'month'
      ? { type: 'month', month: selectedMonth() }
      : { type: 'week', weekStart: isoWeekToMonday(selectedWeek()) }
  const [expenses, { refetch: refetchExpenses }] = createResource(selectedPeriod, listExpenses)
  const [recent, { refetch: refetchRecent }] = createResource(() =>
    listExpensesPage({ page: 1, limit: RECENT_LIMIT }),
  )
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
      await Promise.all([refetchExpenses(), refetchRecent(), refetchSummary()])
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
      await Promise.all([refetchExpenses(), refetchRecent(), refetchSummary()])
      setSuccessMessage('Gasto eliminado correctamente.')
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'No se pudo eliminar el gasto.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div class="grid gap-6">
      <section class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="m-0 text-xs font-bold uppercase tracking-[0.1em] text-finzz-accent">Resumen</p>
          <h1 class="mb-2 mt-1.5 max-w-[38rem] text-3xl leading-none tracking-tight text-finzz-heading sm:text-5xl">
            Controla tus gastos con claridad.
          </h1>
          <p class="max-w-[38rem]">Registra cada movimiento y mantén una visión sencilla de tus finanzas.</p>
        </div>
        <div class="w-fit min-w-36 rounded-xl border border-finzz-border bg-finzz-surface p-4">
          <span class="block text-xs">Gastos registrados</span>
          <strong class="mt-1 block text-3xl text-finzz-heading">{summary()?.expenseCount ?? 0}</strong>
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
        expenses={expenses() ?? []}
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
        <div class="grid gap-3">
          <ExpenseList
            expenses={recent()?.items ?? []}
            loading={recent.loading}
            error={recent.error ? 'No se pudieron cargar tus gastos.' : null}
            onEdit={setEditingExpense}
            onDelete={handleDelete}
            deletingId={deletingId()}
          />
          <Show when={!recent.loading && !recent.error && (recent()?.total ?? 0) > RECENT_LIMIT}>
            <A href="/historial" class="justify-self-end text-sm font-semibold text-finzz-accent hover:underline">
              Ver historial →
            </A>
          </Show>
        </div>
      </div>
    </div>
  )
}
