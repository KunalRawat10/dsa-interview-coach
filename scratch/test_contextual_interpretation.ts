/**
 * Contextual Interpretation & Regression Verification Test Suite
 */

import { liteRespond } from '../src/lib/liteSocratic.ts'
import { interpretLearnerMessage } from '../src/lib/socraticInterpreter.ts'
import { createInitialMentalModel, applyInterpretationDelta } from '../src/lib/mentalModel.ts'
import { planPedagogicalAction } from '../src/lib/pedagogicalPlanner.ts'
import { extractActiveThread } from '../src/lib/activeThread.ts'
import { PROBLEMS, type Problem } from '../src/data/problems.ts'
import { getActiveGraph } from '../src/lib/problemGraphs.ts'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')!
const twoSum = PROBLEMS.find((p) => p.slug === 'two-sum')!
const stock = PROBLEMS.find((p) => p.slug === 'best-time-to-buy-and-sell-stock')!
const validParens = PROBLEMS.find((p) => p.slug === 'valid-parentheses')!
const containerWater = PROBLEMS.find((p) => p.slug === 'container-with-most-water')!
const binarySearch = PROBLEMS.find((p) => p.slug === 'binary-search')!

function buildWelcome(problem: Problem) {
  return {
    role: 'assistant' as const,
    content: `**${problem.title}**\n---\nWhere would you like to start? What stands out about the inputs or what the problem is asking for?\n<!--lite:{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING","returnStack":[]}-->`,
  }
}

console.log('============================================================')
console.log('CONTEXTUAL INTERPRETATION & REGRESSION TEST SUITE')
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
// TEST 1: Exact Production Failure Flow
// ─────────────────────────────────────────────────────────────────────────────

console.log('--- TEST 1: Exact Production Failure Flow ---')

let messages = [buildWelcome(cdProblem)]

