import chalk from 'chalk'
import paths from '../util/paths.js'
import extensionConfig from '../configs/extension.config.js'
import { resolve } from 'path'
import { watch } from 'chokidar'
import { build, BuildConfig } from 'unbuild'

const { appPath, appPackageJson } = paths

export async function buildExt(config: BuildConfig & { composite?: boolean } = extensionConfig, path?: string) {
  console.log(chalk.blue('[extension]'), chalk.gray('Building...'))
  if (path) console.log(chalk.blue('[extension]'), chalk.greenBright(path, 'changed'))
  if (config.composite) {
    config = {
      ...extensionConfig,
      ...config,
    }
  }
  build(appPath, false, config)
}

export async function setupExtensionWatcher(mode: 'development' | 'production') {
  // console.log(chalk.blue('[extension]'), chalk.gray('Building...'))
  const extPath = resolve(appPath, './src/extension')
  const watcher = watch([extPath + '/**/*'], {
    ignoreInitial: false,
  })

  watcher.on('change', (path) => buildExt(undefined, path))
  buildExt()
  return watcher
}
