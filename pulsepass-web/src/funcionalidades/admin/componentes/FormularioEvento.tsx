import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { Aviso } from '../../../componentes/Aviso.tsx'
import { Boton, BotonEnlace } from '../../../componentes/Boton.tsx'
import { AreaTexto, Campo } from '../../../componentes/Campo.tsx'
import { Selector } from '../../../componentes/Selector.tsx'
import { useAvisos } from '../../../componentes/avisosContexto.ts'
import { aplicarErroresDeCampo } from '../../../lib/formularios.ts'
import { esEstado, mensajeDeError } from '../../../lib/errores.ts'
import { RUTAS } from '../../../lib/rutas.ts'
import { CATEGORIAS } from '../../eventos/categorias.tsx'
import { useCrearEvento } from '../../eventos/hooks.ts'
import { CrearEventoFormSchema, DESCRIPCION_MAX, type CrearEventoForm } from '../../eventos/tipos.ts'
import type { VenueResponse } from '../../sedes/tipos.ts'
import { recordarEventoCreado } from '../eventosSesion.ts'

const CAMPOS = [
  'eventCode',
  'name',
  'description',
  'category',
  'eventDate',
  'minimumAge',
  'venueCode',
] as const

interface PropsFormularioEvento {
  sedes: readonly VenueResponse[]
}

/**
 * Nuevo evento (§9.17). 400 → details por campo; 409 → aviso arriba del formulario; 403 → /403.
 * Las reglas (fecha futura, sede activa, código único) las valida el backend.
 */
export function FormularioEvento({ sedes }: PropsFormularioEvento) {
  const navigate = useNavigate()
  const { notificar } = useAvisos()
  const crear = useCrearEvento()
  const [generales, setGenerales] = useState<string[]>([])
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<CrearEventoForm>({
    resolver: zodResolver(CrearEventoFormSchema),
    defaultValues: {
      eventCode: '',
      name: '',
      description: '',
      category: 'MUSIC',
      eventDate: '',
      minimumAge: 0,
      venueCode: '',
    },
  })

  const enviar = handleSubmit((datos) => {
    setGenerales([])
    crear.mutate(datos, {
      onSuccess: (evento) => {
        recordarEventoCreado(evento.eventCode)
        notificar('exito', `Evento ${evento.eventCode} creado en estado ${evento.status}.`)
        void navigate(RUTAS.adminEvento(evento.eventCode))
      },
      onError: (error) => {
        if (esEstado(error, 403)) {
          void navigate(RUTAS.sinPermisos, { replace: true })
          return
        }
        setGenerales(aplicarErroresDeCampo(error, CAMPOS, setError))
      },
    })
  })

  const avisoServidor =
    crear.isError && !esEstado(crear.error, 400, 403) ? mensajeDeError(crear.error) : null
  const descripcion = useWatch({ control, name: 'description' })

  return (
    <form
      noValidate
      onSubmit={(e) => {
        void enviar(e)
      }}
      className="space-y-4"
    >
      <div aria-live="polite" className="space-y-2">
        {avisoServidor ? <Aviso tono="error">{avisoServidor}</Aviso> : null}
        {generales.map((g) => (
          <Aviso key={g} tono="error">
            {g}
          </Aviso>
        ))}
      </div>
      <Campo
        etiqueta="Código del evento"
        className="font-mono"
        error={errors.eventCode?.message}
        {...register('eventCode')}
      />
      <Campo etiqueta="Nombre" error={errors.name?.message} {...register('name')} />
      <AreaTexto
        etiqueta="Descripción"
        rows={4}
        maxLength={DESCRIPCION_MAX}
        error={errors.description?.message}
        ayuda={`${String(descripcion.length)}/${String(DESCRIPCION_MAX)}`}
        {...register('description')}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <Selector etiqueta="Categoría" error={errors.category?.message} {...register('category')}>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Selector>
        <Campo
          etiqueta="Edad mínima"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          error={errors.minimumAge?.message}
          {...register('minimumAge', { valueAsNumber: true })}
        />
      </div>
      <Campo
        etiqueta="Fecha y hora"
        type="datetime-local"
        error={errors.eventDate?.message}
        {...register('eventDate')}
      />
      <Selector etiqueta="Sede" error={errors.venueCode?.message} {...register('venueCode')}>
        <option value="">Elige una sede…</option>
        {sedes.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name} ({s.code})
          </option>
        ))}
      </Selector>
      <div className="flex justify-end gap-2 pt-2">
        <BotonEnlace to={RUTAS.adminEventos} variante="secundario">
          Cancelar
        </BotonEnlace>
        <Boton type="submit" cargando={crear.isPending} textoCargando="Creando…">
          Crear evento
        </Boton>
      </div>
    </form>
  )
}
