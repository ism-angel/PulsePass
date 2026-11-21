import clsx from 'clsx'
import { bytesUtf8 } from '../../../lib/formularios.ts'
import { nivelFortaleza } from '../fortaleza.ts'

const ETIQUETAS = ['—', 'débil', 'media', 'fuerte'] as const
const SEGMENTOS = 8
const LLENOS: Record<0 | 1 | 2 | 3, number> = { 0: 0, 1: 2, 2: 5, 3: 8 }

export function BarraFortaleza({ clave }: { clave: string }) {
  const nivel = nivelFortaleza(clave)
  return (
    <div className="space-y-1">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Entre 12 caracteres y 72 bytes ({bytesUtf8(clave)}/72).
      </p>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: SEGMENTOS }, (_, i) => (
          <span
            key={i}
            className={clsx(
              'h-1 flex-1 rounded-full',
              i < LLENOS[nivel] ? 'bg-marca-600' : 'bg-slate-200 dark:bg-slate-700',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Fortaleza: {ETIQUETAS[nivel]}</p>
    </div>
  )
}
