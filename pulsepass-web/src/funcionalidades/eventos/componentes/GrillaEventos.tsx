import type { EventSummaryResponse } from '../tipos.ts'
import { TarjetaEvento } from './TarjetaEvento.tsx'

interface PropsGrilla {
  eventos: readonly EventSummaryResponse[]
  etiqueta: string
}

/** grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 (§9.4). */
export function GrillaEventos({ eventos, etiqueta }: PropsGrilla) {
  return (
    <ul aria-label={etiqueta} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {eventos.map((evento) => (
        <li key={evento.eventCode}>
          <TarjetaEvento evento={evento} />
        </li>
      ))}
    </ul>
  )
}
