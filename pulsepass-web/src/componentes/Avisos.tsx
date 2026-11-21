import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { Aviso } from './Aviso.tsx'
import { AvisosContext, type AvisoEmergente, type ValorAvisos } from './avisosContexto.ts'
import type { TonoAviso } from './Aviso.tsx'

/** Duración del aviso de éxito (§9.20: desaparece a los 4 s). */
export const DURACION_EXITO_MS = 4000

export function AvisosProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<AvisoEmergente[]>([])
  const siguienteId = useRef(1)

  const descartar = useCallback((id: number) => {
    setAvisos((actuales) => actuales.filter((a) => a.id !== id))
  }, [])

  const notificar = useCallback(
    (tono: TonoAviso, mensaje: string) => {
      const id = siguienteId.current++
      setAvisos((actuales) => [...actuales, { id, tono, mensaje }])
      // Los errores persisten hasta que se cierran; el resto se retira solo.
      if (tono !== 'error') {
        window.setTimeout(() => {
          descartar(id)
        }, DURACION_EXITO_MS)
      }
    },
    [descartar],
  )

  const valor: ValorAvisos = useMemo(
    () => ({ avisos, notificar, descartar }),
    [avisos, notificar, descartar],
  )

  return (
    <AvisosContext value={valor}>
      {children}
      <RegionAvisos avisos={avisos} onDescartar={descartar} />
    </AvisosContext>
  )
}

interface PropsRegion {
  avisos: readonly AvisoEmergente[]
  onDescartar: (id: number) => void
}

/** Región viva aria-live="polite" donde se apilan los avisos. */
function RegionAvisos({ avisos, onDescartar }: PropsRegion) {
  return (
    <div
      aria-live="polite"
      aria-label="Notificaciones"
      className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex flex-col items-end gap-2 md:bottom-6 md:left-auto md:w-96"
    >
      {avisos.map((a) => (
        <div key={a.id} className="pointer-events-auto w-full shadow-lg">
          <Aviso
            tono={a.tono}
            onCerrar={() => {
              onDescartar(a.id)
            }}
          >
            {a.mensaje}
          </Aviso>
        </div>
      ))}
    </div>
  )
}
