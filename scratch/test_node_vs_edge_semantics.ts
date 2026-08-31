/**
 * Semantic Node vs. Edge Mutation Audit & Verification Test Suite
 */

import { interpretLearnerMessage } from '../src/lib/socraticInterpreter.ts'
import { createInitialMentalModel, applyInterpretationDelta } from '../src/lib/mentalModel.ts'
import { planPedagogicalAction } from '../src/lib/pedagogicalPlanner.ts'
import { PROBLEMS } from '../src/data/problems.ts'
import { getActiveGraph } from '../src/lib/problemGraphs.ts'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')!
const twoSum = PROBLEMS.find((p) => p.slug === 'two-sum')!
const containerWater = PROBLEMS.find((p) => p.slug === 'container-with-most-water')!
const binarySearch = PROBLEMS.find((p) => p.slug === 'binary-search')!

console.log('============================================================')
console.log('SEMANTIC NODE VS. EDGE STATE AUDIT TEST SUITE')
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
// TEST A: Elliptical answer demonstrates NODE only, NOT edge justification
// ─────────────────────────────────────────────────────────────────────────────

console.log('--- TEST A: Elliptical Answer on Memory ---')

const graphCD = getActiveGraph('contains-duplicate')
let modelA = createInitialMentalModel(graphCD)
modelA.nodes['brute_force'].state = 'ARTICULATED'
modelA.nodes['repeated_work'].state = 'ARTICULATED'
modelA.edges['brute_to_bottleneck'].state = 'JUSTIFIED'

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

const interpA = interpretLearnerMessage('a number which has occurred', cdProblem, threadMemory, graphCD)
assert(interpA.touchedNodeIds.includes('memory'), 'Test A: Touched node includes memory')
assert(interpA.touchedEdgeIds.length === 0, 'Test A: Touched edges does NOT include bottleneck_to_memory')

modelA = applyInterpretationDelta(modelA, interpA, graphCD)
assert(modelA.nodes['memory'].state === 'ARTICULATED', 'Test A: memory node state is ARTICULATED')
assert(modelA.edges['bottleneck_to_memory'].state === 'UNCLAIMED', 'Test A: bottleneck_to_memory edge remains UNCLAIMED')

// Planner should still advance to set_structure!
const decisionA = planPedagogicalAction(modelA, threadMemory, interpA, graphCD)
assert(
  decisionA.targetNodeId === 'set_structure',
  'Test A: Planner advances to set_structure even though incoming edge is UNCLAIMED',
  `Got: ${decisionA.targetNodeId}`
)
assert(
  decisionA.targetEdgeId === 'memory_to_set',
  'Test A: Planner targets memory_to_set edge',
  `Got: ${decisionA.targetEdgeId}`
)

// ─────────────────────────────────────────────────────────────────────────────
// TEST B: Full relational explanation demonstrates BOTH node and edge
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST B: Explicit Relational Explanation ---')

let modelB = createInitialMentalModel(graphCD)
modelB.nodes['brute_force'].state = 'ARTICULATED'
modelB.nodes['repeated_work'].state = 'ARTICULATED'

const interpB = interpretLearnerMessage(
  "we can remember numbers we've already seen so we don't have to scan them again",
  cdProblem,
  threadMemory,
  graphCD
)
assert(interpB.touchedNodeIds.includes('memory'), 'Test B: Touched node includes memory')
assert(interpB.touchedNodeIds.includes('repeated_work'), 'Test B: Touched node includes repeated_work')
assert(interpB.touchedEdgeIds.includes('bottleneck_to_memory'), 'Test B: Touched edges includes bottleneck_to_memory')

modelB = applyInterpretationDelta(modelB, interpB, graphCD)
assert(modelB.nodes['memory'].state === 'ARTICULATED', 'Test B: memory node state is ARTICULATED')
assert(modelB.edges['bottleneck_to_memory'].state === 'JUSTIFIED', 'Test B: bottleneck_to_memory edge is JUSTIFIED')

// ─────────────────────────────────────────────────────────────────────────────
// TEST C: Elliptical variant "store the previous numbers"
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST C: "store the previous numbers" ---')

let modelC = createInitialMentalModel(graphCD)
modelC.nodes['brute_force'].state = 'ARTICULATED'
modelC.nodes['repeated_work'].state = 'ARTICULATED'

const interpC = interpretLearnerMessage('store the previous numbers', cdProblem, threadMemory, graphCD)
assert(interpC.touchedNodeIds.includes('memory'), 'Test C: Touches memory')
assert(interpC.touchedEdgeIds.length === 0, 'Test C: Does NOT touch bottleneck_to_memory')

