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

  // Complete implementation jump in natural language
  const step3 = await evaluateDialogueStepAsync(
    "I'll loop through the array, check if the number is already in the Set, return true if it is, otherwise add it to the Set. If I finish the loop, return false.",
    cdProblem,
    history2
  )
  assert(
    step3.decision.action === 'OFFER_CODE_IMPLEMENTATION',
    'H3. Turn 3: Complete summary jump triggers OFFER_CODE_IMPLEMENTATION'
  )
  assert(
    step3.decision.cognitiveTask === 'SUMMARIZE',
    'H3. Turn 3: CognitiveTask is SUMMARIZE'
  )
  assert(
    step3.renderedText.includes('Excellent work') || step3.renderedText.includes('constraints'),
    'H3. Turn 3: Output validates solution'
  )

  console.log('\n============================================================')
  console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
  console.log('============================================================')
}

runAllTests()
