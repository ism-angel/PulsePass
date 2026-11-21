/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GAP-05: la API no tiene CORS; en desarrollo se usa el proxy de Vite (/api → backend).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const destinoApi = env.PULSEPASS_API_PROXY ?? 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: { '/api': destinoApi },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
      restoreMocks: true,
    },
  }
})
