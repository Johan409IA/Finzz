import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { createApp } from '../index'
import { getMonthBounds, getPeriodBounds, getWeekBounds } from './schemas'
import type { ExpensePeriod } from './periods'
import type { ExpenseRepository } from './repository'
import type { CreateExpenseInput, Expense, ExpenseCategory, ExpenseSummary, UpdateExpenseInput } from './types'

const userId = '4e7a0f3e-232e-4e3a-bda2-495b1324b266'
const otherUserId = '8b9c1d4e-1111-4e3a-bda2-495b1324b999'
const categoryId = '11111111-1111-4111-8111-111111111111'
const expenseId = '22222222-2222-4222-8222-222222222222'

let privateKey!: CryptoKey
let jwksServer!: ReturnType<typeof Bun.serve>

const category: ExpenseCategory = { id: categoryId, slug: 'alimentacion', name: 'Alimentación' }
const foodCategory: ExpenseCategory = { id: 'cat-food', slug: 'alimentacion', name: 'Alimentación' }
const transportCategory: ExpenseCategory = { id: 'cat-transport', slug: 'transporte', name: 'Transporte' }
const leisureCategory: ExpenseCategory = { id: 'cat-leisure', slug: 'ocio', name: 'Ocio' }
const otherCategory: ExpenseCategory = { id: 'cat-other', slug: 'otros', name: 'Otros' }

function makeExpense(
  id: string,
  amount: number,
  expenseDate: string,
  categoryValue: ExpenseCategory,
  description = '',
): Expense {
  return {
    id,
    amount,
    expenseDate,
    description: description || `Gasto ${expenseDate}`,
    category: categoryValue,
    createdAt: `${expenseDate}T12:00:00.000Z`,
    updatedAt: `${expenseDate}T12:00:00.000Z`,
  }
}

const expense: Expense = {
  id: expenseId,
  amount: 25.5,
  expenseDate: '2026-09-12',
  description: 'Almuerzo',
  category: foodCategory,
  createdAt: '2026-09-12T12:00:00.000Z',
  updatedAt: '2026-09-12T12:00:00.000Z',
}

