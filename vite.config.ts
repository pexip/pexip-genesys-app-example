import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/pexip-genesys-app-example/',
  plugins: [basicSsl(), react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'ES2022'
  }
})
