import { build, createLogger, InlineConfig, LogLevel, mergeConfig, loadConfigFromFile } from 'vite'
import paths from '../util/paths.js'
import graphicsConfig from '../configs/graphics.config.js'
import dashboardConfig from '../configs/dashboard.config.js'
import { Command } from 'commander'
import chalk from 'chalk'
import { join, resolve } from 'path'
import fs from 'fs-extra'
import { buildExt } from '../extension/index.js'

const mode = (process.env.MODE = process.env.MODE ?? process.env.NODE_ENV ?? 'production')
const LOG_LEVEL: LogLevel = 'info'
const logger = createLogger(LOG_LEVEL, { prefix: chalk.bold.green('[build]') })
const { appPath, appPackageJson } = paths
const pkg = fs.readJSONSync(appPackageJson)

const sharedConfig: InlineConfig = {
  mode,
  logLevel: LOG_LEVEL,
}

const rootConfigPromise = loadConfigFromFile({ command: 'build', mode: mode }, undefined, appPath)
  .then((root) => ({
    ...root,
    config: {
      ...(root?.config || {}),
      build: {
        ...(root?.config?.build || {}),
        outDir: root?.config?.build?.outDir ? join(appPath, root.config.build.outDir) : join(appPath, 'dist'),
      },
    },
  }))
  .catch((err) => {
    logger.error(err)
    process.exit(1)
  })

async function getCFG(type: 'graphics' | 'dashboard') {
  logger.info(chalk.yellow(`Loading ${type} config...`))
  const rootConfig = await rootConfigPromise

  const userConfig = await loadConfigFromFile({ command: 'build', mode: mode }, undefined, join(appPath, `src/${type}`)).catch((err) => {
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
  logger.info(chalk.green(`Loaded ${type} config.`))
  logger.info(chalk.yellow(`Building ${type}...`))
  return mergeConfig(sharedConfig, configFromFile)
}

export default async function (program: Command) {
  try {
    program
      .command('build')
      .description('run vite build in production mode.')
      .option('-e, --extension', 'run only the extension build')
      .option('-E, --no-extension', "don't run the extension build")
      .option('-g, --graphics', 'run the graphics build')
      .option('-G, --no-graphics', "don't run the graphics build")
      .option('-d, --dashboard', 'run the dashboard build')
      .option('-D, --no-dashboard', "don't run the dashboard build")
      .option('-m, --mode <mode>', 'specify env mode (default: production)', 'production')
      .combineFlagAndOptionalValue(false)
      .action(async function (opts) {
        let ext: RollupBuildOutput | undefined, graphics: RollupBuildOutput | undefined, dashboard: RollupBuildOutput | undefined
        const options = opts || {}
        if (options.extension) {
          await buildExt({
            composite: true,
            outDir: resolve(appPath, './extension'),
            hooks: {
              'build:before': (ctx) => {
                logger.info('building extension...' + ctx.buildEntries.map((ent) => ent.path).join('\n'))
              },
              'build:done': (ctx) => {
                logger.info('done building extension')
              },
            },
          })
        }
        if (options.graphics) {
          const config = await getCFG('graphics')
          config.mode = opts.mode
          graphics = await build(config)
        }
        if (options.dashboard) {
          const config = await getCFG('dashboard')
          config.mode = opts.mode
          dashboard = await build(config)
        }
        if (!ext && !graphics && !dashboard) {
          const graphicsConfig = await getCFG('graphics')
          const dashboardConfig = await getCFG('dashboard')
          graphicsConfig.mode = dashboardConfig.mode = opts.mode
          await buildExt({
            composite: true,
            outDir: resolve(appPath, './extension'),
            hooks: {
              'build:before': (ctx) => {
                logger.info('building extension...' + ctx.buildEntries.map((ent) => ent.path).join('\n'))
              },
              'build:done': (ctx) => {
                logger.info('done building extension')
              },
            },
          })
          graphics = await build(graphicsConfig)
          dashboard = await build(dashboardConfig)
        }
      })
  } catch (e) {
    console.error(e)
    process.exit(0)
  }
}
type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
type RollupBuildOutput = ThenArg<ReturnType<typeof build>>
