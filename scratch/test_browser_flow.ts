/**
 * Full Browser Dialogue Sequence Test
 * Simulates the exact multi-turn user conversation from the UI.
 */

import { liteRespond, reconstructMentalModel } from '../src/lib/liteSocratic.ts'
import { extractActiveThread } from '../src/lib/activeThread.ts'
import { PROBLEMS } from '../src/data/problems.ts'
import { getActiveGraph } from '../src/lib/problemGraphs.ts'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')!
const graphCD = getActiveGraph('contains-duplicate')

console.log('============================================================')
console.log('FULL BROWSER DIALOGUE SEQUENCE REGRESSION TEST')
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

let history = [
  {
    role: 'assistant' as const,
    content: `**${cdProblem.title}**\n---\nWhere would you like to start?\n<!--lite:{"current":{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->`,
  },
]

function runTurn(userText: string) {
  const userMsg = { role: 'user' as const, content: userText }
  const nextMessages = [...history, userMsg]
  const fullReply = liteRespond(userMsg.content, cdProblem, nextMessages)
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
  history = [...nextMessages, { role: 'assistant' as const, content: fullReply }]
  const thread = extractActiveThread(history)
  return { visibleReply, fullReply, thread }
}

// Flow 1: "Use a Set"
console.log('--- Step 1: User says "Use a Set" ---')
const turn1 = runTurn('Use a Set')
console.log('Coach reply 1:', turn1.visibleReply)
assert(turn1.thread.current.targetNodeId === 'membership_lookup', 'Turn 1 target is membership_lookup')
assert(turn1.visibleReply.includes('Why does a Set') || turn1.visibleReply.includes('lookup'), 'Turn 1 asks why Set / lookup')

// Flow 2: "bcs complexity is O(1)"
console.log('\n--- Step 2: User says "bcs complexity is O(1)" ---')
const turn2 = runTurn('bcs complexity is O(1)')
console.log('Coach reply 2:', turn2.visibleReply)
assert(turn2.thread.current.targetNodeId === 'hit_branch', 'Turn 2 target is hit_branch')
assert(turn2.visibleReply.includes('already in the Set') || turn2.visibleReply.includes('already in it') || turn2.visibleReply.includes('duplicate'), 'Turn 2 asks about hit branch')

// Flow 3: User answers hit_branch with "it means duplicate so return true"
console.log('\n--- Step 3: User answers hit branch: "return true" ---')
const turn3 = runTurn('return true')
console.log('Coach reply 3:', turn3.visibleReply)
assert(turn3.thread.current.targetNodeId === 'miss_branch', 'Turn 3 target is miss_branch', `Got: ${turn3.thread.current.targetNodeId}`)
assert(turn3.visibleReply.includes('NOT in the Set'), 'Turn 3 asks what to do when NOT in the Set')

// Flow 4: User answers miss_branch with "then we add it to the set"
console.log('\n--- Step 4: User answers miss branch: "then we add it to the set" ---')
const turn4 = runTurn('then we add it to the set')
console.log('Coach reply 4:', turn4.visibleReply)
assert(
  turn4.thread.current.targetNodeId === 'termination',
  'Turn 4 targetNodeId is termination',
  `Got: ${turn4.thread.current.targetNodeId}`
)
assert(
  turn4.thread.current.pedagogicalAction === 'DEEPEN_PARTIAL_REASONING',
  'Turn 4 probes termination condition before OFFER_CODE_IMPLEMENTATION',
  `Action: ${turn4.thread.current.pedagogicalAction}`
)
assert(turn4.thread.current.targetNodeId !== 'goal', 'Turn 4 targetNodeId never falls back to goal')
assert(
  turn4.visibleReply.includes('reach the end') || turn4.visibleReply.includes('end of the array') || turn4.visibleReply.includes('without finding'),
  'Turn 4 asks what to return at the end of the array'
)

