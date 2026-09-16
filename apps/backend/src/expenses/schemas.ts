import { z } from 'zod'
import {
  getMonthBounds,
  getPeriodBounds,
  getWeekBounds,
  isMonday,
  isValidDate,
  isValidMonth,
  type ExpensePeriod,
} from './periods'

const amountSchema = z
  .number({ error: 'El importe debe ser un número' })
  .finite('El importe debe ser válido')
  .positive('El importe debe ser mayor que cero')
  .multipleOf(0.01, 'El importe debe tener como máximo dos decimales')
  .max(9999999999.99, 'El importe es demasiado grande')

const expenseDateSchema = z
  .string({ error: 'La fecha es obligatoria' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe usar el formato YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  }, 'La fecha no es válida')

const descriptionSchema = z
  .string()
  .trim()
  .max(500, 'La descripción no puede superar los 500 caracteres')

export const createExpenseSchema = z.object({
  amount: amountSchema,
  expenseDate: expenseDateSchema,
  categoryId: z.uuid('La categoría no es válida'),
  description: descriptionSchema.optional().default(''),
})

export const updateExpenseSchema = z
  .object({
    amount: amountSchema.optional(),
    expenseDate: expenseDateSchema.optional(),
    categoryId: z.uuid('La categoría no es válida').optional(),
    description: descriptionSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, 'Debes enviar al menos un campo')

export const expenseIdParamsSchema = z.object({
  id: z.uuid('El gasto no es válido'),
})

const periodTypeSchema = z.enum(['month', 'week'])

const monthSchema = z
  .string({ error: 'El mes es obligatorio' })
  .refine(isValidMonth, 'El mes debe usar el formato YYYY-MM y ser válido')

const weekStartSchema = z
  .string({ error: 'El inicio de semana es obligatorio' })
  .refine(isValidDate, 'La fecha de inicio debe usar el formato YYYY-MM-DD y ser válida')
  .refine(isMonday, 'La semana debe comenzar en lunes')

export const expensePeriodQuerySchema = z
  .object({
    period: periodTypeSchema,
    month: z.string().optional(),
    weekStart: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.period === 'month') {
      const parsed = monthSchema.safeParse(value.month)
      if (!parsed.success) context.addIssue({ code: 'custom', path: ['month'], message: parsed.error.issues[0]?.message ?? 'El mes no es válido' })
      if (value.weekStart !== undefined) context.addIssue({ code: 'custom', path: ['weekStart'], message: 'weekStart no aplica al periodo mensual' })
    } else {
      const parsed = weekStartSchema.safeParse(value.weekStart)
      if (!parsed.success) context.addIssue({ code: 'custom', path: ['weekStart'], message: parsed.error.issues[0]?.message ?? 'La semana no es válida' })
      if (value.month !== undefined) context.addIssue({ code: 'custom', path: ['month'], message: 'month no aplica al periodo semanal' })
    }
  })

const expensePeriodFieldsSchema = z.object({
  period: periodTypeSchema.optional(),
  month: z.string().optional(),
  weekStart: z.string().optional(),
})

function addPeriodIssues(value: z.infer<typeof expensePeriodFieldsSchema>, context: z.RefinementCtx) {
  if (value.period === undefined) {
    if (value.month === undefined) {
      context.addIssue({ code: 'custom', path: ['month'], message: 'El mes es obligatorio' })
    } else {
      const parsedMonth = monthSchema.safeParse(value.month)
      if (!parsedMonth.success) context.addIssue({ code: 'custom', path: ['month'], message: parsedMonth.error.issues[0]?.message ?? 'El mes no es válido' })
    }
    if (value.weekStart !== undefined) context.addIssue({ code: 'custom', path: ['weekStart'], message: 'weekStart no aplica sin un periodo semanal' })
    return
  }

  const parsed = expensePeriodQuerySchema.safeParse(value)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      context.addIssue({ code: 'custom', path: issue.path, message: issue.message })
    }
  }
}

export const expenseSummaryQuerySchema = expensePeriodFieldsSchema.superRefine(addPeriodIssues)
export const expenseListQuerySchema = expensePeriodFieldsSchema.superRefine((value, context) => {
  if (value.period === undefined && value.month === undefined && value.weekStart === undefined) return
  addPeriodIssues(value, context)
})

export type ExpenseSummaryQuery = z.infer<typeof expenseSummaryQuerySchema>
export type ExpenseListQuery = {
  period?: 'month' | 'week'
  month?: string
  weekStart?: string
}

type NormalizableExpensePeriodQuery = {
  period?: 'month' | 'week'
  month?: string
  weekStart?: string
}

export function normalizeExpensePeriod(query: NormalizableExpensePeriodQuery): ExpensePeriod | undefined {
  if (query.period === undefined) {
    return query.month === undefined ? undefined : { type: 'month', month: query.month }
  }
  return query.period === 'month'
    ? { type: 'month', month: query.month! }
    : { type: 'week', weekStart: query.weekStart! }
}

export { getMonthBounds, getPeriodBounds, getWeekBounds }

export type CreateExpensePayload = z.infer<typeof createExpenseSchema>
export type UpdateExpensePayload = z.infer<typeof updateExpenseSchema>
