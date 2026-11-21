import { Aviso } from '../../../componentes/Aviso.tsx'
import { Boton } from '../../../componentes/Boton.tsx'
import { Modal } from '../../../componentes/Modal.tsx'
import type { TicketType } from '../tipos.ts'

interface PropsModalCompra {
  abierto: boolean
  evento: string
  tipo: TicketType
  cuenta: string
  enviando: boolean
  /** Mensaje del backend (409/403…) mostrado dentro del modal sin cerrarlo (DES-10). */
  error: string | null
  onConfirmar: () => void
  onCerrar: () => void
}

export function ModalConfirmarCompra({
  abierto,
  evento,
  tipo,
  cuenta,
  enviando,
  error,
  onConfirmar,
  onCerrar,
}: PropsModalCompra) {
  return (
    <Modal
      abierto={abierto}
      titulo="Confirmar compra"
      onCerrar={onCerrar}
      acciones={
        <>
          <Boton variante="secundario" tamano="pequeno" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton
            tamano="pequeno"
            onClick={onConfirmar}
            cargando={enviando}
            textoCargando="Comprando…"
          >
            Confirmar
          </Boton>
        </>
      }
    >
      <dl className="divide-y divide-slate-100 dark:divide-slate-800">
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-slate-500 dark:text-slate-400">Evento</dt>
          <dd className="text-right font-medium">{evento}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-slate-500 dark:text-slate-400">Tipo</dt>
          <dd className="font-medium">{tipo}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-slate-500 dark:text-slate-400">Cuenta</dt>
          <dd className="font-medium break-all">{cuenta}</dd>
        </div>
      </dl>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
    </Modal>
  )
}
