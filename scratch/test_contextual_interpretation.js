/**
 * Contextual Interpretation & Regression Verification Test Suite
 */

import { liteRespond, evaluateDialogueStep, reconstructMentalModel } from '../src/lib/liteSocratic.js'
import { interpretLearnerMessage } from '../src/lib/socraticInterpreter.js'
import { extractActiveThread } from '../src/lib/activeThread.js'
import { PROBLEMS } from '../src/data/problems.js'
import { getActiveGraph } from '../src/lib/problemGraphs.js'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')
const twoSum = PROBLEMS.find((p) => p.slug === 'two-sum')
const stock = PROBLEMS.find((p) => p.slug === 'best-time-to-buy-and-sell-stock')
const validParens = PROBLEMS.find((p) => p.slug === 'valid-parentheses')
const containerWater = PROBLEMS.find((p) => p.slug === 'container-with-most-water')
const binarySearch = PROBLEMS.find((p) => p.slug === 'binary-search')

function buildWelcome(problem) {
  return {
    role: 'assistant',
    content: `**${problem.title}**\n---\nWhere would you like to start? What stands out about the inputs or what the problem is asking for?\n<!--lite:{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING","returnStack":[]}-->`,
  }
}

console.log('============================================================')
console.log('CONTEXTUAL INTERPRETATION & REGRESSION TEST SUITE')
console.log('============================================================\n')

let totalTests = 0
let passedTests = 0

