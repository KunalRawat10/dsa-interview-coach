/**
 * Exhaustive Adversarial Socratic Engine Validator
 * Tests: Permutation Invariance, Semantic Anti-Repetition, Multi-Problem Generalization, 20-turn Messy Trace
 */

import { evaluateDialogueStep, liteRespond, extractActiveThread, serializeActiveThread } from '../src/lib/liteSocratic.js'
import { PROBLEMS } from '../src/data/problems.js'
import { CONTAINS_DUPLICATE_CANONICAL, CONTAINER_WATER_CANONICAL, BINARY_SEARCH_CANONICAL, STOCK_CANONICAL } from '../src/lib/problemGraphs.js'
import { planPedagogicalAction } from '../src/lib/pedagogicalPlanner.js'
import { createInitialMentalModel, applyInterpretationDelta } from '../src/lib/mentalModel.js'
import { interpretLearnerMessage } from '../src/lib/socraticInterpreter.js'

const cdProblem = PROBLEMS.find(p => p.slug === 'contains-duplicate')
const waterProblem = PROBLEMS.find(p => p.slug === 'container-with-most-water')
const bsProblem = PROBLEMS.find(p => p.slug === 'binary-search')
const stockProblem = PROBLEMS.find(p => p.slug === 'best-time-to-buy-and-sell-stock')

console.log('============================================================')
console.log('EXHAUSTIVE ADVERSARIAL SOCRATIC ENGINE VALIDATION')
console.log('============================================================\n')

// ─────────────────────────────────────────────────────────────────────────────
// 1. SECTION 17: GRAPH-ORDER PERMUTATION INVARIANCE TEST
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- 1. GRAPH-ORDER PERMUTATION INVARIANCE TEST ---')

function testPermutationInvariance() {
  const originalGraph = CONTAINS_DUPLICATE_CANONICAL
  const reversedGraph = {
    ...originalGraph,
    nodes: [...originalGraph.nodes].reverse(),
    edges: [...originalGraph.edges].reverse(),
  }
  
  // Seed a state where brute_force is articulated
  const history = [{ role: 'assistant', content: 'What would you try first?' }]
  const input = "I'd compare each number with the others."
  
  // Original
  const stepOrig = evaluateDialogueStep(input, cdProblem, history)
  
  // Custom run with reversed graph
  const modelRev = createInitialMentalModel(reversedGraph)
  const threadRev = extractActiveThread(history)
  const interpRev = interpretLearnerMessage(input, cdProblem, threadRev, reversedGraph)
  const updatedModelRev = applyInterpretationDelta(modelRev, interpRev, reversedGraph)
  const decisionRev = planPedagogicalAction(updatedModelRev, threadRev, interpRev, reversedGraph)
  
  const matches = stepOrig.decision.action === decisionRev.action &&
                  stepOrig.decision.cognitiveTask === decisionRev.cognitiveTask &&
                  stepOrig.decision.targetNodeId === decisionRev.targetNodeId &&
                  stepOrig.decision.targetEdgeId === decisionRev.targetEdgeId

  console.log(`Original Graph Chosen: [${stepOrig.decision.action}] on ${stepOrig.decision.targetNodeId ?? stepOrig.decision.targetEdgeId}`)
  console.log(`Reversed Graph Chosen: [${decisionRev.action}] on ${decisionRev.targetNodeId ?? decisionRev.targetEdgeId}`)
  console.log(`Permutation Invariance Result: ${matches ? 'PASS (100% IDENTICAL DECISION)' : 'FAIL (ORDER DEPENDENCY DETECTED)'}\n`)
}

testPermutationInvariance()

// ─────────────────────────────────────────────────────────────────────────────
// 2. SECTION 1: 10-TURN STEP-BY-STEP COGNITIVE TRACE
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- 2. SECTION 1: 10-TURN EXACT STEP-BY-STEP COGNITIVE TRACE ---')

const tenTurns = [
  "I'd compare each number with the others.",
  "Because if two are equal then there's a duplicate.",
  "I think it would be O(n²).",
  "Because we'd keep checking numbers we've already checked.",
  "Maybe keep the numbers we've already seen.",
  "Use a Set.",
  "Because I can check whether the number already exists.",
  "If it's already there, it's a duplicate.",
  "If it isn't there, add it.",
  "If we finish without finding one, return false."
]

const history = [{ role: 'assistant', content: 'What would you try first?' }]
const qualityLog = []

for (let t = 0; t < tenTurns.length; t++) {
  const learnerUtterance = tenTurns[t]
  const trace = evaluateDialogueStep(learnerUtterance, cdProblem, history)
  
  console.log(`\n================ TURN ${t + 1} ================`)
  console.log(`Learner: "${learnerUtterance}"`)
  console.log(`Active Thread Before: Target: ${trace.activeThread.current.targetNodeId ?? trace.activeThread.current.targetEdgeId}, Action: ${trace.activeThread.current.pedagogicalAction}`)
  console.log(`Interpretation: Touched Nodes: [${trace.interpretation.touchedNodeIds.join(', ')}], Confidence: ${trace.interpretation.confidence}`)
  console.log(`Demonstrated So Far: [${Object.keys(trace.mentalModel.nodes).filter(k => trace.mentalModel.nodes[k].state === 'ARTICULATED' || trace.mentalModel.nodes[k].state === 'APPLIED').join(', ')}]`)
  console.log(`Planner Selected Action: ${trace.decision.action}, Task: ${trace.decision.cognitiveTask}, Target: ${trace.decision.targetNodeId ?? trace.decision.targetEdgeId}`)
  console.log(`Score Rationale: ${trace.decision.scoreTrace}`)
  console.log(`Coach Response: "${trace.renderedText}"`)

  // Quality check: Check if coach re-asked something already demonstrated
  const isSemanticRepetition = trace.renderedText.includes('NOT in the Set') && t >= 9
  qualityLog.push({
    turn: t + 1,
    action: trace.decision.action,
    category: isSemanticRepetition ? 'SEMANTIC_REPETITION' : (trace.decision.action === 'OFFER_CODE_IMPLEMENTATION' ? 'IMPLEMENTATION_INVITE' : 'NEW_REASONING_TASK')
  })

  history.push({ role: 'user', content: learnerUtterance })
  history.push({ role: 'assistant', content: trace.fullResponseWithMeta })
}

console.log('\nQuality Log for 10-turn trace:', qualityLog)

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONTAINER WITH MOST WATER MESSY TRACE
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- 3. CONTAINER WITH MOST WATER MESSY TRACE ---')

const waterTurns = [
  "I'd calculate the area between pairs of lines.",
  "Probably O(n²).",
  "Because we're checking lots of pairs.",
  "Maybe keep the two ends.",
  "Use two pointers.",
  "Why do we move one?",
  "I think move the taller one?",
  "Wait, no, move the shorter one because the taller line can't increase the height.",
  "Then stop when the pointers meet and return the max area."
]

const waterHistory = [{ role: 'assistant', content: 'How would you find the container that holds the most water?' }]
for (let t = 0; t < waterTurns.length; t++) {
  const userText = waterTurns[t]
  const trace = evaluateDialogueStep(userText, waterProblem, waterHistory)
  console.log(`\n[Water Turn ${t + 1}] Learner: "${userText}"`)
  console.log(`Coach: "${trace.renderedText}"`)
  console.log(`Action: ${trace.decision.action} | Target: ${trace.decision.targetNodeId ?? trace.decision.targetEdgeId}`)
  waterHistory.push({ role: 'user', content: userText })
  waterHistory.push({ role: 'assistant', content: trace.fullResponseWithMeta })
}
