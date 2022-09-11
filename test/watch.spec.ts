import test, { TestFn } from 'ava'
import { spawn } from 'cross-spawn'
import mockery from 'mockery'
import sinon from 'sinon'
import path from 'path'
import MockNodeCG from 'mock-nodecg'
import { fileURLToPath } from 'url'

mockery.enable({ warnOnUnregistered: false })

interface TestContext {
  nodecg: MockNodeCG
  clock?: sinon.SinonFakeTimers
  Ext: (mock: MockNodeCG) => any
  bundle: any
}
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootTest = __dirname
const testDir = path.resolve(rootTest, './mock/stream-starting')
const tst: TestFn<TestContext> = test

const bundleName = testDir.split(path.sep).pop()

tst.before('Import extension', async (t) => {
  t.context.Ext = (await import(path.resolve(testDir, './extension/index.js'))).default
})

tst.beforeEach((t) => {
  t.context.nodecg = new MockNodeCG({ bundleName })
  // t.context.bundle = t.context.Ext(t.context.nodecg)
})

tst.afterEach((t) => {
  if (t.context.clock) {
    t.context.clock.restore()
    t.context.clock = undefined
  }
})

tst('bundle name', (t) => {
  t.is(t.context.nodecg.bundleName, bundleName)
  t.is(bundleName, 'stream-starting')
})

// tst('namespace safety', (t) => {
//   t.throws(
//     () => {
//       return StreamStarting(t.context.nodecg)
//     },
//     { message: /Please choose a different namespace/ }
//   )
// })

tst('should run well', (t) => {
  const ncg = t.context.nodecg
  const clock = sinon.useFakeTimers()
  t.context.clock = clock

  const extension = t.context.Ext(ncg)
  t.assert(!extension)
})
