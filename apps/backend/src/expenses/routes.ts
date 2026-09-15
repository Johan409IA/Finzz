import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { expenseIdParamsSchema, createExpenseSchema, updateExpenseSchema } from './schemas'
import { ExpenseRepositoryError, type ExpenseRepository } from './repository'

interface ExpenseRouteOptions {
  repository: ExpenseRepository
}

function sendError(reply: FastifyReply, statusCode: number, code: string, message: string, details?: unknown) {
  return reply.status(statusCode).send({
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
  })
}

function requireAuth(request: FastifyRequest): NonNullable<FastifyRequest['auth']> {
  if (!request.auth) throw new Error('La ruta de gastos requiere autenticación')
  return request.auth
}

function handleError(reply: FastifyReply, error: unknown) {
  if (error instanceof ExpenseRepositoryError) {
    if (error.code === 'NOT_FOUND') return sendError(reply, 404, 'NOT_FOUND', error.message)
    return sendError(reply, 500, 'DATABASE_ERROR', 'No se pudo completar la operación')
  }

  return sendError(reply, 500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado')
}

export async function registerExpenseRoutes(app: FastifyInstance, options: ExpenseRouteOptions) {
  app.get('/api/expense-categories', async (request, reply) => {
    try {
      const auth = requireAuth(request)
      const categories = await options.repository.listCategories(auth.token)
      return { data: categories }
    } catch (error) {
      return handleError(reply, error)
    }
  })

  app.get('/api/expenses', async (request, reply) => {
    try {
      const auth = requireAuth(request)
      const expenses = await options.repository.listExpenses(auth.token, auth.user.usuarioId)
      return { data: expenses }
    } catch (error) {
      return handleError(reply, error)
    }
  })

  app.post('/api/expenses', async (request, reply) => {
    const parsed = createExpenseSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendError(reply, 422, 'VALIDATION_ERROR', 'Los datos del gasto no son válidos', parsed.error.flatten())
    }

    try {
      const auth = requireAuth(request)
      const expense = await options.repository.createExpense(auth.token, auth.user.usuarioId, parsed.data)
      return reply.status(201).send({ data: expense })
    } catch (error) {
      return handleError(reply, error)
    }
  })

  app.patch('/api/expenses/:id', async (request, reply) => {
    const params = expenseIdParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendError(reply, 422, 'VALIDATION_ERROR', 'El identificador del gasto no es válido', params.error.flatten())
    }

    const parsed = updateExpenseSchema.safeParse(request.body)
    if (!parsed.success) {
      return sendError(reply, 422, 'VALIDATION_ERROR', 'Los datos del gasto no son válidos', parsed.error.flatten())
    }

    try {
      const auth = requireAuth(request)
      const expense = await options.repository.updateExpense(
        auth.token,
        auth.user.usuarioId,
        params.data.id,
        parsed.data,
      )
      return { data: expense }
    } catch (error) {
      return handleError(reply, error)
    }
  })

  app.delete('/api/expenses/:id', async (request, reply) => {
    const params = expenseIdParamsSchema.safeParse(request.params)
    if (!params.success) {
      return sendError(reply, 422, 'VALIDATION_ERROR', 'El identificador del gasto no es válido', params.error.flatten())
    }

    try {
      const auth = requireAuth(request)
      await options.repository.deleteExpense(auth.token, auth.user.usuarioId, params.data.id)
      return reply.status(204).send()
    } catch (error) {
      return handleError(reply, error)
    }
  })
}

export function isValidationError(error: unknown): error is ZodError {
  return error instanceof ZodError
}
