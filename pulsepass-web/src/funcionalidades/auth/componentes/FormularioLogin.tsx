import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Aviso } from '../../../componentes/Aviso.tsx'
import { Boton } from '../../../componentes/Boton.tsx'
import { Campo, CampoContrasena } from '../../../componentes/Campo.tsx'
import { aplicarErroresDeCampo } from '../../../lib/formularios.ts'
import { esEstado, mensajeDeError } from '../../../lib/errores.ts'
import { useLogin } from '../hooks.ts'
import { LoginSchema, type LoginForm } from '../tipos.ts'

interface PropsFormularioLogin {
  onExito: () => void
}

const CAMPOS = ['identifier', 'password'] as const

/**
 * identifier + password (§9.8). 401 → "Credenciales inválidas" sin distinguir usuario/contraseña
 * (AC-FE-008); 400 → errores de campo; red/500 → "Inténtalo más tarde".
 */
export function FormularioLogin({ onExito }: PropsFormularioLogin) {
  const login = useLogin()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const enviar = handleSubmit((datos) => {
    login.mutate(datos, {
      onSuccess: onExito,
      onError: (error) => {
        aplicarErroresDeCampo(error, CAMPOS, setError)
      },
    })
  })

  const mensaje =
    login.isError && !esEstado(login.error, 400) ? mensajeDeError(login.error, 'login') : null

  return (
    <form
      noValidate
      onSubmit={(e) => {
        void enviar(e)
      }}
      className="space-y-4"
    >
      <Campo
        etiqueta="Usuario o correo"
        autoComplete="username"
        error={errors.identifier?.message}
        {...register('identifier')}
      />
      <CampoContrasena
        etiqueta="Contraseña"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div aria-live="polite">{mensaje ? <Aviso tono="error">{mensaje}</Aviso> : null}</div>
      <Boton
        type="submit"
        tamano="grande"
        className="w-full"
        cargando={login.isPending}
        textoCargando="Ingresando…"
      >
        Ingresar
      </Boton>
    </form>
  )
}
