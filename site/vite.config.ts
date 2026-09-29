import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    // Páginas: o site (/), a ouvidoria anônima (/ouvidoria/) e o painel da equipe (/ouvidoria/gestao/).
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        ouvidoria: path.resolve(import.meta.dirname, 'ouvidoria/index.html'),
        gestao: path.resolve(import.meta.dirname, 'ouvidoria/gestao/index.html'),
      },
    },
  },
})
