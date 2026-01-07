import { defineConfig, loadEnv } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const basePath = env.VITE_BASE_PATH || '/pexip-genesys-app-example'

  return {
    base: basePath,
    plugins: [basicSsl(), react()],
    server: {
      port: 3000,
      open: true
    },
    build: {
      target: 'ES2022'
    }
  }
})
