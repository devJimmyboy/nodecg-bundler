import chalk from 'chalk'
import { Command } from 'commander'

export = async function (program: Command) {
  program
    .command('init')
    .description('Initialize a new NodeCG Bundle (not implemented)')
    .action(function () {
      console.error('Not implemented', chalk.bold.red('(╯°□°）╯︵ ┻━┻'))
      process.exit(1)
    })
}
