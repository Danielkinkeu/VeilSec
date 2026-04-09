// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        /**
         * manualChunks doit être une FONCTION dans Vite 8 / Rolldown.
         * Reçoit l'ID du module et retourne le nom du chunk.
         * Retourner undefined = chunk par défaut.
         */
        manualChunks: (id) => {
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons'
          }
          if (id.includes('node_modules/axios')) {
            return 'vendor-http'
          }
          if (id.includes('node_modules/jspdf')) {
            return 'vendor-pdf'
          }
        }
      }
    }
  },

  server: {
    proxy: {
      '/api': 'https://veilsec.onrender.com'
    }
  }
})