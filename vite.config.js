import { defineConfig } from 'vite'

export default defineConfig({
  base: '/WhatsApp-Message-Sender/',
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  plugins: [],
  css: {
    postcss: './postcss.config.js'
  }
}) 