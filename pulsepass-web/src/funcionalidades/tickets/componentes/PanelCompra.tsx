import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router'
import { Aviso } from '../../../componentes/Aviso.tsx'
import { Boton, BotonEnlace } from '../../../componentes/Boton.tsx'
import { useAvisos } from '../../../componentes/avisosContexto.ts'
import { Tarjeta } from '../../../componentes/Tarjeta.tsx'
import { esEstado, mensajeDeError } from '../../../lib/errores.ts'
import { RUTAS, type EstadoNavegacionLogin } from '../../../lib/rutas.ts'
import { useAuth } from '../../auth/hooks.ts'
import type { EventResponse } from '../../eventos/tipos.ts'
import { useComprarTicket } from '../hooks.ts'
import { CompraFormSchema, TicketTypeSchema, type CompraForm } from '../tipos.ts'
import { ModalConfirmarCompra } from './ModalConfirmarCompra.tsx'

interface PropsPanelCompra {
  evento: EventResponse
}

const ID_FORM = 'form-compra'

/**
 * Panel "Entradas" (§9.5). Solo orquesta: no calcula precios ni valida edad/capacidad (§24.1);
 * el backend responde 409 y el mensaje se muestra en el modal.
 */
export function PanelCompra({ evento }: PropsPanelCompra) {
  const { sesion, tieneRol } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { notificar } = useAvisos()
  const compra = useComprarTicket()
  const [confirmando, setConfirmando] = useState(false)
  const { register, handleSubmit, control } = useForm<CompraForm>({
    resolver: zodResolver(CompraFormSchema),
    defaultValues: { type: 'GENERAL' },
  })
  const tipo = useWatch({ control, name: 'type' })

  // STAFF/ADMIN no compran desde la UI (FR-SEC-TKT-01): panel oculto.
  if (sesion.estado === 'autenticado' && !tieneRol('USER')) return null

  const disponible = evento.status === 'PUBLISHED'
  const anonimo = sesion.estado !== 'autenticado'
  const estadoLogin: EstadoNavegacionLogin = { desde: location.pathname }

  function cerrarModal() {
    setConfirmando(false)
    compra.reset()
  }

  function confirmar() {
    compra.mutate(
      { eventCode: evento.eventCode, type: tipo },
      {
        onSuccess: (ticket) => {
          void navigate(RUTAS.confirmacion(ticket.ticketCode))
        },
        onError: (error) => {
          if (esEstado(error, 403)) notificar('error', mensajeDeError(error))
        },
      },
    )
  }

  const motivo = disponible
    ? null
    : `La compra no está disponible: el evento está en estado ${evento.status}.`

  const botonComprar = (clase?: string) =>
    anonimo ? (
      <BotonEnlace
        to={RUTAS.login}
        state={estadoLogin}
        tamano="grande"
        className={clsx('w-full', clase)}
      >
        Inicia sesión para comprar
      </BotonEnlace>
    ) : (
      <Boton
        type="submit"
        form={ID_FORM}
        tamano="grande"
        disabled={!disponible}
        className={clsx('w-full', clase)}
      >
        Comprar entrada
      </Boton>
    )

  return (
    <>
      <Tarjeta className="p-5">
        <h2 className="text-lg font-semibold">Entradas</h2>
        <form
          id={ID_FORM}
          noValidate
          onSubmit={(e) => {
            void handleSubmit(() => {
              setConfirmando(true)
            })(e)
          }}
          className="mt-3 space-y-4"
        >
          <fieldset>
            <legend className="mb-2 text-sm text-slate-600 dark:text-slate-400">
              Tipo de entrada
            </legend>
            <div className="space-y-2">
              {TicketTypeSchema.options.map((opcion) => (
                <label
                  key={opcion}
                  className={clsx(
                    'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 text-sm font-medium has-focus-visible:outline-2 has-focus-visible:outline-marca-600',
                    tipo === opcion
                      ? 'border-marca-600 bg-marca-50 dark:bg-indigo-950'
                      : 'border-slate-200 dark:border-slate-700',
                  )}
                >
                  <input
                    type="radio"
                    value={opcion}
                    {...register('type')}
                    className="size-4 accent-marca-600"
                  />
                  {opcion}
                </label>
              ))}
            </div>
          </fieldset>
          {botonComprar()}
          {motivo ? <Aviso tono="advertencia">{motivo}</Aviso> : null}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            El precio lo define el sistema al confirmar.
          </p>
        </form>
      </Tarjeta>

      {/* DES-07: en móvil la acción de compra se fija en una barra inferior. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 p-4 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        {botonComprar()}
      </div>

      {sesion.estado === 'autenticado' ? (
        <ModalConfirmarCompra
          abierto={confirmando}
          evento={evento.name}
          tipo={tipo}
          cuenta={sesion.usuario.email}
          enviando={compra.isPending}
          error={
            compra.isError && !esEstado(compra.error, 401) ? mensajeDeError(compra.error) : null
          }
          onConfirmar={confirmar}
          onCerrar={cerrarModal}
        />
      ) : null}
    </>
  )
}
