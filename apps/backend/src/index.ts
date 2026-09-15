import Fastify from 'fastify'
import cors from '@fastify/cors'
import authPlugin from './auth/plugin'
import { registerAuthRoutes } from './routes/auth'
import { registerHealthRoutes } from './routes/health'
import { createExpenseRepository, type ExpenseRepository } from './expenses/repository'
import { registerExpenseRoutes } from './expenses/routes'

export interface AppConfig {
  jwksUrl: string
  hs256Secret?: string
  corsOrigin: string | string[]
  port: number
  expenseRepository?: ExpenseRepository
}

export function createApp(config: AppConfig) {
  const app = Fastify({ logger: false })

  void app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  })

  void app.register(authPlugin, {
    jwksUrl: config.jwksUrl,
    hs256Secret: config.hs256Secret,
  })

  void app.register(registerHealthRoutes)
  void app.register(registerAuthRoutes)
  void app.register(registerExpenseRoutes, {
    repository: config.expenseRepository ?? createExpenseRepository(new URL(config.jwksUrl).origin),
  })

  return app
}

function loadConfigFromEnv(): AppConfig {
  const jwksUrl = process.env.INSFORGE_JWKS_URL
  const hs256Secret = process.env.INSFORGE_JWT_SECRET
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
  const port = Number(process.env.PORT ?? 3000)

  if (!jwksUrl) throw new Error('Falta INSFORGE_JWKS_URL en el entorno')

  return {
    jwksUrl,
    hs256Secret,
    corsOrigin: corsOrigin.split(',').map((origin) => origin.trim()),
    port,
  }
}

if (import.meta.main) {
  const config = loadConfigFromEnv()
  const app = createApp(config)

  try {
    await app.listen({
      port: config.port,
      host: '0.0.0.0',
    })
    console.log(`🚀 Servidor corriendo en http://localhost:${config.port}`)
  } catch (error) {
    app.log.error(error)
    process.exit(1)
  }
}

export { loadConfigFromEnv }