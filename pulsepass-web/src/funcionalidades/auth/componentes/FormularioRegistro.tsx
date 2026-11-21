import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Aviso } from '../../../componentes/Aviso.tsx'
import { Boton } from '../../../componentes/Boton.tsx'
import { Campo, CampoContrasena } from '../../../componentes/Campo.tsx'
import { aplicarErroresDeCampo } from '../../../lib/formularios.ts'
import { esEstado, mensajeDeError } from '../../../lib/errores.ts'
import { useRegistrarUsuario } from '../../usuarios/hooks.ts'
import { RegistroFormSchema, type RegistroForm } from '../../usuarios/tipos.ts'
import { BarraFortaleza } from './BarraFortaleza.tsx'

interface PropsFormularioRegistro {
  onExito: () => void
}

const CAMPOS = ['username', 'email', 'firstName', 'lastName', 'birthDate', 'password'] as const

/**
 * Registro (§9.9). No existe selección de rol: el backend asigna USER. La edad mínima no se valida aquí.
 * 400 → details a campos (setError); 409 → mensaje genérico sin detalles internos (AC-FE-007).
 */
export function FormularioRegistro({ onExito }: PropsFormularioRegistro) {
  const registrar = useRegistrarUsuario()
  const [generales, setGenerales] = useState<string[]>([])
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<RegistroForm>({
    resolver: zodResolver(RegistroFormSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      birthDate: '',
      password: '',
    },
  })

  const clave = useWatch({ control, name: 'password' })

  const enviar = handleSubmit((datos) => {
    setGenerales([])
    registrar.mutate(datos, {
      onSuccess: onExito,
      onError: (error) => {
        setGenerales(
          aplicarErroresDeCampo(error, CAMPOS, setError, { passwordWithinBcryptLimit: 'password' }),
        )
      },
    })
  })

  const mensaje =
    registrar.isError && !esEstado(registrar.error, 400)
      ? mensajeDeError(registrar.error, 'registro')
      : null

  return (
    <form
      noValidate
      onSubmit={(e) => {
        void enviar(e)
      }}
      className="space-y-4"
    >
      <Campo
        etiqueta="Nombre de usuario"
        autoComplete="username"
        error={errors.username?.message}
        {...register('username')}
      />
      <Campo
        etiqueta="Correo electrónico"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Campo
          etiqueta="Nombres"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Campo
          etiqueta="Apellidos"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
      </div>
      <Campo
        etiqueta="Fecha de nacimiento"
        type="date"
        autoComplete="bday"
        error={errors.birthDate?.message}
        {...register('birthDate')}
      />
      <div className="space-y-2">
        <CampoContrasena
          etiqueta="Contraseña (mín. 12 caracteres)"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <BarraFortaleza clave={clave} />
      </div>
      <div aria-live="polite" className="space-y-2">
        {mensaje ? <Aviso tono="error">{mensaje}</Aviso> : null}
        {generales.map((g) => (
          <Aviso key={g} tono="error">
            {g}
          </Aviso>
        ))}
      </div>
      <Boton
        type="submit"
        tamano="grande"
        className="w-full"
        cargando={registrar.isPending}
        textoCargando="Creando cuenta…"
      >
        Crear cuenta
      </Boton>
    </form>
  )
}
