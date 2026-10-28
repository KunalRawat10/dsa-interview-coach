import test from 'node:test'
import assert from 'node:assert/strict'
import { requestsFullSolution, guidedReplyViolations, generateTeachingReply, needsWorkedExample } from '../src/lib/teachingPolicy.ts'

const payload = [{ role: 'system', content: 'Teach the learner.' }, { role: 'user', content: 'I do not know an approach.' }]
const answer = content => ({ choices: [{ message: { content } }] })

test('beginner uncertainty and conceptual questions never authorize a full solution', () => {
  for (const text of [
    'it asks us to identify any number that is repeating in the array',
    'i have no idea what an approach even means',
    'i dont know code, can you help me learn?',
    'please explain what a loop is',
    'can you help me solve this step by step?',
    'do not give the full solution',
    "don't show me the code yet",
    'teach me without giving the answer',
    'show me code for a loop',
  ]) assert.equal(requestsFullSolution(text), false, text)
})

test('explicit full solution and implementation requests are honored', () => {
  for (const text of [
    'please give me the complete JavaScript function now',
    'show me the full solution', 'please show the code',
    'write the implementation', 'i want the whole algorithm',
  ]) assert.equal(requestsFullSolution(text), true, text)
})

test('guided reply check catches the unsolicited solution reported by the user', () => {
  const leaked = `Initialize an empty Set. Loop through each number. If it is already in the Set, return true. Otherwise add it. If you finish the loop, return false.`
  assert.ok(guidedReplyViolations(leaked).includes('complete solution recipe'))
  assert.ok(guidedReplyViolations('```js\nfunction solve(nums) { return true; }\n```').includes('unsolicited implementation'))
  assert.deepEqual(guidedReplyViolations('A loop repeats an action for each item. With [4,7,9], it looks at 4, then 7, then 9. Which value comes after 4?'), [])
  assert.deepEqual(guidedReplyViolations('The problem returns true if there is a repeat and false otherwise. Which number repeats in [4,7,4]?'), [])
})

test('a leaking draft is rewritten and never streamed to the student', async () => {
  const visible = []
  let calls = 0
  const result = await generateTeachingReply(payload, 'I have no idea what an approach is', async request => {
    calls++
    assert.match(request[0].content, /ONE small idea/)
    return answer(calls === 1
      ? '```js\nfunction containsDuplicate(nums) { return new Set(nums).size !== nums.length; }\n```'
      : JSON.stringify({ explanation: 'An approach is a plan for checking the numbers.', workedExample: 'Compare 4 with 7: those values differ.', checkQuestion: 'What does matching another 4 tell us?' }))
  }, text => visible.push(text))
  assert.equal(calls, 2)
  assert.deepEqual(visible, [result])
  assert.doesNotMatch(result, /function|new Set/)
})

test('a focused explanation is displayed without an unnecessary second model call', async () => {
  let calls = 0
  const text = await generateTeachingReply(payload, 'what is a loop?', async () => {
    calls++
    return answer('A loop repeats the same action for each item, like reading names from a list. Which item would come after 4 in [4,7,9]?')
  })
  assert.equal(calls, 1)
  assert.match(text, /repeats/)
})

test('beginner confusion gets a worked example instead of another request to invent a method', async () => {
  assert.equal(needsWorkedExample('i dont know what an approach is'), true)
  assert.equal(needsWorkedExample('show me just the first step'), true)
  const visible = []
  let calls = 0
  const result = await generateTeachingReply(payload, 'i dont know how to check', async request => {
    calls++
    assert.match(request[0].content, /Perform ONE concrete action yourself/)
    return answer(calls === 1
      ? "Let's look at the first number, 4. How would you check whether it repeats?"
      : JSON.stringify({ explanation: 'We can compare two values to check for a match.', workedExample: 'Compare the first 4 with 7: they differ, so that pair is not a repeat.', checkQuestion: 'Are 4 and 4 the same?' }))
  }, text => visible.push(text))
  assert.equal(calls, 2)
  assert.deepEqual(visible, [result])
  assert.match(result, /they differ/)
})

test('beginner support requests constrained fields and displays prose without exposing JSON', async () => {
  let receivedOptions
  const result = await generateTeachingReply(payload, 'i dont understand a loop', async (_request, options) => {
    receivedOptions = options
    return answer(JSON.stringify({
      explanation: 'A loop repeats an action for each item.',
      workedExample: 'For [4,7], the first turn looks at 4.',
      checkQuestion: 'Which item would the next turn look at?',
    }))
  })
  assert.deepEqual(receivedOptions, { responseFormat: 'json' })
  assert.match(result, /first turn looks at 4/)
  assert.doesNotMatch(result, /workedExample|explanation|[{}]/)
})

test('two noncompliant drafts fail clearly rather than showing spoilers or retrying forever', async () => {
  let calls = 0
  const visible = []
  await assert.rejects(generateTeachingReply(payload, 'help me begin', async () => {
    calls++
    return answer('```js\nfunction solve() {}\n```')
  }, text => visible.push(text)), /focused teaching step/)
  assert.equal(calls, 2)
  assert.deepEqual(visible, [])
})

test('explicitly requested code is streamed normally', async () => {
  const visible = []
  const code = '```js\nfunction containsDuplicate(nums) { return new Set(nums).size !== nums.length; }\n```'
  const result = await generateTeachingReply(payload, 'show me the complete solution', async () => (async function* () {
    yield { choices: [{ delta: { content: code } }] }
  })(), text => visible.push(text))
  assert.equal(result, code)
  assert.equal(visible.at(-1), code)
})
