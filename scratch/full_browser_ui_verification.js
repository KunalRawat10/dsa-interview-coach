/**
 * Comprehensive Real UI End-to-End Simulation & Verification Suite
 */

import { liteRespond, evaluateDialogueStep } from '../src/lib/liteSocratic.js'
import { extractActiveThread, serializeActiveThread } from '../src/lib/activeThread.js'
import { PROBLEMS } from '../src/data/problems.js'
import { getActiveGraph } from '../src/lib/problemGraphs.js'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')
const twoSum = PROBLEMS.find((p) => p.slug === 'two-sum')
const containerWater = PROBLEMS.find((p) => p.slug === 'container-with-most-water')
const binarySearch = PROBLEMS.find((p) => p.slug === 'binary-search')

// Emulate WebLLMChat.tsx buildProblemWelcome
function buildProblemWelcome(problem) {
  const exampleText = problem.examples
    .slice(0, 2)
    .map((e, i) => `Example ${i + 1}: ${e.input} → ${e.output}${e.note ? ` (${e.note})` : ''}`)
    .join('\n')

  return {
    role: 'assistant',
    content: `**${problem.title}** (${problem.difficulty} · ${problem.category})\n\n${problem.description}\n\n\`\`\`\n${exampleText}\n\`\`\`\n\nConstraints: ${problem.constraints.join(', ')}\n\n---\nWhere would you like to start? What stands out about the inputs or what the problem is asking for?\n<!--lite:{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING","returnStack":[]}-->`,
  }
}

console.log('============================================================')
console.log('REAL UI FLOW & ACTIVETHREAD PERSISTENCE VERIFICATION')
console.log('============================================================\n')

