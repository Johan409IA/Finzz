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

export function listExpenses(): Promise<Expense[]> {
  return request<Expense[]>('/api/expenses')
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
