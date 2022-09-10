process.title = 'nodecg-bundler'

// import request from 'request'
import semver from 'semver'
import chalk from 'chalk'
import { Command } from 'commander'
import { request } from 'undici'
import { fileURLToPath } from 'node:url'
import fs from 'fs-extra'
const { readJSONSync } = fs
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const program = new Command('nodecg-bundler')
const pkg = readJSONSync(path.resolve(__dirname, '../package.json'))
const packageVersion = pkg.version

// Check for updates
request('http://registry.npmjs.org/nodecg-bundler/latest')
  .then((res) => {
    if (res.statusCode === 200) {
      return res.body.json()
    } else return undefined
  })
  .then((body: any) => {
    if (!body) return
    if (semver.gt(body.version, packageVersion)) {
      console.log(chalk.yellow('?') + ' A new update is available for nodecg-bundler: ' + chalk.green.bold(body.version) + chalk.dim(' (current: ' + packageVersion + ')'))
      console.log('  Run ' + chalk.cyan.bold('npm install -g nodecg-bundler@latest') + ' to install the latest version')
    }
  })
  .catch((err) => {
    console.error(err)
  })

// Initialise CLI
program.version(packageVersion).usage('<command> [options]')

// Initialise commands
import initCommands from './commands/index.js'
import path from 'node:path'

initCommands(program).then(() => {
  // Process commands
  program.parse(process.argv)
})

// Handle unknown commands
program.on('*', () => {
  console.log('Unknown command:', program.args.join(' '))
  program.help()
})

// Print help if no commands were given
if (!process.argv.slice(2).length) {
  program.help()
}
