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

test('a beginner requesting one action keeps their exact values and gets only one operation', async () => {
  for (const input of ['I have no idea how to keep track of numbers. I have never solved a problem like this. Show me just one small action using [4,7,4].', 'I am stuck. Show me one small action using [-8,0,-8].']) {
    for (const tutor of [generateSmallModelTurn, generateLessonTurn]) {
      const result = await tutor([{role:'user',content:input}],problem,'concepts',noModel)
      const first = input.includes('-8') ? '-8' : '4'
      assert.ok(result.reply.includes(`list is now [${first}]`))
      assert.ok(result.reply.includes(input.includes('-8') ? '[-8,0,-8]' : '[4,7,4]'))
      assert.doesNotMatch(result.reply,/another 1|such as 1|compare each later|matches an earlier|answer is true/)
      assert.equal(result.lesson.complete,false)
      assert.deepEqual(result.lesson.demonstrated,[])
    }
  }
})

test('consecutive walkthrough turns preserve the seen list and next value', async () => {
  for (const tutor of [generateSmallModelTurn, generateLessonTurn]) {
    const history=[]
    const turns=[
      ['I have no idea how to keep track of numbers. I have never solved a problem like this. Show me just one small action using [4,7,4].', /list is now \[4\]/],
      ['I wrote down 4, so my seen list is [4]. The next number is 7. What should I check before writing it down?', /7 is already in your seen list \[4\]/],
      ['My seen list is [4,7]. The next number is 4. What should I check before adding it?', /4 is already in your seen list \[4,7\]/],
    ]
    for (const [content,expected] of turns) {
      history.push({role:'user',content})
      const result=await tutor(history,problem,'concepts',noModel)
      assert.match(result.reply,expected)
      assert.doesNotMatch(result.reply,/another 1|1 and 2|\[1,2,1\]/)
      assert.equal(result.lesson.complete,false)
      history.push({role:'assistant',content:result.reply,lesson:result.lesson})
    }
    assert.match(history.at(-1).content,/matches an earlier occurrence/)
  }
})

test('membership explanations calculate different supplied states without granting mastery', async () => {
  for (const [input,expected] of [['My seen list is []. The next number is -2. What should I check?', /not there/],['My seen list is [-2,0]. The current value is -2. What should I check?',/already there/]]) {
    for (const tutor of [generateSmallModelTurn,generateLessonTurn]) assert.match((await tutor([{role:'user',content:input}],problem,'concepts',noModel)).reply,expected)
  }
})

test('technical Set comparison reaches the model and keeps its answer instead of a definition override', async () => {
  const question='Suppose my seen list contains 1,000 different numbers. To check whether 7 is already there, would an ordinary list need to search through them? How would checking a Set differ? Explain only this comparison, without tracing [4,7,4] again.'
  const answer='An ordinary unsorted list may require up to 1,000 comparisons for one lookup. A hash-based Set typically offers average O(1) membership checks, while a list scan is O(n). That average is not a guarantee that every Set lookup takes constant time.'
  for (const tutor of [generateSmallModelTurn,generateLessonTurn]) {
    let calls=0
    const result=await tutor([{role:'user',content:question}],problem,'concepts',async (_messages,options)=>{
      calls++
      const content=options?.jsonSchema?.properties?.goal ? {goal:false,approach:false,repeat:false,noRepeat:false}
        : options?.responseFormat==='json' ? {reply:answer,taught:['other'],questionConcept:'none',nextAction:'explain',requestedGoal:'unchanged',goalEvidence:''} : answer
      return {choices:[{message:{content:typeof content==='string'?content:JSON.stringify(content)}}]}
    })
    assert.ok(calls>0,'A technical question must reach the model')
    assert.equal(result.reply.replace(/\s+/g,' '),answer)
    assert.doesNotMatch(result.reply,/contains 1 and 2|A Set stores each/)
  }
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
    assert.match(result.reply, /falsely reports a duplicate/)
    assert.match(result.reply, /before adding/)
    assert.equal(result.lesson.complete, false)
  }
})

test('the exact technical order question traces only the first occurrence in both tutors', async () => {
  for (const tutor of [generateSmallModelTurn,generateLessonTurn]) {
    for (const goal of ['concepts','pseudocode']) {
      const result=await tutor([{role:'user',content:'Before writing pseudocode, explain why I must check whether a number is in the Set before adding it. What would go wrong if I added it first? Show only what happens to the first 4 in [4,7,4].'}],problem,goal,noModel)
      assert.match(result.reply,/membership check answers yes/)
      assert.match(result.reply,/no earlier 4 existed/)
      assert.doesNotMatch(result.reply,/until.*second|fail the check/)
      assert.equal(result.lesson.goal,goal)
      assert.equal(result.lesson.complete,false)
    }
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
