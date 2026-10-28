import test from 'node:test'
import solveDemo from '../docs/demo/contains-duplicate.js'
import assert from 'node:assert/strict'
import { buildChatHistoryPayload, generateTutorReply } from '../src/lib/conversationalTutor.ts'
import { executeFullAITurnSafe, setDialogueEvaluatorAsyncForTesting } from '../src/components/WebLLMChat.tsx'
import { PROBLEMS } from '../src/data/problems.ts'
import { CONTAINS_DUPLICATE_CANONICAL as graph } from '../src/lib/problemGraphs.ts'
import { createInitialMentalModel } from '../src/lib/mentalModel.ts'
import { planPedagogicalAction } from '../src/lib/pedagogicalPlanner.ts'
import { getDefaultActiveThread } from '../src/lib/activeThread.ts'
import { interpretLearnerMessage } from '../src/lib/socraticInterpreter.ts'
import { renderSocraticResponse } from '../src/lib/socraticRenderer.ts'

const problem = PROBLEMS.find(p => p.slug === 'contains-duplicate')

test('AI receives informal explanations, interruptions and code in order without planner metadata', async () => {
  const messages = [
    { role: 'assistant', content: 'Welcome <!--lite:{"current":{"targetNodeId":"goal"}}-->' },
    { role: 'user', content: 'id keep a guest list of numbers ive met lol' },
    { role: 'assistant', content: 'A Set can store those earlier values.' },
    { role: 'user', content: 'wait whats a set? explain like im new' },
    { role: 'assistant', content: 'A collection where each value appears only once.' },
    { role: 'user', content: 'could i sort and look at neighbours instead?' },
    { role: 'assistant', content: 'Yes. Sorting puts equal values beside each other.' },
    { role: 'user', content: 'please show the whole js solution and walk me through [4,7,4]' },
  ]
  let evaluatorCalls = 0
  setDialogueEvaluatorAsyncForTesting(async () => { evaluatorCalls++; throw new Error('Matcher unavailable') })
  let received
  const result = await executeFullAITurnSafe({
    userText: messages.at(-1).content, problem, messages,
    createCompletion: async payload => {
      received = payload
      return { choices: [{ message: { content: JSON.stringify({ reply: 'Here is the walkthrough.', demonstrated: [], taught: [], questionConcept: 'none', nextAction: 'explain', requestedGoal: 'unchanged', goalEvidence: '' }) } }] }
    },
  })
  setDialogueEvaluatorAsyncForTesting(null)
  assert.equal(evaluatorCalls, 0, 'language generation must not depend on matcher success')
  assert.deepEqual(received.slice(1), messages.slice(1))
  assert.equal(result.usedFallback, false)
  assert.equal(result.finalContent, 'Here is the walkthrough.')
  assert.ok(!JSON.stringify(received).includes('<!--lite:'))
})

test('history retains reasoning from more than three exchanges and always the latest turn', () => {
  const messages = Array.from({ length: 16 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `turn ${i}` }))
  messages.push({ role: 'user', content: 'What about my earlier idea?' })
  const payload = buildChatHistoryPayload('teacher', messages)
  assert.deepEqual(payload.slice(1), messages)
  const huge = 'x'.repeat(16000)
  assert.deepEqual(buildChatHistoryPayload('teacher', [...messages, { role: 'user', content: huge }]).slice(1), [{ role: 'user', content: huge }])
})

test('streaming returns assembled response and rejects empty answers and partial failures', async () => {
  const updates = []
  const result = await generateTutorReply([], async () => (async function* () {
    yield { choices: [{ delta: { content: 'A Set ' } }] }
    yield { choices: [{ delta: { content: 'remembers earlier values.' } }] }
  })(), text => updates.push(text))
  assert.equal(result, 'A Set remembers earlier values.')
  assert.equal(updates.at(-1), result)
  await assert.rejects(generateTutorReply([], async () => ({ choices: [] })), /empty answer/)
  await assert.rejects(generateTutorReply([], async () => (async function* () {
    yield { choices: [{ delta: { content: 'unfinished' } }] }
    throw new Error('GPU disconnected')
  })()), /GPU disconnected/)
})

test('AI failure is explicit and never silently returns a rigid Lite question', async () => {
  const result = await executeFullAITurnSafe({
    userText: 'what does duplicate mean?', problem,
    messages: [{ role: 'user', content: 'what does duplicate mean?' }],
    createCompletion: async () => { throw new Error('GPU failed') },
  })
  assert.equal(result.usedFallback, true)
  assert.match(result.finalContent, /could not finish/)
  assert.doesNotMatch(result.finalContent, /what stands out|Excellent work/)
})

test('explaining the final return and being asked for code do not count as a code submission', () => {
  const model = createInitialMentalModel(graph)
  for (const n of graph.nodes) model.nodes[n.id] = { state: 'ARTICULATED', recognition: 1, causalUnderstanding: 1, confidence: 'SOLID', evidence: ['explanation'] }
  const thread = getDefaultActiveThread()
  thread.current.pedagogicalAction = 'OFFER_CODE_IMPLEMENTATION'
  const interpretation = interpretLearnerMessage('If nothing repeats we finish with a negative result', problem, thread, graph)
  assert.equal(interpretLearnerMessage('If I finish the loop, return false.', problem, thread, graph).hasCode, false)
  interpretation.hasCode = false
  const decision = planPedagogicalAction(model, thread, interpretation, graph)
  assert.equal(decision.cognitiveTask, 'IMPLEMENT')
  const rendered = renderSocraticResponse(decision.action, decision.cognitiveTask, decision.targetNode, decision.targetEdge, interpretation, problem, graph, true)
  assert.doesNotMatch(rendered, /complete implementation|Excellent work|satisfying/)
  interpretation.hasCode = true
  const submitted = planPedagogicalAction(model, thread, interpretation, graph)
  const review = renderSocraticResponse(submitted.action, submitted.cognitiveTask, submitted.targetNode, submitted.targetEdge, interpretation, problem, graph)
  assert.match(review, /not been executed or verified/)
})

test('Contains Duplicate demonstration algorithm passes diverse cases and matches a pairwise oracle', () => {
  const solve = solveDemo
  const oracle = nums => nums.some((x, i) => nums.slice(i + 1).includes(x))
  const cases = [[4,7,4], [4,7,9], [0], [-1,0,-1], [1,1], [1,2,3,4,1], [1000000000,-1000000000]]
  for (let n = 1; n < 80; n++) cases.push(Array.from({ length: n }, (_, i) => (i * 17 + n) % 31))
  for (const nums of cases) assert.equal(solve(nums), oracle(nums), JSON.stringify(nums))
})
