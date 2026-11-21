import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { AvisosProvider } from './componentes/Avisos.tsx'
import { AuthProvider } from './funcionalidades/auth/AuthContext.tsx'

interface PropsProveedores {
  queryClient: QueryClient
  children: ReactNode
}

/** QueryClientProvider · AuthProvider · AvisosProvider (orden de PRD §17). */
export function Proveedores({ queryClient, children }: PropsProveedores) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AvisosProvider>{children}</AvisosProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
