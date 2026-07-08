import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // caminhos relativos: funciona no GitHub Pages (subpasta), Vercel e afins
  base: './',
  plugins: [react()],
})
