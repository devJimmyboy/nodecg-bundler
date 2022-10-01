/**
 * Command loader copied from Tim Santeford's commander.js starter
 * https://github.com/tsantef/commander-starter
 */

import fs from 'node:fs'
import path from 'node:path'
import { Command } from 'commander'
import { fileURLToPath } from 'node:url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// console.log(import.meta.url)
export default async function (program: Command) {
  const commands: { [x: string]: (program: Command) => void } = {}
  const loadPath = __dirname

  // Loop though command files
  await Promise.all(
    fs
      .readdirSync(loadPath)
      .filter((filename) => {
        return filename.match(/\..?(js|ts)$/) && !filename.match(/index\..?(ts|js)$/)
      })
      .map(async (filename) => {
        const name = filename.substring(0, filename.lastIndexOf('.'))

        // Require command
        const command = await import(`./${filename}`)
        // Initialize command
        commands[name] = command.default(program)
      })
  )

  return commands
}
