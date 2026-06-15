import path from 'path'
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
    resolve: {
      alias: {
        'purecloud-platform-client-v2':
          'purecloud-platform-client-v2/src/purecloud-platform-client-v2/index.js',
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
      cssTarget: ['chrome105', 'safari16', 'firefox104']
    },
    optimizeDeps: {
      exclude: ['platformClient']
    }
  }
})
