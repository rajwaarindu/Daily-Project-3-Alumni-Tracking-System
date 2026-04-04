import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-pddikti': {
        target: 'https://api-pddikti.rone.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-pddikti/, ''),
      },
      '^/api(?!-pddikti)': 'http://127.0.0.1:3001',
    },
  },
})
