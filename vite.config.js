// taller-frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // 1. El array de plugins está bien
  plugins: [react()],
  server: {
    // Redirecciona /api a tu Spring Boot (http://localhost:8080)
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Puerto de tu backend Spring Boot
        changeOrigin: true,             // Necesario para que el proxy funcione
      },
    }
  }
});