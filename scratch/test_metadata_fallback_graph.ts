import { PROBLEMS } from '../src/data/problems'
import { getActiveGraph } from '../src/lib/problemGraphs'
import {
  createInitialMentalModel,
  applyInterpretationDelta,
  isNodeGrounded,
} from '../src/lib/mentalModel'
import { planPedagogicalAction } from '../src/lib/pedagogicalPlanner'
import { getDefaultActiveThread } from '../src/lib/activeThread'
import { interpretLearnerMessage } from '../src/lib/socraticInterpreter'
import { renderSocraticResponse } from '../src/lib/socraticRenderer'

let totalTests = 0
let passedTests = 0

function assert(condition: boolean, name: string) {
  totalTests++

  if (condition) {
    passedTests++
    console.log(`[PASS] ${name}`)
  } else {
    console.error(`[FAIL] ${name}`)
  }
}

console.log('============================================================')
console.log('PATTERN-OS V1.2-B — DYNAMIC FALLBACK GRAPH VERIFICATION')
console.log('============================================================')

const FALLBACK_SLUGS = [
  'valid-anagram',
  'longest-substring-no-repeat',
  'maximum-subarray',
  'product-except-self',
  'merge-intervals',
  '3sum',
  'daily-temperatures',
  'number-of-islands',
  'top-k-frequent',
  'longest-consecutive-sequence',
  'clone-graph',
  'course-schedule',
  'lowest-common-ancestor',
  'word-break',
]

/* ============================================================
   1. Every formerly-fallback problem gets its own graph
============================================================ */

for (const slug of FALLBACK_SLUGS) {
  const problem = PROBLEMS.find((p) => p.slug === slug)

  assert(Boolean(problem), `Problem exists: ${slug}`)

  if (!problem) continue

  const graph = getActiveGraph(slug, undefined, problem)

  assert(
    graph.id === `fallback-${slug}`,
    `${slug}: problem-specific fallback graph`
  )

  assert(
    graph.nodes.length === 4,
    `${slug}: exactly 4 nodes`
  )

  assert(
    graph.edges.length === 3,
    `${slug}: exactly 3 edges`
  )

  const goal = graph.nodes.find((n) => n.id === 'goal')
  const strategy = graph.nodes.find((n) => n.id === 'strategy')
  const invariant = graph.nodes.find((n) => n.id === 'invariant')
  const branch = graph.nodes.find((n) => n.id === 'branch')

  assert(
    goal?.category === 'GOAL',
    `${slug}: GOAL node`
  )

  assert(
    strategy?.category === 'OPTIMIZATION_STRATEGY',
    `${slug}: strategy node`
  )

  assert(
    invariant?.category === 'INVARIANT_MECHANISM',
    `${slug}: invariant node`
  )

  assert(
    branch?.category === 'OPERATIONAL_BRANCH',
    `${slug}: operational branch node`
  )

  assert(
    Boolean(strategy?.semanticSummary),
    `${slug}: strategy has semantic summary`
  )

  assert(
    invariant?.semanticSummary === problem.invariant,
    `${slug}: invariant uses this problem's invariant`
  )

  assert(
    goal?.expectedEvidencePatterns.length === 0,
    `${slug}: goal has no autonomous evidence`
  )

  assert(
    branch?.expectedEvidencePatterns.length === 0,
    `${slug}: branch has no generic evidence`
  )
}

/* ============================================================
   2. No Contains Duplicate contamination
============================================================ */

for (const slug of FALLBACK_SLUGS) {
  const problem = PROBLEMS.find((p) => p.slug === slug)

  if (!problem) continue

  const graph = getActiveGraph(slug, undefined, problem)

  const ids = graph.nodes.map((n) => n.id)

  assert(
    !ids.includes('hit_branch') &&
    !ids.includes('miss_branch') &&
    !ids.includes('membership_lookup') &&
    !ids.includes('repeated_work'),
    `${slug}: no Contains Duplicate graph contamination`
  )
}

/* ============================================================
   3. Handcrafted graphs remain structurally rich
============================================================ */

const HANDCRAFTED_SLUGS = [
  'contains-duplicate',
  'two-sum',
  'best-time-to-buy-and-sell-stock',
  'valid-parentheses',
  'container-with-most-water',
  'binary-search',
]

for (const slug of HANDCRAFTED_SLUGS) {
  const problem = PROBLEMS.find((p) => p.slug === slug)
  const graph = getActiveGraph(slug, undefined, problem)

  assert(
    graph.nodes.length >= 6,
    `${slug}: handcrafted graph remains structurally rich`
  )
}

