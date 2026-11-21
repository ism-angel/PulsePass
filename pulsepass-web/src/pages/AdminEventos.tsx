import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Aviso } from '../componentes/Aviso.tsx'
import { Boton, BotonEnlace } from '../componentes/Boton.tsx'
import { Campo } from '../componentes/Campo.tsx'
import { IconoMas } from '../componentes/Iconos.tsx'
import { Pagina, Seccion } from '../componentes/Pagina.tsx'
import { FilaEventoAdmin } from '../funcionalidades/admin/componentes/FilaEventoAdmin.tsx'
import { useEventosCreadosEnSesion } from '../funcionalidades/admin/eventosSesion.ts'
import { RUTAS } from '../lib/rutas.ts'

const BuscarEventoSchema = z.object({
  eventCode: z.string().trim().min(1, 'Ingresa el código del evento'),
})
type BuscarEventoForm = z.infer<typeof BuscarEventoSchema>

/**
 * Administración de eventos (/admin/eventos) — §9.16. Búsqueda por código (#4, ADMIN ve borradores)
 * y lista "Creados en esta sesión" (GAP-01: no existe listado completo de eventos).
 */
export default function AdminEventos() {
  const creados = useEventosCreadosEnSesion()
  const [buscado, setBuscado] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BuscarEventoForm>({
    resolver: zodResolver(BuscarEventoSchema),
    defaultValues: { eventCode: '' },
  })

  const buscar = handleSubmit((datos) => {
    setBuscado(datos.eventCode.trim())
  })

  return (
    <Pagina
      estrecha
      titulo="Administración de eventos"
      accion={
        <BotonEnlace to={RUTAS.adminNuevoEvento}>
          <IconoMas className="size-4" /> Nuevo evento
        </BotonEnlace>
      }
    >
      <form
        noValidate
        className="flex items-start gap-2"
        onSubmit={(e) => {
          void buscar(e)
        }}
      >
        <Campo
          etiqueta="Buscar evento por código"
          contenedorClassName="flex-1"
          className="font-mono"
          error={errors.eventCode?.message}
          {...register('eventCode')}
        />
        <Boton type="submit" variante="secundario" className="mt-6.5">
          Abrir
        </Boton>
      </form>

      <div className="mt-8 space-y-8">
        {buscado ? (
          <Seccion titulo="Resultado de la búsqueda">
            <FilaEventoAdmin key={buscado} eventCode={buscado} />
          </Seccion>
        ) : null}
        <Seccion titulo="Creados en esta sesión">
          {creados.length === 0 ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Aún no has creado eventos en esta sesión.
            </p>
          ) : (
            <ul className="space-y-2" aria-label="Eventos creados en esta sesión">
              {creados.map((codigo) => (
                <li key={codigo}>
                  <FilaEventoAdmin eventCode={codigo} />
                </li>
              ))}
            </ul>
          )}
          <Aviso tono="info">Nota: la API no ofrece un listado completo de eventos (GAP-01).</Aviso>
        </Seccion>
      </div>
    </Pagina>
  )
}
