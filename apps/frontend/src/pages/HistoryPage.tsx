import { createResource, createSignal, For, onCleanup, Show } from 'solid-js'
import CalendarIcon from 'lucide-solid/icons/calendar'
import ChevronLeftIcon from 'lucide-solid/icons/chevron-left'
import ChevronRightIcon from 'lucide-solid/icons/chevron-right'
import PencilIcon from 'lucide-solid/icons/pencil'
import PlusIcon from 'lucide-solid/icons/plus'
import ReceiptTextIcon from 'lucide-solid/icons/receipt-text'
import SearchIcon from 'lucide-solid/icons/search'
import TrashIcon from 'lucide-solid/icons/trash'
import CategoryBadge, { categoryIcon } from '../components/CategoryBadge'
import ExpenseForm from '../components/ExpenseForm'
import { categoryChartColor } from '../lib/charts'
import { formatShowingRange, getVisiblePageNumbers } from '../lib/history'
import { formatCurrency, formatDate, formatTodayLong } from '../lib/format'
import {
  cardClass,
  dangerButtonClass,
  fieldClass,
  ghostButtonClass,
  primaryButtonClass,
  tableHeadClass,
} from '../lib/ui'
import {
  createExpense,
  deleteExpense,
  listCategories,
  listExpensesPage,
  updateExpense,
  type Expense,
  type ExpenseInput,
} from '../lib/expenses'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const rowActionClass = 'px-3 py-2 text-xs'

