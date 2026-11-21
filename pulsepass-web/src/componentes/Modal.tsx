import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconoCerrar } from './Iconos.tsx'

interface PropsModal {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
  /** Botonera inferior (Cancelar / Confirmar). */
  acciones?: ReactNode
}

const SELECTOR_ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Diálogo accesible (PRD §9.1): role="dialog" + aria-modal, atrapa el foco,
 * se cierra con Esc y devuelve el foco al elemento que lo abrió.
 */
export function Modal({ abierto, titulo, onCerrar, children, acciones }: PropsModal) {
  const idTitulo = useId()
  const panel = useRef<HTMLDivElement>(null)
  const onCerrarRef = useRef(onCerrar)

  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    if (!abierto) return
    const anterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const nodo = panel.current
    const primero = nodo?.querySelector<HTMLElement>(SELECTOR_ENFOCABLES)
    ;(primero ?? nodo)?.focus()

    function alTeclear(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.stopPropagation()
        onCerrarRef.current()
        return
      }
      if (evento.key !== 'Tab' || !nodo) return
      const enfocables = Array.from(nodo.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES))
      const inicio = enfocables[0]
      const fin = enfocables[enfocables.length - 1]
      if (!inicio || !fin) return
      if (evento.shiftKey && document.activeElement === inicio) {
        evento.preventDefault()
        fin.focus()
      } else if (!evento.shiftKey && document.activeElement === fin) {
        evento.preventDefault()
        inicio.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      anterior?.focus()
    }
  }, [abierto])

  if (!abierto) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" aria-hidden="true" onClick={onCerrar} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-xl bg-white shadow-xl focus:outline-none dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 id={idTitulo} className="text-base font-semibold">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-marca-600 dark:hover:bg-slate-800"
          >
            <IconoCerrar className="size-4" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4 text-sm">{children}</div>
        {acciones ? <div className="flex justify-end gap-2 px-5 pb-5">{acciones}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
