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

export interface CreateExpenseInput {
  amount: number
  expenseDate: string
  categoryId: string
  description?: string
}

export interface UpdateExpenseInput {
  amount?: number
  expenseDate?: string
  categoryId?: string
  description?: string
}

export interface ExpenseSummaryCategory {
  categoryId: string
  slug: string
  name: string
  amount: number
  expenseCount: number
  percentage: number
}

export type ExpensePeriodType = 'month' | 'week'

export interface ExpenseSummaryDay {
  date: string
  total: number
}

export interface ExpenseHistoryQuery {
  page: number
  limit: number
  search?: string
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
  dailyTotals: ExpenseSummaryDay[]
}
