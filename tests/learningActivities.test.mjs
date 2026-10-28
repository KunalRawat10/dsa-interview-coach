import test from 'node:test'
import assert from 'node:assert/strict'
import { ACTIVITIES, freshActivity, answerActivity, emptyLearningRecord, readLearningRecord, recordActivity, learningContext } from '../src/lib/learningActivities.ts'
import { smallestCompatibleModel, compactPayload, generateSmallModelTurn } from '../src/lib/smallModel.ts'
import { prebuiltAppConfig } from '@mlc-ai/web-llm'
import { PROBLEMS } from '../src/data/problems.ts'

test('exercise checks before adding and does not advance after a wrong answer', () => {
  const activity = ACTIVITIES[0]
  let state = answerActivity(activity, freshActivity(), true)
  assert.equal(state.index, 0); assert.equal(state.mistakes, 1); assert.deepEqual(state.seen, [])
  state = answerActivity(activity, state, false)
  state = answerActivity(activity, state, false)
  assert.equal(state.index, 2); assert.deepEqual(state.seen, [1, 2])
  state = answerActivity(activity, state, true)
  assert.equal(state.complete, true); assert.match(state.feedback, /true/)
  assert.equal(answerActivity(activity, state, false), state)
})
test('distinct case needs every item; transfer uses strings with the same rule', () => {
  let state = freshActivity()
  for (let i = 0; i < 3; i++) { assert.equal(state.complete, false); state = answerActivity(ACTIVITIES[1], state, false) }
  assert.equal(state.complete, true); assert.match(state.feedback, /false/)
  state = freshActivity()
  for (const answer of [false, false, true]) state = answerActivity(ACTIVITIES[2], state, answer)
  assert.equal(state.complete, true); assert.deepEqual(state.seen, ['maya', 'arun'])
})
test('learning record retains best evidence and distinguishes viewing from demonstrating', () => {
  let record = recordActivity(emptyLearningRecord(), 'transfer', 2)
  record = recordActivity(record, 'transfer', 0)
  record = recordActivity(record, 'transfer', 3)
  assert.equal(record.activities.length, 1); assert.equal(record.activities[0].mistakes, 0)
  assert.deepEqual(readLearningRecord(JSON.stringify(record)), record)
  assert.deepEqual(readLearningRecord('broken'), emptyLearningRecord())
  assert.deepEqual(readLearningRecord('{"version":1,"activities":[null, {"id":"bad"}],"viewed":[2]}'), emptyLearningRecord())
  assert.match(learningContext({ ...record, viewed: ['set'] }), /not proof of understanding/)
})
test('default selects lowest estimated compatible memory using actual runtime catalogue', () => {
  const withoutF16 = smallestCompatibleModel(prebuiltAppConfig.model_list, new Set())
  const withF16 = smallestCompatibleModel(prebuiltAppConfig.model_list, new Set(['shader-f16']))
  assert.equal(withF16.model_id, 'SmolLM2-135M-Instruct-q0f16-MLC')
  assert.equal(withoutF16.model_id, 'SmolLM2-360M-Instruct-q4f32_1-MLC')
  assert.ok(withF16.vram_required_MB < withoutF16.vram_required_MB)
  assert.throws(() => smallestCompatibleModel([], new Set()), /No compatible/)
})
test('small model uses one short plain-text call and cannot award mastery', async () => {
  let calls = 0
  const problem = PROBLEMS[0]
  const messages = [{ role: 'user', content: 'can we use a guest list?' }]
  const result = await generateSmallModelTurn(messages, problem, 'concepts', async (payload, options) => {
    calls++; assert.equal(options.maxTokens, 128); assert.equal(options.responseFormat, undefined)
    assert.match(payload[0].content, /Coding is optional/)
    return { choices: [{ message: { content: 'A Set keeps distinct values.' } }] }
  })
  assert.equal(calls, 1); assert.equal(result.lesson.complete, false); assert.deepEqual(result.lesson.demonstrated, [])
  const long = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x'.repeat(2000) }))
  const payload = compactPayload(long, problem, 'concepts', '')
  assert.ok(payload.length < 10); assert.ok(payload.map(x => x.content).join('').length < 7000)
})
test('tiny-model solution leaks are replaced and prerequisite questions get checked explanations', async () => {
  const complete = async () => ({ choices: [{ message: { content: 'Solution: ```python\ndef containsDuplicate(nums): return True\n```' } }] })
  const result = await generateSmallModelTurn([{ role: 'user', content: 'how should i think about this?' }], PROBLEMS[0], 'concepts', complete)
  assert.doesNotMatch(result.reply, /```|def /); assert.match(result.reply, /true or false/)
  const prerequisite = await generateSmallModelTurn([{ role: 'user', content: 'i dont know about the set. can u tell me how would we check it' }], PROBLEMS[0], 'concepts', () => { throw Error('Should use verified explanation') })
  assert.match(prerequisite.reply, /BEFORE adding/); assert.equal(prerequisite.attempts, 0)
})
test('small-model repeated paraphrases are replaced with a teaching step', async () => {
  const draft = 'You can write the numbers 1, 2, and then stop. The workshop lets you try this.'
  const result = await generateSmallModelTurn([{ role: 'assistant', content: draft }, { role: 'user', content: 'is there another way?' }], PROBLEMS[0], 'concepts', async () => ({ choices: [{ message: { content: draft } }] }))
  assert.notEqual(result.reply, draft); assert.equal(result.lesson.questions.other, 1)
})
