import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Aviso } from '../componentes/Aviso.tsx'
import { BadgeEstado } from '../componentes/Badge.tsx'
import { Boton } from '../componentes/Boton.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { Campo } from '../componentes/Campo.tsx'
import { IconoBuscar } from '../componentes/Iconos.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { useBuscarTicket, useUsarTicket } from '../funcionalidades/tickets/hooks.ts'
import { BuscarTicketSchema, type BuscarTicketForm } from '../funcionalidades/tickets/tipos.ts'
import { esEstado, mensajeDeError, MENSAJES } from '../lib/errores.ts'

/**
 * Validación de ingreso (/staff/validacion) — §9.14. Búsqueda bajo demanda (#16) y PATCH …/use (#20).
 * 200 → "Ingreso registrado." y badge USED; 409 → mensaje del backend (advertencia);
 * 404 → "Ticket no encontrado"; 403 → "Sin permisos". La transición la decide el backend.
 */
export default function ValidacionIngreso() {
  const [buscado, setBuscado] = useState('')
  const ticket = useBuscarTicket(buscado)
  const usar = useUsarTicket()
  const [registrado, setRegistrado] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BuscarTicketForm>({
    resolver: zodResolver(BuscarTicketSchema),
    defaultValues: { ticketCode: '' },
  })

  const buscar = handleSubmit(({ ticketCode }) => {
    usar.reset()
    setRegistrado(false)
    setBuscado(ticketCode.trim())
    if (ticketCode.trim() === buscado) void ticket.refetch()
  })

  function marcarUsado(codigo: string) {
    usar.mutate(codigo, {
      onSuccess: () => {
        setRegistrado(true)
        reset({ ticketCode: '' })
      },
      onError: (error) => {
        if (esEstado(error, 409)) void ticket.refetch()
      },
    })
  }

  const errorBusqueda = ticket.isError
    ? esEstado(ticket.error, 404)
      ? 'Ticket no encontrado.'
      : esEstado(ticket.error, 403)
        ? 'Sin permisos.'
        : mensajeDeError(ticket.error)
    : null

  return (
    <Pagina titulo="Validación de ingreso" estrecha>
      <form
        noValidate
        onSubmit={(e) => {
          void buscar(e)
        }}
        className="flex items-start gap-2"
      >
        <Campo
          etiqueta="Código de ticket"
          contenedorClassName="flex-1"
          className="font-mono uppercase"
          autoFocus
          autoComplete="off"
          error={errors.ticketCode?.message}
          {...register('ticketCode')}
        />
        <Boton type="submit" className="mt-6.5">
          <IconoBuscar className="size-4" /> Buscar
        </Boton>
      </form>

      <div className="mt-5 space-y-4" aria-live="polite">
        {buscado !== '' && ticket.isPending ? (
          <Cargando forma="linea" etiqueta="Buscando ticket…" />
        ) : null}
        {errorBusqueda ? <Aviso tono="error">{errorBusqueda}</Aviso> : null}
        {ticket.isSuccess ? (
          <Tarjeta className="p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-titulo text-xl font-semibold">{ticket.data.eventName}</h2>
              <BadgeEstado estado={ticket.data.status} className="text-sm" />
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {ticket.data.type} · Titular: {ticket.data.userEmail}
            </p>
            {registrado ? null : (
              <Boton
                tamano="grande"
                className="mt-4 w-full"
                cargando={usar.isPending}
                textoCargando="Registrando…"
                onClick={() => {
                  marcarUsado(ticket.data.ticketCode)
                }}
              >
                Marcar como usado
              </Boton>
            )}
          </Tarjeta>
        ) : null}
        {registrado ? <Aviso tono="exito">Ingreso registrado.</Aviso> : null}
        {usar.isError ? (
          <Aviso tono={esEstado(usar.error, 409) ? 'advertencia' : 'error'}>
            {esEstado(usar.error, 403) ? MENSAJES.sinPermisos : mensajeDeError(usar.error)}
            {esEstado(usar.error, 409) ? ' (409)' : ''}
          </Aviso>
        ) : null}
      </div>
    </Pagina>
  )
}
