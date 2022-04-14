import { defineConfig } from 'vite'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
  root: 'src/dashboard',
  base: '',
  build: {
    outDir: '../../dashboard',
    minify: isDev ? false : 'esbuild',
    emptyOutDir: true,
    chunkSizeWarningLimit: isDev ? 0 : 1024,
    sourcemap: isDev ? 'inline' : false,
    watch: {
      include: ['src/dashboard/**/*'],
    },
  },
})
