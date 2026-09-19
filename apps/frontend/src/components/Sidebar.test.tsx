import { fireEvent, render, screen } from 'solid-testing-library'
import { Route, Router } from '@solidjs/router'
import { describe, expect, test, vi } from 'vitest'
import Sidebar from './Sidebar'

const signOut = vi.fn()

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    user: () => ({ email: 'johan@example.com', profile: { name: 'Johan Castillon' } }),
    signOut,
  }),
}))

function renderAt(path: string) {
  window.history.pushState({}, '', path)
  render(() => (
    <Router>
      <Route path="*" component={Sidebar} />
    </Router>
  ))
}

describe('Sidebar', () => {
  test('resalta Historial como activo en /historial', () => {
    renderAt('/historial')

    const historyLinks = screen.getAllByRole('link', { name: /historial/i })
    expect(historyLinks.length).toBeGreaterThan(0)
    expect(historyLinks.some((link) => link.getAttribute('aria-current') === 'page')).toBe(true)
    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i })
    expect(dashboardLinks.every((link) => link.getAttribute('aria-current') === null)).toBe(true)
  })

  test('resalta Dashboard como activo en /dashboard', () => {
    renderAt('/dashboard')

    const dashboardLinks = screen.getAllByRole('link', { name: /dashboard/i })
    expect(dashboardLinks.some((link) => link.getAttribute('aria-current') === 'page')).toBe(true)
  })

  test('muestra el nombre del usuario y cierra sesión', () => {
    renderAt('/historial')

    expect(screen.getByText('Johan Castillon')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }))

    expect(signOut).toHaveBeenCalled()
  })
})
