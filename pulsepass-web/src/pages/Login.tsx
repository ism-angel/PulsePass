import { Link, useLocation, useNavigate } from 'react-router'
import { Aviso } from '../componentes/Aviso.tsx'
import { IconoMusica } from '../componentes/Iconos.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { FormularioLogin } from '../funcionalidades/auth/componentes/FormularioLogin.tsx'
import { leerEstadoLogin } from '../funcionalidades/auth/estadoNavegacion.ts'
import { MENSAJES } from '../lib/errores.ts'
import { RUTAS } from '../lib/rutas.ts'

/**
 * Login (/login) — §9.8. Tras POST /api/auth/login + GET /api/auth/me navega a
 * location.state.desde ?? '/' con replace (AC-FE-004). Muestra "Tu sesión expiró" y "Cuenta creada".
 */
export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const estado = leerEstadoLogin(location.state)

  return (
    <Pagina>
      <Tarjeta className="mx-auto w-full max-w-sm p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex size-10 items-center justify-center rounded-xl bg-marca-600 text-white">
            <IconoMusica className="size-5" />
          </span>
          <h1 className="text-2xl font-bold">Inicia sesión</h1>
        </div>
        <div className="mb-4 space-y-2">
          {estado.motivo === 'expirada' ? (
            <Aviso tono="info">{MENSAJES.sesionExpirada}</Aviso>
          ) : null}
          {estado.registrado ? <Aviso tono="exito">Cuenta creada, inicia sesión.</Aviso> : null}
        </div>
        <FormularioLogin
          onExito={() => {
            void navigate(estado.desde ?? RUTAS.inicio, { replace: true })
          }}
        />
        <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link
            to={RUTAS.registro}
            className="font-semibold text-marca-600 hover:text-marca-700 dark:text-marca-500"
          >
            Regístrate
          </Link>
        </p>
      </Tarjeta>
    </Pagina>
  )
}
