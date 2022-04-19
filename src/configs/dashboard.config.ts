import { defineConfig } from 'vite'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
  mode: isDev ? 'development' : 'production',
  root: 'src/dashboard',
  base: '',
  build: {
    outDir: '../../dashboard',
    minify: isDev ? false : 'esbuild',
    emptyOutDir: true,
    chunkSizeWarningLimit: isDev ? 0 : 1024,
    sourcemap: isDev ? 'inline' : false,
    watch: isDev
      ? {
          include: ['src/dashboard/**/*'],
        }
      : undefined,
  },
})
