/**
 * Phase 2 Hybrid Semantic Interpretation Test Suite
 */

import { interpretLearnerMessage, interpretLearnerMessageAsync } from '../src/lib/socraticInterpreter.ts'
import { matchSemanticConcepts } from '../src/lib/semanticMatcher.ts'
import { SEMANTIC_THRESHOLDS } from '../src/lib/semanticCorpus.ts'
import { createInitialMentalModel, applyInterpretationDelta } from '../src/lib/mentalModel.ts'
import { planPedagogicalAction } from '../src/lib/pedagogicalPlanner.ts'
import { evaluateDialogueStepAsync } from '../src/lib/liteSocratic.ts'
import { extractActiveThread } from '../src/lib/activeThread.ts'
import { PROBLEMS } from '../src/data/problems.ts'
import { getActiveGraph } from '../src/lib/problemGraphs.ts'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')!
const graphCD = getActiveGraph('contains-duplicate')

console.log('============================================================')
console.log('PHASE 2: HYBRID SEMANTIC INTERPRETATION TEST SUITE')
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

async function runAllTests() {
  const defaultThread = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'goal',
      cognitiveTask: 'IDENTIFY' as const,
      pedagogicalAction: 'DEEPEN_PARTIAL_REASONING' as const,
    },
    returnStack: [],
  }

  // ─────────────────────────────────────────────────────────────────────────
  // A. Exact existing phrases continue to match with 100% fidelity
  // ─────────────────────────────────────────────────────────────────────────
  console.log('--- TEST A: Exact Existing Phrases (Phase 1 Baseline) ---')
  const syncExact = interpretLearnerMessage('Use a Set', cdProblem, defaultThread, graphCD)
  assert(syncExact.touchedNodeIds.includes('set_structure'), 'A1. Exact: "Use a Set" matches set_structure synchronously')

  const asyncExact = await interpretLearnerMessageAsync('Use a Set', cdProblem, defaultThread, graphCD)
  assert(asyncExact.touchedNodeIds.includes('set_structure'), 'A2. Exact: "Use a Set" matches set_structure asynchronously')

  // ─────────────────────────────────────────────────────────────────────────
  // B. Node Paraphrases (Natural Language Variations)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST B: Node Paraphrases ---')

  const threadMem = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'memory',
      cognitiveTask: 'IDENTIFY' as const,
      pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
    },
    returnStack: [],
  }
  const interpB1 = await interpretLearnerMessageAsync('keep track of previous elements', cdProblem, threadMem, graphCD)
  assert(interpB1.touchedNodeIds.includes('memory'), 'B1. Node Paraphrase: "keep track of previous elements" matches memory')

  const threadLookup = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'membership_lookup',
      cognitiveTask: 'JUSTIFY' as const,
      pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
    },
    returnStack: [],
  }
  const interpB2 = await interpretLearnerMessageAsync('check whether this value was already recorded', cdProblem, threadLookup, graphCD)
  assert(interpB2.touchedNodeIds.includes('membership_lookup'), 'B2. Node Paraphrase: "check whether this value was already recorded" matches membership_lookup')

  const interpB3 = await interpretLearnerMessageAsync('use a hash table to store unique values', cdProblem, defaultThread, graphCD)
  assert(interpB3.touchedNodeIds.includes('set_structure'), 'B3. Node Paraphrase: "use a hash table to store unique values" matches set_structure')

  // ─────────────────────────────────────────────────────────────────────────
  // C. Branch Paraphrases
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST C: Branch Paraphrases ---')

  const threadHit = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'hit_branch',
      cognitiveTask: 'APPLY' as const,
      pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
    },
    returnStack: [],
  }
  const interpC1 = await interpretLearnerMessageAsync(
    "if we've encountered this number before, that's a duplicate",
    cdProblem,
    threadHit,
    graphCD
  )
  assert(interpC1.touchedNodeIds.includes('hit_branch'), 'C1. Branch Paraphrase: "if we\'ve encountered this number before, that\'s a duplicate" matches hit_branch')

  const threadMiss = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'miss_branch',
      cognitiveTask: 'APPLY' as const,
      pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
    },
    returnStack: [],
  }
  const interpC2 = await interpretLearnerMessageAsync(
    'if this value is new, save it for later',
    cdProblem,
    threadMiss,
    graphCD
  )
  assert(interpC2.touchedNodeIds.includes('miss_branch'), 'C2. Branch Paraphrase: "if this value is new, save it for later" matches miss_branch')

  const interpC3 = await interpretLearnerMessageAsync(
    'if we reach the end without finding a duplicate, return false',
    cdProblem,
    defaultThread,
    graphCD
  )
  assert(interpC3.touchedNodeIds.includes('termination'), 'C3. Branch Paraphrase: "if we reach the end without finding a duplicate, return false" matches termination')

  // ─────────────────────────────────────────────────────────────────────────
  // D. Edge Paraphrases (Relational Justifications)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST D: Edge Paraphrases ---')

  const interpD1 = await interpretLearnerMessageAsync(
    "I'll use a Set because I don't need to scan the earlier array elements again",
    cdProblem,
    threadMem,
    graphCD
  )
  assert(interpD1.touchedNodeIds.includes('set_structure'), 'D1. Edge Paraphrase: grounds set_structure')
  assert(interpD1.touchedEdgeIds.includes('memory_to_set'), 'D1. Edge Paraphrase: grounds memory_to_set edge')

  const interpD2 = await interpretLearnerMessageAsync(
    'hashing lets me jump directly to the location for the membership check',
    cdProblem,
    threadLookup,
    graphCD
  )
  assert(interpD2.touchedEdgeIds.includes('set_to_lookup'), 'D2. Edge Paraphrase: grounds set_to_lookup edge')

  const interpD3 = await interpretLearnerMessageAsync(
    'if the lookup succeeds, we have already seen that number earlier',
    cdProblem,
    threadHit,
    graphCD
  )
  assert(interpD3.touchedEdgeIds.includes('lookup_to_hit'), 'D3. Edge Paraphrase: grounds lookup_to_hit edge')

  const interpD4 = await interpretLearnerMessageAsync(
    'if it is not present, store it so future elements can detect it',
    cdProblem,
    threadMiss,
    graphCD
  )
  assert(interpD4.touchedEdgeIds.includes('lookup_to_miss'), 'D4. Edge Paraphrase: grounds lookup_to_miss edge')

  // ─────────────────────────────────────────────────────────────────────────
  // E. False-Positive Controls & Noise Rejection
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST E: False-Positive Controls ---')

  const interpE1 = await interpretLearnerMessageAsync('The problem is confusing.', cdProblem, defaultThread, graphCD)
  assert(interpE1.touchedNodeIds.length === 0, 'E1. Noise Control: "The problem is confusing." grounds 0 nodes')
  assert(interpE1.touchedEdgeIds.length === 0, 'E1. Noise Control: grounds 0 edges')

  const interpE2 = await interpretLearnerMessageAsync('I do not understand why this works.', cdProblem, defaultThread, graphCD)
  assert(interpE2.touchedNodeIds.length === 0, 'E2. Noise Control: "I do not understand why this works." grounds 0 nodes')

  const interpE3 = await interpretLearnerMessageAsync('What is the complexity of bubble sort?', cdProblem, threadLookup, graphCD)
  assert(interpE3.isQuestion, 'E3. Question Priority: "What is the complexity of bubble sort?" marked as question')
  assert(!interpE3.touchedNodeIds.includes('membership_lookup'), 'E3. Question Priority: does NOT accidentally ground membership_lookup')

  // ─────────────────────────────────────────────────────────────────────────
  // F. Node vs. Edge Invariant
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST F: Node vs. Edge Invariant ---')

  const interpF1 = await interpretLearnerMessageAsync('use a Set', cdProblem, defaultThread, graphCD)
  assert(interpF1.touchedNodeIds.includes('set_structure'), 'F1. Bare Node: "use a Set" grounds set_structure')
  assert(!interpF1.touchedEdgeIds.includes('memory_to_set'), 'F1. Bare Node: does NOT claim memory_to_set')
  assert(!interpF1.touchedEdgeIds.includes('set_to_lookup'), 'F1. Bare Node: does NOT claim set_to_lookup')

  // ─────────────────────────────────────────────────────────────────────────
  // G. Active-Thread Negative Control
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST G: Active-Thread Negative Control ---')

  const interpG = await interpretLearnerMessageAsync("I don't understand.", cdProblem, threadHit, graphCD)
  assert(!interpG.touchedNodeIds.includes('hit_branch'), 'G. Active Thread Control: "I don\'t understand." does NOT ground hit_branch')

  // ─────────────────────────────────────────────────────────────────────────
  // H. Complete Multi-Turn Async Dialogue Flow
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST H: Multi-Turn Async Dialogue Flow ---')

  const initialHistory = [
    {
      role: 'assistant' as const,
      content: `**${cdProblem.title}**\n---\nWhere would you like to start?\n<!--lite:{"current":{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->`,
    },
  ]

  const step1 = await evaluateDialogueStepAsync('use a hash table to store unique values', cdProblem, initialHistory)
  assert(step1.interpretation.touchedNodeIds.includes('set_structure'), 'H1. Turn 1: Semantic paraphrase grounds set_structure')
  assert(step1.decision.targetNodeId === 'membership_lookup', 'H1. Turn 1: Planner advances to membership_lookup')

  const history2 = [
    ...initialHistory,
    { role: 'user' as const, content: 'use a hash table to store unique values' },
    { role: 'assistant' as const, content: step1.fullResponseWithMeta },
  ]

  const step2 = await evaluateDialogueStepAsync('check whether this value was already recorded', cdProblem, history2)
  assert(step2.interpretation.touchedNodeIds.includes('membership_lookup'), 'H2. Turn 2: Semantic paraphrase grounds membership_lookup')
  assert(step2.decision.targetNodeId === 'hit_branch', 'H2. Turn 2: Planner advances to hit_branch')

  // ─────────────────────────────────────────────────────────────────────────
  // I. Complete Multi-Concept Simultaneous Grounding Regression Test
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST I: Multi-Concept Simultaneous Grounding ---')

  const fullUtterance =
    "I'll loop through the array, check if the number is already in the Set, return true if it is, otherwise add it to the Set. If I finish the loop, return false."

  const interpI = await interpretLearnerMessageAsync(fullUtterance, cdProblem, threadHit, graphCD)
  assert(interpI.touchedNodeIds.includes('membership_lookup'), 'I1. membership_lookup is grounded')
  assert(interpI.touchedNodeIds.includes('hit_branch'), 'I2. hit_branch is grounded')
  assert(interpI.touchedNodeIds.includes('miss_branch'), 'I3. miss_branch is grounded')
  assert(interpI.touchedNodeIds.includes('termination'), 'I4. termination is grounded')

  // Step evaluation with mental model and planner
  const stepI = await evaluateDialogueStepAsync(fullUtterance, cdProblem, history2)
  assert(
    stepI.mentalModel.nodes['membership_lookup']?.state === 'ARTICULATED' ||
      stepI.mentalModel.nodes['membership_lookup']?.state === 'APPLIED',
    'I5. Mental model: membership_lookup is ARTICULATED/APPLIED'
  )
  assert(
    stepI.mentalModel.nodes['hit_branch']?.state === 'ARTICULATED' ||
      stepI.mentalModel.nodes['hit_branch']?.state === 'APPLIED',
    'I6. Mental model: hit_branch is ARTICULATED/APPLIED'
  )
  assert(
    stepI.mentalModel.nodes['miss_branch']?.state === 'ARTICULATED' ||
      stepI.mentalModel.nodes['miss_branch']?.state === 'APPLIED',
    'I7. Mental model: miss_branch is ARTICULATED/APPLIED'
  )
  assert(
    stepI.mentalModel.nodes['termination']?.state === 'ARTICULATED' ||
      stepI.mentalModel.nodes['termination']?.state === 'APPLIED',
    'I8. Mental model: termination is ARTICULATED/APPLIED'
  )
  assert(stepI.decision.targetNodeId !== 'hit_branch', 'I9. Planner does NOT select hit_branch as an unresolved target')
  assert(stepI.decision.targetEdgeId !== 'lookup_to_hit', 'I10. Planner does NOT select lookup_to_hit')
  assert(
    stepI.decision.action === 'OFFER_CODE_IMPLEMENTATION',
    'I11. Planner reaches OFFER_CODE_IMPLEMENTATION'
  )
  assert(
    stepI.decision.cognitiveTask === 'SUMMARIZE',
    'I12. Planner sets cognitiveTask to SUMMARIZE'
  )
  assert(
    !stepI.renderedText.includes('Can you write the code?'),
    'I13. No "Can you write the code?" repetition when full summary is provided'
  )
  assert(
    stepI.renderedText.includes('Excellent work') || stepI.renderedText.includes('constraints'),
    'I14. Output validates solution completeness'
  )

  // ─────────────────────────────────────────────────────────────────────────
  // J. Opening Discovery Context & Negative Controls Suite
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST J: Opening Discovery Context & Negative Controls ---')

  const openingThread = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'goal',
      cognitiveTask: 'IDENTIFY' as const,
      pedagogicalAction: 'DEEPEN_PARTIAL_REASONING' as const,
    },
    returnStack: [],
  }

  // J1. Exact Live Opening Utterance
  const liveUtterance = "I'd keep the values we've encountered somewhere so we can check them quickly."
  const interpJ1 = await interpretLearnerMessageAsync(liveUtterance, cdProblem, openingThread, graphCD)
  assert(interpJ1.touchedNodeIds.includes('memory'), 'J1. Opening Discovery: "keep values encountered" grounds memory')
  assert(interpJ1.touchedEdgeIds.length === 0, 'J1. Opening Discovery: does NOT claim edges automatically')

  const initialOpeningHistory = [
    {
      role: 'assistant' as const,
      content: `**${cdProblem.title}**\n---\nWhere would you like to start?\n<!--lite:{"current":{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->`,
    },
  ]

  const stepJ1 = await evaluateDialogueStepAsync(liveUtterance, cdProblem, initialOpeningHistory)
  assert(stepJ1.mentalModel.nodes['memory']?.state === 'ARTICULATED', 'J1. Opening: mental model marks memory as ARTICULATED')
  assert(stepJ1.decision.targetNodeId !== 'goal', 'J1. Opening: planner advances away from goal')
  assert(stepJ1.decision.targetNodeId === 'set_structure', 'J1. Opening: planner advances to set_structure')
  assert(
    stepJ1.decision.action === 'PROBE_ADJACENT_RELATIONSHIP',
    'J1. Opening: planner selects PROBE_ADJACENT_RELATIONSHIP'
  )

  // J2. Opening Positive Paraphrases
  const interpJ2a = await interpretLearnerMessageAsync(
    'store those values in a collection that supports fast membership checks',
    cdProblem,
    openingThread,
    graphCD
  )
  assert(interpJ2a.touchedNodeIds.includes('set_structure'), 'J2a. Opening Paraphrase: grounds set_structure')

  const interpJ2b = await interpretLearnerMessageAsync(
    'compare every number against all other elements',
    cdProblem,
    openingThread,
    graphCD
  )
  assert(interpJ2b.touchedNodeIds.includes('brute_force'), 'J2b. Opening Paraphrase: grounds brute_force')

  const interpJ2c = await interpretLearnerMessageAsync(
    'we repeatedly rescan earlier elements and perform pairwise checks',
    cdProblem,
    openingThread,
    graphCD
  )
  assert(interpJ2c.touchedNodeIds.includes('repeated_work'), 'J2c. Opening Paraphrase: grounds repeated_work')

  // J3. Opening Negative Controls
  const interpJ3a = await interpretLearnerMessageAsync(
    "I've been thinking about what to eat for dinner.",
    cdProblem,
    openingThread,
    graphCD
  )
  assert(interpJ3a.touchedNodeIds.length === 0, 'J3a. Opening Negative Control: dinner sentence grounds 0 nodes')

  const interpJ3b = await interpretLearnerMessageAsync(
    'The problem is confusing.',
    cdProblem,
    openingThread,
    graphCD
  )
  assert(interpJ3b.touchedNodeIds.length === 0, 'J3b. Opening Negative Control: confusing sentence grounds 0 nodes')

  const interpJ3c = await interpretLearnerMessageAsync(
    'I like playing soccer on weekends.',
    cdProblem,
    openingThread,
    graphCD
  )
  assert(interpJ3c.touchedNodeIds.length === 0, 'J3c. Opening Negative Control: soccer sentence grounds 0 nodes')

  // J4. Strict Edge Invariant at Opening
  const stepJ4 = await evaluateDialogueStepAsync('use a Set', cdProblem, initialOpeningHistory)
  assert(stepJ4.mentalModel.nodes['set_structure']?.state === 'ARTICULATED', 'J4. Invariant: set_structure grounded')
  assert(stepJ4.mentalModel.edges['memory_to_set']?.state === 'UNCLAIMED', 'J4. Invariant: memory_to_set remains UNCLAIMED')

  console.log('\n============================================================')
  console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
  console.log('============================================================')
}

runAllTests()
