import path from 'path'
import { createLogger, defineConfig } from 'vite'

const rootDir = path.resolve(process.cwd(), 'src/extension/')
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'
  return {
    mode: isDev ? 'development' : 'production',
    root: rootDir,
    customLogger: createLogger('info', { prefix: '[extension]' }),
    build: {
      outDir: '../../extension',
      minify: isDev,
      emptyOutDir: true,
      chunkSizeWarningLimit: isDev ? 0 : 1024,
      sourcemap: isDev,
      watch: isDev
        ? {
            include: ['./src/extension/**/*.{ts,js}'],
          }
        : undefined,
      lib: {
        entry: path.resolve(rootDir, 'index.ts'),
        formats: ['cjs'],
        fileName: (form) => `[name].${form === 'cjs' ? 'js' : form}`,
      },
      rollupOptions: {
        external: ['nodecg-types'],
      },
    },
  }
})
