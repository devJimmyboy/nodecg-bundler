import { defineConfig } from 'vite'

const isDev = process.env.NODE_ENV === 'development'

export default defineConfig({
  root: 'src/extension/',
  build: {
    outDir: '../../extension',
    minify: isDev,
    emptyOutDir: true,
    chunkSizeWarningLimit: isDev ? 0 : 1024,
    sourcemap: true,
    watch: {
      include: ['src/extension/**/*.{ts,js}'],
    },
    lib: {
      entry: 'index.ts',
      formats: ['cjs'],
      fileName: () => '[name].js',
    },
  },
})
