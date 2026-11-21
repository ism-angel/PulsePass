import { useState } from 'react'
import { Aviso } from '../../../componentes/Aviso.tsx'
import { Boton } from '../../../componentes/Boton.tsx'
import { Modal } from '../../../componentes/Modal.tsx'
import { Tarjeta } from '../../../componentes/Tarjeta.tsx'
import { useAvisos } from '../../../componentes/avisosContexto.ts'
import { mensajeDeError } from '../../../lib/errores.ts'
import { usePublicarEvento } from '../../eventos/hooks.ts'
import type { EventResponse } from '../../eventos/tipos.ts'

interface PropsPanelPublicacion {
  evento: EventResponse
}

/**
 * "Publicar evento" con modal de confirmación (§9.18). Deshabilitado si el estado ≠ DRAFT
 * (solo UX); la transición la decide el backend y un 409 se muestra en aviso.
 */
export function PanelPublicacion({ evento }: PropsPanelPublicacion) {
  const publicar = usePublicarEvento()
  const { notificar } = useAvisos()
  const [confirmando, setConfirmando] = useState(false)
  const esBorrador = evento.status === 'DRAFT'

  function confirmar() {
    publicar.mutate(evento.eventCode, {
      onSuccess: (actualizado) => {
        setConfirmando(false)
        notificar('exito', `Evento publicado (${actualizado.status}).`)
      },
      onError: () => {
        setConfirmando(false)
      },
    })
  }

  return (
    <Tarjeta className="p-5">
      <h2 className="text-base font-semibold">Publicación</h2>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {esBorrador
            ? 'El evento es visible al público una vez publicado.'
            : `El evento está en estado ${evento.status}; solo un borrador (DRAFT) puede publicarse.`}
        </p>
        <Boton
          onClick={() => {
            publicar.reset()
            setConfirmando(true)
          }}
          disabled={!esBorrador}
        >
          Publicar evento
        </Boton>
      </div>
      {publicar.isError ? (
        <Aviso tono="error" className="mt-3">
          {mensajeDeError(publicar.error)}
        </Aviso>
      ) : null}
      <Modal
        abierto={confirmando}
        titulo="Publicar evento"
        onCerrar={() => {
          setConfirmando(false)
        }}
        acciones={
          <>
            <Boton
              variante="secundario"
              tamano="pequeno"
              onClick={() => {
                setConfirmando(false)
              }}
            >
              Cancelar
            </Boton>
            <Boton
              tamano="pequeno"
              onClick={confirmar}
              cargando={publicar.isPending}
              textoCargando="Publicando…"
            >
              Publicar
            </Boton>
          </>
        }
      >
        <p>
          ¿Publicar <strong>{evento.name}</strong>? Quedará visible en la cartelera.
        </p>
      </Modal>
    </Tarjeta>
  )
}
