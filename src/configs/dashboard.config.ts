import { createLogger, defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    mode: isDev ? 'development' : 'production',
    root: 'src/dashboard',
    base: '',
    envDir: process.cwd(),
    customLogger: createLogger('info', { prefix: '[dashboard]' }),
    build: {
      outDir: '../../dashboard',
      minify: isDev ? false : 'esbuild',
      emptyOutDir: false,
      chunkSizeWarningLimit: isDev ? 0 : 1024,
      sourcemap: isDev ? 'inline' : false,
      watch: isDev
        ? {
            include: ['src/dashboard/**/*'],
          }
        : undefined,
    },
  }
})
