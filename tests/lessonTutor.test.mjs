import test from 'node:test'
import assert from 'node:assert/strict'
import { getLessonState, applyLessonPacket, generateLessonTurn, prepareUserTurn, conceptLessonSummary } from '../src/lib/lessonTutor.ts'
import { PROBLEMS } from '../src/data/problems.ts'
const emptyAssessment = { choices: [{ message: { content: JSON.stringify({ goal: false, approach: false, repeat: false, noRepeat: false }) } }] }
const isAssessment = options => options?.jsonSchema?.properties?.goal?.type === 'boolean'
const problem = PROBLEMS.find(item => item.slug === 'contains-duplicate')
const fresh = () => getLessonState([], problem.slug)
const packet = (changes = {}) => ({ reply: 'We can keep the earlier values.', demonstrated: [], taught: [], questionConcept: 'none', nextAction: 'explain', requestedGoal: 'unchanged', goalEvidence: '', ...changes })

test('technical follow-ups survive both new and existing completion, including a repeated question', async () => {
  const question='Suppose my seen list contains 1,000 different numbers. To check whether 7 is already there, would an ordinary list need to search through them? How would checking a Set differ? Explain only this comparison, without tracing [4,7,4] again.'
  const reply='An unsorted list may scan up to 1,000 entries for one lookup. A common hash-based Set offers expected O(1) membership checks on average, without guaranteeing constant time for every lookup.'
  for (const complete of [false,true]) {
    const lesson=fresh()
    lesson.demonstrated=[{concept:'approach',quote:'I keep earlier values and check each arrival'},{concept:'repeat_case',quote:'The last 4 matches the first 4'}]
    lesson.complete=complete
    if(complete) lesson.taught=['no_repeat_case']
    const history=[{role:'assistant',content:'Previous checkpoint.',lesson},{role:'user',content:question},{role:'assistant',content:'An old irrelevant Set definition.',lesson},{role:'user',content:question}]
    const result=await generateLessonTurn(history,problem,'concepts',async (_payload,options)=>isAssessment(options)?emptyAssessment:{choices:[{message:{content:JSON.stringify(packet({reply,taught:['no_repeat_case'],questionConcept:'approach'}))}}]})
    assert.equal(result.reply.replace(/\s+/g,' '),reply)
    assert.doesNotMatch(result.reply,/You can finish|You.ve demonstrated/)
    assert.equal(result.lesson.complete,true)
  }
})

test('a completed example rewrites a premature closing answer to a technical question', async () => {
  const lesson=fresh();lesson.complete=true;lesson.taught=['no_repeat_case']
  lesson.demonstrated=[{concept:'approach',quote:'I record earlier numbers'},{concept:'repeat_case',quote:'The last 4 repeats'}]
  let drafts=0
  const result=await generateLessonTurn([{role:'assistant',content:'Checkpoint complete.',lesson},{role:'user',content:'Explain why searching a list is slower than checking a hash-based Set.'}],problem,'concepts',async (_payload,options)=>{
    if(isAssessment(options))return emptyAssessment
    drafts++
    return {choices:[{message:{content:JSON.stringify(packet(drafts===1?{reply:'You can finish the lesson here.',nextAction:'finish'}:{reply:'A list can require checking every stored value. A hash-based Set typically provides average constant-time membership.'}))}}]}
  })
  assert.equal(drafts,2)
  assert.match(result.reply,/checking every stored value/)
})

test('technical answers cannot equate average constant time to exactly one comparison', async () => {
  let drafts=0
  const result=await generateLessonTurn([{role:'user',content:'Compare membership cost in a list and a Set.'}],problem,'concepts',async (_payload,options)=>{
    if(isAssessment(options))return emptyAssessment
    drafts++
    return {choices:[{message:{content:JSON.stringify(packet({reply:drafts===1?'Checking a Set takes only 1 comparison on average.':'A list may scan all its entries. A hash-based Set offers expected O(1) membership, without a fixed comparison count.'}))}}]}
  })
  assert.equal(drafts,2)
  assert.match(result.reply,/without a fixed comparison count/)
})

