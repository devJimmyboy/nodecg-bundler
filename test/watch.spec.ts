import test, { TestFn } from 'ava'
import { spawn } from 'cross-spawn'
import mockery from 'mockery'
import sinon from 'sinon'
import path from 'path'
import MockNodeCG from 'mock-nodecg'

mockery.enable({ warnOnUnregistered: false })

interface TestContext {
  nodecg: MockNodeCG
  clock?: sinon.SinonFakeTimers
}

const rootTest = path.resolve(__dirname, './')
const tst: TestFn<TestContext> = test

tst.beforeEach((t) => {
  t.context.nodecg = new MockNodeCG()
})

tst.afterEach((t) => {
  if (t.context.clock) {
    t.context.clock.restore()
    t.context.clock = undefined
  }
})
