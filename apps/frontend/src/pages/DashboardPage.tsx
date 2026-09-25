import { createResource, createSignal, Show } from 'solid-js'
import { A } from '@solidjs/router'
import ArrowRightIcon from 'lucide-solid/icons/arrow-right'
import CalendarIcon from 'lucide-solid/icons/calendar'
import PlusIcon from 'lucide-solid/icons/plus'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'
import ExpenseSummary from '../components/ExpenseSummary'
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
import { currentIsoWeek, currentMonth, formatTodayLong, isoWeekToMonday } from '../lib/format'
import { primaryButtonClass } from '../lib/ui'

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
      <div class="dashboard-page grid gap-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-4">
        <section class="flex flex-col gap-4 lg:ml-5 lg:shrink-0 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 class="mb-1.5 mt-0 text-3xl font-bold leading-none tracking-tight text-finzz-heading sm:text-4xl">
            Dashboard
          </h1>
          <p class="m-0 text-finzz-text">Visualiza y controla tus gastos personales.</p>
        </div>
          <div class="flex flex-wrap items-center gap-3 lg:min-w-[420px] lg:justify-between xl:min-w-[560px]">
          <span class="inline-flex items-center gap-2 text-sm text-finzz-text">
            <CalendarIcon size={16} strokeWidth={2} class="text-finzz-accent" aria-hidden="true" />
            <span class="capitalize">{formatTodayLong()}</span>
          </span>
          <button type="button" onClick={openCreateModal} class={primaryButtonClass}>
            <PlusIcon size={16} strokeWidth={2.4} aria-hidden="true" />
            Registrar gasto
          </button>
        </div>
      </section>

      <Show when={successMessage()}>
        {(message) => (
          <p
            class="m-0 rounded-xl border border-finzz-accent-border/60 bg-finzz-accent-bg px-4 py-3 text-sm text-finzz-success lg:shrink-0"
            role="status"
          >
            {message()}
          </p>
        )}
      </Show>

      <Show when={categories.error}>
        <p
          class="m-0 rounded-xl border border-finzz-danger-border bg-finzz-danger-bg px-4 py-3 text-sm text-finzz-danger lg:shrink-0"
          role="alert"
        >
          No se pudieron cargar las categorías.
        </p>
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
                class="inline-flex items-center gap-1.5 text-sm font-semibold text-finzz-accent transition-colors hover:text-[#6cf6d3]"
              >
                Ver historial
                <ArrowRightIcon size={16} strokeWidth={2.2} aria-hidden="true" />
              </A>
            </Show>
          }
        />
      </div>

      <Show when={modalOpen()}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Registrar gasto"
          class="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#02101f]/80 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div class="w-full max-w-lg">
            <ExpenseForm
              categories={categories() ?? []}
              editingExpense={null}
              saving={saving()}
              error={mutationError()}
              onSubmit={handleExpenseSubmit}
              onCancelEdit={closeModal}
            />
          </div>
        </div>
      </Show>
    </div>
  )
}
