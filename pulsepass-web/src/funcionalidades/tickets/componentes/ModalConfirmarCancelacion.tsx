import { Aviso } from '../../../componentes/Aviso.tsx'
import { Boton } from '../../../componentes/Boton.tsx'
import { Modal } from '../../../componentes/Modal.tsx'
import type { TicketResponse } from '../tipos.ts'

interface PropsModalCancelacion {
  ticket: TicketResponse | null
  enviando: boolean
  /** 409 ("no cancelable") se muestra dentro del modal sin cerrarlo (§9.11). */
  error: string | null
  onConfirmar: () => void
  onCerrar: () => void
}

export function ModalConfirmarCancelacion({
  ticket,
  enviando,
  error,
  onConfirmar,
  onCerrar,
}: PropsModalCancelacion) {
  return (
    <Modal
      abierto={ticket !== null}
      titulo="Cancelar ticket"
      onCerrar={onCerrar}
      acciones={
        <>
          <Boton variante="secundario" tamano="pequeno" onClick={onCerrar}>
            Volver
          </Boton>
          <Boton
            variante="peligro"
            tamano="pequeno"
            onClick={onConfirmar}
            cargando={enviando}
            textoCargando="Cancelando…"
          >
            Cancelar ticket
          </Boton>
        </>
      }
    >
      {ticket ? (
        <p>
          ¿Quieres cancelar el ticket <strong className="font-mono">{ticket.ticketCode}</strong> (
          {ticket.type}) de {ticket.eventName}?
        </p>
      ) : null}
      {error ? <Aviso tono="error">{error}</Aviso> : null}
    </Modal>
  )
}
