import { defineConfig } from 'vitest/config'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid({ hot: false })],
  resolve: {
    conditions: ['development', 'browser'],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    server: {
      deps: {
        inline: ['solid-js', 'solid-testing-library'],
      },
    },
  },
})
