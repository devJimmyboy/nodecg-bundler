import test, { TestFn } from 'ava'
import { spawn } from 'cross-spawn'
import path from 'path'
import MockNodeCG from 'mock-nodecg'

interface TestContext {
  nodecg: MockNodeCG
  clock?: sinon.SinonFakeTimers
}

const tst = test as TestFn<TestContext>
