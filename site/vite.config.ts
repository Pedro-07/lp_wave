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
    // Páginas: o site (/), a ouvidoria anônima (/ouvidoria/), o painel da equipe (/ouvidoria/gestao/)
    // e a ficha de avaliação inicial (/wave-profile/).
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        ouvidoria: path.resolve(import.meta.dirname, 'ouvidoria/index.html'),
        gestao: path.resolve(import.meta.dirname, 'ouvidoria/gestao/index.html'),
        waveProfile: path.resolve(import.meta.dirname, 'wave-profile/index.html'),
      },
    },
  },
})
