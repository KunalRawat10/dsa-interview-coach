/**
 * Phase 0 History Replay Regression Test Suite
 * Verifies that historical learner turns are replayed with their respective ActiveThread snapshots.
 */

import { liteRespond, reconstructMentalModel } from '../src/lib/liteSocratic.ts'
import { extractActiveThread } from '../src/lib/activeThread.ts'
import { PROBLEMS, type Problem } from '../src/data/problems.ts'
import { getActiveGraph } from '../src/lib/problemGraphs.ts'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')!
const twoSum = PROBLEMS.find((p) => p.slug === 'two-sum')!
const containerWater = PROBLEMS.find((p) => p.slug === 'container-with-most-water')!
const binarySearch = PROBLEMS.find((p) => p.slug === 'binary-search')!
const stock = PROBLEMS.find((p) => p.slug === 'best-time-to-buy-and-sell-stock')!

function buildWelcome(problem: Problem) {
  return {
    role: 'assistant' as const,
    content: `**${problem.title}**\n---\nWhere would you like to start? What stands out about the inputs or what the problem is asking for?\n<!--lite:{"current":{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->`,
  }
}

console.log('============================================================')
console.log('PHASE 0: HISTORICAL MENTAL MODEL REPLAY REGRESSION TESTS')
console.log('============================================================\n')

let totalTests = 0
let passedTests = 0

