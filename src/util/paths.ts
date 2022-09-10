import path from 'path'
import fs from 'fs'
import { searchForWorkspaceRoot } from 'vite'
import chalk from 'chalk'

const appDirectory = searchForWorkspaceRoot(process.cwd())
console.log(chalk.blueBright('App directory:', appDirectory))
const resolveApp = (relativePath: string) => path.resolve(appDirectory, relativePath)

const buildPath = process.env.BUILD_PATH || 'dist'

const moduleFileExtensions = ['web.mjs', 'mjs', 'web.js', 'js', 'web.ts', 'ts', 'web.tsx', 'tsx', 'json', 'web.jsx', 'jsx']

const resolveModule = (resolveFn: (path: string) => string, filePath: string) => {
  const extension = moduleFileExtensions.find((extension) => fs.existsSync(resolveFn(`${filePath}.${extension}`)))

  if (extension) {
    return resolveFn(`${filePath}.${extension}`)
  }

  return resolveFn(`${filePath}.js`)
}

export default {
  dotenv: resolveApp('.env'),
  appPath: resolveApp('.'),
  appBuild: resolveApp(buildPath),
  appPublic: resolveApp('public'),
  appHtml: resolveApp('public/index.html'),
  appIndexJs: resolveModule(resolveApp, 'src/index'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  appTsConfig: resolveApp('tsconfig.json'),
  appJsConfig: resolveApp('jsconfig.json'),
  appConfig: resolveModule(resolveApp, './nodecg-bundler.config'),
  yarnLockFile: resolveApp('yarn.lock'),
  appNodeModules: resolveApp('node_modules'),
  appViteCache: resolveApp('node_modules/.vite'),
  appTsBuildInfoFile: resolveApp('node_modules/.cache/tsconfig.tsbuildinfo'),
}
