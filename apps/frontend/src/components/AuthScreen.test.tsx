import { fireEvent, render, screen } from 'solid-testing-library'
import { describe, expect, test } from 'vitest'
import { AuthField } from './AuthScreen'

describe('AuthField', () => {
  test('permite mostrar y ocultar la contraseña sin enviar el formulario', () => {
    render(() => (
      <form>
        <AuthField
          label="Contraseña"
          icon={<span aria-hidden="true">Lock</span>}
          type="password"
          value="secreto"
          onInput={() => undefined}
        />
      </form>
    ))

    const input = screen.getByLabelText('Contraseña') as HTMLInputElement
    const showButton = screen.getByRole('button', { name: 'Mostrar contraseña' })

    expect(input.type).toBe('password')
    expect(showButton.getAttribute('type')).toBe('button')

    fireEvent.click(showButton)
    expect(input.type).toBe('text')
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' }).getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(input.type).toBe('password')
  })
})
