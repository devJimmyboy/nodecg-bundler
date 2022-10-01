import fs from 'fs-extra'
import path from 'path'
import { fileURLToPath } from 'url'
import chalk from 'chalk'
import { getFiles } from './util.js'
import winston from 'winston'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const templateDir = path.resolve(__dirname, '../templates')
const logger = winston.createLogger({
  level: 'info',

  transports: [
    new winston.transports.Console({
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize({
          colors: {
            info: 'green',
            error: 'red',
            warn: 'yellow',
          },
          all: true,
        }),
        winston.format.label({ label: chalk.magentaBright('template-convert'), message: true }),
        winston.format.simple()
      ),
    }),
  ],
})

type ReadDir = ReadFile[]
type ReadFile = {
  name: string
  content: string
}

async function main() {
  const templateFiles = await fs.readdir(templateDir)

  for (const template of templateFiles) {
    // {
    //   const template = templateFiles[0]
    const templatePath = path.resolve(templateDir, template)
    logger.info(`Converting ${template}...`)
    const srcPth = path.resolve(templatePath, 'src')
    const originalDir: string[] = await getFiles(srcPth).catch((err) => {
      console.log(err)
      return []
    })

    // console.dir(await createDirTree(originalDir, srcPth), {
    //   breakLength: 35,
    //   colors: true,
    // })
    createDirTree(originalDir, srcPth).then(async (srcFiles: DirTree) => {
      await makeDirs(srcPth, srcFiles)
      originalDir.forEach((filePath) => {
        const file = path.relative(srcPth, filePath)
        const dirs = file.split(path.sep)
        if (dirs.length > 1) {
          const dir = dirs.shift()!
          fs.rmSync(path.join(srcPth, dir), { recursive: true })
        } else {
          fs.rmSync(filePath)
        }
      })
    })

    // const templateContent = await fs.readFile(templatePath, 'utf-8')
    // const templateContentConverted = templateContent.replace(/{{/g, '{').replace(/}}/g, '}')
    // await fse.writeFile(templatePath, templateContentConverted)
  }
}

type DirTree = { [key: string]: ReadDir | DirTree | ReadFile }

const matchTs = (str: string) => /-ts\/src\/?$/i.test(str)

async function makeDirs(rootDir: string, originalDir: DirTree) {
  const isTs = matchTs(rootDir)
  const indexHtml = {
    name: 'index.html',
    content: rewritePaths(await fs.readFile(path.resolve(rootDir, '../index.html'), 'utf-8')),
  }
  const dirTree: DirTree = {
    extension: [
      {
        name: 'index.{js}',
        content: await fs.readFile('./example-ext.ts', 'utf-8'),
      },
    ],
    dashboard: { ...originalDir, 'index.html': indexHtml },
    graphics: { ...originalDir, 'index.html': indexHtml },
  }
  const context = {
    '{js}': isTs ? 'ts' : 'js',
    '{jsx}': isTs ? 'tsx' : 'jsx',
  }

  await executeDirTree(dirTree, rootDir, context)
}

function makeFile(file: ReadFile, context: { [key: string]: string }) {
  const { name, content } = file
  const newName = Object.entries(context).reduce((acc, [key, value]) => acc.replace(new RegExp(key, 'g'), value), name)
  return { name: newName, content }
}

async function executeDirTree(dirTree: DirTree, rootDir: string, context: { [key: string]: string }) {
  for (const [dir, files] of Object.entries(dirTree)) {
    const currDir = path.resolve(rootDir, dir)
    if (isReadFile(files)) {
      const { name, content } = makeFile(files, context)
      await fs.writeFile(path.resolve(rootDir, name), content, 'utf-8')
    } else {
      await fs.mkdirp(currDir)
      if (Array.isArray(files)) {
        for (const file of files) {
          const { name, content } = makeFile(file, context)
          await fs.writeFile(path.resolve(currDir, name), content, 'utf-8')
        }
      } else {
        executeDirTree(files, currDir, context)
      }
    }
  }
}

async function createDirTree(dir: string[], root: string) {
  const dirTree: DirTree = {}
  for (const file of dir) {
    const content = await fs.readFile(file, 'utf-8')
    const name = path.relative(root, file)
    console.log(name)
    const dirs = name.split(path.sep)
    let currDir = dirTree
    for (const dir of dirs) {
      if (dir === dirs[dirs.length - 1]) {
        currDir[dir] = { name: dir, content }
      } else {
        if (!currDir[dir]) {
          currDir[dir] = {}
        }
        currDir = currDir[dir] as DirTree
      }
    }
  }
  console.dir(dirTree, { breakLength: 35, colors: true })
  return dirTree
}

function restoreDir() {
  const origFiles = getFiles(path.resolve(templateDir, 'original'))
}
function isReadFile(obj: any): obj is ReadFile {
  return typeof obj.name === 'string' && typeof obj.content === 'string'
}

function rewritePaths(content: string) {
  return content.replace(/(\.?\/)?src\//g, './')
}

main().catch((err) => {
  logger.error(err)
})
