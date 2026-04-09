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
    // Avertissement si un chunk dépasse 800kb
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Séparer les dépendances lourdes en chunks indépendants
        // → meilleur cache navigateur
        manualChunks: {
          'vendor-react':   ['react', 'react-dom'],
          'vendor-charts':  ['recharts'],
          'vendor-icons':   ['lucide-react'],
          'vendor-http':    ['axios'],
          'vendor-pdf':     ['jspdf', 'jspdf-autotable'],
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