/* ============================================================
   4. Goal cannot be grounded from title/slug language
============================================================ */

const anagram = PROBLEMS.find(
  (p) => p.slug === 'valid-anagram'
)

if (!anagram) {
  throw new Error('valid-anagram problem not found')
}

const anagramGraph = getActiveGraph(
  'valid-anagram',
  undefined,
  anagram
)

const initialThread = getDefaultActiveThread()

const titleMention = interpretLearnerMessage(
  "Let's use a frequency map for valid anagram.",
  anagram,
  initialThread,
  anagramGraph
)

let anagramModel = createInitialMentalModel(
  anagramGraph
)

anagramModel = applyInterpretationDelta(
  anagramModel,
  titleMention,
  anagramGraph
)

const anagramGoal = anagramGraph.nodes.find(
  (n) => n.id === 'goal'
)

if (!anagramGoal) {
  throw new Error('valid-anagram goal node not found')
}

assert(
  !isNodeGrounded(
    anagramModel.nodes.goal,
    anagramGoal
  ),
  'Title/slug mention does not ground GOAL'
)

assert(
  anagramModel.nodes.goal.state === 'UNKNOWN',
  'GOAL remains UNKNOWN after title/slug mention'
)

/* ============================================================
   5. Strategy recognition vs articulation
============================================================ */

const substring = PROBLEMS.find(
  (p) => p.slug === 'longest-substring-no-repeat'
)

if (!substring) {
  throw new Error(
    'longest-substring-no-repeat problem not found'
  )
}

const substringGraph = getActiveGraph(
  'longest-substring-no-repeat',
  undefined,
  substring
)

const named = interpretLearnerMessage(
  "I'll use a sliding window.",
  substring,
  initialThread,
  substringGraph
)

let namedModel = createInitialMentalModel(
  substringGraph
)

namedModel = applyInterpretationDelta(
  namedModel,
  named,
  substringGraph
)

assert(
  namedModel.nodes.strategy.recognition >= 0.7,
  'Named strategy reaches recognition threshold'
)

assert(
  namedModel.nodes.strategy.causalUnderstanding === 0,
  'Strategy naming does not create causal understanding'
)

const namedPlan = planPedagogicalAction(
  namedModel,
  initialThread,
  named,
  substringGraph
)

assert(
  namedPlan.targetNodeId === 'invariant' ||
  namedPlan.targetEdgeId === 'strategy_to_invariant',
  'Planner advances from named strategy toward invariant'
)

/* ============================================================
   6. Invariant requires causal reasoning
============================================================ */

const kadane = PROBLEMS.find(
  (p) => p.slug === 'maximum-subarray'
)

if (!kadane) {
  throw new Error(
    'maximum-subarray problem not found'
  )
}

const kadaneGraph = getActiveGraph(
  'maximum-subarray',
  undefined,
  kadane
)

const invariantNode = kadaneGraph.nodes.find(
  (n) => n.id === 'invariant'
)

if (!invariantNode) {
  throw new Error(
    'maximum-subarray invariant node not found'
  )
}

const nonCausal = interpretLearnerMessage(
  'reset to zero',
  kadane,
  initialThread,
  kadaneGraph
)

let kadaneModel = createInitialMentalModel(
  kadaneGraph
)

kadaneModel = applyInterpretationDelta(
  kadaneModel,
  nonCausal,
  kadaneGraph
)

assert(
  !isNodeGrounded(
    kadaneModel.nodes.invariant,
    invariantNode
  ),
  'Invariant keyword alone does not ground invariant'
)

assert(
  kadaneModel.nodes.invariant.causalUnderstanding < 0.5,
  'Non-causal invariant mention stays below causal threshold'
)

const causal = interpretLearnerMessage(
  'We reset the running sum to zero because adding a negative sum would only decrease any future subarray sum.',
  kadane,
  initialThread,
  kadaneGraph
)

kadaneModel = applyInterpretationDelta(
  kadaneModel,
  causal,
  kadaneGraph
)

assert(
  isNodeGrounded(
    kadaneModel.nodes.invariant,
    invariantNode
  ),
  'Causal invariant explanation grounds invariant'
)

/* ============================================================
   7. Real multi-turn progression
============================================================ */

let liveModel = createInitialMentalModel(
  kadaneGraph
)

let liveThread = getDefaultActiveThread()

