import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Contenedor, ContenedorEstrecho } from './Contenedor.tsx'

interface PropsPagina {
  titulo?: string
  /** Acción a la derecha del título (p. ej. "+ Nuevo evento"). */
  accion?: ReactNode
  /** Columna estrecha (~830 px) para formularios y gestión ADMIN (DES-04). */
  estrecha?: boolean
  /** Contenido antes del título (enlace "← Volver"). */
  antes?: ReactNode
  className?: string
  children: ReactNode
}

/** Estructura común de página: contenedor max-w-6xl, px-4, py-8 (§9.2). */
export function Pagina({
  titulo,
  accion,
  estrecha = false,
  antes,
  className,
  children,
}: PropsPagina) {
  const contenido = (
    <>
      {antes ? <div className="mb-4">{antes}</div> : null}
      {titulo ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{titulo}</h1>
          {accion}
        </div>
      ) : null}
      {children}
    </>
  )
  return (
    <Contenedor className={clsx('py-8', className)}>
      {estrecha ? <ContenedorEstrecho>{contenido}</ContenedorEstrecho> : contenido}
    </Contenedor>
  )
}

interface PropsSeccion {
  titulo: string
  enlace?: ReactNode
  children: ReactNode
}

export function Seccion({ titulo, enlace, children }: PropsSeccion) {
  return (
    <section className="space-y-4" aria-label={titulo}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {enlace}
      </div>
      {children}
    </section>
  )
}
