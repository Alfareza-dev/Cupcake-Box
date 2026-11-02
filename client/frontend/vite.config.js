import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import eslint from "vite-plugin-eslint"
import vueI18n from '@intlify/unplugin-vue-i18n/vite'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const backendTarget = process.env.VITE_BACKEND_URL || 'http://localhost:8080'

export default defineConfig({
  optimizeDeps: {
    exclude: ['pufferpanel-conditions']
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        ws: true
      },
      '/auth': {
        target: backendTarget,
        changeOrigin: true,
        bypass(req) {
          if (req.method === 'GET' && !req.url.startsWith('/auth/publickey')) {
            return '/index.html'
          }
        }
      },
      '/oauth2': {
        target: backendTarget,
        changeOrigin: true
      },
      '/daemon': {
        target: backendTarget,
        changeOrigin: true,
        ws: true
      },
      '/theme': {
        target: backendTarget,
        changeOrigin: true
      },
      '/manifest.json': {
        target: backendTarget,
        changeOrigin: true
      },
      '/swagger': {
        target: backendTarget,
        changeOrigin: true
      }
    }
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash][extname]'
      }
    }
  },
  resolve: {
    alias: [
      {find: "@", replacement: path.resolve(__dirname, 'src')}
    ]
  },
  define: {
    localeList: fs.readdirSync('src/lang')
  },
  plugins: [
    vue(),
    vueI18n({
      runtimeOnly: false,
      include: path.resolve(__dirname, '@/lang/**')
    }),
    eslint()
  ]
})
