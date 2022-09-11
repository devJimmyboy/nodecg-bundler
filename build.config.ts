import path from 'node:path'
import url from 'node:url'
import { defineBuildConfig } from 'unbuild'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export default defineBuildConfig({
  entries: [
    {
      builder: 'mkdist',
      input: './src/',
      format: 'esm',
      ext: 'js',
      outDir: './dist',
    },
  ],
  clean: true,
  rollup: {
    inlineDependencies: false,
    esbuild: {
      minify: true,
      platform: 'node',
    },
    alias: {
      entries: {},
    },
    resolve: {
      preferBuiltins: true,
    },
  },
  alias: {
    // we can always use non-transpiled code since we support 14.18.0+
    prompts: 'prompts/lib/index.js',
  },

  hooks: {
    'rollup:options'(ctx, options) {
      if (!options.plugins) {
        options.plugins = []
      }
    },
  },
})
