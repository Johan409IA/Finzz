import { createResource, createSignal, For, onCleanup, Show } from 'solid-js'
import ExpenseForm from '../components/ExpenseForm'
import { categoryBadgeClass, formatShowingRange, getVisiblePageNumbers } from '../lib/history'
import { formatCurrency, formatDate } from '../lib/format'
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

export function todayLong(): string {
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'long' }).format(new Date())
}

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
    <div class="grid gap-6">
      <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="mb-1 mt-0 text-3xl tracking-tight text-finzz-heading">Historial</h1>
          <p class="m-0">Consulta, busca y administra todos tus gastos registrados.</p>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm capitalize">{todayLong()}</span>
          <button
            type="button"
            onClick={openCreateModal}
            class="rounded-md border border-transparent bg-finzz-accent px-3 py-2 text-sm text-white transition-colors hover:bg-finzz-accent-strong"
          >
            + Registrar gasto
          </button>
        </div>
      </section>

      <Show when={successMessage()}>
        {(message) => <p class="text-sm text-finzz-success" role="status">{message()}</p>}
      </Show>
      <Show when={mutationError()}>
        {(message) => <p class="text-sm text-finzz-danger" role="alert">{message()}</p>}
      </Show>

      <section aria-label="Buscar y filtrar gastos" class="grid gap-3">
        <input
          type="search"
          aria-label="Buscar por nombre del gasto"
          placeholder="Buscar por nombre del gasto..."
          value={searchInput()}
          onInput={(event) => handleSearchInput(event.currentTarget.value)}
          class="w-full box-border rounded-md border border-finzz-border bg-finzz-surface px-3 py-2.5 text-finzz-heading"
        />
        <p class="m-0 text-sm" role="status">
          {total()} {total() === 1 ? 'gasto registrado en total' : 'gastos registrados en total'}
          <Show when={debouncedSearch()}>
            {(term) => (
              <span>
                {' '}· {(history()?.total ?? 0) === 1 ? '1 coincide' : `${history()?.total ?? 0} coinciden`} con «{term()}»
              </span>
            )}
          </Show>
        </p>
      </section>

      <Show when={history.loading && !history()}>
        <div class="grid gap-3" aria-busy="true" aria-label="Cargando gastos">
          <For each={[1, 2, 3, 4, 5]}>{() => <div class="h-14 animate-pulse rounded-md bg-finzz-code" />}</For>
        </div>
      </Show>

      <Show when={history.error}>
        <div class="rounded-xl border border-finzz-border bg-finzz-surface p-5 text-left" role="alert">
          <p class="mt-0 text-sm text-finzz-danger">No se pudieron cargar tus gastos.</p>
          <button
            type="button"
            onClick={() => refetch()}
            class="rounded-md border border-finzz-border bg-transparent px-3 py-2 text-sm text-finzz-heading transition-colors hover:bg-finzz-accent-bg"
          >
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
                <div class="rounded-xl border border-finzz-border bg-finzz-surface p-5 text-center" role="status">
                  <Show
                    when={debouncedSearch()}
                    fallback={<p class="m-0">No tienes gastos registrados.</p>}
                  >
                    <p class="m-0">No se encontraron gastos con ese nombre.</p>
                  </Show>
                </div>
              }
            >
              <div class="overflow-x-auto rounded-xl border border-finzz-border bg-finzz-surface">
                <table class="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr class="border-b border-finzz-border text-xs uppercase tracking-wide">
                      <th scope="col" class="px-4 py-3 font-bold text-finzz-heading">Descripción</th>
                      <th scope="col" class="px-4 py-3 font-bold text-finzz-heading">Categoría</th>
                      <th scope="col" class="px-4 py-3 font-bold text-finzz-heading">Fecha</th>
                      <th scope="col" class="px-4 py-3 text-right font-bold text-finzz-heading">Importe</th>
                      <th scope="col" class="px-4 py-3 text-right font-bold text-finzz-heading">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={data().items}>
                      {(expense) => (
                        <tr class="border-b border-finzz-border last:border-b-0">
                          <td class="px-4 py-3">
                            <div class="flex items-center gap-3">
                              <span
                                aria-hidden="true"
                                class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-finzz-accent-bg font-bold text-finzz-accent"
                              >
                                {expense.category.name.slice(0, 1)}
                              </span>
                              <span class="min-w-0">
                                <strong class="block overflow-hidden text-ellipsis whitespace-nowrap text-finzz-heading">
                                  {expense.description || expense.category.name}
                                </strong>
                                <Show
                                  when={expense.description}
                                  fallback={<span class="block text-xs">Sin descripción</span>}
                                >
                                  <span class="block overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                                    {expense.category.name}
                                  </span>
                                </Show>
                              </span>
                            </div>
                          </td>
                          <td class="px-4 py-3">
                            <span class={categoryBadgeClass(expense.category.slug)}>{expense.category.name}</span>
                          </td>
                          <td class="whitespace-nowrap px-4 py-3">{formatDate(expense.expenseDate)}</td>
                          <td class="whitespace-nowrap px-4 py-3 text-right">
                            <strong class="text-finzz-heading">{formatCurrency(expense.amount)}</strong>
                          </td>
                          <td class="whitespace-nowrap px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => openEditModal(expense)}
                              class="mr-1 rounded-md border border-finzz-border bg-transparent px-3 py-2 text-sm text-finzz-heading transition-colors hover:bg-finzz-accent-bg"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              disabled={deletingId() === expense.id}
                              onClick={() => handleDelete(expense)}
                              class="rounded-md border border-transparent bg-transparent px-3 py-2 text-sm text-finzz-danger transition-colors hover:border-finzz-danger-border hover:bg-finzz-danger-bg disabled:cursor-not-allowed disabled:opacity-55"
                            >
                              {deletingId() === expense.id ? 'Eliminando…' : 'Eliminar'}
                            </button>
                          </td>
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>

              <nav aria-label="Paginación de gastos" class="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p class="m-0 text-sm" role="status">
                  Mostrando {range().from}–{range().to} de {total()} gastos
                  <Show when={history.loading}>
                    <span> · Cargando…</span>
                  </Show>
                </p>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page() <= 1}
                    onClick={() => setPage(page() - 1)}
                    class="rounded-md border border-finzz-border bg-transparent px-3 py-2 text-sm text-finzz-heading transition-colors hover:bg-finzz-accent-bg disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    Anterior
                  </button>
                  <For each={getVisiblePageNumbers(page(), totalPages())}>
                    {(pageNumber) => (
                      <button
                        type="button"
                        aria-label={`Ir a la página ${pageNumber}`}
                        aria-current={pageNumber === page() ? 'page' : undefined}
                        onClick={() => setPage(pageNumber)}
                        class={`rounded-md px-3 py-2 text-sm transition-colors ${
                          pageNumber === page()
                            ? 'bg-emerald-500 font-bold text-white'
                            : 'border border-finzz-border bg-transparent text-finzz-heading hover:bg-finzz-accent-bg'
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
                    class="rounded-md border border-finzz-border bg-transparent px-3 py-2 text-sm text-finzz-heading transition-colors hover:bg-finzz-accent-bg disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    Siguiente
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
          class="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-black/40 p-4"
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
