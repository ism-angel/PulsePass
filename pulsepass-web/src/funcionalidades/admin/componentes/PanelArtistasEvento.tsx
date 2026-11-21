import { useState } from 'react'
import { Aviso } from '../../../componentes/Aviso.tsx'
import { Boton } from '../../../componentes/Boton.tsx'
import { IconoMas } from '../../../componentes/Iconos.tsx'
import { Selector } from '../../../componentes/Selector.tsx'
import { Tarjeta } from '../../../componentes/Tarjeta.tsx'
import { useAvisos } from '../../../componentes/avisosContexto.ts'
import { mensajeDeError } from '../../../lib/errores.ts'
import { useArtistasActivos } from '../../artistas/hooks.ts'
import { useAsociarArtista } from '../../eventos/hooks.ts'
import { ListaArtistasEvento } from '../../eventos/componentes/ListaArtistasEvento.tsx'
import type { EventResponse } from '../../eventos/tipos.ts'

interface PropsPanelArtistas {
  evento: EventResponse
}

/**
 * Artistas asociados + "Agregar artista" (§9.18). Los ya asociados se deshabilitan en el select
 * (solo UX); el backend sigue siendo la autoridad y responde 409 ante duplicados.
 */
export function PanelArtistasEvento({ evento }: PropsPanelArtistas) {
  const artistas = useArtistasActivos()
  const asociar = useAsociarArtista()
  const { notificar } = useAvisos()
  const [seleccion, setSeleccion] = useState('')
  const asociados = new Set(evento.artists.map((a) => a.id))

  function enviar() {
    const artista = artistas.data?.find((a) => String(a.id) === seleccion)
    if (!artista) return
    asociar.mutate(
      { eventCode: evento.eventCode, artistId: artista.id, stageName: artista.stageName },
      {
        onSuccess: () => {
          setSeleccion('')
          notificar('exito', `${artista.stageName} asociado al evento.`)
        },
      },
    )
  }

  return (
    <Tarjeta className="p-5">
      <h2 className="text-base font-semibold">Artistas asociados</h2>
      <div className="mt-3">
        <ListaArtistasEvento artistas={evento.artists} enlazar={false} />
      </div>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault()
          enviar()
        }}
      >
        <Selector
          etiqueta="Agregar artista"
          contenedorClassName="flex-1"
          value={seleccion}
          onChange={(e) => {
            asociar.reset()
            setSeleccion(e.target.value)
          }}
          disabled={artistas.isPending}
        >
          <option value="">
            {artistas.isPending ? 'Cargando artistas…' : 'Selecciona un artista'}
          </option>
          {(artistas.data ?? []).map((a) => (
            <option key={a.id} value={String(a.id)} disabled={asociados.has(a.id)}>
              {a.stageName}
              {asociados.has(a.id) ? ' (ya asociado)' : ''}
            </option>
          ))}
        </Selector>
        <Boton
          type="submit"
          variante="secundario"
          disabled={seleccion === ''}
          cargando={asociar.isPending}
          textoCargando="Asociando…"
        >
          <IconoMas className="size-4" /> Asociar
        </Boton>
      </form>
      {artistas.isError ? (
        <Aviso tono="error" className="mt-3">
          {mensajeDeError(artistas.error)}
        </Aviso>
      ) : null}
      {asociar.isError ? (
        <Aviso tono="error" className="mt-3">
          {mensajeDeError(asociar.error)}
        </Aviso>
      ) : null}
    </Tarjeta>
  )
}
