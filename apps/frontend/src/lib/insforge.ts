import { createClient } from '@insforge/sdk'

export const insforge = createClient({
  baseUrl: import.meta.env.VITE_INSFORGE_URL,
  anonKey: import.meta.env.VITE_INSFORGE_ANON_KEY,
})

export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
}
