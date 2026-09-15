import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { createApp } from '../index'
import type { ExpenseRepository } from './repository'
import type { CreateExpenseInput, Expense, ExpenseCategory, UpdateExpenseInput } from './types'

const userId = '4e7a0f3e-232e-4e3a-bda2-495b1324b266'
const categoryId = '11111111-1111-4111-8111-111111111111'
const expenseId = '22222222-2222-4222-8222-222222222222'

let privateKey!: CryptoKey
let jwksServer!: ReturnType<typeof Bun.serve>

const category: ExpenseCategory = { id: categoryId, slug: 'alimentacion', name: 'Alimentación' }
const expense: Expense = {
  id: expenseId,
  amount: 25.5,
  expenseDate: '2026-09-12',
  description: 'Almuerzo',
  category,
  createdAt: '2026-09-12T12:00:00.000Z',
  updatedAt: '2026-09-12T12:00:00.000Z',
}

beforeAll(async () => {
  const { publicKey, privateKey: generatedPrivateKey } = await generateKeyPair('RS256')
  privateKey = generatedPrivateKey
  const jwk = await exportJWK(publicKey)

  jwksServer = Bun.serve({
    port: 0,
    fetch() {
      return new Response(JSON.stringify({ keys: [{ ...jwk, kid: 'test-kid', alg: 'RS256', use: 'sig' }] }), {
        headers: { 'content-type': 'application/json' },
      })
    },
  })
})

afterAll(() => {
  jwksServer.stop()
})

async function signToken() {
  return new SignJWT({ sub: userId, role: 'authenticated', email: 'user@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)
}

function createRepository(): ExpenseRepository & { lastOwner?: string } {
  return {
    async listCategories() {
      return [category]
    },
    async listExpenses(_token, ownerId) {
      this.lastOwner = ownerId
      return ownerId === userId ? [expense] : []
    },
    async createExpense(_token, ownerId, input: CreateExpenseInput) {
      this.lastOwner = ownerId
      return { ...expense, amount: input.amount, expenseDate: input.expenseDate, description: input.description ?? '' }
    },
    async updateExpense(_token, ownerId, id, input: UpdateExpenseInput) {
      this.lastOwner = ownerId
      if (id !== expenseId || ownerId !== userId) throw new Error('not found')
      return { ...expense, ...input, category: input.categoryId ? category : expense.category }
    },
    async deleteExpense(_token, ownerId, id) {
      this.lastOwner = ownerId
      if (id !== expenseId || ownerId !== userId) throw new Error('not found')
    },
  }
}

describe('expense routes', () => {
  test('rechaza listado sin autenticación', async () => {
    const app = createApp({
      jwksUrl: `http://127.0.0.1:${jwksServer.port}/jwks`,
      corsOrigin: ['http://localhost:5173'],
      port: 0,
      expenseRepository: createRepository(),
    })

    const response = await app.inject({ method: 'GET', url: '/api/expenses' })

    expect(response.statusCode).toBe(401)
    await app.close()
  })

  test('valida el importe antes de crear', async () => {
    const app = createApp({
      jwksUrl: `http://127.0.0.1:${jwksServer.port}/jwks`,
      corsOrigin: ['http://localhost:5173'],
      port: 0,
      expenseRepository: createRepository(),
    })
    const token = await signToken()

    const response = await app.inject({
      method: 'POST',
      url: '/api/expenses',
      headers: { authorization: `Bearer ${token}` },
      payload: { amount: 0, expenseDate: '2026-09-12', categoryId },
    })

    expect(response.statusCode).toBe(422)
    expect(response.json().error.code).toBe('VALIDATION_ERROR')
    await app.close()
  })

  test('lista y crea usando el sub autenticado como propietario', async () => {
    const repository = createRepository()
    const app = createApp({
      jwksUrl: `http://127.0.0.1:${jwksServer.port}/jwks`,
      corsOrigin: ['http://localhost:5173'],
      port: 0,
      expenseRepository: repository,
    })
    const token = await signToken()

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/expenses',
      headers: { authorization: `Bearer ${token}` },
    })
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/expenses',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        amount: 30.75,
        expenseDate: '2026-09-12',
        categoryId,
        description: 'Cena',
        user_id: 'attacker-id',
      },
    })

    expect(listResponse.statusCode).toBe(200)
    expect(listResponse.json().data).toHaveLength(1)
    expect(createResponse.statusCode).toBe(201)
    expect(repository.lastOwner).toBe(userId)
    await app.close()
  })

  test('permite modificar y eliminar un gasto propio', async () => {
    const app = createApp({
      jwksUrl: `http://127.0.0.1:${jwksServer.port}/jwks`,
      corsOrigin: ['http://localhost:5173'],
      port: 0,
      expenseRepository: createRepository(),
    })
    const token = await signToken()

    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/expenses/${expenseId}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { description: 'Cena actualizada' },
    })
    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/expenses/${expenseId}`,
      headers: { authorization: `Bearer ${token}` },
    })

    expect(updateResponse.statusCode).toBe(200)
    expect(deleteResponse.statusCode).toBe(204)
    await app.close()
  })
})