test('learning defaults to concepts and mastery requires learner evidence, not teacher statements', () => {
  const messages = [{ role: 'assistant', content: 'Remember earlier values and check for repeats.' }, { role: 'user', content: 'okk' }]
  const next = applyLessonPacket(fresh(), packet({ demonstrated: [{ concept: 'membership', quote: messages[0].content }] }), messages, 'concepts')
  assert.equal(next.goal, 'concepts')
  assert.deepEqual(next.demonstrated, [])
  assert.equal(next.complete, false)
})

test('concept completion distinguishes student demonstrations from the missing case taught directly', () => {
  const content = 'I record earlier numbers, check if the next is already there, and identify the second 1 as a repeat.'
  const next = applyLessonPacket(fresh(), packet({
    demonstrated: ['memory', 'membership', 'repeat_case'].map(concept => ({ concept, quote: content })),
    taught: ['no_repeat_case'],
  }), [{ role: 'user', content }], 'concepts')
  assert.equal(next.complete, true)
  assert.ok(!next.demonstrated.some(item => item.concept === 'no_repeat_case'))
  assert.ok(next.taught.includes('no_repeat_case'))
  assert.equal(next.goal, 'concepts')
})

test('okay is not consent to coding; an explicit request can change the goal', () => {
  const next = applyLessonPacket(fresh(), packet({ requestedGoal: 'code', goalEvidence: 'okk' }), [{ role: 'user', content: 'okk' }], 'concepts')
  assert.equal(next.goal, 'concepts')
  const request = 'I want to practice coding in Python now'
  assert.equal(applyLessonPacket(next, packet({ requestedGoal: 'code', goalEvidence: request }), [{ role: 'user', content: request }], 'concepts').goal, 'code')
})

test('lesson memory survives history serialization and is isolated by problem', () => {
  const lesson = fresh()
  lesson.demonstrated = [{ concept: 'memory', quote: 'I would record the earlier numbers' }]
  const history = JSON.parse(JSON.stringify([{ role: 'assistant', content: 'Useful idea.', lesson }]))
  assert.deepEqual(getLessonState(history, problem.slug), lesson)
  assert.deepEqual(getLessonState(history, 'two-sum').demonstrated, [])
  const restored = getLessonState(history, problem.slug)
  restored.taught.push('goal')
  assert.deepEqual(history[0].lesson.taught, [])
})

test('redundant repeat checks are replaced with a missing teaching step', async () => {
  const lesson = fresh()
  lesson.demonstrated = ['memory','membership','repeat_case'].map(concept => ({ concept, quote: 'I record earlier values and identify 1 as the repeating number' }))
  const messages = [{ role: 'assistant', content: 'You found the repeat.', lesson }, { role: 'user', content: 'I would do the same with 1,2,3,1' }]
  let calls = 0
  const result = await generateLessonTurn(messages, problem, 'concepts', async (_payload, options) => {
    if (isAssessment(options)) return emptyAssessment
    assert.ok(options.jsonSchema)
    calls++
    return { choices: [{ message: { content: JSON.stringify(calls === 1
      ? packet({ reply: 'What happens at the second 1?', questionConcept: 'repeat_case', nextAction: 'check' })
      : packet({ reply: 'You already explained the repeat case. With [4,7,9], all values differ, so the answer is false after checking them all.', taught: ['no_repeat_case'] })) } }] }
  })
  assert.equal(calls, 1)
  assert.match(result.reply, /all values differ/)
  assert.equal(result.lesson.questions.repeat_case, undefined)
})

