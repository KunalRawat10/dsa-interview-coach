import test from 'node:test'
import assert from 'node:assert/strict'
import { withModelDeadline, browserLoadProgress } from '../src/lib/modelDeadline.ts'
import { executeFullAITurnSafe } from '../src/components/WebLLMChat.tsx'

test('an unresponsive model releases the tutor and records an explicit failed reply', async () => {
  let stopped = false
  const result = await executeFullAITurnSafe({ userText: 'help me', messages: [{role:'user',content:'help me'}],
    createCompletion: () => new Promise(() => {}), timeoutMs: 5, onTimeout: () => { stopped = true } })
  assert.equal(stopped, true)
  assert.equal(result.usedFallback, true)
  assert.match(result.finalContent, /could not finish/)
  assert.equal(await withModelDeadline(async () => 'ready', 100), 'ready')
})

test('load progress separates download from GPU allocation when percentages restart', () => {
  assert.match(browserLoadProgress(.99, 'Fetching param cache[30/33]'), /Downloading.*99%/)
  assert.match(browserLoadProgress(.63, 'Loading model from cache[20/33]'), /graphics memory.*63%/)
})
