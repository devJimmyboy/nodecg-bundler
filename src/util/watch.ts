import type { Stats } from 'fs'
import chokidar, { WatchOptions } from 'chokidar'
import TypedEmitter, { EventMap } from 'typed-emitter'
export function setupWatcher(path: string | string[], opts?: { cwd?: string; ignore?: WatchOptions['ignored'] }) {
  const configFileIdentifier = /vite.config.(ts|js)$/
  const watcher = chokidar.watch(path, {
    cwd: opts?.cwd,
    ignored: opts?.ignore || /node_modules/,
  }) as Watcher
  watcher.on('change', (file) => {
    if (file.match(configFileIdentifier)) {
      delete require.cache[require.resolve(file)]
      watcher.emit('config-change', file)
    }
  })
  return watcher
}

interface FSEvents extends EventMap {
  'config-change': (file: string) => void
  change: (file: string, stat?: Stats) => void
  add: (file: string, stat?: Stats) => void
  addDir: (dir: string, stat?: Stats) => void
  unlink: (file: string, stat?: Stats) => void
  unlinkDir: (dir: string, stat?: Stats) => void
  error: (error: Error) => void
  ready: () => void
  all: (event: keyof Omit<FSEvents, 'config-change'>, file: string) => void
}

type Watcher = Omit<chokidar.FSWatcher, 'on' | 'emit' | 'once'> & TypedEmitter<FSEvents>
