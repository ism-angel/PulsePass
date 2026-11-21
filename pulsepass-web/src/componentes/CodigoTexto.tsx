import clsx from 'clsx'

interface PropsCodigo {
  children: string
  className?: string
}

/** Códigos (CMF-2026, TKT-8F2A1C) en fuente monoespaciada (DES-05). */
export function CodigoTexto({ children, className }: PropsCodigo) {
  return <span className={clsx('font-mono tracking-wide', className)}>{children}</span>
}