function assert(condition, name, details = '') {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`[PASS] ${name}`)
  } else {
    console.error(`[FAIL] ${name}`)
    if (details) console.error(`       Details: ${details}`)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Exact Production Failure Flow
// ─────────────────────────────────────────────────────────────────────────────

console.log('--- TEST 1: Exact Production Failure Flow ---')

let messages = [buildWelcome(cdProblem)]

function runTurn(userText) {
  const userMsg = { role: 'user', content: userText }
  const nextMessages = [...messages, userMsg]
  const fullReply = liteRespond(userMsg.content, cdProblem, nextMessages)
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
  messages = [...nextMessages, { role: 'assistant', content: fullReply }]
  const thread = extractActiveThread(messages)
  return { visibleReply, thread }
}

// Turn 1
const turn1 = runTurn("I'd compare each number with the others.")
assert(
  turn1.visibleReply.includes('repeatedly searching') || turn1.visibleReply.includes('avoid'),
  'Turn 1: Advanced to repeated work bottleneck',
  turn1.visibleReply
)

// Turn 2
const turn2 = runTurn("Oh because we'd keep checking stuff we've already seen.")
assert(
  turn2.visibleReply.includes('What could we remember'),
  'Turn 2: Advanced to memory question',
  turn2.visibleReply
)
assert(turn2.thread.current.targetNodeId === 'memory', 'Turn 2 Target: memory')

// Turn 3: Exact Recorded Failure Utterance
const turn3 = runTurn('a number which has occurred')
assert(
  turn3.visibleReply.includes('structure') || turn3.visibleReply.includes('Set'),
  'Turn 3: Recognized "a number which has occurred" and advanced to Set structure',
  turn3.visibleReply
)
assert(
  turn3.thread.current.targetNodeId === 'set_structure',
  'Turn 3 Target: set_structure (NOT memory!)',
  `Got: ${turn3.thread.current.targetNodeId}`
)

// Turn 4: Another elliptical answer on Set
const turn4 = runTurn('Use a Set')
assert(
  turn4.visibleReply.includes('Why does a Set') || turn4.visibleReply.includes('lookup'),
  'Turn 4: Advanced to Set membership lookup',
  turn4.visibleReply
)

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Exact Recorded Failure Utterance B ("a number which has occurred previously")
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 2: Failure Variant B ("a number which has occurred previously") ---')

let messagesB = [buildWelcome(cdProblem)]
function runTurnB(userText) {
  const userMsg = { role: 'user', content: userText }
  const nextMessages = [...messagesB, userMsg]
  const fullReply = liteRespond(userMsg.content, cdProblem, nextMessages)
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
  messagesB = [...nextMessages, { role: 'assistant', content: fullReply }]
  const thread = extractActiveThread(messagesB)
  return { visibleReply, thread }
}

runTurnB("I'd compare each number with the others.")
runTurnB("Oh because we'd keep checking stuff we've already seen.")
const turn3B = runTurnB('a number which has occurred previously')

assert(
  turn3B.visibleReply.includes('structure') || turn3B.visibleReply.includes('Set'),
  'Test 2: "a number which has occurred previously" advanced to Set structure',
  turn3B.visibleReply
)
assert(
  !turn3B.visibleReply.includes('What could we remember while scanning so we don\'t have to start that search again?'),
  'Test 2: Memory question NOT repeated'
)

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Elliptical Answers Across All Other Problem Graphs
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 3: Elliptical Answers Across All Graphs ---')

// 3A. Contains Duplicate: "the ones we've already seen"
const graphCD = getActiveGraph('contains-duplicate')
const threadMemory = {
  current: {
    approachId: 'hash-set-canonical',
    targetNodeId: 'memory',
    targetEdgeId: 'bottleneck_to_memory',
    cognitiveTask: 'JUSTIFY',
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP',
  },
  returnStack: [],
}
const interpCD = interpretLearnerMessage("the ones we've already seen", cdProblem, threadMemory, graphCD)
assert(interpCD.touchedNodeIds.includes('memory'), '3A. Contains Duplicate: "the ones we\'ve already seen" matches memory')

// 3B. Two Sum: "the matching partner" when target is complement_formula
const graphTS = getActiveGraph('two-sum')
const threadComplement = {
  current: {
    approachId: 'two-sum-canonical',
    targetNodeId: 'complement_formula',
    targetEdgeId: 'bottleneck_to_complement',
    cognitiveTask: 'JUSTIFY',
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP',
  },
  returnStack: [],
}
const interpTS1 = interpretLearnerMessage('the matching partner', twoSum, threadComplement, graphTS)
assert(interpTS1.touchedNodeIds.includes('complement_formula'), '3B. Two Sum: "the matching partner" matches complement_formula')

const interpTS2 = interpretLearnerMessage('target minus x', twoSum, threadComplement, graphTS)
assert(interpTS2.touchedNodeIds.includes('complement_formula'), '3C. Two Sum: "target minus x" matches complement_formula')

// 3D. Container With Most Water: "the shorter one" when target is move_shorter_pointer
const graphCW = getActiveGraph('container-with-most-water')
const threadPointers = {
  current: {
    approachId: 'container-water-canonical',
    targetNodeId: 'move_shorter_pointer',
    targetEdgeId: 'pointers_to_movement',
    cognitiveTask: 'JUSTIFY',
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP',
  },
  returnStack: [],
}
const interpCW = interpretLearnerMessage('the shorter one', containerWater, threadPointers, graphCW)
assert(interpCW.touchedNodeIds.includes('move_shorter_pointer'), '3D. Container Water: "the shorter one" matches move_shorter_pointer')

// 3E. Binary Search: "the middle" when target is midpoint_comparison
const graphBS = getActiveGraph('binary-search')
const threadMid = {
  current: {
    approachId: 'binary-search-canonical',
    targetNodeId: 'midpoint_comparison',
    targetEdgeId: 'sorted_to_mid',
    cognitiveTask: 'JUSTIFY',
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP',
  },
  returnStack: [],
}
const interpBS = interpretLearnerMessage('the middle', binarySearch, threadMid, graphBS)
assert(interpBS.touchedNodeIds.includes('midpoint_comparison'), '3E. Binary Search: "the middle" matches midpoint_comparison')

// 3F. Stock: "the lowest price so far" when target is min_price_invariant
const graphStock = getActiveGraph('best-time-to-buy-and-sell-stock')
const threadStock = {
  current: {
    approachId: 'stock-running-min-canonical',
    targetNodeId: 'min_price_invariant',
    targetEdgeId: 'bottleneck_to_min_price',
    cognitiveTask: 'JUSTIFY',
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP',
  },
  returnStack: [],
}
const interpStock = interpretLearnerMessage('the lowest price so far', stock, threadStock, graphStock)
assert(interpStock.touchedNodeIds.includes('min_price_invariant'), '3F. Stock: "the lowest price so far" matches min_price_invariant')

// 3G. Valid Parentheses: "the most recent opening bracket" when target is lifo_requirement
const graphVP = getActiveGraph('valid-parentheses')
const threadVP = {
  current: {
    approachId: 'valid-parentheses-canonical',
    targetNodeId: 'lifo_requirement',
    cognitiveTask: 'EXPLAIN',
    pedagogicalAction: 'DEEPEN_PARTIAL_REASONING',
  },
  returnStack: [],
}
const interpVP = interpretLearnerMessage('the most recent opening bracket', validParens, threadVP, graphVP)
assert(interpVP.touchedNodeIds.includes('lifo_requirement'), '3G. Valid Parentheses: "the most recent opening bracket" matches lifo_requirement')

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Negative Controls (Must NOT Falsely Match)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 4: Negative Controls (Preventing False Matches) ---')

// 4A. "the previous implementation was slow" when target is memory
const neg1 = interpretLearnerMessage('the previous implementation was slow', cdProblem, threadMemory, graphCD)
assert(neg1.touchedNodeIds.length === 0, '4A. Negative Control: "the previous implementation was slow" does NOT touch memory')

// 4B. "the previous question" when target is memory
const neg2 = interpretLearnerMessage('the previous question was confusing', cdProblem, threadMemory, graphCD)
assert(neg2.touchedNodeIds.length === 0, '4B. Negative Control: "the previous question was confusing" does NOT touch memory')

// 4C. "a number which occurred previously" when target is set_structure (asking for data structure)
const threadSet = {
  current: {
    approachId: 'hash-set-canonical',
    targetNodeId: 'set_structure',
    targetEdgeId: 'memory_to_set',
    cognitiveTask: 'IDENTIFY',
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP',
  },
  returnStack: [],
}
const neg3 = interpretLearnerMessage('a number which occurred previously', cdProblem, threadSet, graphCD)
assert(!neg3.touchedNodeIds.includes('set_structure'), '4C. Negative Control: "a number which occurred previously" does NOT touch set_structure')

// 4D. "the shorter one" when target is brute_force in Contains Duplicate
const threadCDBrute = {
  current: {
    approachId: 'hash-set-canonical',
    targetNodeId: 'brute_force',
    cognitiveTask: 'EXPLAIN',
    pedagogicalAction: 'DEEPEN_PARTIAL_REASONING',
  },
  returnStack: [],
}
const neg4 = interpretLearnerMessage('the shorter one', cdProblem, threadCDBrute, graphCD)
assert(neg4.touchedNodeIds.length === 0, '4D. Negative Control: "the shorter one" in Contains Duplicate does NOT touch any node')

console.log('\n============================================================')
console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
console.log('============================================================')
