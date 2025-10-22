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
      '/datasets': process.env.VITE_API_BASE_URL || 'http://localhost:4000',
      '/upload': process.env.VITE_API_BASE_URL || 'http://localhost:4000',
      '/create-dataset': process.env.VITE_API_BASE_URL || 'http://localhost:4000',
      '/access': process.env.VITE_API_BASE_URL || 'http://localhost:4000',
      '/price': process.env.VITE_API_BASE_URL || 'http://localhost:4000',
      '/quote': process.env.VITE_API_BASE_URL || 'http://localhost:4000',
      '/health': process.env.VITE_API_BASE_URL || 'http://localhost:4000',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

