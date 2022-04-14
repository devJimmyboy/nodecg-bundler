import { defineConfig } from 'vite'
import paths from '../config/paths'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
  root: 'src/graphics',
  base: '',
  build: {
    outDir: '../../graphics',
    minify: isDev,
    emptyOutDir: true,
    chunkSizeWarningLimit: isDev ? 0 : 1024,
    sourcemap: isDev ? 'inline' : false,
    watch: {
      include: ['src/graphics/**/*'],
    },
  },
})