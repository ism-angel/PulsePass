import { Link } from 'react-router'
import { IconoFlechaDerecha } from './Iconos.tsx'

export function EnlaceVerTodos({ a, children = 'Ver todos' }: { a: string; children?: string }) {
  return (
    <Link
      to={a}
      className="inline-flex items-center gap-1 rounded text-sm font-medium text-marca-600 hover:text-marca-700 focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-marca-500"
    >
      {children} <IconoFlechaDerecha className="size-4" />
    </Link>
  )
}
