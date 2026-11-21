import clsx from 'clsx'
import { useEffect, useId, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'
import { BotonEnlace } from '../componentes/Boton.tsx'
import { IconoCerrar, IconoMenu } from '../componentes/Iconos.tsx'
import { useAuth } from '../funcionalidades/auth/hooks.ts'
import { RUTAS } from '../lib/rutas.ts'
import { BotonTema, Logo } from './Marca.tsx'
import { MenuUsuario } from './MenuUsuario.tsx'
import { ENLACES } from './enlacesNav.ts'

function claseEnlace({ isActive }: { isActive: boolean }) {
  return clsx(
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-marca-600',
    isActive
      ? 'bg-marca-50 text-marca-700 dark:bg-indigo-950 dark:text-indigo-200'
      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
  )
}

export function Navbar() {
  const { sesion, tieneRol } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const idMenu = useId()
  const botonMenu = useRef<HTMLButtonElement>(null)
  const location = useLocation()

  const enlaces = ENLACES.filter((e) => e.roles.length === 0 || tieneRol(...e.roles))
  const anonimo = sesion.estado !== 'autenticado'

  // Cerrar el menú móvil al navegar.
  const [rutaPrevia, setRutaPrevia] = useState(location.pathname)
  if (rutaPrevia !== location.pathname) {
    setRutaPrevia(location.pathname)
    setAbierto(false)
  }

  // Esc cierra el menú móvil y devuelve el foco al botón (TEST-FE-GEN-004).
  useEffect(() => {
    if (!abierto) return
    function alTeclear(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setAbierto(false)
        botonMenu.current?.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('keydown', alTeclear)
    }
  }, [abierto])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Logo />
          <nav aria-label="Principal" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {enlaces.map((e) => (
                <li key={e.texto}>
                  <NavLink to={e.a} end={e.fin} className={claseEnlace}>
                    {e.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <BotonTema />
          {anonimo ? (
            <>
              <BotonEnlace to={RUTAS.login} variante="fantasma" tamano="pequeno">
                Ingresar
              </BotonEnlace>
              <BotonEnlace to={RUTAS.registro} tamano="pequeno">
                Registrarse
              </BotonEnlace>
            </>
          ) : (
            <MenuUsuario />
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <BotonTema />
          <button
            ref={botonMenu}
            type="button"
            aria-expanded={abierto}
            aria-controls={idMenu}
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => {
              setAbierto((v) => !v)
            }}
            className="inline-flex size-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-marca-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {abierto ? <IconoCerrar className="size-6" /> : <IconoMenu className="size-6" />}
          </button>
        </div>
      </div>

      {abierto ? (
        <div
          id={idMenu}
          className="border-t border-slate-200 px-4 pb-5 md:hidden dark:border-slate-800"
        >
          <nav aria-label="Principal móvil">
            <ul className="flex flex-col py-2">
              {enlaces.map((e) => (
                <li key={e.texto}>
                  <NavLink
                    to={e.a}
                    end={e.fin}
                    className={({ isActive }) =>
                      clsx(
                        'block rounded-lg px-2 py-3 text-base focus-visible:outline-2 focus-visible:outline-marca-600',
                        isActive
                          ? 'font-semibold text-marca-700 dark:text-indigo-200'
                          : 'text-slate-800 dark:text-slate-200',
                      )
                    }
                  >
                    {e.texto}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
            {anonimo ? (
              <>
                <BotonEnlace to={RUTAS.login} variante="secundario">
                  Ingresar
                </BotonEnlace>
                <BotonEnlace to={RUTAS.registro}>Registrarse</BotonEnlace>
              </>
            ) : (
              <MenuUsuario movil />
            )}
          </div>
        </div>
      ) : null}
    </header>
  )
}
