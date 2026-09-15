import { createClient, type InsForgeClient } from '@insforge/sdk'
import type { CreateExpensePayload, UpdateExpensePayload } from './schemas'
import type { Expense, ExpenseCategory } from './types'

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
  listExpenses(token: string, userId: string): Promise<Expense[]>
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

  async function listExpenses(token: string, userId: string): Promise<Expense[]> {
    const client = createInsforgeClient(baseUrl, token)
    const { data, error } = await client.database
      .from('expenses')
      .select(expenseSelect)
      .eq('user_id', userId)
      .order('expense_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throwDatabaseError('No se pudieron consultar los gastos', error)
    return (data ?? []).map((expense) => mapExpense(expense as unknown as RawExpense))
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
    createExpense,
    updateExpense,
    deleteExpense,
  }
}
