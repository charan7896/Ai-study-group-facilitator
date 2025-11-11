import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files from the current directory (frontend/)
  // Only load variables that start with VITE_ for client-side access
  const env = loadEnv(mode, '.', 'VITE_');

  return {
    plugins: [react()],
    // Set the development server port to 3000
    server: {
      port: 3000,
    },
  }
})
