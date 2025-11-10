import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // ✅ Esto escucha en TODAS las interfaces
    port: 5173,
  }
})