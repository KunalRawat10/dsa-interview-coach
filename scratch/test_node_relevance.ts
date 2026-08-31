/**
 * Phase 1 Node Relevance & Focus Selection Test Suite
 */

import { interpretLearnerMessage } from '../src/lib/socraticInterpreter.ts'
import { createInitialMentalModel, applyInterpretationDelta } from '../src/lib/mentalModel.ts'
import { planPedagogicalAction } from '../src/lib/pedagogicalPlanner.ts'
import { extractActiveThread } from '../src/lib/activeThread.ts'
import { PROBLEMS } from '../src/data/problems.ts'
import { getActiveGraph } from '../src/lib/problemGraphs.ts'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')!
const graphCD = getActiveGraph('contains-duplicate')

console.log('============================================================')
console.log('PHASE 1: NODE RELEVANCE & FOCUS SELECTION TEST SUITE')
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
// TEST A: "then we add it to the set"
// ─────────────────────────────────────────────────────────────────────────────

console.log('--- TEST A: "then we add it to the set" ---')

const threadMiss = {
  current: {
    approachId: 'hash-set-canonical',
    targetNodeId: 'miss_branch',
    targetEdgeId: 'lookup_to_miss',
    cognitiveTask: 'APPLY' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
  },
  returnStack: [],
}

const interpA = interpretLearnerMessage('then we add it to the set', cdProblem, threadMiss, graphCD)
assert(interpA.primaryTouchedNodeId === 'miss_branch', 'Test A: primaryTouchedNodeId is miss_branch', `Got: ${interpA.primaryTouchedNodeId}`)
assert(interpA.touchedNodeIds[0] === 'miss_branch', 'Test A: touchedNodeIds[0] is miss_branch', `Got: ${interpA.touchedNodeIds[0]}`)
assert(!interpA.touchedNodeIds.includes('set_structure'), 'Test A: generic "set" is subsumed and does not match set_structure', `Touched: ${interpA.touchedNodeIds.join(', ')}`)

let modelA = createInitialMentalModel(graphCD)
modelA.nodes['goal'].state = 'ARTICULATED'
modelA.nodes['brute_force'].state = 'ARTICULATED'
modelA.nodes['repeated_work'].state = 'ARTICULATED'
modelA.nodes['memory'].state = 'ARTICULATED'
modelA.nodes['set_structure'].state = 'ARTICULATED'
modelA.nodes['membership_lookup'].state = 'ARTICULATED'

modelA = applyInterpretationDelta(modelA, interpA, graphCD)
assert(modelA.nodes['miss_branch'].state === 'ARTICULATED', 'Test A: miss_branch is ARTICULATED')

const decisionA = planPedagogicalAction(modelA, threadMiss, interpA, graphCD)
assert(decisionA.targetNodeId !== 'set_structure', 'Test A: Planner does NOT regress to set_structure', `Got: ${decisionA.targetNodeId}`)

// ─────────────────────────────────────────────────────────────────────────────
// TEST B: "Use a Set"
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST B: "Use a Set" ---')

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

const interpB = interpretLearnerMessage('Use a Set', cdProblem, threadSet, graphCD)
assert(interpB.primaryTouchedNodeId === 'set_structure', 'Test B: primaryTouchedNodeId is set_structure', `Got: ${interpB.primaryTouchedNodeId}`)
assert(interpB.touchedNodeIds.includes('set_structure'), 'Test B: touchedNodeIds includes set_structure')

let modelB = createInitialMentalModel(graphCD)
modelB.nodes['memory'].state = 'ARTICULATED'
modelB = applyInterpretationDelta(modelB, interpB, graphCD)
assert(modelB.nodes['set_structure'].state === 'ARTICULATED', 'Test B: set_structure is ARTICULATED')

const decisionB = planPedagogicalAction(modelB, threadSet, interpB, graphCD)
assert(decisionB.targetNodeId === 'membership_lookup', 'Test B: Planner advances to membership_lookup', `Got: ${decisionB.targetNodeId}`)

// ─────────────────────────────────────────────────────────────────────────────
// TEST C: "Because Set lookup is constant time."
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST C: "Because Set lookup is constant time." ---')

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

const interpC = interpretLearnerMessage('Because Set lookup is constant time.', cdProblem, threadLookup, graphCD)
assert(interpC.primaryTouchedNodeId === 'membership_lookup', 'Test C: primaryTouchedNodeId is membership_lookup', `Got: ${interpC.primaryTouchedNodeId}`)
assert(interpC.touchedNodeIds.includes('membership_lookup'), 'Test C: touchedNodeIds includes membership_lookup')
assert(!interpC.touchedNodeIds.includes('set_structure'), 'Test C: "Set" in "Set lookup" does NOT match set_structure as separate node')
assert(interpC.touchedEdgeIds.length === 0, 'Test C: incoming set_to_lookup remains UNTOUCHED / UNCLAIMED in interpreter', `Touched edges: ${interpC.touchedEdgeIds.join(', ')}`)

