/**
 * Self-Contained Contextual Interpretation Test Suite (Zero Transpilation Required)
 */

import { CONTAINS_DUPLICATE_CANONICAL, TWO_SUM_CANONICAL, STOCK_CANONICAL, VALID_PARENTHESES_CANONICAL, CONTAINER_WATER_CANONICAL, BINARY_SEARCH_CANONICAL, getActiveGraph } from '../src/lib/problemGraphs.ts'
import { interpretLearnerMessage } from '../src/lib/socraticInterpreter.ts'
import { createInitialMentalModel, applyInterpretationDelta } from '../src/lib/mentalModel.ts'
import { planPedagogicalAction } from '../src/lib/pedagogicalPlanner.ts'
import { renderSocraticResponse } from '../src/lib/socraticRenderer.ts'
import { PROBLEMS } from '../src/data/problems.ts'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')
const twoSum = PROBLEMS.find((p) => p.slug === 'two-sum')
const stock = PROBLEMS.find((p) => p.slug === 'best-time-to-buy-and-sell-stock')
const validParens = PROBLEMS.find((p) => p.slug === 'valid-parentheses')
const containerWater = PROBLEMS.find((p) => p.slug === 'container-with-most-water')
const binarySearch = PROBLEMS.find((p) => p.slug === 'binary-search')

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
// TEST 1: Exact Production Failure Flow Simulation
// ─────────────────────────────────────────────────────────────────────────────

console.log('--- TEST 1: Exact Production Failure Flow ---')

const graphCD = CONTAINS_DUPLICATE_CANONICAL
let model = createInitialMentalModel(graphCD)
let thread = {
  current: {
    approachId: 'hash-set-canonical',
    targetNodeId: 'goal',
    cognitiveTask: 'IDENTIFY',
    pedagogicalAction: 'DEEPEN_PARTIAL_REASONING',
  },
  returnStack: [],
}

function simulateTurn(userText) {
  const interp = interpretLearnerMessage(userText, cdProblem, thread, graphCD)
  model = applyInterpretationDelta(model, interp, graphCD)
  const decision = planPedagogicalAction(model, thread, interp, graphCD)
  const isRePrompt =
    thread.current.targetNodeId === decision.targetNodeId &&
    thread.current.targetEdgeId === decision.targetEdgeId &&
    interp.touchedNodeIds.length === 0
  const reply = renderSocraticResponse(
    decision.action,
    decision.cognitiveTask,
    decision.targetNode,
    decision.targetEdge,
    interp,
    cdProblem,
    graphCD,
    isRePrompt
  )
  thread = decision.newThread
  return { interp, decision, reply }
}

// Turn 1
const t1 = simulateTurn("I'd compare each number with the others.")
assert(
  t1.reply.includes('repeatedly searching') || t1.reply.includes('avoid'),
  'Turn 1: Advanced to repeated work bottleneck',
  t1.reply
)

// Turn 2
const t2 = simulateTurn("Oh because we'd keep checking stuff we've already seen.")
assert(
  t2.reply.includes('What could we remember'),
  'Turn 2: Advanced to memory question',
  t2.reply
)
assert(thread.current.targetNodeId === 'memory', 'Turn 2 Target: memory')

// Turn 3: Exact Recorded Failure Utterance
const t3 = simulateTurn('a number which has occurred')
assert(
  t3.reply.includes('structure') || t3.reply.includes('Set'),
  'Turn 3: Recognized "a number which has occurred" and advanced to Set structure',
  t3.reply
)
assert(
  thread.current.targetNodeId === 'set_structure',
  'Turn 3 Target: set_structure (NOT memory!)',
  `Got: ${thread.current.targetNodeId}`
)

// Turn 4: Another elliptical answer on Set
const t4 = simulateTurn('Use a Set')
assert(
  t4.reply.includes('Why does a Set') || t4.reply.includes('lookup'),
  'Turn 4: Advanced to Set membership lookup',
  t4.reply
)

// Turn 5: "bcs complexity is O(1)"
const t5 = simulateTurn('bcs complexity is O(1)')
assert(
  t5.reply.includes('NOT in the Set') || t5.reply.includes('not in the Set') || thread.current.targetNodeId === 'hit_branch',
  'Turn 5: "bcs complexity is O(1)" advanced to hit_branch',
  t5.reply
)
assert(
  !t5.reply.includes('Why does a Set help us avoid repeatedly searching through the array?'),
  'Turn 5: Set lookup question NOT repeated'
)

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Exact Recorded Failure Utterance B ("a number which has occurred previously")
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 2: Failure Variant B ("a number which has occurred previously") ---')

