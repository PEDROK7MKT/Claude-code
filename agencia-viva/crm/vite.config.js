import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// servido em agenciaviva.com.br/crm/ (build copiado para ../site/crm pelo build.mjs)
export default defineConfig({ base: '/crm/', plugins: [react()] })
