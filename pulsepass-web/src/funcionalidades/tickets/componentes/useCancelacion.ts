import { useState } from 'react'
import { useAvisos } from '../../../componentes/avisosContexto.ts'
import { esEstado, mensajeDeError } from '../../../lib/errores.ts'
import { useCancelarTicket } from '../hooks.ts'
import type { TicketResponse } from '../tipos.ts'

/**
 * Flujo de cancelación con confirmación (§9.11, reutilizado en §9.12):
 * 409 queda dentro del modal; 403/404 se notifican con un aviso.
 */
export function useCancelacion() {
  const [seleccionado, setSeleccionado] = useState<TicketResponse | null>(null)
  const cancelar = useCancelarTicket()
  const { notificar } = useAvisos()

  function abrir(ticket: TicketResponse) {
    cancelar.reset()
    setSeleccionado(ticket)
  }

  function cerrar() {
    setSeleccionado(null)
    cancelar.reset()
  }

  function confirmar() {
    if (!seleccionado) return
    cancelar.mutate(seleccionado.ticketCode, {
      onSuccess: () => {
        setSeleccionado(null)
        notificar('exito', 'Ticket cancelado.')
      },
      onError: (error) => {
        if (esEstado(error, 403, 404)) {
          setSeleccionado(null)
          notificar('error', mensajeDeError(error))
        }
      },
    })
  }

  const error =
    cancelar.isError && esEstado(cancelar.error, 409, 400, 500, 0)
      ? mensajeDeError(cancelar.error)
      : null

  return { seleccionado, abrir, cerrar, confirmar, enviando: cancelar.isPending, error }
}
