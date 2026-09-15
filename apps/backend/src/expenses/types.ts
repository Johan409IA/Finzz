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