let allPassed = true

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`)
  } else {
    console.error(`[FAIL] ${testName}`)
    if (details) console.error(`       Details: ${details}`)
    allPassed = false
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1, 2, 3, 4, 5: Turn-by-Turn React State Cycle
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- EXECUTING TEST 1-5: Turn-by-Turn React State Cycle ---')

let messages = [buildProblemWelcome(cdProblem)]

function stepUI(userText, expectedSubstring, label) {
  const userMsg = { role: 'user', content: userText }
  const nextMessages = [...messages, userMsg]

  const fullReply = liteRespond(userMsg.content, cdProblem, nextMessages)
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()

  // Update messages state exactly as WebLLMChat.tsx does
  messages = [...nextMessages, { role: 'assistant', content: fullReply }]

  // Verify ActiveThread persistence
  const thread = extractActiveThread(messages)
  const containsWelcome = visibleReply.includes('Where would you like to start?')

  console.log(`\nTurn: "${userText}"`)
  console.log(`Visible Coach: "${visibleReply}"`)
  console.log(`Extracted ActiveThread: ${JSON.stringify(thread.current)}`)

  assert(!containsWelcome, `${label} — Does NOT repeat initial welcome question`)
  if (expectedSubstring) {
    assert(
      visibleReply.toLowerCase().includes(expectedSubstring.toLowerCase()),
      `${label} — Contains expected cognitive prompt: "${expectedSubstring}"`,
      `Got: "${visibleReply}"`
    )
  }
  return { visibleReply, thread }
}

// Turn 1
const t1 = stepUI("I'd compare each number with the others.", 'quadratically', 'Turn 1: Pairwise brute force')

// Turn 2
const t2 = stepUI('O(n²)', 'work for four elements', 'Turn 2: Quadratic growth')

// Turn 3
const t3 = stepUI("We keep checking numbers we've already checked.", 'What could we remember', 'Turn 3: Redundant scan bottleneck')

// Turn 4
const t4 = stepUI("The numbers we've already seen.", 'What kind of structure', 'Turn 4: Seen memory to Set')

// Turn 5
const t5 = stepUI('Use a Set', 'Why does a Set help', 'Turn 5: Set structure')

// Turn 6
const t6 = stepUI("Because checking if it's in a Set is O(1)", 'NOT in the Set', 'Turn 6: Set lookup to miss branch')

// Turn 7
const t7 = stepUI('Add it to the set', 'already in the Set', 'Turn 7: Miss branch to hit branch')

// Turn 8
const t8 = stepUI('Return true because we found a duplicate', 'end of the array', 'Turn 8: Hit branch to termination')

// Turn 9
const t9 = stepUI('Return false', 'Can you write', 'Turn 9: Termination to code implementation')

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Previous Failure with Learner Question Interrupt
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- EXECUTING TEST 7: Interruption & Return Stack ---')

let qMessages = [buildProblemWelcome(cdProblem)]

function stepQ(userText) {
  const userMsg = { role: 'user', content: userText }
  const nextMessages = [...qMessages, userMsg]
  const fullReply = liteRespond(userMsg.content, cdProblem, nextMessages)
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
  qMessages = [...nextMessages, { role: 'assistant', content: fullReply }]
  return visibleReply
}

const qR1 = stepQ("I'd compare each number with the others.")
assert(!qR1.includes('Where would you like to start?'), 'Test 7 Turn 1: New response')

const qR2 = stepQ('I think it would be O(n²).')
assert(qR2.includes('3 + 2 + 1'), 'Test 7 Turn 2: Anchors fragile knowledge')

const qR3 = stepQ('Why is it n²?')
assert(qR3.includes('quadratic') || qR3.includes('pairs with'), 'Test 7 Turn 3: Answers learner question')

const qR4 = stepQ("Oh because we'd keep checking stuff we've already seen.")
assert(qR4.includes('remember') || qR4.includes('avoid'), 'Test 7 Turn 4: Resumes thread toward memory optimization')

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: Secondary Cases (A - J)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- EXECUTING TEST 8: Secondary Cases ---')

function evalSingleTurn(userText, problem = cdProblem) {
  const initial = [buildProblemWelcome(problem)]
  const userMsg = { role: 'user', content: userText }
  const nextMessages = [...initial, userMsg]
  const reply = liteRespond(userText, problem, nextMessages)
  return reply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
}

// Case A: "I'd compare every number against the others."
const caseA = evalSingleTurn("I'd compare every number against the others.")
assert(!caseA.includes('Where would you like to start?'), 'Case A: compare every number against the others')

// Case B: "I'd use nested loops."
const caseB = evalSingleTurn("I'd use nested loops.")
assert(!caseB.includes('Where would you like to start?'), 'Case B: nested loops')

// Case C: "I'd probably just look at the numbers."
const caseC = evalSingleTurn("I'd probably just look at the numbers.")
assert(!caseC.includes('Where would you like to start?'), 'Case C: look at the numbers')

// Case D: "O(n)"
const caseD = evalSingleTurn('O(n)')
assert(!caseD.includes('Where would you like to start?'), 'Case D: O(n)')

// Case E: "I think O(n²)"
const caseE = evalSingleTurn('I think O(n²)')
assert(!caseE.includes('Where would you like to start?'), 'Case E: I think O(n²)')

// Case F: "I don't know"
const caseF = evalSingleTurn("I don't know")
assert(!caseF.includes('Where would you like to start?'), 'Case F: I don\'t know')

// Case G: "Use a Set"
const caseG = evalSingleTurn('Use a Set')
assert(caseG.includes('Set'), 'Case G: Use a Set')

// Case H: "I'd use a Set because it sorts the numbers."
const caseH = evalSingleTurn("I'd use a Set because it sorts the numbers.")
assert(caseH.includes('doesn\'t sort') || caseH.includes('sort'), 'Case H: Misconception correction for Set sorting')

// Case I: "Actually maybe sorting would be easier."
const caseI = evalSingleTurn('Actually maybe sorting would be easier.')
assert(caseI.includes('Sorting') || caseI.includes('tradeoff'), 'Case I: Explore sorting alternative')

// Case J: Jump ahead full algorithm
const caseJ = evalSingleTurn("I'd create a Set, loop through the array, check if the number exists, return true if it does, otherwise add it, and return false at the end.")
assert(caseJ.includes('code') || caseJ.includes('write'), 'Case J: Jump ahead triggers offer code implementation')

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9: Multi-Problem Generalization (Two Sum, Container Water, Binary Search)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- EXECUTING TEST 9: Other Problem Graphs ---')

// Two Sum
const ts1 = evalSingleTurn('Check every pair to see if they add to target.', twoSum)
assert(!ts1.includes('Where would you like to start?'), 'Two Sum Turn 1: Pairwise check recognized')
assert(ts1.toLowerCase().includes('search') || ts1.toLowerCase().includes('repeatedly') || ts1.toLowerCase().includes('complement') || ts1.toLowerCase().includes('partner'), 'Two Sum Turn 1: Probes partner search bottleneck')

// Container With Most Water
const cw1 = evalSingleTurn("I'd try every pair of lines.", containerWater)
assert(!cw1.includes('Where would you like to start?'), 'Container Water Turn 1: Pairwise lines recognized')
assert(cw1.includes('bottleneck') || cw1.includes('shorter') || cw1.includes('line') || cw1.includes('area') || cw1.includes('work'), 'Container Water Turn 1: Probes area formula or pointers')

// Binary Search
const bs1 = evalSingleTurn('Linear scan from beginning to end.', binarySearch)
assert(!bs1.includes('Where would you like to start?'), 'Binary Search Turn 1: Linear scan recognized')

console.log('\n============================================================')
if (allPassed) {
  console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY (100%)')
} else {
  console.error('SOME VERIFICATION TESTS FAILED')
}
console.log('============================================================')
