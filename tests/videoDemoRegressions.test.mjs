import test from 'node:test'
import assert from 'node:assert/strict'
import { generateSmallModelTurn } from '../src/lib/smallModel.ts'
import { PROBLEMS } from '../src/data/problems.ts'
import { generateLessonTurn } from '../src/lib/lessonTutor.ts'
const problem = PROBLEMS.find(item => item.slug === 'contains-duplicate')
const noModel = () => { throw Error('This mathematical fact should use checked content') }

test('the exact array acknowledgement advances to one comparison instead of repeating the definition', async () => {
  const inputs = [
    'I understand what an array is now, but I have no idea how to start solving this. Show me just one small step.',
    'I understand what a loop is now, but I have no idea how to start solving this. Show me just one small step.',
    'I know what a Set is now. Show me the first step.',
  ]
  for (const input of inputs) {
    const history = [
      {role:'user',content:"I don't know what an array is. Can you explain it using just three numbers?"},
      {role:'assistant',content:'An array is an ordered list of values. In [4,7,4], the first and last positions contain equal values.'},
      {role:'user',content:input},
    ]
    for (const tutor of [generateSmallModelTurn, generateLessonTurn]) {
      const result = await tutor(history, problem, 'concepts', noModel)
      assert.match(result.reply, /compare.*first 4.*7/i)
      assert.doesNotMatch(result.reply, /An array is|A loop repeats|A Set stores|answer is true|finds a match/i)
      assert.equal(result.lesson.complete, false)
    }
  }
})

test('genuine prerequisite uncertainty still gets an explanation', async () => {
  for (const [input, expected] of [["I don't know what an array is. Can you explain it using just three numbers?", /An array is/], ["I don't understand what a loop is", /A loop repeats/], ['What is a Set?', /A Set stores/]]) {
    for (const tutor of [generateSmallModelTurn, generateLessonTurn]) {
      assert.match((await tutor([{role:'user',content:input}],problem,'concepts',noModel)).reply, expected)
    }
  }
})

test('the exact follow-up asks for one comparison, not another goal restatement', async () => {
  const result = await generateSmallModelTurn([{role:'user',content:'Show me just the first comparison I should make. Don’t explain the whole solution.'}],problem,'concepts',noModel)
  assert.match(result.reply,/Compare only the first 4 with 7/)
  assert.doesNotMatch(result.reply,/question asks|answer is true|last 4 finds/)
})

test('a guest-list plan is considered before generic checking help, including question form', async () => {
  for (const input of ['Could I keep a guest list of numbers I have already seen and check whether each arriving number is already on it?', 'I would keep a list of earlier numbers and compare each arriving number with that list.']) {
    const result = await generateSmallModelTurn([{role:'user',content:input}],problem,'concepts',noModel)
    assert.match(result.reply,/guest-list idea can work/)
    assert.match(result.reply,/before adding/)
    assert.doesNotMatch(result.reply,/An approach is|Compare only the first 4/)
    assert.equal(result.lesson.complete,false)
  }
})

test('the photographed conversation progresses without swapping the learner example to ones', async () => {
  const inputs = [
    'I think the question asks whether any number appears more than once. I want to understand the concept before writing code.',
    "I don't know what an array is. Can you explain it using just three numbers?",
    'I understand what an array is now, but I have no idea how to start solving this. Show me just one small step.',
    'Show me just the first comparison I should make. Don’t explain the whole solution.',
    'The first 4 and 7 are different, but the first and last 4 match. So there is a repeat, and we return true.\n\nIntroduce your own analogy',
    'Could I keep a guest list of numbers I have already seen and check whether each arriving number is already on it?',
  ]
  const history=[]
  const replies=[]
  for (const content of inputs) {
    history.push({role:'user',content})
    const result=await generateSmallModelTurn(history,problem,'concepts',noModel)
    replies.push(result.reply)
    history.push({role:'assistant',content:result.reply,lesson:result.lesson})
  }
  assert.match(replies[1],/An array is/)
  assert.doesNotMatch(replies[2],/An array is/)
  assert.match(replies[3],/Compare only/)
  assert.doesNotMatch(replies[4],/\[1,2,1\]|whether 1/)
  assert.match(replies[5],/guest-list idea can work/)
})

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
