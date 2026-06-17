import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react-swc'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const basePath = env.VITE_BASE_PATH || '/pexip-genesys-app-example'

  return {
    base: basePath,
    plugins: [basicSsl(), react()],
    resolve: {
      alias: {
        'purecloud-platform-client-v2': path.resolve(
          __dirname,
          'node_modules/purecloud-platform-client-v2/src/purecloud-platform-client-v2/index.js'
        ),
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
      }
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      target: 'ES2022',
      cssTarget: ['chrome105', 'safari16', 'firefox121']
    },
    optimizeDeps: {
      exclude: ['platformClient']
    }
  }
})
