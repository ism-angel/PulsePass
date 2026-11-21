import clsx from 'clsx'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Avatar } from '../componentes/Avatar.tsx'
import { IconoChevronAbajo, IconoSalir } from '../componentes/Iconos.tsx'
import { useAuth } from '../funcionalidades/auth/hooks.ts'
import { useUsuarioPorEmail } from '../funcionalidades/usuarios/hooks.ts'
import { RUTAS } from '../lib/rutas.ts'

interface PropsMenuUsuario {
  movil?: boolean
}

/** Menú de usuario con avatar de iniciales: Mi cuenta · Mis tickets · Salir (PRD §9.2). */
export function MenuUsuario({ movil = false }: PropsMenuUsuario) {
  const { sesion, cerrarSesion, tieneRol } = useAuth()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const idMenu = useId()
  const contenedor = useRef<HTMLDivElement>(null)
  const usuario = sesion.estado === 'autenticado' ? sesion.usuario : null
  // Nombre visible: firstName del perfil propio si está disponible; si no, el username de /api/auth/me.
  const perfil = useUsuarioPorEmail(usuario?.email ?? null)

  useEffect(() => {
    if (!abierto) return
    function alClic(e: MouseEvent) {
      if (
        contenedor.current &&
        e.target instanceof Node &&
        !contenedor.current.contains(e.target)
      ) {
        setAbierto(false)
      }
    }
    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', alClic)
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('mousedown', alClic)
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  if (!usuario) return null
  const nombre = perfil.data?.firstName ?? usuario.username

  function salir() {
    // Primero se sale de la ruta protegida y luego se cierra la sesión (§12.2: navega a /).
    void Promise.resolve(navigate(RUTAS.inicio)).then(() => {
      cerrarSesion('manual')
    })
  }

  const opciones = (
    <>
      <Link to={RUTAS.cuenta} className={claseOpcion} role={movil ? undefined : 'menuitem'}>
        Mi cuenta
      </Link>
      {tieneRol('USER') ? (
        <Link to={RUTAS.misTickets} className={claseOpcion} role={movil ? undefined : 'menuitem'}>
          Mis tickets
        </Link>
      ) : null}
      <button
        type="button"
        onClick={salir}
        className={clsx(claseOpcion, 'w-full text-left')}
        role={movil ? undefined : 'menuitem'}
      >
        <IconoSalir className="size-4" /> Salir
      </button>
    </>
  )

  if (movil) {
    return (
      <div className="flex w-full flex-col gap-1">
        <p className="flex items-center gap-2 px-2 pb-2 text-sm font-semibold">
          <Avatar nombre={nombre} tamano="sm" /> {nombre}
        </p>
        {opciones}
      </div>
    )
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={idMenu}
        onClick={() => {
          setAbierto((v) => !v)
        }}
        className="flex min-h-10 items-center gap-2 rounded-full border border-slate-200 py-1 pr-3 pl-1 text-sm font-medium hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-marca-600 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <Avatar nombre={nombre} tamano="xs" />
        <span>{nombre}</span>
        <IconoChevronAbajo className="size-4" />
      </button>
      {abierto ? (
        <div
          id={idMenu}
          role="menu"
          aria-label="Menú de usuario"
          className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900"
          onClick={() => {
            setAbierto(false)
          }}
        >
          {opciones}
        </div>
      ) : null}
    </div>
  )
}

const claseOpcion =
  'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-slate-200 dark:hover:bg-slate-800'
