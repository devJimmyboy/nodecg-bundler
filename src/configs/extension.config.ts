import path from 'path'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  rootDir: process.cwd(),
  clean: true,

  entries: [{ input: './src/extension/', builder: 'mkdist', format: 'cjs', name: 'index', outDir: './extension' }],

  outDir: './extension',
})
