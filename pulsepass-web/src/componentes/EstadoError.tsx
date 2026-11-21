import { mensajeDeError } from '../lib/errores.ts'
import { Aviso } from './Aviso.tsx'
import { Boton } from './Boton.tsx'
import { Tarjeta } from './Tarjeta.tsx'

interface PropsEstadoError {
  /** Error capturado (unknown); se traduce con el mapeo de §13. */
  error?: unknown
  mensaje?: string
  onReintentar?: () => void
}

/** Estado de error con reintento (refetch) (§9.20). */
export function EstadoError({ error, mensaje, onReintentar }: PropsEstadoError) {
  const texto = mensaje ?? mensajeDeError(error)
  return (
    <Tarjeta className="flex flex-col items-center gap-4 px-6 py-8 text-center">
      <Aviso tono="error" className="w-full max-w-sm justify-center">
        {texto}
      </Aviso>
      {onReintentar ? <Boton onClick={onReintentar}>Reintentar</Boton> : null}
    </Tarjeta>
  )
}
