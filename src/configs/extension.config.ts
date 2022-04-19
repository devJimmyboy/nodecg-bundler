import path from 'path'
import { defineConfig } from 'vite'

const isDev = process.env.NODE_ENV === 'development'
const rootDir = path.resolve(process.cwd(), 'src/extension/')
export default defineConfig({
  mode: isDev ? 'development' : 'production',
  root: rootDir,
  build: {
    outDir: '../../extension',
    minify: isDev,
    emptyOutDir: true,
    chunkSizeWarningLimit: isDev ? 0 : 1024,
    sourcemap: isDev,
    watch: isDev
      ? {
          include: ['src/extension/**/*.{ts,js}'],
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
})
