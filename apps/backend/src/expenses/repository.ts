import { createClient, type InsForgeClient } from '@insforge/sdk'
import { getPeriodBounds, type CreateExpensePayload, type UpdateExpensePayload } from './schemas'
import { enumerateDates, type ExpensePeriod } from './periods'
import type { Expense, ExpenseCategory, ExpenseHistoryQuery, ExpensePage, ExpenseSummary } from './types'

const expenseSelect = `
  id,
  amount,
  expense_date,
  description,
  created_at,
  updated_at,
  category:expense_categories(id, slug, name)
`

type RawCategory = {
  id: string
  slug: string
  name: string
}

type RawExpense = {
  id: string
  amount: number | string
  expense_date: string
  description: string
  created_at: string
  updated_at: string
  category: RawCategory
}

type RawSummaryExpense = {
  amount: number | string
  expense_date: string
  category: RawCategory
}

interface FilterBuilder {
  eq(column: string, value: string): FilterBuilder
  ilike(column: string, pattern: string): FilterBuilder
}

function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

export class ExpenseRepositoryError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'DATABASE_ERROR',
    message: string,
  ) {
    super(message)
    this.name = 'ExpenseRepositoryError'
  }
}

export interface ExpenseRepository {
  listCategories(token: string): Promise<ExpenseCategory[]>
  listExpenses(token: string, userId: string, period?: ExpensePeriod): Promise<Expense[]>
  listExpensesPage(token: string, userId: string, query: ExpenseHistoryQuery): Promise<ExpensePage>
  getSummary(token: string, userId: string, period: ExpensePeriod): Promise<ExpenseSummary>
  createExpense(token: string, userId: string, input: CreateExpensePayload): Promise<Expense>
  updateExpense(token: string, userId: string, expenseId: string, input: UpdateExpensePayload): Promise<Expense>
  deleteExpense(token: string, userId: string, expenseId: string): Promise<void>
}

function mapCategory(category: RawCategory): ExpenseCategory {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
  }
}

function mapExpense(expense: RawExpense): Expense {
  return {
    id: expense.id,
    amount: Number(expense.amount),
    expenseDate: expense.expense_date,
    description: expense.description,
    category: mapCategory(expense.category),
    createdAt: expense.created_at,
    updatedAt: expense.updated_at,
  }
}

function createInsforgeClient(baseUrl: string, token: string): InsForgeClient {
  return createClient({ baseUrl, accessToken: token })
}

function throwDatabaseError(message: string, error: unknown): never {
  const details = error instanceof Error ? error.message : 'Unknown database error'
  throw new ExpenseRepositoryError('DATABASE_ERROR', `${message}: ${details}`)
}

