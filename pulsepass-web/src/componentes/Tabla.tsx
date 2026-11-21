import type { Key, ReactNode } from 'react'

export interface ColumnaTabla<T> {
  encabezado: string
  celda: (fila: T) => ReactNode
  /** Oculta la etiqueta de la columna en la vista de tarjetas (p. ej. botones de acción). */
  sinEtiquetaMovil?: boolean
}

interface PropsTabla<T> {
  columnas: readonly ColumnaTabla<T>[]
  filas: readonly T[]
  clave: (fila: T) => Key
  titulo: string
}

/**
 * Tabla genérica (guía React §10). Mobile-first: en < md se muestra como lista de tarjetas
 * y desde md como <table> (PRD §9.15).
 */
export function Tabla<T>({ columnas, filas, clave, titulo }: PropsTabla<T>) {
  return (
    <>
      <ul className="space-y-3 md:hidden" aria-label={titulo}>
        {filas.map((fila) => (
          <li
            key={clave(fila)}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <dl className="space-y-1.5 text-sm">
              {columnas.map((col) =>
                col.sinEtiquetaMovil ? (
                  <div key={col.encabezado} className="pt-2">
                    <dt className="sr-only">{col.encabezado}</dt>
                    <dd>{col.celda(fila)}</dd>
                  </div>
                ) : (
                  <div key={col.encabezado} className="flex items-center justify-between gap-3">
                    <dt className="text-slate-500 dark:text-slate-400">{col.encabezado}</dt>
                    <dd className="text-right font-medium">{col.celda(fila)}</dd>
                  </div>
                ),
              )}
            </dl>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{titulo}</caption>
          <thead className="border-b border-slate-200 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <tr>
              {columnas.map((col) => (
                <th key={col.encabezado} scope="col" className="px-4 py-3 font-semibold">
                  {col.encabezado}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filas.map((fila) => (
              <tr key={clave(fila)}>
                {columnas.map((col) => (
                  <td key={col.encabezado} className="px-4 py-3">
                    {col.celda(fila)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
