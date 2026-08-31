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
  turn4.thread.current.pedagogicalAction === 'OFFER_CODE_IMPLEMENTATION',
  'Turn 4 advances to OFFER_CODE_IMPLEMENTATION',
  `Action: ${turn4.thread.current.pedagogicalAction}`
)
assert(turn4.thread.current.targetNodeId === 'termination', 'Turn 4 targetNodeId is termination')
assert(turn4.thread.current.targetNodeId !== 'goal', 'Turn 4 targetNodeId never falls back to goal')
assert(turn4.visibleReply.includes('Can you write the code?'), 'Turn 4 asks to write code')

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
  turnB4.thread.current.pedagogicalAction === 'OFFER_CODE_IMPLEMENTATION',
  'Flow B Turn 4: Both branches articulated, advances to OFFER_CODE_IMPLEMENTATION',
  `Action: ${turnB4.thread.current.pedagogicalAction}`
)
assert(turnB4.thread.current.targetNodeId === 'termination', 'Flow B Turn 4 targetNodeId is termination')
assert(turnB4.thread.current.targetNodeId !== 'goal', 'Flow B Turn 4 targetNodeId never falls back to goal')

console.log('\n============================================================')
console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
console.log('============================================================')