test('a missing case is explained instead of asking it a second time', async () => {
  const lesson = fresh()
  lesson.questions.no_repeat_case = 1
  const messages = [{ role: 'assistant', content: 'What about [4,7,9]?', lesson }, { role: 'user', content: 'I know the two 1s repeat' }]
  let calls = 0
  const result = await generateLessonTurn(messages, problem, 'concepts', async (_payload, options) => {
    if (isAssessment(options)) return emptyAssessment
    calls++
    return { choices: [{ message: { content: JSON.stringify(calls === 1
      ? packet({ reply: 'What about [4,7,9]?', questionConcept: 'no_repeat_case' })
      : packet({ reply: 'For [4,7,9], none repeats, so we finish with false.', taught: ['no_repeat_case'] })) } }] }
  })
  assert.equal(calls, 1)
  assert.match(result.reply, /finish with false/)
})

test('a concept lesson does not introduce JavaScript after an acknowledgment', async () => {
  const messages = [{ role: 'user', content: 'okk' }]
  let calls = 0
  const result = await generateLessonTurn(messages, problem, 'concepts', async (_payload, options) => {
    if (isAssessment(options)) return emptyAssessment
    calls++
    return { choices: [{ message: { content: JSON.stringify(calls === 1
      ? packet({ reply: "Now let's write code in JavaScript.", nextAction: 'offer_code' })
      : packet({ reply: 'We can stop the concept lesson here; coding is optional.', nextAction: 'finish' })) } }] }
  })
  assert.equal(calls, 1)
  assert.equal(result.lesson.goal, 'concepts')
  assert.doesNotMatch(result.reply, /JavaScript/)
})

test('the response writer cannot grant mastery after only a restatement of the goal', async () => {
  const messages = [{ role: 'user', content: 'the task asks whether numbers repeat' }]
  const result = await generateLessonTurn(messages, problem, 'concepts', async (_payload, options) => ({ choices: [{ message: { content: JSON.stringify(isAssessment(options)
    ? { goal: true, approach: false, repeat: false, noRepeat: false }
    : packet({ demonstrated: ['memory','membership','repeat_case','no_repeat_case'].map(concept => ({ concept, quote: messages[0].content })), taught: ['no_repeat_case'] })) } }] }))
  assert.equal(result.lesson.complete, false)
  assert.deepEqual(result.lesson.demonstrated.map(item => item.concept), ['goal'])
})

test('not writing the repeated value twice is never credited as a distinct case', async () => {
  const result = await generateLessonTurn([{ role: 'user', content: 'I stop as I dont want to repeat the 1' }], problem, 'concepts', async (_payload, options) => ({ choices: [{ message: { content: JSON.stringify(isAssessment(options)
    ? { goal: false, approach: false, repeat: true, noRepeat: true }
    : packet()) } }] }))
  assert.ok(result.lesson.demonstrated.some(item => item.concept === 'repeat_case'))
  assert.ok(!result.lesson.demonstrated.some(item => item.concept === 'no_repeat_case'))
})

test('a finished concept lesson accepts okay without any model call or coding invitation', async () => {
  const lesson = fresh()
  lesson.complete = true
  const result = await generateLessonTurn([{ role: 'assistant', content: 'Concept lesson complete.', lesson }, { role: 'user', content: 'okk' }], problem, 'concepts', async () => { throw new Error('No model call expected') })
  assert.equal(result.attempts, 0)
  assert.match(result.reply, /Coding is optional/)
  assert.doesNotMatch(result.reply, /\?|JavaScript/)
})

