import { defineConfig } from 'vite'

export default defineConfig({
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    lib: {
      entry: 'src/map/engine.js',
      formats: ['es'],
      fileName: () => 'uranus-widget-map.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
})