const seedExpenses: Array<Expense & { ownerId: string }> = [
  { ...makeExpense('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 20, '2026-09-08', foodCategory), ownerId: userId },
  { ...expense, ownerId: userId },
  { ...makeExpense('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 30, '2026-09-20', transportCategory), ownerId: userId },
  { ...makeExpense('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 10, '2026-09-05', leisureCategory), ownerId: userId },
  { ...makeExpense('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 15, '2026-08-31', transportCategory), ownerId: userId },
  { ...makeExpense('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 40, '2025-12-30', foodCategory), ownerId: userId },
  { ...makeExpense('ffffffff-ffff-4fff-8fff-ffffffffffff', 50, '2026-01-02', transportCategory), ownerId: userId },
  { ...makeExpense('99999999-9999-4999-8999-999999999999', 5, '2026-09-12', otherCategory), ownerId: otherUserId },
]

function periodKeyOf(period: ExpensePeriod): string {
  return period.type === 'month' ? period.month : period.weekStart
}

function buildSummary(period: ExpensePeriod, items: Expense[]): ExpenseSummary {
  const { periodStart, periodEnd } = getPeriodBounds(period)
  const grouped = new Map<string, { category: ExpenseCategory; amount: number; expenseCount: number }>()
  let totalAmount = 0
  for (const item of items) {
    const current = grouped.get(item.category.id) ?? { category: item.category, amount: 0, expenseCount: 0 }
    current.amount += item.amount
    current.expenseCount += 1
    grouped.set(item.category.id, current)
    totalAmount += item.amount
  }
  const roundedTotal = Number(totalAmount.toFixed(2))
  const categories = [...grouped.values()]
    .map(({ category: groupedCategory, amount, expenseCount: categoryExpenseCount }) => ({
      categoryId: groupedCategory.id,
      slug: groupedCategory.slug,
      name: groupedCategory.name,
      amount: Number(amount.toFixed(2)),
      expenseCount: categoryExpenseCount,
      percentage: roundedTotal === 0 ? 0 : Number(((amount / roundedTotal) * 100).toFixed(2)),
    }))
    .sort((left, right) => right.amount - left.amount || left.name.localeCompare(right.name))
  return {
    period: period.type,
    periodKey: periodKeyOf(period),
    ...(period.type === 'month' ? { month: period.month } : { weekStart: period.weekStart }),
    periodStart,
    periodEnd,
    totalAmount: roundedTotal,
    expenseCount: items.length,
    categories,
  }
}

function filterByPeriod(items: Expense[], period?: ExpensePeriod): Expense[] {
  if (!period) return items
  const { periodStart, periodEnd } = getPeriodBounds(period)
  return items.filter((item) => item.expenseDate >= periodStart && item.expenseDate <= periodEnd)
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
  return signTokenFor(userId)
}

async function signTokenFor(sub: string) {
  return new SignJWT({ sub, role: 'authenticated', email: `${sub}@example.com` })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-kid' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey)
}

function createRepository(): ExpenseRepository & {
  lastOwner?: string
  lastPeriod?: ExpensePeriod
  lastListPeriod?: ExpensePeriod
  summaryCalls: number
  listCalls: number
  summariesByKey?: Record<string, ExpenseSummary>
} {
  return {
    summaryCalls: 0,
    listCalls: 0,
    async listCategories() {
      return [category]
    },
    async listExpenses(_token, ownerId, period) {
      this.lastOwner = ownerId
      this.lastListPeriod = period
      this.listCalls = (this.listCalls ?? 0) + 1
      const owned = seedExpenses.filter((item) => item.ownerId === ownerId)
      return filterByPeriod(owned, period)
    },
    async getSummary(_token, ownerId, period): Promise<ExpenseSummary> {
      this.lastOwner = ownerId
      this.lastPeriod = period
      this.summaryCalls = (this.summaryCalls ?? 0) + 1
      const override = this.summariesByKey?.[`${ownerId}|${periodKeyOf(period)}`]
      if (override) return override
      const owned = seedExpenses.filter((item) => item.ownerId === ownerId)
      return buildSummary(period, filterByPeriod(owned, period))
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
    expect(listResponse.json().data).toHaveLength(7)
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

describe('expense list filtrado por periodo', () => {
  function buildListApp(repository: ExpenseRepository) {
    return createApp({
      jwksUrl: `http://127.0.0.1:${jwksServer.port}/jwks`,
      corsOrigin: ['http://localhost:5173'],
      port: 0,
      expenseRepository: repository,
    })
  }

  test('sin filtro devuelve todos los gastos propios', async () => {
    const repository = createRepository()
    const app = buildListApp(repository)
    const token = await signToken()

    const response = await app.inject({
      method: 'GET',
      url: '/api/expenses',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data).toHaveLength(7)
    expect(repository.lastListPeriod).toBeUndefined()
    await app.close()
  })

  test('filtra por mes legacy y explícito', async () => {
    const repository = createRepository()
    const app = buildListApp(repository)
    const token = await signToken()

    const legacy = await app.inject({
      method: 'GET',
      url: '/api/expenses?month=2026-09',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(legacy.statusCode).toBe(200)
    expect(legacy.json().data).toHaveLength(4)
    expect(repository.lastListPeriod).toEqual({ type: 'month', month: '2026-09' })

    const explicit = await app.inject({
      method: 'GET',
      url: '/api/expenses?period=month&month=2026-09',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(explicit.statusCode).toBe(200)
    expect(explicit.json().data).toHaveLength(4)
    expect(repository.lastListPeriod).toEqual({ type: 'month', month: '2026-09' })
    await app.close()
  })

  test('filtra por semana lunes-domingo', async () => {
    const repository = createRepository()
    const app = buildListApp(repository)
    const token = await signToken()

    const response = await app.inject({
      method: 'GET',
      url: '/api/expenses?period=week&weekStart=2026-09-07',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(200)
    const data = response.json().data as Expense[]
    expect(data).toHaveLength(2)
    expect(data.map((item) => item.expenseDate).sort()).toEqual(['2026-09-08', '2026-09-12'])
    expect(repository.lastListPeriod).toEqual({ type: 'week', weekStart: '2026-09-07' })
    await app.close()
  })

  test('filtra semanas que cruzan mes y año', async () => {
    const repository = createRepository()
    const app = buildListApp(repository)
    const token = await signToken()

    const crossMonth = await app.inject({
      method: 'GET',
      url: '/api/expenses?period=week&weekStart=2026-08-31',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(crossMonth.statusCode).toBe(200)
    expect((crossMonth.json().data as Expense[]).map((item) => item.expenseDate).sort()).toEqual([
      '2026-08-31',
      '2026-09-05',
    ])

    const crossYear = await app.inject({
      method: 'GET',
      url: '/api/expenses?period=week&weekStart=2025-12-29',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(crossYear.statusCode).toBe(200)
    expect((crossYear.json().data as Expense[]).map((item) => item.expenseDate).sort()).toEqual([
      '2025-12-30',
      '2026-01-02',
    ])
    await app.close()
  })

  test('aísla el listado por usuario', async () => {
    const repository = createRepository()
    const app = buildListApp(repository)
    const otherToken = await signTokenFor(otherUserId)

    const response = await app.inject({
      method: 'GET',
      url: '/api/expenses?period=month&month=2026-09',
      headers: { authorization: `Bearer ${otherToken}` },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().data).toHaveLength(1)
    expect(repository.lastOwner).toBe(otherUserId)
    await app.close()
  })

  test('responde 422 con periodos inválidos y no consulta el repositorio', async () => {
    const repository = createRepository()
    const app = buildListApp(repository)
    const token = await signToken()
    const invalidUrls = [
      '/api/expenses?month=2026-13',
      '/api/expenses?month=2026-9',
      '/api/expenses?period=month&month=2026-09&weekStart=2026-09-07',
      '/api/expenses?period=week&weekStart=2026-09-08',
      '/api/expenses?period=week&weekStart=2026-13-01',
      '/api/expenses?period=week&month=2026-09',
      '/api/expenses?period=month',
      '/api/expenses?period=week',
      '/api/expenses?period=year&month=2026-09',
    ]

    for (const url of invalidUrls) {
      const response = await app.inject({
        method: 'GET',
        url,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(response.statusCode).toBe(422)
      expect(response.json().error.code).toBe('VALIDATION_ERROR')
    }

    expect(repository.listCalls).toBe(0)
    await app.close()
  })
})

describe('expense summary', () => {
  function buildSummaryApp(repository: ExpenseRepository) {
    return createApp({
      jwksUrl: `http://127.0.0.1:${jwksServer.port}/jwks`,
      corsOrigin: ['http://localhost:5173'],
      port: 0,
      expenseRepository: repository,
    })
  }

  test('resumen mensual legacy con métricas, límites y distribución', async () => {
    const repository = createRepository()
    const app = buildSummaryApp(repository)
    const token = await signToken()

    const response = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?month=2026-09',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(200)
    const data = response.json().data as ExpenseSummary
    expect(data.period).toBe('month')
    expect(data.periodKey).toBe('2026-09')
    expect(data.month).toBe('2026-09')
    expect(data.periodStart).toBe('2026-09-01')
    expect(data.periodEnd).toBe('2026-09-30')
    expect(data.totalAmount).toBe(85.5)
    expect(data.expenseCount).toBe(4)
    expect(data.categories.map((item) => item.amount)).toEqual([45.5, 30, 10])
    expect(data.categories.reduce((sum, item) => sum + item.amount, 0)).toBe(data.totalAmount)
    expect(data.categories.reduce((sum, item) => sum + item.expenseCount, 0)).toBe(data.expenseCount)
    expect(data.categories.reduce((sum, item) => sum + item.percentage, 0)).toBeCloseTo(100, 1)
    expect(repository.lastOwner).toBe(userId)
    expect(repository.lastPeriod).toEqual({ type: 'month', month: '2026-09' })
    await app.close()
  })

  test('resumen mensual explícito coincide con legacy', async () => {
    const repository = createRepository()
    const app = buildSummaryApp(repository)
    const token = await signToken()

    const legacy = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?month=2026-09',
      headers: { authorization: `Bearer ${token}` },
    })
    const explicit = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?period=month&month=2026-09',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(legacy.statusCode).toBe(200)
    expect(explicit.statusCode).toBe(200)
    expect(explicit.json().data).toEqual(legacy.json().data)
    expect(repository.lastPeriod).toEqual({ type: 'month', month: '2026-09' })
    await app.close()
  })

  test('resumen semanal lunes-domingo', async () => {
    const repository = createRepository()
    const app = buildSummaryApp(repository)
    const token = await signToken()

    const response = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?period=week&weekStart=2026-09-07',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(200)
    const data = response.json().data as ExpenseSummary
    expect(data.period).toBe('week')
    expect(data.periodKey).toBe('2026-09-07')
    expect(data.weekStart).toBe('2026-09-07')
    expect(data.periodStart).toBe('2026-09-07')
    expect(data.periodEnd).toBe('2026-09-13')
    expect(data.totalAmount).toBe(45.5)
    expect(data.expenseCount).toBe(2)
    expect(data.categories).toHaveLength(1)
    expect(repository.lastPeriod).toEqual({ type: 'week', weekStart: '2026-09-07' })
    await app.close()
  })

  test('resumen semanal cruza mes y año', async () => {
    const repository = createRepository()
    const app = buildSummaryApp(repository)
    const token = await signToken()

    const crossMonth = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?period=week&weekStart=2026-08-31',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(crossMonth.statusCode).toBe(200)
    const crossMonthData = crossMonth.json().data as ExpenseSummary
    expect(crossMonthData.periodStart).toBe('2026-08-31')
    expect(crossMonthData.periodEnd).toBe('2026-09-06')
    expect(crossMonthData.totalAmount).toBe(25)
    expect(crossMonthData.expenseCount).toBe(2)

    const crossYear = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?period=week&weekStart=2025-12-29',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(crossYear.statusCode).toBe(200)
    const crossYearData = crossYear.json().data as ExpenseSummary
    expect(crossYearData.periodStart).toBe('2025-12-29')
    expect(crossYearData.periodEnd).toBe('2026-01-04')
    expect(crossYearData.totalAmount).toBe(90)
    expect(crossYearData.expenseCount).toBe(2)

    const december = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?period=month&month=2025-12',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(december.statusCode).toBe(200)
    expect((december.json().data as ExpenseSummary).totalAmount).toBe(40)
    expect((december.json().data as ExpenseSummary).expenseCount).toBe(1)

    const january = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?period=month&month=2026-01',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(january.statusCode).toBe(200)
    expect((january.json().data as ExpenseSummary).totalAmount).toBe(50)
    expect((january.json().data as ExpenseSummary).expenseCount).toBe(1)
    await app.close()
  })

  test('devuelve ceros y distribución vacía cuando el periodo no tiene gastos', async () => {
    const repository = createRepository()
    const app = buildSummaryApp(repository)
    const token = await signToken()

    const emptyMonth = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?month=2026-07',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(emptyMonth.statusCode).toBe(200)
    expect(emptyMonth.json().data).toEqual({
      period: 'month',
      periodKey: '2026-07',
      month: '2026-07',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      totalAmount: 0,
      expenseCount: 0,
      categories: [],
    })

    const emptyWeek = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?period=week&weekStart=2026-09-21',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(emptyWeek.statusCode).toBe(200)
    expect(emptyWeek.json().data).toEqual({
      period: 'week',
      periodKey: '2026-09-21',
      weekStart: '2026-09-21',
      periodStart: '2026-09-21',
      periodEnd: '2026-09-27',
      totalAmount: 0,
      expenseCount: 0,
      categories: [],
    })
    await app.close()
  })

  test('responde 422 cuando month está ausente y no consulta el repositorio', async () => {
    const repository = createRepository()
    const app = buildSummaryApp(repository)
    const token = await signToken()

    const response = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(422)
    expect(response.json().error.code).toBe('VALIDATION_ERROR')
    expect(repository.summaryCalls).toBe(0)
    await app.close()
  })

  test('responde 422 con meses con formato inválido o imposibles', async () => {
    const repository = createRepository()
    const app = buildSummaryApp(repository)
    const token = await signToken()
    const invalidMonths = ['2026-13', '2026-00', '2026-9', '09-2026', '2026/09', '2026-09-01', 'abc', '1899-12', 'month=']

    for (const month of invalidMonths) {
      const response = await app.inject({
        method: 'GET',
        url: `/api/expenses/summary?month=${encodeURIComponent(month)}`,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(response.statusCode).toBe(422)
      expect(response.json().error.code).toBe('VALIDATION_ERROR')
    }

    expect(repository.summaryCalls).toBe(0)
    await app.close()
  })

  test('responde 422 con periodos semanales y combinaciones inválidas', async () => {
    const repository = createRepository()
    const app = buildSummaryApp(repository)
    const token = await signToken()
    const invalidUrls = [
      '/api/expenses/summary?period=month',
      '/api/expenses/summary?period=week',
      '/api/expenses/summary?period=week&weekStart=2026-09-08',
      '/api/expenses/summary?period=week&weekStart=2026-09-32',
      '/api/expenses/summary?period=week&weekStart=2026-13-01',
      '/api/expenses/summary?period=week&weekStart=09-2026',
      '/api/expenses/summary?period=month&month=2026-09&weekStart=2026-09-07',
      '/api/expenses/summary?period=week&month=2026-09',
      '/api/expenses/summary?period=week&month=2026-09&weekStart=2026-09-07',
      '/api/expenses/summary?period=year&month=2026-09',
      '/api/expenses/summary?month=2026-09&weekStart=2026-09-07',
    ]

    for (const url of invalidUrls) {
      const response = await app.inject({
        method: 'GET',
        url,
        headers: { authorization: `Bearer ${token}` },
      })
      expect(response.statusCode).toBe(422)
      expect(response.json().error.code).toBe('VALIDATION_ERROR')
    }

    expect(repository.summaryCalls).toBe(0)
    await app.close()
  })

  test('rechaza el resumen sin autenticación con 401', async () => {
    const app = buildSummaryApp(createRepository())

    const response = await app.inject({ method: 'GET', url: '/api/expenses/summary?month=2026-09' })

    expect(response.statusCode).toBe(401)
    await app.close()
  })

  test('aísla por usuario e ignora identificadores enviados por el cliente', async () => {
    const repository = createRepository()
    const app = buildSummaryApp(repository)
    const token = await signToken()
    const otherToken = await signTokenFor(otherUserId)

    const ownResponse = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?month=2026-09&user_id=attacker-id&usuarioId=attacker-id',
      headers: { authorization: `Bearer ${token}`, 'x-usuario-id': 'attacker-id' },
    })
    expect(ownResponse.statusCode).toBe(200)
    expect((ownResponse.json().data as ExpenseSummary).totalAmount).toBe(85.5)
    expect(repository.lastOwner).toBe(userId)

    const otherResponse = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?month=2026-09',
      headers: { authorization: `Bearer ${otherToken}` },
    })
    expect(otherResponse.statusCode).toBe(200)
    const otherData = otherResponse.json().data as ExpenseSummary
    expect(otherData.totalAmount).toBe(5)
    expect(otherData.categories).toHaveLength(1)
    expect(repository.lastOwner).toBe(otherUserId)
    await app.close()
  })

  test('serializa importes con contrato decimal de dos decimales', async () => {
    const repository = createRepository()
    repository.summariesByKey = {
      [`${userId}|2026-09`]: {
        period: 'month',
        periodKey: '2026-09',
        month: '2026-09',
        periodStart: '2026-09-01',
        periodEnd: '2026-09-30',
        totalAmount: 31.25,
        expenseCount: 3,
        categories: [
          { categoryId: 'cat-a', slug: 'a', name: 'A', amount: 20.75, expenseCount: 2, percentage: 66.4 },
          { categoryId: 'cat-b', slug: 'b', name: 'B', amount: 10.5, expenseCount: 1, percentage: 33.6 },
        ],
      },
    }
    const app = buildSummaryApp(repository)
    const token = await signToken()

    const response = await app.inject({
      method: 'GET',
      url: '/api/expenses/summary?month=2026-09',
      headers: { authorization: `Bearer ${token}` },
    })

    expect(response.statusCode).toBe(200)
    const data = response.json().data as ExpenseSummary
    expect(typeof data.totalAmount).toBe('number')
    expect(Number(data.totalAmount.toFixed(2))).toBe(data.totalAmount)
    for (const item of data.categories) {
      expect(typeof item.amount).toBe('number')
      expect(typeof item.percentage).toBe('number')
      expect(Number(item.amount.toFixed(2))).toBe(item.amount)
      expect(Number(item.percentage.toFixed(2))).toBe(item.percentage)
    }
    expect(response.body).toContain('"totalAmount":31.25')
    expect(response.body).toContain('"amount":20.75')
    await app.close()
  })

  test('calcula límites del mes calendario', () => {
    expect(getMonthBounds('2026-09')).toEqual({ periodStart: '2026-09-01', periodEnd: '2026-09-30' })
    expect(getMonthBounds('2026-02')).toEqual({ periodStart: '2026-02-01', periodEnd: '2026-02-28' })
    expect(getMonthBounds('2024-02')).toEqual({ periodStart: '2024-02-01', periodEnd: '2024-02-29' })
    expect(getMonthBounds('2026-01')).toEqual({ periodStart: '2026-01-01', periodEnd: '2026-01-31' })
  })

  test('calcula límites semanales lunes-domingo con cruces de mes y año', () => {
    expect(getWeekBounds('2026-09-07')).toEqual({ periodStart: '2026-09-07', periodEnd: '2026-09-13' })
    expect(getWeekBounds('2026-08-31')).toEqual({ periodStart: '2026-08-31', periodEnd: '2026-09-06' })
    expect(getWeekBounds('2025-12-29')).toEqual({ periodStart: '2025-12-29', periodEnd: '2026-01-04' })
    expect(getWeekBounds('2026-12-28')).toEqual({ periodStart: '2026-12-28', periodEnd: '2027-01-03' })
    expect(getPeriodBounds({ type: 'month', month: '2026-09' })).toEqual({
      periodStart: '2026-09-01',
      periodEnd: '2026-09-30',
    })
    expect(getPeriodBounds({ type: 'week', weekStart: '2026-09-07' })).toEqual({
      periodStart: '2026-09-07',
      periodEnd: '2026-09-13',
    })
    expect(() => getWeekBounds('2026-09-08')).toThrow('La semana debe comenzar en lunes')
  })
})
