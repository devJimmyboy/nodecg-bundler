import { build, createLogger, InlineConfig, LogLevel, mergeConfig, loadConfigFromFile } from 'vite'
import { RollupWatcher } from 'rollup'
import paths from '../config/paths'
import { builtinModules } from 'module'
import extensionConfig from '../configs/extension.config'
import graphicsConfig from '../configs/graphics.config'
import dashboardConfig from '../configs/dashboard.config'
import { Command } from 'commander'
import path, { join } from 'path'
process.env.NODE_ENV = 'development'

const mode = (process.env.MODE = process.env.MODE ?? process.env.NODE_ENV ?? 'development')

const LOG_LEVEL: LogLevel = 'info'
const { appPath, appPackageJson } = paths
const pkg = require(appPackageJson)

const sharedConfig: (type: string) => InlineConfig = (type: string) => ({
  mode,
  build: {
    minify: false,
    sourcemap: 'inline',
    watch: {
      include: [`src/${type}/**/*`],
    },
  },
  logLevel: LOG_LEVEL,
})

const rootConfigPromise = loadConfigFromFile({ command: 'build', mode: mode }, undefined, appPath).catch((err) => {
  console.error(err)
  process.exit(1)
})

async function getCFG(type: 'extension' | 'graphics' | 'dashboard') {
  const rootConfig = await rootConfigPromise;

  const userConfig = await loadConfigFromFile({ command: 'build', mode: mode }, undefined, join(appPath, `src/${type}`)).catch((err) => {
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

async function setupExtensionWatcher() {
  return build(await getCFG('extension'))
}

async function setupGraphicsWatcher() {
  return build(await getCFG('graphics'))
}
async function setupDashboardWatcher() {
  return build(await getCFG('dashboard'))
}

export = async function (program: Command) {
  try {
    program
      .command('*')
      .alias('watch')
      .alias('dev')
      .description('run vite build -w in development mode. This is activated by default when no arguments are passed.')
      .option('-e, --extension', 'run only the extension build')
      .option('-E, --no-extension', "don't run the extension build")
      .option('-g, --graphics', 'run the graphics build')
      .option('-G, --no-graphics', "don't run the graphics build")
      .option('-d, --dashboard', 'run the dashboard build')
      .option('-D, --no-dashboard', "don't run the dashboard build")
      .combineFlagAndOptionalValue(false)
      .action(async function (opts) {
        let ext: RollupWatcher | undefined, graphics: RollupWatcher | undefined, dashboard: RollupWatcher | undefined
        const options = opts || {}
        if (options.extension) {
          ext = (await setupExtensionWatcher()) as RollupWatcher
        }
        if (options.graphics) {
          graphics = (await setupGraphicsWatcher()) as RollupWatcher
        }
        if (options.dashboard) {
          dashboard = (await setupDashboardWatcher()) as RollupWatcher
        }
        if (!ext && !graphics && !dashboard) {
          ext = (await setupExtensionWatcher()) as RollupWatcher
          graphics = (await setupGraphicsWatcher()) as RollupWatcher
          dashboard = (await setupDashboardWatcher()) as RollupWatcher
        }
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
    console.error(e)
    process.exit(1)
  }
}
