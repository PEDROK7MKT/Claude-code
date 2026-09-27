import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// servido em agenciaviva.com.br/crm/ (build copiado para ../site/crm pelo build.mjs)
// --mode demo: prévia com dados de exemplo, sem Supabase (gera crm/demo-dist)
export default defineConfig(({ mode }) => mode === 'demo'
  ? { base: './', plugins: [react()], build: { outDir: 'demo-dist' }, resolve: { alias: [{ find: /^\.\/cliente\.js$/, replacement: fileURLToPath(new URL('./src/demo.js', import.meta.url)) }] } }
  : { base: '/crm/', plugins: [react()] })
