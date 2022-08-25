import test from 'ava'
import execa from 'execa'
import path from 'path'

const rootTest = path.resolve(__dirname, './')

/**
 * Doesn't work at the moment.
 * For testing, should run `yarn install` in `./mock/stream-starting/` and then run `yarn build` to see results.
 */
test('main', async (t) => {
  const err = await t.throwsAsync(async () => execa('yarn', ['run', 'dev'], { cwd: path.join(__dirname, 'mock/stream-starting/') }))
})
