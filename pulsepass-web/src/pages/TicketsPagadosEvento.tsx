import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { z } from 'zod'
import { BadgeEstado } from '../componentes/Badge.tsx'
import { Boton } from '../componentes/Boton.tsx'
import { Campo } from '../componentes/Campo.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { CodigoTexto } from '../componentes/CodigoTexto.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { EstadoVacio } from '../componentes/EstadoVacio.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { PrecioCOP } from '../componentes/PrecioCOP.tsx'
import { Tabla, type ColumnaTabla } from '../componentes/Tabla.tsx'
import { useAvisos } from '../componentes/avisosContexto.ts'
import { useTicketsPagadosPorEvento, useUsarTicket } from '../funcionalidades/tickets/hooks.ts'
import type { TicketResponse } from '../funcionalidades/tickets/tipos.ts'
import { STAFF_SIN_EVENTO } from '../layouts/constantes.ts'
import { esEstado, mensajeDeError } from '../lib/errores.ts'
import { RUTAS } from '../lib/rutas.ts'

const IrEventoSchema = z.object({ eventCode: z.string().trim().min(1, 'Ingresa un código') })
type IrEventoForm = z.infer<typeof IrEventoSchema>

/**
 * Tickets pagados por evento (/staff/eventos/:eventCode/tickets) — §9.15. Tabla<TicketResponse>
 * que en móvil se transforma en tarjetas; "Usar" reutiliza useUsarTicket() e invalida la lista.
 */
export default function TicketsPagadosEvento() {
  const { eventCode: parametro = '' } = useParams()
  const eventCode = parametro === STAFF_SIN_EVENTO ? '' : parametro
  const navigate = useNavigate()
  const { notificar } = useAvisos()
  const tickets = useTicketsPagadosPorEvento(eventCode)
  const usar = useUsarTicket()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IrEventoForm>({ resolver: zodResolver(IrEventoSchema), values: { eventCode } })

  const ir = handleSubmit((datos) => {
    void navigate(RUTAS.staffTicketsPagados(datos.eventCode.trim()))
  })

  const columnas: ColumnaTabla<TicketResponse>[] = [
    {
      encabezado: 'Código',
      celda: (t) => <CodigoTexto className="text-xs">{t.ticketCode}</CodigoTexto>,
    },
    { encabezado: 'Tipo', celda: (t) => t.type },
    { encabezado: 'Titular', celda: (t) => t.userEmail },
    { encabezado: 'Precio', celda: (t) => <PrecioCOP valor={t.price} /> },
    { encabezado: 'Estado', celda: (t) => <BadgeEstado estado={t.status} /> },
    {
      encabezado: 'Acción',
      sinEtiquetaMovil: true,
      celda: (t) => (
        <Boton
          tamano="pequeno"
          className="w-full md:w-auto"
          aria-label={`Usar ticket ${t.ticketCode}`}
          cargando={usar.isPending && usar.variables === t.ticketCode}
          onClick={() => {
            usar.mutate(t.ticketCode, {
              onSuccess: () => {
                notificar('exito', `Ingreso registrado: ${t.ticketCode}.`)
              },
              onError: (error) => {
                notificar('error', mensajeDeError(error))
              },
            })
          }}
        >
          Usar
        </Boton>
      ),
    },
  ]

  return (
    <Pagina>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="text-2xl font-bold sm:text-3xl">
          Tickets pagados
          {eventCode ? (
            <>
              {' '}
              · <CodigoTexto>{eventCode}</CodigoTexto>
            </>
          ) : null}
        </h1>
        <form
          noValidate
          className="flex items-start gap-2"
          onSubmit={(e) => {
            void ir(e)
          }}
        >
          <Campo
            etiqueta="Evento"
            className="font-mono"
            error={errors.eventCode?.message}
            {...register('eventCode')}
          />
          <Boton type="submit" variante="secundario" className="mt-6.5">
            Ir
          </Boton>
        </form>
      </div>

      {eventCode === '' ? (
        <EstadoVacio mensaje="Ingresa el código de un evento para ver sus tickets pagados" />
      ) : null}
      {eventCode !== '' && tickets.isPending ? (
        <Cargando forma="lista" etiqueta="Cargando tickets pagados…" />
      ) : null}
      {tickets.isError && esEstado(tickets.error, 404) ? (
        <EstadoVacio mensaje="Evento no encontrado" />
      ) : null}
      {tickets.isError && !esEstado(tickets.error, 404) ? (
        <EstadoError
          error={tickets.error}
          onReintentar={() => {
            void tickets.refetch()
          }}
        />
      ) : null}
      {tickets.isSuccess ? (
        <>
          <p className="mb-3 text-sm text-marca-700 dark:text-indigo-300">
            Total: {tickets.data.length}
          </p>
          {tickets.data.length === 0 ? (
            <EstadoVacio mensaje="No hay tickets pagados" />
          ) : (
            <Tabla
              titulo={`Tickets pagados de ${eventCode}`}
              columnas={columnas}
              filas={tickets.data}
              clave={(t) => t.ticketCode}
            />
          )}
        </>
      ) : null}
    </Pagina>
  )
}