function runTurn(userText: string) {
  const userMsg = { role: 'user' as const, content: userText }
  const nextMessages = [...messages, userMsg]
  const fullReply = liteRespond(userMsg.content, cdProblem, nextMessages)
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
  messages = [...nextMessages, { role: 'assistant' as const, content: fullReply }]
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

// Turn 5: Production User Utterance A ("bcs complexity is O(1)")
const turn5 = runTurn('bcs complexity is O(1)')
assert(
  turn5.visibleReply.includes('already in the Set') || turn5.visibleReply.includes('already in it') || turn5.thread.current.targetNodeId === 'hit_branch',
  'Turn 5: "bcs complexity is O(1)" advanced to hit_branch',
  turn5.visibleReply
)
assert(
  !turn5.visibleReply.includes('Why does a Set help us avoid repeatedly searching through the array?'),
  'Turn 5: Set lookup question NOT repeated'
)

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Exact Recorded Failure Utterance B ("a number which has occurred previously")
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 2: Failure Variant B ("a number which has occurred previously") ---')

let messagesB = [buildWelcome(cdProblem)]
function runTurnB(userText: string) {
  const userMsg = { role: 'user' as const, content: userText }
  const nextMessages = [...messagesB, userMsg]
  const fullReply = liteRespond(userMsg.content, cdProblem, nextMessages)
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
  messagesB = [...nextMessages, { role: 'assistant' as const, content: fullReply }]
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

const turn4B = runTurnB('Use a Set')
const turn5B = runTurnB('Because Set lookup is constant time.')

assert(
  turn5B.visibleReply.includes('already in the Set') || turn5B.visibleReply.includes('already in it') || turn5B.thread.current.targetNodeId === 'hit_branch',
  'Test 2 Turn 5B: "Because Set lookup is constant time." advanced to hit_branch',
  turn5B.visibleReply
)
assert(
  !turn5B.visibleReply.includes('Why does a Set help us avoid repeatedly searching through the array?'),
  'Test 2 Turn 5B: Set lookup question NOT repeated'
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
    cognitiveTask: 'JUSTIFY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
  },
  returnStack: [],
}
const interpCD = interpretLearnerMessage("the ones we've already seen", cdProblem, threadMemory, graphCD)
assert(interpCD.touchedNodeIds.includes('memory'), '3A. Contains Duplicate: "the ones we\'ve already seen" matches memory')
assert(interpCD.touchedEdgeIds.length === 0, '3A. Contains Duplicate: "the ones we\'ve already seen" does NOT touch bottleneck_to_memory')

let model3A = createInitialMentalModel(graphCD)
model3A.nodes['brute_force'].state = 'ARTICULATED'
model3A.nodes['repeated_work'].state = 'ARTICULATED'
model3A = applyInterpretationDelta(model3A, interpCD, graphCD)
assert(model3A.nodes['memory'].state === 'ARTICULATED', '3A. Contains Duplicate: memory state is ARTICULATED')
assert(model3A.edges['bottleneck_to_memory'].state === 'UNCLAIMED', '3A. Contains Duplicate: bottleneck_to_memory remains UNCLAIMED')

// 3B. Two Sum: "the matching partner" when target is complement_formula
const graphTS = getActiveGraph('two-sum')
const threadComplement = {
  current: {
    approachId: 'two-sum-canonical',
    targetNodeId: 'complement_formula',
    targetEdgeId: 'bottleneck_to_complement',
    cognitiveTask: 'JUSTIFY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
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
    cognitiveTask: 'JUSTIFY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
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
    cognitiveTask: 'JUSTIFY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
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
    cognitiveTask: 'JUSTIFY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
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
    cognitiveTask: 'EXPLAIN' as const,
    pedagogicalAction: 'DEEPEN_PARTIAL_REASONING' as const,
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
    cognitiveTask: 'IDENTIFY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
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
    cognitiveTask: 'EXPLAIN' as const,
    pedagogicalAction: 'DEEPEN_PARTIAL_REASONING' as const,
  },
  returnStack: [],
}
const neg4 = interpretLearnerMessage('the shorter one', cdProblem, threadCDBrute, graphCD)
assert(!neg4.touchedNodeIds.includes('brute_force'), '4D. Negative Control: "the shorter one" does NOT touch brute_force in Contains Duplicate')

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Membership Lookup (O(1) / Constant Time) 10-Test Semantic Audit Suite
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 5: Membership Lookup (O(1) / Constant Time) Semantic Audit ---')

const threadLookup = {
  current: {
    approachId: 'hash-set-canonical',
    targetNodeId: 'membership_lookup',
    targetEdgeId: 'set_to_lookup',
    cognitiveTask: 'JUSTIFY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
  },
  returnStack: [],
}

// TEST 1: Active target = membership_lookup, "bcs complexity is O(1)"
const interp5_1 = interpretLearnerMessage('bcs complexity is O(1)', cdProblem, threadLookup, graphCD)
assert(interp5_1.touchedNodeIds.includes('membership_lookup'), 'TEST 1: "bcs complexity is O(1)" touches membership_lookup')
assert(interp5_1.touchedEdgeIds.length === 0, 'TEST 1: "bcs complexity is O(1)" does NOT touch set_to_lookup')
let model5_1 = createInitialMentalModel(graphCD)
model5_1.nodes['set_structure'].state = 'ARTICULATED'
model5_1 = applyInterpretationDelta(model5_1, interp5_1, graphCD)
assert(model5_1.nodes['membership_lookup'].state === 'ARTICULATED', 'TEST 1: membership_lookup becomes ARTICULATED')
assert(model5_1.edges['set_to_lookup'].state === 'UNCLAIMED', 'TEST 1: set_to_lookup remains UNCLAIMED')
const decision5_1 = planPedagogicalAction(model5_1, threadLookup, interp5_1, graphCD)
assert(decision5_1.targetNodeId === 'hit_branch', 'TEST 1: Planner advances to hit_branch')
assert(decision5_1.targetEdgeId === 'lookup_to_hit', 'TEST 1: Planner targets lookup_to_hit')

// TEST 2: Active target = membership_lookup, "Because Set lookup is constant time."
const interp5_2 = interpretLearnerMessage('Because Set lookup is constant time.', cdProblem, threadLookup, graphCD)
assert(interp5_2.touchedNodeIds.includes('membership_lookup'), 'TEST 2: "Because Set lookup is constant time." touches membership_lookup')
assert(interp5_2.touchedEdgeIds.length === 0, 'TEST 2: does NOT touch set_to_lookup')
let model5_2 = createInitialMentalModel(graphCD)
model5_2.nodes['set_structure'].state = 'ARTICULATED'
model5_2 = applyInterpretationDelta(model5_2, interp5_2, graphCD)
assert(model5_2.nodes['membership_lookup'].state === 'ARTICULATED', 'TEST 2: membership_lookup becomes ARTICULATED')
assert(model5_2.edges['set_to_lookup'].state === 'UNCLAIMED', 'TEST 2: set_to_lookup remains UNCLAIMED')
const decision5_2 = planPedagogicalAction(model5_2, threadLookup, interp5_2, graphCD)
assert(decision5_2.targetNodeId === 'hit_branch', 'TEST 2: Planner advances to hit_branch')
assert(decision5_2.targetEdgeId === 'lookup_to_hit', 'TEST 2: Planner targets lookup_to_hit')

// TEST 3: Active target = membership_lookup, "constant-time lookup"
const interp5_3 = interpretLearnerMessage('constant-time lookup', cdProblem, threadLookup, graphCD)
assert(interp5_3.touchedNodeIds.includes('membership_lookup'), 'TEST 3: "constant-time lookup" touches membership_lookup')
let model5_3 = createInitialMentalModel(graphCD)
model5_3.nodes['set_structure'].state = 'ARTICULATED'
model5_3 = applyInterpretationDelta(model5_3, interp5_3, graphCD)
assert(model5_3.nodes['membership_lookup'].state === 'ARTICULATED', 'TEST 3: membership_lookup is ARTICULATED')

// TEST 4: Negative Control: Active target = brute_force, "complexity is O(1)"
const threadBrute = {
  current: {
    approachId: 'hash-set-canonical',
    targetNodeId: 'brute_force',
    cognitiveTask: 'EXPLAIN' as const,
    pedagogicalAction: 'DEEPEN_PARTIAL_REASONING' as const,
  },
  returnStack: [],
}
const interp5_4 = interpretLearnerMessage('complexity is O(1)', cdProblem, threadBrute, graphCD)
assert(!interp5_4.touchedNodeIds.includes('membership_lookup'), 'TEST 4: Neg control: "complexity is O(1)" does NOT touch membership_lookup')
let model5_4 = createInitialMentalModel(graphCD)
model5_4 = applyInterpretationDelta(model5_4, interp5_4, graphCD)
assert(model5_4.nodes['membership_lookup'].state === 'UNKNOWN', 'TEST 4: membership_lookup remains UNKNOWN')
assert(model5_4.nodes['brute_force'].state !== 'ARTICULATED', 'TEST 4: brute_force is NOT ARTICULATED')

// TEST 5: Negative Control: Active target = brute_force, "the algorithm is constant time"
const interp5_5 = interpretLearnerMessage('the algorithm is constant time', cdProblem, threadBrute, graphCD)
assert(!interp5_5.touchedNodeIds.includes('membership_lookup'), 'TEST 5: Neg control: "the algorithm is constant time" does NOT touch membership_lookup')
let model5_5 = createInitialMentalModel(graphCD)
model5_5 = applyInterpretationDelta(model5_5, interp5_5, graphCD)
assert(model5_5.nodes['membership_lookup'].state === 'UNKNOWN', 'TEST 5: membership_lookup remains UNKNOWN')

// TEST 6: Negative Control: Active target = sorting_cost, "constant time"
const graphSorting = getActiveGraph('contains-duplicate', 'sorting-alternative')
const threadSorting = {
  current: {
    approachId: 'sorting-alternative',
    targetNodeId: 'sorting_cost',
    cognitiveTask: 'JUSTIFY' as const,
    pedagogicalAction: 'DEEPEN_PARTIAL_REASONING' as const,
  },
  returnStack: [],
}
const interp5_6 = interpretLearnerMessage('constant time', cdProblem, threadSorting, graphSorting)
assert(!interp5_6.touchedNodeIds.includes('membership_lookup'), 'TEST 6: Neg control: "constant time" does NOT touch membership_lookup')
let model5_6 = createInitialMentalModel(graphSorting)
model5_6 = applyInterpretationDelta(model5_6, interp5_6, graphSorting)
assert(model5_6.nodes['membership_lookup']?.state !== 'ARTICULATED', 'TEST 6: membership_lookup is NOT ARTICULATED')

// TEST 7: Negative Control: Active target = brute_force, "fast lookup"
const interp5_7 = interpretLearnerMessage('fast lookup', cdProblem, threadBrute, graphCD)
assert(!interp5_7.touchedNodeIds.includes('membership_lookup'), 'TEST 7: Neg control: "fast lookup" when target is brute_force does NOT touch membership_lookup')
let model5_7 = createInitialMentalModel(graphCD)
model5_7 = applyInterpretationDelta(model5_7, interp5_7, graphCD)
assert(model5_7.nodes['membership_lookup'].state === 'UNKNOWN', 'TEST 7: membership_lookup remains UNKNOWN')

// TEST 8: Active target = membership_lookup, "the lookup is constant time"
const interp5_8 = interpretLearnerMessage('the lookup is constant time', cdProblem, threadLookup, graphCD)
assert(interp5_8.touchedNodeIds.includes('membership_lookup'), 'TEST 8: "the lookup is constant time" touches membership_lookup')
let model5_8 = createInitialMentalModel(graphCD)
model5_8.nodes['set_structure'].state = 'ARTICULATED'
model5_8 = applyInterpretationDelta(model5_8, interp5_8, graphCD)
assert(model5_8.nodes['membership_lookup'].state === 'ARTICULATED', 'TEST 8: membership_lookup becomes ARTICULATED')

// TEST 9: Active target = membership_lookup, "we can check the Set in O(1)"
const interp5_9 = interpretLearnerMessage('we can check the Set in O(1)', cdProblem, threadLookup, graphCD)
assert(interp5_9.touchedNodeIds.includes('membership_lookup'), 'TEST 9: "we can check the Set in O(1)" touches membership_lookup')
let model5_9 = createInitialMentalModel(graphCD)
model5_9.nodes['set_structure'].state = 'ARTICULATED'
model5_9 = applyInterpretationDelta(model5_9, interp5_9, graphCD)
assert(model5_9.nodes['membership_lookup'].state === 'ARTICULATED', 'TEST 9: membership_lookup becomes ARTICULATED')

// TEST 10: Active target = membership_lookup, "Because Set lookup is constant time."
const interp5_10 = interpretLearnerMessage('Because Set lookup is constant time.', cdProblem, threadLookup, graphCD)
assert(interp5_10.touchedNodeIds.includes('membership_lookup'), 'TEST 10: touches membership_lookup')
assert(interp5_10.touchedEdgeIds.length === 0, 'TEST 10: does NOT touch set_to_lookup')
let model5_10 = createInitialMentalModel(graphCD)
model5_10.nodes['set_structure'].state = 'ARTICULATED'
model5_10 = applyInterpretationDelta(model5_10, interp5_10, graphCD)
assert(model5_10.nodes['membership_lookup'].state === 'ARTICULATED', 'TEST 10: membership_lookup is ARTICULATED')
assert(model5_10.edges['set_to_lookup'].state === 'UNCLAIMED', 'TEST 10: set_to_lookup is UNCLAIMED')

console.log('\n============================================================')
console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
console.log('============================================================')
