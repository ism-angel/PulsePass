import clsx from 'clsx'
import { useId, type ComponentProps, type ReactNode } from 'react'
import { EnvolturaCampo } from './Campo.tsx'
import { CLASES_CONTROL, clasesBorde, describedBy } from './estilosCampo.ts'

interface PropsSelector extends ComponentProps<'select'> {
  etiqueta: string
  error?: string
  ayuda?: ReactNode
  etiquetaOculta?: boolean
  contenedorClassName?: string
}

/** Igual que Campo, para <select> (PRD §9.1). */
export function Selector({
  etiqueta,
  error,
  ayuda,
  etiquetaOculta,
  id,
  className,
  contenedorClassName,
  children,
  ...resto
}: PropsSelector) {
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
      <select
        id={idCampo}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(idCampo, error, ayuda)}
        className={clsx(CLASES_CONTROL, clasesBorde(Boolean(error)), 'pr-8', className)}
        {...resto}
      >
        {children}
      </select>
    </EnvolturaCampo>
  )
}
