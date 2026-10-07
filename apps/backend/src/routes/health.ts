import { type FastifyInstance } from 'fastify'

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      config: {
        public: true,
      },
    },
    async () => ({ status: 'ok' }),
  )

  app.get(
    '/api/health',
    {
      config: {
        public: true,
      },
    },
    async () => ({ status: 'ok' }),
  )
}
