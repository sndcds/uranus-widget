import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      customElement: true
    })
  ],

  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  build: {
    lib: {
      entry: 'src/main.js',
      name: 'UranusWidget',
      formats: ['iife'],
      fileName: () => 'uranus-widget-vue.js'
    },

    outDir: 'dist',
    emptyOutDir: true
  }
})