import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Toate request-urile catre /api/* sunt redirectate catre backend
      '/api': {
        target: 'http://localhost:5129',
        changeOrigin: true,
      },
    },
  },
})