export default function HistoryPage() {
  const [searchInput, setSearchInput] = createSignal('')
  const [debouncedSearch, setDebouncedSearch] = createSignal('')
  const [page, setPage] = createSignal(1)
  const [modalOpen, setModalOpen] = createSignal(false)
  const [editingExpense, setEditingExpense] = createSignal<Expense | null>(null)
  const [saving, setSaving] = createSignal(false)
  const [deletingId, setDeletingId] = createSignal<string | null>(null)
  const [mutationError, setMutationError] = createSignal<string | null>(null)
  const [successMessage, setSuccessMessage] = createSignal<string | null>(null)

  let debounceTimer: number | undefined
  onCleanup(() => window.clearTimeout(debounceTimer))

  function handleSearchInput(value: string) {
    setSearchInput(value)
    window.clearTimeout(debounceTimer)
    debounceTimer = window.setTimeout(() => {
      setDebouncedSearch(value.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
  }

  const query = () => ({ page: page(), limit: PAGE_SIZE, search: debouncedSearch() || undefined })
  const [history, { refetch }] = createResource(query, listExpensesPage)
  const [categories] = createResource(listCategories)

  const total = () => history()?.total ?? 0
  const totalPages = () => history()?.totalPages ?? 1
  const range = () => formatShowingRange(history()?.page ?? 1, PAGE_SIZE, total())

  function openCreateModal() {
    setEditingExpense(null)
    setMutationError(null)
    setModalOpen(true)
  }

  function openEditModal(expense: Expense) {
    setEditingExpense(expense)
    setMutationError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingExpense(null)
  }

  async function handleExpenseSubmit(input: ExpenseInput) {
    setSaving(true)
    setMutationError(null)
    setSuccessMessage(null)
    try {
      const currentExpense = editingExpense()
      if (currentExpense) {
        await updateExpense(currentExpense.id, input)
        setSuccessMessage('Gasto actualizado correctamente.')
      } else {
        await createExpense(input)
        setSuccessMessage('Gasto guardado correctamente.')
      }
      closeModal()
      await refetch()
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
      if (editingExpense()?.id === expense.id) closeModal()
      // Si se elimina el último registro de la página, retroceder una página.
      if ((history()?.items.length ?? 0) <= 1 && page() > 1) {
        setPage(page() - 1)
      } else {
        await refetch()
      }
      setSuccessMessage('Gasto eliminado correctamente.')
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : 'No se pudo eliminar el gasto.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div class="grid gap-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-4">
      <section class="flex flex-col gap-4 border-b border-finzz-border/60 pb-5 lg:shrink-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="mb-1.5 mt-0 text-3xl font-bold leading-none tracking-tight text-finzz-heading sm:text-4xl">
            Historial
          </h1>
          <p class="m-0 text-finzz-text">Consulta, busca y administra todos tus gastos registrados.</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
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
      <Show when={mutationError()}>
        {(message) => (
          <p
            class="m-0 rounded-xl border border-finzz-danger-border bg-finzz-danger-bg px-4 py-3 text-sm text-finzz-danger lg:shrink-0"
            role="alert"
          >
            {message()}
          </p>
        )}
      </Show>

      <section
        aria-label="Buscar y filtrar gastos"
        class={`${cardClass} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 lg:shrink-0`}
      >
        <span class="relative flex min-w-0 flex-1 items-center">
          <SearchIcon
            size={18}
            strokeWidth={2}
            class="pointer-events-none absolute left-3.5 text-finzz-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Buscar por nombre del gasto"
            placeholder="Buscar por nombre del gasto..."
            value={searchInput()}
            onInput={(event) => handleSearchInput(event.currentTarget.value)}
            class={`${fieldClass} pl-11`}
          />
        </span>
        <div class="flex items-center gap-3 sm:pr-2">
          <span
            aria-hidden="true"
            class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-finzz-info/15 text-finzz-info"
          >
            <ReceiptTextIcon size={18} strokeWidth={2} />
          </span>
          <p class="m-0 text-sm text-finzz-text" role="status">
            {total()} {total() === 1 ? 'gasto registrado en total' : 'gastos registrados en total'}
            <Show when={debouncedSearch()}>
              {(term) => (
                <span>
                  {' '}· {(history()?.total ?? 0) === 1 ? '1 coincide' : `${history()?.total ?? 0} coinciden`} con «{term()}»
                </span>
              )}
            </Show>
          </p>
        </div>
      </section>

      <Show when={history.loading && !history()}>
        <div class="grid gap-3 lg:shrink-0" aria-busy="true" aria-label="Cargando gastos">
          <For each={[1, 2, 3, 4, 5, 6]}>
            {() => <div class="h-14 animate-pulse rounded-xl bg-finzz-code/70" />}
          </For>
        </div>
      </Show>

      <Show when={history.error}>
        <div class={`${cardClass} p-5 text-left lg:shrink-0`} role="alert">
          <p class="mt-0 text-sm text-finzz-danger">No se pudieron cargar tus gastos.</p>
          <button type="button" onClick={() => refetch()} class={ghostButtonClass}>
            Reintentar
          </button>
        </div>
      </Show>

      <Show when={!history.loading || history()}>
        <Show when={!history.error && history()}>
          {(data) => (
            <Show
              when={data().total > 0}
              fallback={
                <div class={`${cardClass} p-10 text-center`} role="status">
                  <Show
                    when={debouncedSearch()}
                    fallback={<p class="m-0 text-finzz-text">No tienes gastos registrados.</p>}
                  >
                    <p class="m-0 text-finzz-text">No se encontraron gastos con ese nombre.</p>
                  </Show>
                </div>
              }
            >
                <div class={`${cardClass} history-expenses-scrollbar overflow-auto lg:min-h-0 lg:flex-1`}>
                <table class="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr class="border-b border-finzz-border/80">
                      <th scope="col" class={`px-4 py-3 ${tableHeadClass}`}>Descripción</th>
                      <th scope="col" class={`px-4 py-3 ${tableHeadClass}`}>Categoría</th>
                      <th scope="col" class={`px-4 py-3 ${tableHeadClass}`}>Fecha</th>
                      <th scope="col" class={`px-4 py-3 text-right ${tableHeadClass}`}>Importe</th>
                      <th scope="col" class={`px-4 py-3 text-right ${tableHeadClass}`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={data().items}>
                      {(expense) => (
                        <tr class="border-b border-finzz-border/50 last:border-b-0">
                          <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                              <span
                                aria-hidden="true"
                                class="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-finzz-border/70 bg-finzz-code/70"
                                style={{ color: categoryChartColor(expense.category.slug) }}
                              >
                                {categoryIcon(expense.category.slug, 16)}
                              </span>
                              <span class="min-w-0">
                                <strong class="block truncate font-semibold text-finzz-heading">
                                  {expense.description || expense.category.name}
                                </strong>
                                <Show
                                  when={expense.description}
                                  fallback={<span class="block text-xs text-finzz-text">Sin descripción</span>}
                                >
                                  <span class="block truncate text-xs text-finzz-text">
                                    {expense.category.name}
                                  </span>
                                </Show>
                              </span>
                            </div>
                          </td>
                          <td class="px-4 py-3">
                            <CategoryBadge slug={expense.category.slug} name={expense.category.name} />
                          </td>
                          <td class="whitespace-nowrap px-4 py-3 text-finzz-text">{formatDate(expense.expenseDate)}</td>
                          <td class="whitespace-nowrap px-4 py-3 text-right">
                            <strong class="font-semibold tabular-nums text-finzz-heading">
                              {formatCurrency(expense.amount)}
                            </strong>
                          </td>
                          <td class="whitespace-nowrap px-4 py-3 text-right">
                            <div class="inline-flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditModal(expense)}
                                class={`${ghostButtonClass} ${rowActionClass}`}
                              >
                                <PencilIcon size={14} strokeWidth={2} aria-hidden="true" />
                                Editar
                              </button>
                              <button
                                type="button"
                                disabled={deletingId() === expense.id}
                                onClick={() => handleDelete(expense)}
                                class={`${dangerButtonClass} ${rowActionClass}`}
                              >
                                <TrashIcon size={14} strokeWidth={2} aria-hidden="true" />
                                {deletingId() === expense.id ? 'Eliminando…' : 'Eliminar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>

              <nav
                aria-label="Paginación de gastos"
                class="flex flex-col items-center justify-between gap-3 lg:shrink-0 sm:flex-row"
              >
                <p class="m-0 text-sm text-finzz-text" role="status">
                  Mostrando {range().from}–{range().to} de {total()} gastos
                  <Show when={history.loading}>
                    <span> · Cargando…</span>
                  </Show>
                </p>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={page() <= 1}
                    onClick={() => setPage(page() - 1)}
                    class={`${ghostButtonClass} px-3 py-2 text-xs`}
                  >
                    <ChevronLeftIcon size={14} strokeWidth={2.2} aria-hidden="true" />
                    Anterior
                  </button>
                  <For each={getVisiblePageNumbers(page(), totalPages())}>
                    {(pageNumber) => (
                      <button
                        type="button"
                        aria-label={`Ir a la página ${pageNumber}`}
                        aria-current={pageNumber === page() ? 'page' : undefined}
                        onClick={() => setPage(pageNumber)}
                        class={`grid h-9 w-9 place-items-center rounded-xl border text-sm font-semibold transition-colors ${
                          pageNumber === page()
                            ? 'border-transparent bg-finzz-accent font-bold text-[#03263c]'
                            : 'border-finzz-border-strong/60 text-finzz-text hover:border-finzz-accent/60 hover:bg-finzz-accent-bg hover:text-finzz-heading'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )}
                  </For>
                  <button
                    type="button"
                    disabled={page() >= totalPages()}
                    onClick={() => setPage(page() + 1)}
                    class={`${ghostButtonClass} px-3 py-2 text-xs`}
                  >
                    Siguiente
                    <ChevronRightIcon size={14} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </nav>
            </Show>
          )}
        </Show>
      </Show>

      <Show when={modalOpen()}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingExpense() ? 'Editar gasto' : 'Registrar gasto'}
          class="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-[#02101f]/80 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeModal()
          }}
        >
          <div class="w-full max-w-lg">
            <ExpenseForm
              categories={categories() ?? []}
              editingExpense={editingExpense()}
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