let modelC = createInitialMentalModel(graphCD)
modelC.nodes['set_structure'].state = 'ARTICULATED'
modelC = applyInterpretationDelta(modelC, interpC, graphCD)
assert(modelC.nodes['membership_lookup'].state === 'ARTICULATED', 'Test C: membership_lookup is ARTICULATED')
assert(modelC.edges['set_to_lookup'].state === 'UNCLAIMED', 'Test C: set_to_lookup edge remains UNCLAIMED')

// ─────────────────────────────────────────────────────────────────────────────
// TEST D: "the ones we've already seen"
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST D: "the ones we\'ve already seen" ---')

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

const interpD = interpretLearnerMessage("the ones we've already seen", cdProblem, threadMemory, graphCD)
assert(interpD.primaryTouchedNodeId === 'memory', 'Test D: primaryTouchedNodeId is memory', `Got: ${interpD.primaryTouchedNodeId}`)
assert(interpD.touchedNodeIds.includes('memory'), 'Test D: touchedNodeIds includes memory')
assert(!interpD.touchedNodeIds.includes('repeated_work'), 'Test D: does NOT match repeated_work')

let modelD = createInitialMentalModel(graphCD)
modelD.nodes['brute_force'].state = 'ARTICULATED'
modelD.nodes['repeated_work'].state = 'ARTICULATED'
modelD = applyInterpretationDelta(modelD, interpD, graphCD)
assert(modelD.nodes['memory'].state === 'ARTICULATED', 'Test D: memory is ARTICULATED')

const decisionD = planPedagogicalAction(modelD, threadMemory, interpD, graphCD)
assert(decisionD.targetNodeId === 'set_structure', 'Test D: Planner advances to set_structure', `Got: ${decisionD.targetNodeId}`)

// ─────────────────────────────────────────────────────────────────────────────
// TEST E: "we'd keep checking stuff we've already seen"
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST E: "we\'d keep checking stuff we\'ve already seen" ---')

const threadRepeated = {
  current: {
    approachId: 'hash-set-canonical',
    targetNodeId: 'repeated_work',
    cognitiveTask: 'EXPLAIN' as const,
    pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
  },
  returnStack: [],
}

const interpE = interpretLearnerMessage("we'd keep checking stuff we've already seen", cdProblem, threadRepeated, graphCD)
assert(interpE.primaryTouchedNodeId === 'repeated_work', 'Test E: primaryTouchedNodeId is repeated_work', `Got: ${interpE.primaryTouchedNodeId}`)
assert(interpE.touchedNodeIds.includes('repeated_work'), 'Test E: touchedNodeIds includes repeated_work')

let modelE = createInitialMentalModel(graphCD)
modelE.nodes['brute_force'].state = 'ARTICULATED'
modelE = applyInterpretationDelta(modelE, interpE, graphCD)
assert(modelE.nodes['repeated_work'].state === 'ARTICULATED', 'Test E: repeated_work is ARTICULATED')

// ─────────────────────────────────────────────────────────────────────────────
// TEST F: "we can remember numbers we've already seen so we don't have to scan them again"
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- TEST F: Multi-concept with causal connective ---')

const interpF = interpretLearnerMessage(
  "we can remember numbers we've already seen so we don't have to scan them again",
  cdProblem,
  threadMemory,
  graphCD
)
assert(interpF.primaryTouchedNodeId === 'memory', 'Test F: primaryTouchedNodeId is memory (active target with high score)', `Got: ${interpF.primaryTouchedNodeId}`)
assert(interpF.touchedNodeIds.includes('memory'), 'Test F: touchedNodeIds includes memory')
assert(interpF.touchedNodeIds.includes('repeated_work'), 'Test F: touchedNodeIds includes repeated_work')
assert(interpF.touchedEdgeIds.includes('bottleneck_to_memory'), 'Test F: touchedEdgeIds includes bottleneck_to_memory')

let modelF = createInitialMentalModel(graphCD)
modelF.nodes['brute_force'].state = 'ARTICULATED'
modelF.nodes['repeated_work'].state = 'ARTICULATED'
modelF = applyInterpretationDelta(modelF, interpF, graphCD)
assert(modelF.nodes['memory'].state === 'ARTICULATED', 'Test F: memory is ARTICULATED')
assert(modelF.edges['bottleneck_to_memory'].state === 'JUSTIFIED', 'Test F: bottleneck_to_memory is JUSTIFIED due to causal connective')

console.log('\n============================================================')
console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
console.log('============================================================')
