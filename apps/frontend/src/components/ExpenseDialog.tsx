import { onCleanup, onMount, type JSX } from 'solid-js'
import { Portal } from 'solid-js/web'
import XIcon from 'lucide-solid/icons/x'

interface ExpenseDialogProps {
  title: string
  onClose: () => void
  children: JSX.Element
}

export default function ExpenseDialog(props: ExpenseDialogProps) {
  let dialog: HTMLDivElement | undefined
  let previousFocus: HTMLElement | null = null
  let previousOverflow = ''
  let appRoot: HTMLElement | null = null
  let previousInert = false

  onMount(() => {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousOverflow = document.body.style.overflow
    appRoot = document.getElementById('root')
    previousInert = appRoot?.inert ?? false
    if (appRoot) appRoot.inert = true
    document.body.style.overflow = 'hidden'
    const firstField = dialog?.querySelector<HTMLElement>('input, select, textarea')
    ;(firstField ?? dialog?.querySelector<HTMLElement>('button'))?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        props.onClose()
        return
      }

      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (appRoot) appRoot.inert = previousInert
      previousFocus?.focus()
    })
  })

  return (
    <Portal>
      <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={props.title}
      class="fixed inset-0 z-40 grid place-items-center overflow-y-auto overscroll-contain bg-[#02101f]/80 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) props.onClose()
      }}
    >
      <div class="relative w-full max-w-lg">
        <button
          type="button"
          aria-label="Cerrar formulario"
          onClick={props.onClose}
          class="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-xl text-finzz-muted transition-colors hover:bg-finzz-accent-bg hover:text-finzz-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-finzz-accent"
        >
          <XIcon size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        {props.children}
      </div>
      </div>
    </Portal>
  )
}
