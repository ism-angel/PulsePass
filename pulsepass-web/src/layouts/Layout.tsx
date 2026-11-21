import { Outlet } from 'react-router'
import { Footer } from './Footer.tsx'
import { Navbar } from './Navbar.tsx'
import { ObservadorSesion } from './ObservadorSesion.tsx'

/** Layout raíz: enlace "Saltar al contenido", Navbar sticky, <main id="contenido"> y Footer (§9.2). */
export default function Layout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-marca-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <ObservadorSesion />
      <Navbar />
      <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
