import test from 'node:test'
import assert from 'node:assert/strict'
import { generateSmallModelTurn } from '../src/lib/smallModel.ts'
import { PROBLEMS } from '../src/data/problems.ts'
const problem = PROBLEMS.find(item => item.slug === 'contains-duplicate')
const noModel = () => { throw Error('This mathematical fact should use checked content') }

test('inserting before checking is corrected across different student phrasings', async () => {
  for (const input of ['I plan to insert 4 first and then test membership. Would that mistakenly match itself?', 'Why check the Set before adding?', 'I add first, then check.']) {
    const result = await generateSmallModelTurn([{ role: 'user', content: input }], problem, 'concepts', noModel)
    assert.match(result.reply, /falsely report a repeat/)
    assert.match(result.reply, /before adding/)
    assert.equal(result.lesson.complete, false)
  }
})
test('small explicit examples are evaluated from their values, including negatives and zero', async () => {
  for (const [example, outcome] of [['[4,7,9]', 'false'], ['[-2,0,-2]', 'true'], ['[0]', 'false'], ['[8,8]', 'true']]) {
    const result = await generateSmallModelTurn([{ role: 'user', content: `Please explain the result for ${example} without code.` }], problem, 'concepts', noModel)
    assert.match(result.reply, new RegExp(`answer is ${outcome}`))
    assert.doesNotMatch(result.reply, /```/)
  }
})
test('a model claim that a Set remembers only the last value never reaches the learner', async () => {
  const result = await generateSmallModelTurn([{ role: 'user', content: 'Is there another way?' }], problem, 'concepts', async () => ({ choices: [{ message: { content: 'The Set only remembers the last value added.' } }] }))
  assert.doesNotMatch(result.reply, /only remembers the last/)
})
