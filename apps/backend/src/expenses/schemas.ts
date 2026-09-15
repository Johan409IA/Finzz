import { z } from 'zod'

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

export type CreateExpensePayload = z.infer<typeof createExpenseSchema>
export type UpdateExpensePayload = z.infer<typeof updateExpenseSchema>
