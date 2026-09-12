import { describe, expect, test, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from 'solid-testing-library'
import { AuthProvider, useAuth } from '../lib/auth'
import { insforge } from '../lib/insforge'

const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  profile: null,
  metadata: null,
}

vi.mock('../lib/insforge', () => ({
  insforge: {
    auth: {
      getCurrentUser: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => () => undefined),
    },
  },
}))

function Probe() {
  const { status, user, signOut } = useAuth()
  return (
    <div>
      <span data-testid="status">{status()}</span>
      <span data-testid="user">{user()?.email ?? 'none'}</span>
      <button onClick={() => signOut()}>sign out</button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('muestra loading mientras se recupera la sesión', async () => {
    let resolveCurrentUser!: (value: { data: { user: unknown } | null; error: null }) => void
    ;(insforge.auth.getCurrentUser as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => {
        resolveCurrentUser = resolve
      }),
    )

    render(() => (
      <AuthProvider>
        <Probe />
      </AuthProvider>
    ))

    expect(screen.getByTestId('status').textContent).toBe('loading')
    resolveCurrentUser({ data: { user: mockUser }, error: null })
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    })
  })

  test('marca autenticado cuando getCurrentUser devuelve un usuario', async () => {
    ;(insforge.auth.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    render(() => (
      <AuthProvider>
        <Probe />
      </AuthProvider>
    ))

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    })
    expect(screen.getByTestId('user').textContent).toBe('user@example.com')
  })

  test('marca anonymous cuando no hay usuario', async () => {
    ;(insforge.auth.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: null },
      error: null,
    })

    render(() => (
      <AuthProvider>
        <Probe />
      </AuthProvider>
    ))

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('anonymous')
    })
    expect(screen.getByTestId('user').textContent).toBe('none')
  })

  test('marca anonymous cuando hay error al recuperar la sesión', async () => {
    ;(insforge.auth.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: 'invalid session' },
    })

    render(() => (
      <AuthProvider>
        <Probe />
      </AuthProvider>
    ))

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('anonymous')
    })
  })

  test('signOut limpia el estado y pasa a anonymous', async () => {
    ;(insforge.auth.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
    ;(insforge.auth.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({ error: null })

    render(() => (
      <AuthProvider>
        <Probe />
      </AuthProvider>
    ))

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    })

    screen.getByText('sign out').click()
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('anonymous')
    })
    expect(screen.getByTestId('user').textContent).toBe('none')
    expect(insforge.auth.signOut).toHaveBeenCalled()
  })
})
