import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '', // Лучше оставить пустым, если Vercel сам управляет путями
  build: {
    outDir: 'dist' // Обязательно указать выходную директорию
  }
})
