import { Route, Router, useNavigate, type RouteSectionProps } from '@solidjs/router'
import { createEffect } from 'solid-js'
import { AuthProvider, useAuth } from './lib/auth'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'

function RootRedirect() {
  const { status } = useAuth()
  const navigate = useNavigate()

  createEffect(() => {
    const currentStatus = status()
    if (currentStatus !== 'loading') {
      navigate(currentStatus === 'authenticated' ? '/dashboard' : '/login', { replace: true })
    }
  })

  return status() === 'loading' ? <p class="py-8 text-center text-finzz-text">Cargando sesión…</p> : null
}

function Layout(props: RouteSectionProps) {
  return (
    <div class="mx-auto flex min-h-svh w-full max-w-[1126px] flex-col border-x border-finzz-border bg-finzz-bg text-finzz-text">
      {props.children}
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router root={Layout}>
        <Route path="/" component={RootRedirect} />
        <Route path="/login" component={LoginPage} />
        <Route path="/registro" component={RegisterPage} />
        <Route path="/dashboard" component={ProtectedRoute}>
          <Route path="" component={DashboardPage} />
        </Route>
      </Router>
    </AuthProvider>
  )
}

export default App
