process.title = 'nodecg-bundler'

// import request from 'request'
import semver from 'semver'
import chalk from 'chalk'
import { Command } from 'commander'
import { request } from 'undici'

const program = new Command('nodecg-bundler')
const packageVersion: string = require('../package.json').version

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

// Initialise CLI
program.version(packageVersion).usage('<command> [options]')

// Initialise commands
require('./commands')(program)

// Handle unknown commands
program.on('*', () => {
  console.log('Unknown command:', program.args.join(' '))
  program.help()
})

// Print help if no commands were given
if (!process.argv.slice(2).length) {
  program.help()
}

// Process commands
program.parse(process.argv)
