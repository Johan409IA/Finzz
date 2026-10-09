import { createResource, createSignal, Show } from 'solid-js'
import { A } from '@solidjs/router'
import ArrowRightIcon from 'lucide-solid/icons/arrow-right'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseDialog from '../components/ExpenseDialog'
import ExpenseList from '../components/ExpenseList'
import ExpenseSummary from '../components/ExpenseSummary'
import PageHeader from '../components/PageHeader'
import StatusBanner from '../components/StatusBanner'
import {
  createExpense,
  getExpenseSummary,
  listCategories,
  listExpenses,
  listExpensesPage,
  type ExpenseInput,
  type ExpensePeriod,
  type ExpensePeriodType,
} from '../lib/expenses'
import { currentIsoWeek, currentMonth, isoWeekToMonday } from '../lib/format'

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
  const [categories, { refetch: refetchCategories }] = createResource(listCategories)
  const [summary, { refetch: refetchSummary }] = createResource(selectedPeriod, getExpenseSummary)
  const [modalOpen, setModalOpen] = createSignal(false)
  const [saving, setSaving] = createSignal(false)
  const [mutationError, setMutationError] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  const hasMoreThanRecent = () => !recent.loading && !recent.error && (recent()?.total ?? 0) > RECENT_LIMIT

  function openCreateModal() {
    setMutationError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  async function handleExpenseSubmit(input: ExpenseInput) {
    setSaving(true)
    setMutationError(null)
    setSuccessMessage(null)

    try {
      await createExpense(input)
      setSuccessMessage('Gasto guardado correctamente.')
      closeModal()
      await Promise.all([refetchExpenses(), refetchRecent(), refetchSummary()])
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'No se pudo guardar el gasto.')
    } finally {
      setSaving(false)
    }
  }

  return (
      <div class="dashboard-page grid gap-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <PageHeader
        title="Dashboard"
        subtitle="Visualiza y controla tus gastos personales."
        onCreate={openCreateModal}
        class="lg:border-b-0 lg:pb-0"
      />

      <Show when={successMessage()}>
        {(message) => <StatusBanner tone="success">{message()}</StatusBanner>}
      </Show>

      <Show when={categories.error}>
        <StatusBanner tone="danger">No se pudieron cargar las categorías.</StatusBanner>
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

      <div class="lg:shrink-0">
        <ExpenseList
          expenses={recent()?.items ?? []}
          loading={recent.loading}
          error={recent.error ? 'No se pudieron cargar tus gastos.' : null}
          title="Últimos 5 gastos"
          subtitle="Tus gastos más recientes"
          action={
            <Show when={hasMoreThanRecent()}>
              <A
                href="/historial"
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-finzz-accent transition-colors hover:text-finzz-accent-light"
              >
                Ver historial
                <ArrowRightIcon size={16} strokeWidth={2.2} aria-hidden="true" />
              </A>
            </Show>
          }
        />
      </div>

      <Show when={modalOpen()}>
        <ExpenseDialog title="Registrar gasto" onClose={closeModal}>
          <ExpenseForm
            categories={categories() ?? []}
            editingExpense={null}
            saving={saving()}
            error={mutationError()}
            categoriesError={Boolean(categories.error)}
            onRetryCategories={() => void refetchCategories()}
            onSubmit={handleExpenseSubmit}
          />
        </ExpenseDialog>
      </Show>
    </div>
  )
}
