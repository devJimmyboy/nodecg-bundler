import { build, createLogger, InlineConfig, LogLevel, mergeConfig, loadConfigFromFile, UserConfig, ConfigEnv, resolveConfig } from 'vite'
import { RollupWatcher } from 'rollup'
import paths from '../util/paths.js'

import { Command } from 'commander'
import { join } from 'path'
import chalk from 'chalk'
// import { existsSync } from 'node:fs'
import { setupWatcher } from '../util/watch.js'
// import fs from 'fs-extra'
import graphConfig from '../configs/graphics.config.js'
import dashConfig from '../configs/dashboard.config.js'
import { FSWatcher } from 'chokidar'
import { setupExtensionWatcher } from '../extension/index.js'

let graphicsConfig: UserConfig = {}
let dashboardConfig: UserConfig = {}

const LOG_LEVEL: LogLevel = 'info'
const { appPath, appPackageJson } = paths
// const pkg = fs.readJSONSync(appPackageJson)
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

const sharedConfig: (type: string) => InlineConfig = (type: string) => ({
  build: {
    minify: false,
    sourcemap: 'inline',
    watch: {
      include: [`src/${type}/**/*`],
      clearScreen: false,
    },
  },
  clearScreen: false,
  logLevel: LOG_LEVEL,
})

let rootConfigPromise: ReturnType<typeof loadConfigFromFile>

async function getCFG(type: 'graphics' | 'dashboard') {
  const rootConfig = await rootConfigPromise

  const userConfig = await loadConfigFromFile({ command: 'build', mode: 'development' }, undefined, join(appPath, `src/${type}`)).catch((err) => {
    console.error(err)
    process.exit(1)
  })
  let config = mergeConfig(rootConfig?.config || {}, userConfig?.config || {})
  config.customLogger = createLogger(LOG_LEVEL, { prefix: `[${type}]` })
  let configFromFile = {}
  switch (type) {
    case 'graphics':
      configFromFile = mergeConfig(graphicsConfig, config)
      break
    case 'dashboard':
      configFromFile = mergeConfig(dashboardConfig, config)
      break
  }
  return mergeConfig(sharedConfig(type), configFromFile)
}

async function setupGraphicsWatcher(mode: 'development' | 'production') {
  console.log(chalk.blue('[graphics]'), chalk.gray('Building...'))
  const config = await getCFG('graphics')
  config.mode = mode
  return build(config)
}
async function setupDashboardWatcher(mode: 'development' | 'production') {
  console.log(chalk.blue('[dashboard]'), chalk.gray('Building...'))
  const config = await getCFG('dashboard')
  config.mode = mode
  return build(config)
}

export default async function (program: Command) {
  try {
    program
      .command('watch', { isDefault: true })
      .alias('dev')
      .description('run vite build -w in development mode. This is activated by default when no arguments are passed.')
      .option('-e, --extension', 'run only the extension build')
      .option('-E, --no-extension', "don't run the extension build")
      .option('-g, --graphics', 'run the graphics build')
      .option('-G, --no-graphics', "don't run the graphics build")
      .option('-d, --dashboard', 'run the dashboard build')
      .option('-D, --no-dashboard', "don't run the dashboard build")
      .option('-m, --mode <mode>', 'specify env mode (default: development)', 'development')
      .combineFlagAndOptionalValue(false)
      .action(async function (opts) {
        const watcher = setupWatcher(['./src/extension/**/*', './src/graphics', './src/dashboard/**/*', './vite.config.(ts|js)'], {
          cwd: appPath,
        })
        const configEnv: ConfigEnv = {
          mode: opts.mode || 'development',
          command: 'build',
        }

        graphicsConfig = await (typeof graphConfig === 'function' ? graphConfig(configEnv) : graphConfig)
        dashboardConfig = await (typeof dashConfig === 'function' ? dashConfig(configEnv) : dashConfig)

        rootConfigPromise = loadConfigFromFile(configEnv, undefined, appPath, LOG_LEVEL).catch((err) => {
          console.error(err)
          return null
        })

        let ext: FSWatcher | undefined, graphics: RollupWatcher | undefined, dashboard: RollupWatcher | undefined
        const options = opts || {}
        if (options.extension) {
          ext = await setupExtensionWatcher(opts.mode)
        }
        if (options.graphics) {
          graphics = (await setupGraphicsWatcher(opts.mode)) as RollupWatcher
        }
        if (options.dashboard) {
          dashboard = (await setupDashboardWatcher(opts.mode)) as RollupWatcher
        }
        if (!ext && !graphics && !dashboard) {
          ext = await setupExtensionWatcher(opts.mode)
          graphics = (await setupGraphicsWatcher(opts.mode)) as RollupWatcher
          dashboard = (await setupDashboardWatcher(opts.mode)) as RollupWatcher
        }

        watcher.on('config-change', async (file) => {
          if (!file.match(/^(vite|build)\.config/)) return
          graphics?.close()
          dashboard?.close()

          graphics = (await setupGraphicsWatcher(opts.mode)) as RollupWatcher
          dashboard = (await setupDashboardWatcher(opts.mode)) as RollupWatcher
        })

        process.once('beforeExit', async (code) => {
          console.log('Closing watchers...')
          const proms = []
          function isClosable(watcher: RollupWatcher | undefined): watcher is RollupWatcher {
            return !!watcher && typeof watcher.close === 'function'
          }
          proms.push(ext.close(), isClosable(graphics) && graphics.close(), isClosable(dashboard) && dashboard.close())
          await Promise.all(proms)
          return process.exit(code)
        })
      })
  } catch (e) {
    console.error(chalk.redBright(e))
    process.exit(1)
  }
}
