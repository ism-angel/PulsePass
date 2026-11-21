import clsx from 'clsx'
import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { CLASES_CONTROL, clasesBorde, describedBy } from './estilosCampo.ts'
import { IconoAlerta, IconoOjo, IconoOjoTachado } from './Iconos.tsx'

interface PropsEnvoltura {
  id: string
  etiqueta: string
  error?: string
  ayuda?: ReactNode
  etiquetaOculta?: boolean
  children: ReactNode
  className?: string
}

/** Etiqueta + control + ayuda + error con aria-describedby (FE-010). */
export function EnvolturaCampo({
  id,
  etiqueta,
  error,
  ayuda,
  etiquetaOculta,
  children,
  className,
}: PropsEnvoltura) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={id}
        className={clsx(
          'text-sm font-medium text-slate-800 dark:text-slate-200',
          etiquetaOculta && 'sr-only',
        )}
      >
        {etiqueta}
      </label>
      {children}
      {ayuda && !error ? (
        <p id={`${id}-ayuda`} className="text-xs text-slate-500 dark:text-slate-400">
          {ayuda}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1 text-xs text-red-700 dark:text-red-400"
        >
          <IconoAlerta className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  )
}

export interface PropsCampo extends ComponentProps<'input'> {
  etiqueta: string
  error?: string
  ayuda?: ReactNode
  etiquetaOculta?: boolean
  icono?: ReactNode
  contenedorClassName?: string
}

export function Campo({
  etiqueta,
  error,
  ayuda,
  etiquetaOculta,
  icono,
  id,
  className,
  contenedorClassName,
  ...resto
}: PropsCampo) {
  const generado = useId()
  const idCampo = id ?? generado
  return (
    <EnvolturaCampo
      id={idCampo}
      etiqueta={etiqueta}
      error={error}
      ayuda={ayuda}
      etiquetaOculta={etiquetaOculta}
      className={contenedorClassName}
    >
      <div className="relative">
        {icono ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
            {icono}
          </span>
        ) : null}
        <input
          id={idCampo}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(idCampo, error, ayuda)}
          className={clsx(
            CLASES_CONTROL,
            clasesBorde(Boolean(error)),
            icono ? 'pl-9' : undefined,
            className,
          )}
          {...resto}
        />
      </div>
    </EnvolturaCampo>
  )
}

/** Campo de contraseña con botón mostrar/ocultar accesible. */
export function CampoContrasena({
  etiqueta,
  error,
  ayuda,
  id,
  className,
  ...resto
}: Omit<PropsCampo, 'type'>) {
  const generado = useId()
  const idCampo = id ?? generado
  const [visible, setVisible] = useState(false)
  return (
    <EnvolturaCampo id={idCampo} etiqueta={etiqueta} error={error} ayuda={ayuda}>
      <div className="relative">
        <input
          id={idCampo}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(idCampo, error, ayuda)}
          className={clsx(CLASES_CONTROL, clasesBorde(Boolean(error)), 'pr-11', className)}
          {...resto}
        />
        <button
          type="button"
          onClick={() => {
            setVisible((v) => !v)
          }}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-marca-600 dark:hover:text-slate-200"
        >
          {visible ? <IconoOjoTachado className="size-4" /> : <IconoOjo className="size-4" />}
        </button>
      </div>
    </EnvolturaCampo>
  )
}

interface PropsAreaTexto extends ComponentProps<'textarea'> {
  etiqueta: string
  error?: string
  ayuda?: ReactNode
}

export function AreaTexto({ etiqueta, error, ayuda, id, className, ...resto }: PropsAreaTexto) {
  const generado = useId()
  const idCampo = id ?? generado
  return (
    <EnvolturaCampo id={idCampo} etiqueta={etiqueta} error={error} ayuda={ayuda}>
      <textarea
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(idCampo, error, ayuda)}
        className={clsx(CLASES_CONTROL, clasesBorde(Boolean(error)), 'min-h-24 py-2', className)}
        {...resto}
      />
    </EnvolturaCampo>
  )
}