// Step 5: User responds with a natural-language implementation explanation
console.log('\n--- Step 5: User provides natural-language implementation explanation ---')
const turn5 = runTurn(
  "I'll loop through the array, check if the number is already in the Set, return true if it is, otherwise add it to the Set. If I finish the loop, return false."
)
console.log('Coach reply 5:', turn5.visibleReply)
assert(
  !turn5.visibleReply.includes('Can you write the code?'),
  'Step 5: Does NOT repeat "Can you write the code?" after explanation'
)
assert(
  turn5.visibleReply.includes('Excellent work') || turn5.visibleReply.includes('constraints'),
  'Step 5: Validates solution and complexity'
)

// Step 6: User provides actual C++ code
console.log('\n--- Step 6: User provides actual C++ code ---')
const turn6 = runTurn(`bool containsDuplicate(vector<int>& nums) {
    unordered_set<int> seen;
    for (int x : nums) {
        if (seen.count(x)) return true;
        seen.insert(x);
    }
    return false;
}`)
console.log('Coach reply 6:', turn6.visibleReply)
assert(
  !turn6.visibleReply.includes('Can you write the code?'),
  'Step 6: Does NOT repeat "Can you write the code?" after code submission'
)
assert(
  turn6.visibleReply.includes('Excellent work') || turn6.visibleReply.includes('constraints'),
  'Step 6: Validates code submission'
)

// Step 7: Idempotence check (second submission)
console.log('\n--- Step 7: Second message after completion ---')
const turn7 = runTurn('looks good, thanks!')
console.log('Coach reply 7:', turn7.visibleReply)
assert(
  !turn7.visibleReply.includes('Can you write the code?'),
  'Step 7: No loop on subsequent messages'
)

// ─────────────────────────────────────────────────────────────────────────────
// Flow B: User answers "then we add it to the set" directly when hit_branch was asked
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- Flow B: User answers miss_branch when hit_branch was asked ---')

let historyB = [
  {
    role: 'assistant' as const,
    content: `**${cdProblem.title}**\n---\nWhere would you like to start?\n<!--lite:{"current":{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->`,
  },
]

function runTurnB(userText: string) {
  const userMsg = { role: 'user' as const, content: userText }
  const nextMessages = [...historyB, userMsg]
  const fullReply = liteRespond(userMsg.content, cdProblem, nextMessages)
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
  historyB = [...nextMessages, { role: 'assistant' as const, content: fullReply }]
  const thread = extractActiveThread(historyB)
  return { visibleReply, fullReply, thread }
}

runTurnB('Use a Set')
runTurnB('bcs complexity is O(1)')
const turnB3 = runTurnB('then we add it to the set')
console.log('Flow B Coach reply 3:', turnB3.visibleReply)
assert(
  turnB3.thread.current.targetNodeId === 'hit_branch',
  'Flow B Turn 3: miss_branch was articulated, so coach now asks for the remaining hit_branch',
  `Got: ${turnB3.thread.current.targetNodeId}`
)
assert(
  turnB3.visibleReply.includes('already in the Set') || turnB3.visibleReply.includes('already in it'),
  'Flow B Turn 3: asks for the hit branch condition, NOT the miss branch again',
  turnB3.visibleReply
)

const turnB4 = runTurnB('return true')
console.log('Flow B Coach reply 4:', turnB4.visibleReply)
assert(
  turnB4.thread.current.targetNodeId === 'termination',
  'Flow B Turn 4: Both branches articulated, advances to termination probe',
  `Got: ${turnB4.thread.current.targetNodeId}`
)
assert(
  turnB4.thread.current.pedagogicalAction === 'DEEPEN_PARTIAL_REASONING',
  'Flow B Turn 4: Probes termination condition before OFFER_CODE_IMPLEMENTATION',
  `Action: ${turnB4.thread.current.pedagogicalAction}`
)

const turnB5 = runTurnB('If we reach the end without finding duplicates, return false.')
console.log('Flow B Coach reply 5:', turnB5.visibleReply)
assert(
  turnB5.thread.current.pedagogicalAction === 'OFFER_CODE_IMPLEMENTATION',
  'Flow B Turn 5: Termination articulated, advances to OFFER_CODE_IMPLEMENTATION',
  `Action: ${turnB5.thread.current.pedagogicalAction}`
)
// ─────────────────────────────────────────────────────────────────────────────
// Flow C: Complete Implementation Summary Jump (Browser Regression Utterance)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- Flow C: Complete Implementation Summary Jump ---')

