import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env files from the current directory (frontend/)
  // FIX: Replaced `process.cwd()` with `'.'` to work around a TypeScript type error where `cwd` was not found on `process`.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    // Set the development server port to 3000
    server: {
      port: 3000,
    },
    // Define process.env to be accessible in the client-side code
    // This makes the API key available to the Gemini service
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    }
  }
})
