import { getApiUrl, insforge } from './insforge'

export interface ExpenseCategory {
  id: string
  slug: string
  name: string
}

export interface Expense {
  id: string
  amount: number
  expenseDate: string
  description: string
  category: ExpenseCategory
  createdAt: string
  updatedAt: string
}

export interface ExpenseInput {
  amount: number
  expenseDate: string
  categoryId: string
  description: string
}

export type ExpensePeriodType = 'month' | 'week'

export type ExpensePeriod =
  | { type: 'month'; month: string }
  | { type: 'week'; weekStart: string }

export interface ExpenseSummaryCategory {
  categoryId: string
  slug: string
  name: string
  amount: number
  expenseCount: number
  percentage: number
}

export interface ExpenseSummaryDay {
  date: string
  total: number
}

export interface ExpensePage {
  items: Expense[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ExpenseSummary {
  period: ExpensePeriodType
  periodKey: string
  month?: string
  weekStart?: string
  periodStart: string
  periodEnd: string
  totalAmount: number
  expenseCount: number
  categories: ExpenseSummaryCategory[]
  dailyTotals?: ExpenseSummaryDay[]
}

interface ApiErrorResponse {
  error?: {
    message?: string
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await insforge.getHttpClient().getValidAccessToken()
  if (!token) throw new Error('Tu sesión ha expirado. Inicia sesión de nuevo.')

  const response = await fetch(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null
    throw new Error(body?.error?.message ?? 'No se pudo completar la operación')
  }

  if (response.status === 204) return undefined as T
  const body = (await response.json()) as { data: T }
  return body.data
}

export function listCategories(): Promise<ExpenseCategory[]> {
  return request<ExpenseCategory[]>('/api/expense-categories')
}

function periodSearchParams(period: ExpensePeriod): string {
  const params = new URLSearchParams({ period: period.type })
  if (period.type === 'month') params.set('month', period.month)
  else params.set('weekStart', period.weekStart)
  return params.toString()
}

export function listExpenses(period?: ExpensePeriod): Promise<Expense[]> {
  const query = period ? `?${periodSearchParams(period)}` : ''
  return request<Expense[]>(`/api/expenses${query}`)
}

export function listExpensesPage(params: { page: number; limit: number; search?: string }): Promise<ExpensePage> {
  const query = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
  if (params.search?.trim()) query.set('search', params.search.trim())
  return request<ExpensePage>(`/api/expenses?${query.toString()}`)
}

export function getExpenseSummary(period: ExpensePeriod): Promise<ExpenseSummary> {
  return request<ExpenseSummary>(`/api/expenses/summary?${periodSearchParams(period)}`)
}

export function createExpense(input: ExpenseInput): Promise<Expense> {
  return request<Expense>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateExpense(id: string, input: Partial<ExpenseInput>): Promise<Expense> {
  return request<Expense>(`/api/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteExpense(id: string): Promise<void> {
  return request<void>(`/api/expenses/${id}`, { method: 'DELETE' })
}
