import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = { target: env.API_PROXY_TARGET || 'http://127.0.0.1:8010', changeOrigin: false }

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: { '/api': proxy, '/auth': proxy, '/sanctum': proxy, '/up': proxy },
    },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true },
  }
})