export function createExpenseRepository(baseUrl: string): ExpenseRepository {
  async function getCategory(client: InsForgeClient, categoryId: string): Promise<void> {
    const { data, error } = await client.database
      .from('expense_categories')
      .select('id')
      .eq('id', categoryId)
      .maybeSingle()

    if (error) throwDatabaseError('No se pudo consultar la categoría', error)
    if (!data) throw new ExpenseRepositoryError('NOT_FOUND', 'La categoría no existe')
  }

  async function listCategories(token: string): Promise<ExpenseCategory[]> {
    const client = createInsforgeClient(baseUrl, token)
    const { data, error } = await client.database
      .from('expense_categories')
      .select('id, slug, name')
      .order('name', { ascending: true })

    if (error) throwDatabaseError('No se pudieron consultar las categorías', error)
    return (data ?? []).map((category) => mapCategory(category as RawCategory))
  }

  async function listExpensesPage(token: string, userId: string, query: ExpenseHistoryQuery): Promise<ExpensePage> {
    const client = createInsforgeClient(baseUrl, token)
    const search = query.search?.trim() ? query.search.trim() : undefined

    function applyFilters<B>(builder: B): B {
      const filtered = (builder as unknown as FilterBuilder).eq('user_id', userId)
      const searched = search ? filtered.ilike('description', `%${escapeLikePattern(search)}%`) : filtered
      return searched as unknown as B
    }

    const countQuery = applyFilters(client.database.from('expenses').select('id'))
    const { data: countData, error: countError } = await countQuery
    if (countError) throwDatabaseError('No se pudieron consultar los gastos', countError)
    const total = (countData ?? []).length

    const totalPages = Math.max(1, Math.ceil(total / query.limit))
    const page = Math.min(query.page, totalPages)
    const from = (page - 1) * query.limit

    const pageQuery = applyFilters(client.database.from('expenses').select(expenseSelect))
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, from + query.limit - 1)
    const { data, error } = await pageQuery

    if (error) throwDatabaseError('No se pudieron consultar los gastos', error)
    return {
      items: (data ?? []).map((expense) => mapExpense(expense as unknown as RawExpense)),
      total,
      page,
      limit: query.limit,
      totalPages,
    }
  }
  async function listExpenses(token: string, userId: string, period?: ExpensePeriod): Promise<Expense[]> {
    const client = createInsforgeClient(baseUrl, token)
    const query = client.database
      .from('expenses')
      .select(expenseSelect)
      .eq('user_id', userId)
    if (period) {
      const { periodStart, periodEnd } = getPeriodBounds(period)
      query.gte('expense_date', periodStart).lte('expense_date', periodEnd)
    }
    const { data, error } = await query
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throwDatabaseError('No se pudieron consultar los gastos', error)
    return (data ?? []).map((expense) => mapExpense(expense as unknown as RawExpense))
  }

  async function getSummary(token: string, userId: string, period: ExpensePeriod): Promise<ExpenseSummary> {
    const client = createInsforgeClient(baseUrl, token)
    const { periodStart, periodEnd } = getPeriodBounds(period)
    const { data, error } = await client.database
      .from('expenses')
      .select('amount, expense_date, category:expense_categories(id, slug, name)')
      .eq('user_id', userId)
      .gte('expense_date', periodStart)
      .lte('expense_date', periodEnd)

    if (error) throwDatabaseError('No se pudo consultar el resumen de gastos', error)

    const grouped = new Map<string, { category: ExpenseCategory; amount: number; expenseCount: number }>()
    const dailyAmounts = new Map<string, number>()
    let totalAmount = 0
    let expenseCount = 0

    for (const rawExpense of (data ?? []) as unknown as RawSummaryExpense[]) {
      const amount = Number(rawExpense.amount)
      const category = mapCategory(rawExpense.category)
      const current = grouped.get(category.id) ?? { category, amount: 0, expenseCount: 0 }
      current.amount += amount
      current.expenseCount += 1
      grouped.set(category.id, current)
      dailyAmounts.set(rawExpense.expense_date, Number(((dailyAmounts.get(rawExpense.expense_date) ?? 0) + amount).toFixed(2)))
      totalAmount += amount
      expenseCount += 1
    }

    const roundedTotal = Number(totalAmount.toFixed(2))
    const categories = [...grouped.values()]
      .map(({ category, amount, expenseCount: categoryExpenseCount }) => ({
        categoryId: category.id,
        slug: category.slug,
        name: category.name,
        amount: Number(amount.toFixed(2)),
        expenseCount: categoryExpenseCount,
        percentage: roundedTotal === 0 ? 0 : Number(((amount / roundedTotal) * 100).toFixed(2)),
      }))
      .sort((left, right) => right.amount - left.amount || left.name.localeCompare(right.name))

    return {
      period: period.type,
      periodKey: period.type === 'month' ? period.month : period.weekStart,
      ...(period.type === 'month' ? { month: period.month } : { weekStart: period.weekStart }),
      periodStart,
      periodEnd,
      totalAmount: roundedTotal,
      expenseCount,
      categories,
      dailyTotals: enumerateDates(periodStart, periodEnd).map((date) => ({
        date,
        total: dailyAmounts.get(date) ?? 0,
      })),
    }
  }

  async function createExpense(token: string, userId: string, input: CreateExpensePayload): Promise<Expense> {
    const client = createInsforgeClient(baseUrl, token)
    await getCategory(client, input.categoryId)

    const { data, error } = await client.database
      .from('expenses')
      .insert([
        {
          user_id: userId,
          category_id: input.categoryId,
          amount: input.amount,
          expense_date: input.expenseDate,
          description: input.description,
        },
      ])
      .select(expenseSelect)
      .single()

    if (error) throwDatabaseError('No se pudo crear el gasto', error)
    return mapExpense(data as unknown as RawExpense)
  }

  async function updateExpense(
    token: string,
    userId: string,
    expenseId: string,
    input: UpdateExpensePayload,
  ): Promise<Expense> {
    const client = createInsforgeClient(baseUrl, token)
    if (input.categoryId) await getCategory(client, input.categoryId)

    const values = {
      ...(input.amount === undefined ? {} : { amount: input.amount }),
      ...(input.expenseDate === undefined ? {} : { expense_date: input.expenseDate }),
      ...(input.categoryId === undefined ? {} : { category_id: input.categoryId }),
      ...(input.description === undefined ? {} : { description: input.description }),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await client.database
      .from('expenses')
      .update(values)
      .eq('id', expenseId)
      .eq('user_id', userId)
      .select(expenseSelect)
      .maybeSingle()

    if (error) throwDatabaseError('No se pudo actualizar el gasto', error)
    if (!data) throw new ExpenseRepositoryError('NOT_FOUND', 'El gasto no existe')
    return mapExpense(data as unknown as RawExpense)
  }

  async function deleteExpense(token: string, userId: string, expenseId: string): Promise<void> {
    const client = createInsforgeClient(baseUrl, token)
    const { error } = await client.database
      .from('expenses')
      .delete()
      .eq('id', expenseId)
      .eq('user_id', userId)

    if (error) throwDatabaseError('No se pudo eliminar el gasto', error)
  }

  return {
    listCategories,
    listExpenses,
    listExpensesPage,
    getSummary,
    createExpense,
    updateExpense,
    deleteExpense,
  }
}
