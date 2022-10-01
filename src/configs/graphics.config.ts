import { createLogger, defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    mode: isDev ? 'development' : 'production',
    root: 'src/graphics',
    base: '',
    envDir: process.cwd(),
    customLogger: createLogger('info', { prefix: '[graphics]' }),
    build: {
      outDir: '../../graphics',
      minify: isDev,
      emptyOutDir: false,
      chunkSizeWarningLimit: isDev ? 5128 : 1024,
      sourcemap: isDev ? 'inline' : false,
      watch: isDev
        ? {
            include: ['src/graphics/**/*'],
          }
        : undefined,
    },
  }
})