const strategyTurn = interpretLearnerMessage(
  "Let's use Kadane's algorithm.",
  kadane,
  liveThread,
  kadaneGraph
)

liveModel = applyInterpretationDelta(
  liveModel,
  strategyTurn,
  kadaneGraph
)

const strategyPlan = planPedagogicalAction(
  liveModel,
  liveThread,
  strategyTurn,
  kadaneGraph
)

liveThread = strategyPlan.newThread

assert(
  liveModel.nodes.strategy.recognition >= 0.7,
  'Multi-turn: strategy recognized'
)

assert(
  liveThread.current.targetNodeId === 'invariant',
  'Multi-turn: planner targets invariant'
)

const invariantTurn = interpretLearnerMessage(
  'We reset the running sum to zero because adding a negative sum only hurts future subarray sums.',
  kadane,
  liveThread,
  kadaneGraph
)

liveModel = applyInterpretationDelta(
  liveModel,
  invariantTurn,
  kadaneGraph
)

const invariantPlan = planPedagogicalAction(
  liveModel,
  liveThread,
  invariantTurn,
  kadaneGraph
)

liveThread = invariantPlan.newThread

assert(
  isNodeGrounded(
    liveModel.nodes.invariant,
    invariantNode
  ),
  'Multi-turn: invariant grounds causally'
)

assert(
  liveThread.current.targetNodeId === 'branch',
  'Multi-turn: planner advances to operational branch'
)

const premature = interpretLearnerMessage(
  'I will return the answer in O(n) time.',
  kadane,
  liveThread,
  kadaneGraph
)

liveModel = applyInterpretationDelta(
  liveModel,
  premature,
  kadaneGraph
)

const branchNode = kadaneGraph.nodes.find(
  (n) => n.id === 'branch'
)

if (!branchNode) {
  throw new Error(
    'maximum-subarray branch node not found'
  )
}

assert(
  !isNodeGrounded(
    liveModel.nodes.branch,
    branchNode
  ),
  'Generic return/O(n) does not prematurely ground branch'
)

/* ============================================================
   8. Edge justification remains conservative
============================================================ */

const coMention = interpretLearnerMessage(
  "Kadane's algorithm and resetting the running sum.",
  kadane,
  initialThread,
  kadaneGraph
)

const coMentionJson = JSON.stringify(coMention).toLowerCase()

assert(
  coMention.touchedEdgeIds.length === 0,
  'Co-mention does not justify an edge'
)

assert(
  coMention.touchedNodeIds.length <= 1,
  'Co-mention does not falsely ground multiple concepts'
)

const causalButUnmatched = interpretLearnerMessage(
  "We use Kadane's algorithm because resetting the running sum avoids carrying a negative prefix into future choices.",
  kadane,
  initialThread,
  kadaneGraph
)

assert(
  causalButUnmatched.touchedEdgeIds.length === 0,
  'Causal prose without matched invariant evidence does not justify an edge'
)

assert(
  causalButUnmatched.touchedNodeIds.includes('strategy'),
  'Causal prose still recognizes the strategy'
)

/* ============================================================
   9. Generic fallback renderer
============================================================ */

const strategyPrompt = renderSocraticResponse(
  'DEEPEN_PARTIAL_REASONING',
  'IDENTIFY',
  kadaneGraph.nodes.find(
    (n) => n.id === 'strategy'
  ),
  undefined,
  named,
  kadane,
  kadaneGraph
)

assert(
  !strategyPrompt
    .toLowerCase()
    .includes('contains duplicate'),
  'Fallback renderer does not leak Contains Duplicate wording'
)

const invariantPrompt = renderSocraticResponse(
  'DEEPEN_PARTIAL_REASONING',
  'EXPLAIN',
  invariantNode,
  undefined,
  causal,
  kadane,
  kadaneGraph
)

assert(
  invariantPrompt.includes(
    'core invariant or condition'
  ),
  'Fallback invariant renderer is valid'
)

const branchPrompt = renderSocraticResponse(
  'DEEPEN_PARTIAL_REASONING',
  'APPLY',
  branchNode,
  undefined,
  causal,
  kadane,
  kadaneGraph
)

assert(
  branchPrompt.includes(
    'operational steps and boundaries'
  ),
  'Fallback branch renderer is valid'
)

/* ============================================================
   FINAL RESULT
============================================================ */

console.log('')
console.log('============================================================')
console.log(
  `TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`
)
console.log('============================================================')

if (totalTests !== passedTests) {
  process.exit(1)
}