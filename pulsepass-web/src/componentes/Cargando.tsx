import clsx from 'clsx'

/** Bloque de esqueleto (animate-pulse) con la forma del contenido (§9.20). */
export function Esqueleto({ className }: { className?: string }) {
  return (
    <div className={clsx('animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800', className)} />
  )
}

type FormaCarga = 'tarjetas' | 'detalle' | 'lista' | 'linea'

interface PropsCargando {
  forma?: FormaCarga
  etiqueta?: string
  cantidad?: number
}

/** Estado "cargando" con aria-busy="true" (FE-014). */
export function Cargando({ forma = 'lista', etiqueta = 'Cargando…', cantidad = 3 }: PropsCargando) {
  const elementos = Array.from({ length: cantidad }, (_, i) => i)
  return (
    <div aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">{etiqueta}</span>
      {forma === 'tarjetas' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {elementos.map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
            >
              <Esqueleto className="h-28 rounded-none" />
              <div className="space-y-2 p-4">
                <Esqueleto className="h-3 w-20" />
                <Esqueleto className="h-4 w-3/4" />
                <Esqueleto className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {forma === 'detalle' ? (
        <div className="space-y-4">
          <Esqueleto className="h-48 w-full" />
          <Esqueleto className="h-6 w-2/3" />
          <Esqueleto className="h-4 w-1/2" />
          <Esqueleto className="h-4 w-full" />
        </div>
      ) : null}
      {forma === 'lista' ? (
        <div className="space-y-3">
          {elementos.map((i) => (
            <Esqueleto key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : null}
      {forma === 'linea' ? <Esqueleto className="h-10 w-full" /> : null}
    </div>
  )
}
