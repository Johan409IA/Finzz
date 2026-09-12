import { type ParentProps, Show, createEffect } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useAuth } from '../lib/auth'

export default function ProtectedRoute(props: ParentProps) {
  const { status } = useAuth()
  const navigate = useNavigate()

  createEffect(() => {
    if (status() === 'anonymous') {
      navigate('/login', { replace: true })
    }
  })

  return (
    <Show
      when={status() === 'authenticated'}
      fallback={status() === 'loading' ? <p>Cargando sesión…</p> : null}
    >
      {props.children}
    </Show>
  )
}
