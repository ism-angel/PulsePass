import { Link } from 'react-router'
import { IconoFlechaIzquierda } from './Iconos.tsx'

interface PropsEnlaceVolver {
  a: string
  children: string
}

export function EnlaceVolver({ a, children }: PropsEnlaceVolver) {
  return (
    <Link
      to={a}
      className="inline-flex items-center gap-2 rounded text-sm font-medium text-marca-600 hover:text-marca-700 focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
    >
      <IconoFlechaIzquierda className="size-4" />
      {children}
    </Link>
  )
}
