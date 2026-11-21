import { Link, useNavigate } from 'react-router'
import { IconoMusica } from '../componentes/Iconos.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { FormularioRegistro } from '../funcionalidades/auth/componentes/FormularioRegistro.tsx'
import { RUTAS, type EstadoNavegacionLogin } from '../lib/rutas.ts'

/** Registro (/registro) — §9.9. 201 → /login con state.registrado (GAP-07: el registro no emite token). */
export default function Registro() {
  const navigate = useNavigate()
  return (
    <Pagina>
      <Tarjeta className="mx-auto w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-marca-600 text-white">
            <IconoMusica className="size-5" />
          </span>
          <h1 className="text-2xl font-bold">Crea tu cuenta</h1>
        </div>
        <FormularioRegistro
          onExito={() => {
            const estado: EstadoNavegacionLogin = { registrado: true }
            void navigate(RUTAS.login, { state: estado })
          }}
        />
        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link
            to={RUTAS.login}
            className="font-semibold text-marca-600 hover:text-marca-700 dark:text-marca-500"
          >
            Inicia sesión
          </Link>
        </p>
      </Tarjeta>
    </Pagina>
  )
}
