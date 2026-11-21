import { useNavigate } from 'react-router'
import { Avatar } from '../componentes/Avatar.tsx'
import { Badge } from '../componentes/Badge.tsx'
import { Boton, BotonEnlace } from '../componentes/Boton.tsx'
import { Cargando } from '../componentes/Cargando.tsx'
import { EstadoError } from '../componentes/EstadoError.tsx'
import { FiltroChips } from '../componentes/FiltroChips.tsx'
import { IconoTicket } from '../componentes/Iconos.tsx'
import { Pagina } from '../componentes/Pagina.tsx'
import { Tarjeta } from '../componentes/Tarjeta.tsx'
import { useAuth } from '../funcionalidades/auth/hooks.ts'
import { useUsuarioPorEmail, useUsuarioPorUsername } from '../funcionalidades/usuarios/hooks.ts'
import { formatearFechaNumerica } from '../lib/formato.ts'
import { RUTAS } from '../lib/rutas.ts'
import { useState } from 'react'

type Fuente = 'email' | 'username'

/**
 * Mi cuenta (/cuenta) — §9.10. Sesión (/api/auth/me) + perfil propio por email (#13) o por
 * username (#14). Solo se consulta la identidad propia. No se muestran hash, token ni claims.
 */
export default function Cuenta() {
  const { sesion, cerrarSesion, tieneRol } = useAuth()
  const navigate = useNavigate()
  const [fuente, setFuente] = useState<Fuente>('email')
  const usuario = sesion.estado === 'autenticado' ? sesion.usuario : null
  const porEmail = useUsuarioPorEmail(usuario?.email ?? null, { habilitado: fuente === 'email' })
  const porUsername = useUsuarioPorUsername(usuario?.username ?? null, {
    habilitado: fuente === 'username',
  })
  const perfil = fuente === 'email' ? porEmail : porUsername

  if (!usuario) return null

  return (
    <Pagina titulo="Mi cuenta">
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
        <span>Consultar perfil por:</span>
        <FiltroChips<Fuente>
          etiqueta="Fuente del perfil"
          seleccion={fuente}
          onCambiar={setFuente}
          opciones={[
            { valor: 'email', etiqueta: 'Correo' },
            { valor: 'username', etiqueta: 'Usuario' },
          ]}
        />
      </div>
      {perfil.isPending ? <Cargando forma="linea" etiqueta="Cargando perfil…" /> : null}
      {perfil.isError ? (
        <EstadoError
          error={perfil.error}
          onReintentar={() => {
            void perfil.refetch()
          }}
        />
      ) : null}
      {perfil.isSuccess ? (
        <Tarjeta className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar nombre={perfil.data.firstName} tamano="md" />
            <div>
              <p className="font-titulo text-lg font-semibold">
                {perfil.data.firstName} {perfil.data.lastName}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                @{perfil.data.username} · {perfil.data.email}
              </p>
              {perfil.data.birthDate ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Nacimiento: {formatearFechaNumerica(perfil.data.birthDate)}
                </p>
              ) : null}
            </div>
          </div>
          <dl className="space-y-1 text-sm">
            <div className="flex items-center gap-2 sm:justify-end">
              <dt>Rol:</dt>
              <dd className="flex gap-1">
                {usuario.roles.map((r) => (
                  <Badge key={r} tono="marca">
                    {r}
                  </Badge>
                ))}
              </dd>
            </div>
            <div className="flex items-center gap-2 sm:justify-end">
              <dt>Estado:</dt>
              <dd>
                <Badge tono={perfil.data.active ? 'activo' : 'inactivo'}>
                  {perfil.data.active ? 'Activa' : 'Inactiva'}
                </Badge>
              </dd>
            </div>
          </dl>
        </Tarjeta>
      ) : null}
      <div className="mt-6 flex flex-wrap justify-between gap-3">
        {tieneRol('USER') ? (
          <BotonEnlace to={RUTAS.misTickets}>
            <IconoTicket className="size-4" /> Ver mis tickets
          </BotonEnlace>
        ) : (
          <span />
        )}
        <Boton
          variante="secundario"
          onClick={() => {
            // Primero se sale de la ruta protegida y luego se cierra la sesión (§12.2: navega a /).
            void Promise.resolve(navigate(RUTAS.inicio)).then(() => {
              cerrarSesion('manual')
            })
          }}
        >
          Cerrar sesión
        </Boton>
      </div>
    </Pagina>
  )
}
