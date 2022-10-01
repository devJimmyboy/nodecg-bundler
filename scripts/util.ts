import { readdir } from 'fs/promises'
import { resolve } from 'path'

export async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true })
  const files: (string | string[])[] = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name)
      return dirent.isDirectory() ? getFiles(res) : res
    })
  )
  return files.flat()
}