test('completion summaries distinguish teaching from demonstrated understanding', () => {
  const lesson = fresh()
  lesson.taught = ['no_repeat_case']
  assert.match(conceptLessonSummary(lesson), /haven't demonstrated that last case/)
  lesson.demonstrated.push({ concept: 'no_repeat_case', quote: 'all values differ, so false after the whole input' })
  assert.doesNotMatch(conceptLessonSummary(lesson), /haven't demonstrated/)
})

test('retrying a technical failure does not duplicate the learner message', () => {
  const messages = [{ role: 'assistant', content: 'Tell me your idea.' }, { role: 'user', content: 'I compare the values' }, { role: 'assistant', content: 'AI failed', replyFailed: true }]
  const retry = prepareUserTurn(messages, 'I compare the values', 'concepts', true)
  assert.equal(retry.filter(item => item.role === 'user').length, 1)
  assert.equal(retry.at(-1).content, 'I compare the values')
  assert.equal(messages.length, 3)
})

test('mentioning a loop is not authorization to change to coding', () => {
  const message = 'I would perform a loop and check if anything is similar to the upcoming number'
  const result = applyLessonPacket(fresh(), packet({ requestedGoal: 'code', goalEvidence: message }), [{ role: 'user', content: message }], 'concepts')
  assert.equal(result.goal, 'concepts')
})

test('a beginner gets an actual comparison instead of being asked to invent an approach', async () => {
  const messages = [{ role: 'user', content: 'I have no idea what an approach even means' }]
  const result = await generateLessonTurn(messages, problem, 'concepts', async () => { throw new Error('No model needed for this prerequisite') })
  assert.match(result.reply, /compare.*4.*7/i)
  assert.match(result.reply, /they differ/)
  assert.equal(result.lesson.complete, false)
  assert.deepEqual(result.lesson.demonstrated, [])
})

test('if the beginner is still stuck, explain the comparison without asking the same check again', async () => {
  const lesson = fresh()
  lesson.questions.repeat_case = 1
  const messages = [{ role: 'assistant', content: 'Compare the two values.', lesson }, { role: 'user', content: 'I still dont know, show me just the first step' }]
  const result = await generateLessonTurn(messages, problem, 'concepts', async () => { throw new Error('No model needed for the worked comparison') })
  assert.match(result.reply, /matching pair/)
  assert.doesNotMatch(result.reply, /\?/)
  assert.equal(result.lesson.questions.repeat_case, 1)
})

test('loop and Set prerequisites do not require programming or grant student mastery', async () => {
  for (const content of ['what is a loop? I dont know coding words', 'i dont know about the set. can u tell me how would we check it']) {
    const result = await generateLessonTurn([{ role: 'user', content }], problem, 'concepts', async () => { throw new Error('No model call needed') })
    assert.match(result.reply, /\d/)
    assert.doesNotMatch(result.reply, /```|function|write.*JavaScript/)
    assert.deepEqual(result.lesson.demonstrated, [])
  }
})

test('a sorting approach is not mislabeled as memory or Set understanding', () => {
  const content = 'I sort the numbers and compare neighbouring values to spot a repeat'
  const next = applyLessonPacket(fresh(), packet({ demonstrated: [
    { concept: 'approach', quote: content }, { concept: 'repeat_case', quote: content },
  ], taught: ['no_repeat_case'] }), [{ role: 'user', content }], 'concepts')
  assert.equal(next.complete, true)
  assert.ok(!next.demonstrated.some(item => item.concept === 'memory'))
  assert.doesNotMatch(conceptLessonSummary(next), /remember earlier values|Set/)
})

test('explicit code requests preserve implementation text and select coding deliberately', async () => {
  const code = '```js\nfunction demo() {\n  return 3.14;\n}\n```'
  const result = await generateLessonTurn([{ role: 'user', content: 'Please show me the complete JavaScript function' }], problem, 'concepts', async (_payload, options) => {
    if (isAssessment(options)) return emptyAssessment
    return { choices: [{ message: { content: JSON.stringify(packet({ reply: code })) } }] }
  })
  assert.equal(result.reply, code)
  assert.equal(result.lesson.goal, 'code')
})

test('concept explanations do not promise an automatic coding stage', async () => {
  const result = await generateLessonTurn([{ role: 'user', content: 'okk' }], problem, 'concepts', async () => ({ choices: [{ message: { content: JSON.stringify(packet({ reply: 'Here is the idea before we write the code. Compare the values to check whether they match.' })) } }] }))
  assert.doesNotMatch(result.reply, /before we write the code/)
  assert.match(result.reply, /Compare the values/)
})

test('other problems do not receive the duplicate-specific curriculum or completion rules', async () => {
  const twoSum = PROBLEMS.find(item => item.slug === 'two-sum')
  let prompt
  const result = await generateLessonTurn([{ role: 'user', content: 'I need two indices that add to the target' }], twoSum, 'concepts', async payload => {
    prompt = payload[0].content
    return { choices: [{ message: { content: 'Yes, we need the positions of two values whose sum is the target.' } }] }
  })
  assert.match(prompt, /Two Sum/)
  assert.doesNotMatch(prompt, /CONCEPT LESSON COMPLETE|ALREADY ASKED CHECKS|LEARNER MESSAGE \(assess/)
  assert.equal(result.lesson.problemSlug, 'two-sum')
  assert.equal(result.lesson.complete, false)
})

test('a different positive example is not treated as a new skill check when the model tags it incorrectly', async () => {
  const lesson = fresh()
  lesson.questions.repeat_case = 1
  const messages = [{ role: 'assistant', content: 'Try [1,2,1].', lesson }, { role: 'user', content: 'I record 1 and 2 and stop at another 1' }]
  const result = await generateLessonTurn(messages, problem, 'concepts', async (_payload, options) => {
    if (isAssessment(options)) return emptyAssessment
    return { choices: [{ message: { content: JSON.stringify(packet({ reply: "Let's try another example: [1,2,3,1].", questionConcept: 'other' })) } }] }
  })
  assert.doesNotMatch(result.reply, /try another example/i)
  assert.match(result.reply, /\[4,7,9\]/)
  assert.equal(result.lesson.questions.no_repeat_case, 1)
})

test('after a distinct-case check has already been asked, teach it instead of assigning it again', async () => {
  const lesson = fresh()
  lesson.questions.no_repeat_case = 1
  const result = await generateLessonTurn([{ role: 'assistant', content: 'What about [4,7,9]?', lesson }, { role: 'user', content: 'I can spot the repeated 1' }], problem, 'concepts', async (_payload, options) => {
    if (isAssessment(options)) return emptyAssessment
    return { choices: [{ message: { content: JSON.stringify(packet({ reply: 'Try [4,7,9] again.', questionConcept: 'other' })) } }] }
  })
  assert.match(result.reply, /finishes with false/)
  assert.doesNotMatch(result.reply, /\?/)
  assert.ok(result.lesson.taught.includes('no_repeat_case'))
})

test('completion preserves the distinction between explained and demonstrated cases without duplicating it', async () => {
  const lesson = fresh()
  lesson.demonstrated = [
    { concept: 'approach', quote: 'I record earlier values and check for a match' },
    { concept: 'repeat_case', quote: 'The last 1 is a repeat' },
  ]
  lesson.questions.no_repeat_case = 1
  const result = await generateLessonTurn([{ role: 'assistant', content: 'What about [4,7,9]?', lesson }, { role: 'user', content: 'The last 1 is a repeat' }], problem, 'concepts', async (_payload, options) => {
    if (isAssessment(options)) return emptyAssessment
    return { choices: [{ message: { content: JSON.stringify(packet({ reply: 'For [4,7,9], every value differs, so false.', taught: ['no_repeat_case'], nextAction: 'finish' })) } }] }
  })
  assert.match(result.reply, /haven't demonstrated that last case/)
  assert.equal((result.reply.match(/\bfalse\b/g) ?? []).length, 1)
})

test('a distinct-case explanation is not appended a second time while removing a repeated exercise', async () => {
  const lesson = fresh()
  lesson.questions.repeat_case = 1
  lesson.questions.no_repeat_case = 1
  const result = await generateLessonTurn([{ role: 'assistant', content: 'We checked both cases.', lesson }, { role: 'user', content: 'I would use a list' }], problem, 'concepts', async (_payload, options) => {
    if (isAssessment(options)) return emptyAssessment
    return { choices: [{ message: { content: JSON.stringify(packet({ reply: 'For [4,7,9], every value differs and the answer is false. Try [1,2,1] again.', questionConcept: 'other' })) } }] }
  })
  assert.equal((result.reply.match(/\bfalse\b/g) ?? []).length, 1)
  assert.doesNotMatch(result.reply, /Try/)
})