let historyC = [
  {
    role: 'assistant' as const,
    content: `**${cdProblem.title}**\n---\nWhere would you like to start?\n<!--lite:{"current":{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->`,
  },
]

function runTurnC(userText: string) {
  const userMsg = { role: 'user' as const, content: userText }
  const nextMessages = [...historyC, userMsg]
  const fullReply = liteRespond(userMsg.content, cdProblem, nextMessages)
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
  historyC = [...nextMessages, { role: 'assistant' as const, content: fullReply }]
  const thread = extractActiveThread(historyC)
  const { model, currentInterpretation } = reconstructMentalModel(historyC, userText, graphCD, cdProblem)
  return { visibleReply, fullReply, thread, model, currentInterpretation }
}

runTurnC('Use a Set')
const turnC2 = runTurnC('bcs complexity is O(1)')
assert(turnC2.thread.current.targetNodeId === 'hit_branch', 'Flow C Turn 2 target is hit_branch')
assert(turnC2.visibleReply.includes('already in the Set') || turnC2.visibleReply.includes('already in it'), 'Flow C Turn 2 asks about hit branch')

// Turn C3: Learner responds with complete natural-language implementation summary
const turnC3 = runTurnC(
  "I'll loop through the array, check if the number is already in the Set, return true if it is, otherwise add it to the Set. If I finish the loop, return false."
)
console.log('Flow C Turn 3 Coach reply:', turnC3.visibleReply)

assert(
  turnC3.model.nodes['hit_branch']?.state === 'ARTICULATED' || turnC3.model.nodes['hit_branch']?.state === 'APPLIED',
  'Flow C Turn 3: hit_branch becomes ARTICULATED/APPLIED'
)
assert(
  turnC3.model.nodes['miss_branch']?.state === 'ARTICULATED' || turnC3.model.nodes['miss_branch']?.state === 'APPLIED',
  'Flow C Turn 3: miss_branch becomes ARTICULATED/APPLIED'
)
assert(
  turnC3.model.nodes['termination']?.state === 'ARTICULATED' || turnC3.model.nodes['termination']?.state === 'APPLIED',
  'Flow C Turn 3: termination is recognized and grounded'
)
assert(turnC3.thread.current.targetNodeId !== 'hit_branch', 'Flow C Turn 3: Planner does NOT re-select hit_branch')
assert(turnC3.thread.current.targetEdgeId !== 'lookup_to_hit', 'Flow C Turn 3: Planner does NOT re-select lookup_to_hit')
assert(turnC3.thread.current.targetNodeId !== 'goal', 'Flow C Turn 3: Planner does NOT select goal')
assert(
  turnC3.thread.current.pedagogicalAction === 'OFFER_CODE_IMPLEMENTATION',
  'Flow C Turn 3: Action is OFFER_CODE_IMPLEMENTATION'
)
assert(
  turnC3.thread.current.cognitiveTask === 'SUMMARIZE',
  'Flow C Turn 3: CognitiveTask is SUMMARIZE (solution validated)'
)
assert(
  !turnC3.visibleReply.includes('When you\'re scanning a number and find that it\'s already in the Set'),
  'Flow C Turn 3: Does NOT repeat hit branch question'
)
assert(
  !turnC3.visibleReply.includes('Can you write the code?'),
  'Flow C Turn 3: Does NOT ask "Can you write the code?" when full summary provided'
)
assert(
  turnC3.visibleReply.includes('Excellent work') || turnC3.visibleReply.includes('constraints'),
  'Flow C Turn 3: Validates complete solution and complexity'
)

// Turn C4: Idempotent continuation
const turnC4 = runTurnC('thanks!')
console.log('Flow C Turn 4 Coach reply:', turnC4.visibleReply)
assert(
  !turnC4.visibleReply.includes('already in the Set'),
  'Flow C Turn 4: Does NOT reopen hit branch on subsequent message'
)
assert(
  !turnC4.visibleReply.includes('Can you write the code?'),
  'Flow C Turn 4: Remains stable on subsequent message'
)

console.log('\n============================================================')
console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
console.log('============================================================')
