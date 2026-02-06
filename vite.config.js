import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['app.saikumar.space', 'saikumar.space', 'localhost', '.saikumar.space', '10.0.2.2']
  }
})
