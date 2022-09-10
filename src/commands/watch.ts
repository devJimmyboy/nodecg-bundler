import { build, createLogger, InlineConfig, LogLevel, mergeConfig, loadConfigFromFile, UserConfig, ConfigEnv } from 'vite'
import { RollupWatcher } from 'rollup'
import paths from '../util/paths.js'
import { builtinModules } from 'module'

import { Command } from 'commander'
import { join } from 'path'
import chalk from 'chalk'
// import { existsSync } from 'node:fs'
import { setupWatcher } from '../util/watch.js'
import fs from 'fs-extra'
import extConfig from '../configs/extension.config.js'
import graphConfig from '../configs/graphics.config.js'
import dashConfig from '../configs/dashboard.config.js'
let extensionConfig: UserConfig = {}
let graphicsConfig: UserConfig = {}
let dashboardConfig: UserConfig = {}

process.env.NODE_ENV = process.env.NODE_ENV ?? 'development'
const mode = (process.env.MODE = process.env.MODE ?? process.env.NODE_ENV)

const LOG_LEVEL: LogLevel = 'info'
const { appPath, appPackageJson } = paths
const pkg = fs.readJSONSync(appPackageJson)
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

const sharedConfig: (type: string) => InlineConfig = (type: string) => ({
  mode,
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

async function getCFG(type: 'extension' | 'graphics' | 'dashboard') {
  const rootConfig = await rootConfigPromise

  const userConfig = await loadConfigFromFile({ command: 'build', mode: 'development' }, undefined, join(appPath, `src/${type}`)).catch((err) => {
    console.error(err)
    process.exit(1)
  })
  let config = mergeConfig(rootConfig?.config || {}, userConfig?.config || {})
  config.customLogger = createLogger(LOG_LEVEL, { prefix: `[${type}]` })
  if (type === 'extension') {
    const externals = [...builtinModules, ...Object.keys(pkg.dependencies || {})]
    config = mergeConfig(config, { build: { rollupOptions: { external: externals } } })
  }
  let configFromFile = {}
  switch (type) {
    case 'extension':
      configFromFile = mergeConfig(extensionConfig, config)
      break
    case 'graphics':
      configFromFile = mergeConfig(graphicsConfig, config)
      break
    case 'dashboard':
      configFromFile = mergeConfig(dashboardConfig, config)
      break
  }
  return mergeConfig(sharedConfig(type), configFromFile)
}

async function setupExtensionWatcher(mode: 'development' | 'production') {
  console.log(chalk.blue('[extension]'), chalk.gray('Building...'))
  const config = await getCFG('extension')
  config.mode = mode
  const watcher = (await build(config)) as RollupWatcher
  return watcher
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
        extensionConfig = await (typeof extConfig === 'function' ? extConfig(configEnv) : extConfig)
        graphicsConfig = await (typeof graphConfig === 'function' ? graphConfig(configEnv) : graphConfig)
        dashboardConfig = await (typeof dashConfig === 'function' ? dashConfig(configEnv) : dashConfig)

        rootConfigPromise = loadConfigFromFile(configEnv, undefined, appPath, LOG_LEVEL).catch((err) => {
          console.error(err)
          return null
        })

        let ext: RollupWatcher | undefined, graphics: RollupWatcher | undefined, dashboard: RollupWatcher | undefined
        const options = opts || {}
        if (options.extension) {
          ext = (await setupExtensionWatcher(opts.mode)) as RollupWatcher
        }
        if (options.graphics) {
          graphics = (await setupGraphicsWatcher(opts.mode)) as RollupWatcher
        }
        if (options.dashboard) {
          dashboard = (await setupDashboardWatcher(opts.mode)) as RollupWatcher
        }
        if (!ext && !graphics && !dashboard) {
          ext = (await setupExtensionWatcher(opts.mode)) as RollupWatcher
          graphics = (await setupGraphicsWatcher(opts.mode)) as RollupWatcher
          dashboard = (await setupDashboardWatcher(opts.mode)) as RollupWatcher
        }
        watcher.on('change', async (file) => {
          console.log(chalk.green(`File ${file} changed`))
          if (file.includes('src/extension')) {
            if (ext) {
              ext.close()
            }
            ext = (await setupExtensionWatcher(opts.mode)) as RollupWatcher
          }
          if (file.includes('src/graphics')) {
            if (graphics) {
              graphics.close()
            }
            graphics = (await setupGraphicsWatcher(opts.mode)) as RollupWatcher
          }
          if (file.includes('src/dashboard')) {
            if (dashboard) {
              dashboard.close()
            }
            dashboard = (await setupDashboardWatcher(opts.mode)) as RollupWatcher
          }
        })

        watcher.on('config-change', async (file) => {
          if (!file.includes('vite.config')) return
          ext?.close()
          graphics?.close()
          dashboard?.close()
          ext = (await setupExtensionWatcher(opts.mode)) as RollupWatcher
          graphics = (await setupGraphicsWatcher(opts.mode)) as RollupWatcher
          dashboard = (await setupDashboardWatcher(opts.mode)) as RollupWatcher
        })

        process.once('beforeExit', async (code) => {
          console.log('Closing watchers...')
          const proms = []
          function isClosable(watcher: RollupWatcher | undefined): watcher is RollupWatcher {
            return !!watcher && typeof watcher.close === 'function'
          }
          proms.push(isClosable(ext) && ext.close(), isClosable(graphics) && graphics.close(), isClosable(dashboard) && dashboard.close())
          await Promise.all(proms)
          return process.exit(code)
        })
      })
  } catch (e) {
    console.error(chalk.redBright(e))
    process.exit(1)
  }
}