let modelB = createInitialMentalModel(graphCD)
let threadB = {
  current: {
    approachId: 'hash-set-canonical',
    targetNodeId: 'goal',
    cognitiveTask: 'IDENTIFY',
    pedagogicalAction: 'DEEPEN_PARTIAL_REASONING',
  },
  returnStack: [],
}

function simulateTurnB(userText) {
  const interp = interpretLearnerMessage(userText, cdProblem, threadB, graphCD)
  modelB = applyInterpretationDelta(modelB, interp, graphCD)
  const decision = planPedagogicalAction(modelB, threadB, interp, graphCD)
  const isRePrompt =
    threadB.current.targetNodeId === decision.targetNodeId &&
    threadB.current.targetEdgeId === decision.targetEdgeId &&
    interp.touchedNodeIds.length === 0
  const reply = renderSocraticResponse(
    decision.action,
    decision.cognitiveTask,
    decision.targetNode,
    decision.targetEdge,
    interp,
    cdProblem,
    graphCD,
    isRePrompt
  )
  threadB = decision.newThread
  return { interp, decision, reply }
}

simulateTurnB("I'd compare each number with the others.")
simulateTurnB("Oh because we'd keep checking stuff we've already seen.")
const t3B = simulateTurnB('a number which has occurred previously')

assert(
  t3B.reply.includes('structure') || t3B.reply.includes('Set'),
  'Test 2: "a number which has occurred previously" advanced to Set structure',
  t3B.reply
)
assert(
  !t3B.reply.includes('What could we remember while scanning so we don\'t have to start that search again?'),
  'Test 2: Memory question NOT repeated'
)

simulateTurnB('Use a Set')
const t5B = simulateTurnB('Because Set lookup is constant time.')

assert(
  t5B.reply.includes('NOT in the Set') || t5B.reply.includes('not in the Set') || threadB.current.targetNodeId === 'hit_branch',
  'Test 2 Turn 5B: "Because Set lookup is constant time." advanced to hit_branch',
  t5B.reply
)
assert(
  !t5B.reply.includes('Why does a Set help us avoid repeatedly searching through the array?'),
  'Test 2 Turn 5B: Set lookup question NOT repeated'
)

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Elliptical Answers Across All Other Problem Graphs
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 3: Elliptical Answers Across All Graphs ---')

// 3A. Contains Duplicate: "the ones we've already seen"
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
assert(interpCD.touchedEdgeIds.length === 0, '3A. Contains Duplicate: "the ones we\'ve already seen" does NOT touch bottleneck_to_memory')

let model3A = createInitialMentalModel(graphCD)
model3A.nodes['brute_force'].state = 'ARTICULATED'
model3A.nodes['repeated_work'].state = 'ARTICULATED'
model3A = applyInterpretationDelta(model3A, interpCD, graphCD)
assert(model3A.nodes['memory'].state === 'ARTICULATED', '3A. Contains Duplicate: memory state is ARTICULATED')
assert(model3A.edges['bottleneck_to_memory'].state === 'UNCLAIMED', '3A. Contains Duplicate: bottleneck_to_memory remains UNCLAIMED')

// 3B. Two Sum: "the matching partner" when target is complement_formula
const graphTS = TWO_SUM_CANONICAL
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
const graphCW = CONTAINER_WATER_CANONICAL
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
const graphBS = BINARY_SEARCH_CANONICAL
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
const graphStock = STOCK_CANONICAL
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
const graphVP = VALID_PARENTHESES_CANONICAL
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
// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Membership Lookup (O(1) / Constant Time) 10-Test Semantic Audit Suite
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST 5: Membership Lookup (O(1) / Constant Time) Semantic Audit ---')

const threadLookup = {
  current: {
    approachId: 'hash-set-canonical',
    targetNodeId: 'membership_lookup',
    targetEdgeId: 'set_to_lookup',
    cognitiveTask: 'JUSTIFY',
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP',
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
    cognitiveTask: 'EXPLAIN',
    pedagogicalAction: 'DEEPEN_PARTIAL_REASONING',
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
    cognitiveTask: 'JUSTIFY',
    pedagogicalAction: 'DEEPEN_PARTIAL_REASONING',
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
