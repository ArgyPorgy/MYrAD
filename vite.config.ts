import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/datasets': 'http://localhost:4000',
      '/upload': 'http://localhost:4000',
      '/create-dataset': 'http://localhost:4000',
      '/access': 'http://localhost:4000',
      '/price': 'http://localhost:4000',
      '/quote': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

