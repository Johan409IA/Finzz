import { fireEvent, render, screen } from 'solid-testing-library'
import { describe, expect, test, vi } from 'vitest'
import ExpenseDialog from './ExpenseDialog'

describe('ExpenseDialog', () => {
  test('mueve el foco al contenido, lo confina y lo restaura al cerrar', () => {
    const onClose = vi.fn()
    const appRoot = document.createElement('div')
    appRoot.id = 'root'
    const trigger = document.createElement('button')
    appRoot.append(trigger)
    document.body.append(appRoot)
    trigger.focus()

    const { unmount } = render(() => (
      <ExpenseDialog title="Registrar gasto" onClose={onClose}>
        <form>
          <input aria-label="Importe" />
          <button type="button">Guardar</button>
        </form>
      </ExpenseDialog>
    ))

    expect(document.activeElement).toBe(screen.getByLabelText('Importe'))
    expect(document.getElementById('root')?.inert).toBe(true)

    fireEvent.keyDown(document.activeElement!, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()

    unmount()
    expect(document.activeElement).toBe(trigger)
    expect(document.getElementById('root')?.inert).toBe(false)
    trigger.remove()
  })
})