modelC = applyInterpretationDelta(modelC, interpC, graphCD)
assert(modelC.nodes['memory'].state === 'ARTICULATED', 'Test C: memory node is ARTICULATED')
assert(modelC.edges['bottleneck_to_memory'].state === 'UNCLAIMED', 'Test C: edge remains UNCLAIMED')

// ─────────────────────────────────────────────────────────────────────────────
// TEST D-H: Other Contextual Problem Graphs
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST D-H: Contextual Matching on Other Graphs ---')

// Test D: Two Sum "the matching partner"
const graphTS = getActiveGraph('two-sum')
let modelTS = createInitialMentalModel(graphTS)
modelTS.nodes['brute_force'].state = 'ARTICULATED'
modelTS.nodes['repeated_work'].state = 'ARTICULATED'
const threadTS = {
  current: {
    approachId: 'two-sum-canonical',
    targetNodeId: 'complement_formula',
    targetEdgeId: 'bottleneck_to_complement',
    cognitiveTask: 'JUSTIFY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
  },
  returnStack: [],
}
const interpTS = interpretLearnerMessage('the matching partner', twoSum, threadTS, graphTS)
assert(interpTS.touchedNodeIds.includes('complement_formula'), 'Test D: Two Sum touches complement_formula')
assert(interpTS.touchedEdgeIds.length === 0, 'Test D: Two Sum does NOT touch bottleneck_to_complement')

modelTS = applyInterpretationDelta(modelTS, interpTS, graphTS)
assert(modelTS.nodes['complement_formula'].state === 'ARTICULATED', 'Test D: complement_formula is ARTICULATED')
assert(modelTS.edges['bottleneck_to_complement'].state === 'UNCLAIMED', 'Test D: edge remains UNCLAIMED')
const decisionTS = planPedagogicalAction(modelTS, threadTS, interpTS, graphTS)
assert(decisionTS.targetNodeId === 'map_structure', 'Test D: Planner advances to map_structure')

// Test E: Container Water "the shorter one"
const graphCW = getActiveGraph('container-with-most-water')
let modelCW = createInitialMentalModel(graphCW)
modelCW.nodes['goal'].state = 'ARTICULATED'
modelCW.nodes['area_formula'].state = 'ARTICULATED'
modelCW.nodes['two_pointers'].state = 'ARTICULATED'
const threadCW = {
  current: {
    approachId: 'container-water-canonical',
    targetNodeId: 'move_shorter_pointer',
    targetEdgeId: 'pointers_to_movement',
    cognitiveTask: 'JUSTIFY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
  },
  returnStack: [],
}
const interpCW = interpretLearnerMessage('the shorter one', containerWater, threadCW, graphCW)
assert(interpCW.touchedNodeIds.includes('move_shorter_pointer'), 'Test E: Container touches move_shorter_pointer')
assert(interpCW.touchedEdgeIds.length === 0, 'Test E: Container does NOT touch pointers_to_movement')

modelCW = applyInterpretationDelta(modelCW, interpCW, graphCW)
assert(modelCW.nodes['move_shorter_pointer'].state === 'ARTICULATED', 'Test E: move_shorter_pointer is ARTICULATED')
assert(modelCW.edges['pointers_to_movement'].state === 'UNCLAIMED', 'Test E: edge remains UNCLAIMED')

// Test F: Binary Search "the middle"
const graphBS = getActiveGraph('binary-search')
let modelBS = createInitialMentalModel(graphBS)
modelBS.nodes['goal'].state = 'ARTICULATED'
modelBS.nodes['sorted_property'].state = 'ARTICULATED'
const threadBS = {
  current: {
    approachId: 'binary-search-canonical',
    targetNodeId: 'midpoint_comparison',
    targetEdgeId: 'sorted_to_mid',
    cognitiveTask: 'JUSTIFY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
  },
  returnStack: [],
}
const interpBS = interpretLearnerMessage('the middle', binarySearch, threadBS, graphBS)
assert(interpBS.touchedNodeIds.includes('midpoint_comparison'), 'Test F: Binary Search touches midpoint_comparison')
assert(interpBS.touchedEdgeIds.length === 0, 'Test F: Binary Search does NOT touch sorted_to_mid')

modelBS = applyInterpretationDelta(modelBS, interpBS, graphBS)
assert(modelBS.nodes['midpoint_comparison'].state === 'ARTICULATED', 'Test F: midpoint_comparison is ARTICULATED')
assert(modelBS.edges['sorted_to_mid'].state === 'UNCLAIMED', 'Test F: edge remains UNCLAIMED')

console.log('\n============================================================')
console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
console.log('============================================================')
