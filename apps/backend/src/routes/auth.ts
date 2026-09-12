import { type FastifyInstance } from 'fastify'

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get('/api/auth/me', async (request) => {
    return {
      user: request.auth!.user,
    }
  })
}