function assert(condition: boolean, name: string, details = '') {
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
// REGRESSION TEST 1: Contextual answer persists across multiple subsequent turns
// ─────────────────────────────────────────────────────────────────────────────

console.log('--- TEST 1: Multi-Turn Persistence of Contextual Answers ---')

let historyCD = [buildWelcome(cdProblem)]

function runTurn(userText: string) {
  const userMsg = { role: 'user' as const, content: userText }
  const nextMessages = [...historyCD, userMsg]
  const fullReply = liteRespond(userMsg.content, cdProblem, nextMessages)
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
  historyCD = [...nextMessages, { role: 'assistant' as const, content: fullReply }]
  const thread = extractActiveThread(historyCD)
  return { visibleReply, fullReply, thread }
}

// Turn 1
runTurn("I'd compare each number with the others.")

// Turn 2
runTurn("Oh because we'd keep checking stuff we've already seen.")

// Turn 3: Contextual answer for target "memory"
const turn3 = runTurn('a number which has occurred previously')
assert(
  turn3.thread.current.targetNodeId === 'set_structure',
  'Turn 3 Target: set_structure (memory answered)',
  `Got: ${turn3.thread.current.targetNodeId}`
)

// Turn 4: User answers set_structure. During replay, Turn 3 is in priorTurns.
const turn4 = runTurn('Use a Set')
assert(
  turn4.thread.current.targetNodeId === 'membership_lookup',
  'Turn 4 Target: membership_lookup (memory remained ARTICULATED during history replay)',
  `Got: ${turn4.thread.current.targetNodeId}`
)

// Verify mental model directly via reconstructMentalModel
const graphCD = getActiveGraph('contains-duplicate')
const { model: modelAfterTurn4 } = reconstructMentalModel(historyCD, 'Use a Set', graphCD, cdProblem)
assert(
  modelAfterTurn4.nodes['memory'].state === 'ARTICULATED',
  'Mental Model after Turn 4: memory node remains ARTICULATED after history replay',
  `Got: ${modelAfterTurn4.nodes['memory'].state}`
)
assert(
  modelAfterTurn4.nodes['set_structure'].state === 'ARTICULATED',
  'Mental Model after Turn 4: set_structure node is ARTICULATED',
  `Got: ${modelAfterTurn4.nodes['set_structure'].state}`
)

// Turn 5: User answers membership_lookup. During replay, Turns 1-4 are in priorTurns.
const turn5 = runTurn('bcs complexity is O(1)')
assert(
  turn5.thread.current.targetNodeId === 'hit_branch',
  'Turn 5 Target: hit_branch (memory and set_structure both preserved in history replay)',
  `Got: ${turn5.thread.current.targetNodeId}`
)

const { model: modelAfterTurn5 } = reconstructMentalModel(historyCD, 'bcs complexity is O(1)', graphCD, cdProblem)
assert(
  modelAfterTurn5.nodes['memory'].state === 'ARTICULATED' &&
  modelAfterTurn5.nodes['set_structure'].state === 'ARTICULATED' &&
  modelAfterTurn5.nodes['membership_lookup'].state === 'ARTICULATED',
  'Mental Model after Turn 5: memory, set_structure, membership_lookup all ARTICULATED'
)

// ─────────────────────────────────────────────────────────────────────────────
// REGRESSION TEST 2: ActiveThread snapshot isolation per turn
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 2: ActiveThread Snapshot Isolation Per Turn ---')

// Construct synthetic history with deliberate target sequence
const syntheticHistory = [
  {
    role: 'assistant' as const,
    content: 'Welcome <!--lite:{"current":{"approachId":"hash-set-canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->',
  },
  { role: 'user' as const, content: 'Compare all pairs' },
  {
    role: 'assistant' as const,
    content: 'What repeats? <!--lite:{"current":{"approachId":"hash-set-canonical","targetNodeId":"repeated_work","cognitiveTask":"EXPLAIN","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
  { role: 'user' as const, content: 'Checking already seen elements repeatedly' },
  {
    role: 'assistant' as const,
    content: 'What to remember? <!--lite:{"current":{"approachId":"hash-set-canonical","targetNodeId":"memory","cognitiveTask":"JUSTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
  { role: 'user' as const, content: 'a number which has occurred previously' },
  {
    role: 'assistant' as const,
    content: 'Which structure? <!--lite:{"current":{"approachId":"hash-set-canonical","targetNodeId":"set_structure","cognitiveTask":"IDENTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
]

const { model: synthModel } = reconstructMentalModel(syntheticHistory, 'Use a Set', graphCD, cdProblem)

assert(synthModel.nodes['brute_force'].state === 'ARTICULATED', 'Synth Replay: brute_force ARTICULATED')
assert(synthModel.nodes['repeated_work'].state === 'ARTICULATED', 'Synth Replay: repeated_work ARTICULATED')
assert(synthModel.nodes['memory'].state === 'ARTICULATED', 'Synth Replay: memory ARTICULATED via historical target snapshot')
assert(synthModel.nodes['set_structure'].state === 'ARTICULATED', 'Synth Replay: set_structure ARTICULATED via current target')

// ─────────────────────────────────────────────────────────────────────────────
// REGRESSION TEST 3: Contextual answer from T3 is NOT evaluated against T4 target
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 3: Negative Control — Contextual Answer is Target-Specific ---')

// If "a number which has occurred previously" had been evaluated under set_structure (T4), it would NOT match set_structure
const badHistoryWhereT3WasSetStructure = [
  {
    role: 'assistant' as const,
    content: 'Which structure? <!--lite:{"current":{"approachId":"hash-set-canonical","targetNodeId":"set_structure","cognitiveTask":"IDENTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
  { role: 'user' as const, content: 'a number which has occurred previously' },
  {
    role: 'assistant' as const,
    content: 'Let us continue <!--lite:{"current":{"approachId":"hash-set-canonical","targetNodeId":"set_structure","cognitiveTask":"IDENTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
]

const { model: badModel } = reconstructMentalModel(badHistoryWhereT3WasSetStructure, 'Use a Set', graphCD, cdProblem)
assert(
  badModel.nodes['memory'].state === 'UNKNOWN',
  'Target specificity: memory remains UNKNOWN when assistant target was set_structure'
)

// ─────────────────────────────────────────────────────────────────────────────
// REGRESSION TEST 4: Determinism & Idempotence of History Replay
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 4: Determinism & Idempotence ---')

const run1 = reconstructMentalModel(historyCD, 'bcs complexity is O(1)', graphCD, cdProblem)
const run2 = reconstructMentalModel(historyCD, 'bcs complexity is O(1)', graphCD, cdProblem)

const nodesEqual = JSON.stringify(run1.model.nodes) === JSON.stringify(run2.model.nodes)
const edgesEqual = JSON.stringify(run1.model.edges) === JSON.stringify(run2.model.edges)
assert(nodesEqual, 'Replay idempotence: node states identical across independent replay runs')
assert(edgesEqual, 'Replay idempotence: edge states identical across independent replay runs')

// ─────────────────────────────────────────────────────────────────────────────
// REGRESSION TEST 5: History Replay on Other Problem Graphs
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 5: Multi-Turn Replay Across Multiple Problem Graphs ---')

// 5A: Two Sum ("the matching partner")
const graphTS = getActiveGraph('two-sum')
const historyTS = [
  {
    role: 'assistant' as const,
    content: 'Welcome <!--lite:{"current":{"approachId":"two-sum-canonical","targetNodeId":"complement_formula","cognitiveTask":"JUSTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
  { role: 'user' as const, content: 'the matching partner' },
  {
    role: 'assistant' as const,
    content: 'What data structure? <!--lite:{"current":{"approachId":"two-sum-canonical","targetNodeId":"map_structure","cognitiveTask":"IDENTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
]
const { model: modelTS } = reconstructMentalModel(historyTS, 'Hash Map', graphTS, twoSum)
assert(modelTS.nodes['complement_formula'].state === 'ARTICULATED', '5A. Two Sum: complement_formula ARTICULATED during history replay')
assert(modelTS.nodes['map_structure'].state === 'ARTICULATED', '5A. Two Sum: map_structure ARTICULATED on current turn')

// 5B: Container With Most Water ("the shorter one")
const graphCW = getActiveGraph('container-with-most-water')
const historyCW = [
  {
    role: 'assistant' as const,
    content: 'Welcome <!--lite:{"current":{"approachId":"container-water-canonical","targetNodeId":"move_shorter_pointer","cognitiveTask":"JUSTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
  { role: 'user' as const, content: 'the shorter one' },
  {
    role: 'assistant' as const,
    content: 'Why? <!--lite:{"current":{"approachId":"container-water-canonical","targetNodeId":"area_formula","cognitiveTask":"EXPLAIN","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->',
  },
]
const { model: modelCW } = reconstructMentalModel(historyCW, 'width * min height', graphCW, containerWater)
assert(modelCW.nodes['move_shorter_pointer'].state === 'ARTICULATED', '5B. Container Water: move_shorter_pointer ARTICULATED during history replay')

// 5C: Binary Search ("the middle")
const graphBS = getActiveGraph('binary-search')
const historyBS = [
  {
    role: 'assistant' as const,
    content: 'Welcome <!--lite:{"current":{"approachId":"binary-search-canonical","targetNodeId":"midpoint_comparison","cognitiveTask":"JUSTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
  { role: 'user' as const, content: 'the middle' },
  {
    role: 'assistant' as const,
    content: 'Next? <!--lite:{"current":{"approachId":"binary-search-canonical","targetNodeId":"binary_decision","cognitiveTask":"IDENTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
]
const { model: modelBS } = reconstructMentalModel(historyBS, 'eliminate half', graphBS, binarySearch)
assert(modelBS.nodes['midpoint_comparison'].state === 'ARTICULATED', '5C. Binary Search: midpoint_comparison ARTICULATED during history replay')

// 5D: Stock ("the lowest price so far")
const graphStock = getActiveGraph('best-time-to-buy-and-sell-stock')
const historyStock = [
  {
    role: 'assistant' as const,
    content: 'Welcome <!--lite:{"current":{"approachId":"stock-running-min-canonical","targetNodeId":"min_price_invariant","cognitiveTask":"JUSTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
  { role: 'user' as const, content: 'the lowest price so far' },
  {
    role: 'assistant' as const,
    content: 'Next? <!--lite:{"current":{"approachId":"stock-running-min-canonical","targetNodeId":"profit_calculation","cognitiveTask":"IDENTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
  },
]
const { model: modelStock } = reconstructMentalModel(historyStock, 'price minus min', graphStock, stock)
assert(modelStock.nodes['min_price_invariant'].state === 'ARTICULATED', '5D. Stock: min_price_invariant ARTICULATED during history replay')

console.log('\n============================================================')
console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
console.log('============================================================')
