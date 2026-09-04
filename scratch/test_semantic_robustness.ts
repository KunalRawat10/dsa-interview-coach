import { interpretLearnerMessageAsync } from '../src/lib/socraticInterpreter.ts'
import { evaluateDialogueStepAsync } from '../src/lib/liteSocratic.ts'
import { PROBLEMS } from '../src/data/problems.ts'
import { getActiveGraph } from '../src/lib/problemGraphs.ts'
import {
  createInitialMentalModel,
  applyInterpretationDelta,
  isNodeGrounded,
  isNodeCausal,
} from '../src/lib/mentalModel.ts'
import { planPedagogicalAction } from '../src/lib/pedagogicalPlanner.ts'
import { formatStructuredTutorContext } from '../src/lib/tutorContext.ts'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')!
const graphCD = getActiveGraph('contains-duplicate')

let totalTests = 0
let passedTests = 0

function assert(condition: boolean, message: string) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✓ ${message}`)
  } else {
    console.error(`  ✗ FAIL: ${message}`)
  }
}

async function runSemanticRobustnessSuite() {
  console.log('============================================================')
  console.log('PHASE 2 — DEDICATED SEMANTIC ROBUSTNESS TEST SUITE')
  console.log('============================================================\n')

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
  // 1. MEMORY CONCEPT ROBUSTNESS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Concept: memory ---')
  const memoryPositives = [
    "I'd store the numbers I've already seen.",
    "I'd remember the values we've encountered.",
    "I'd keep track of previously visited numbers.",
    "I'd save the numbers somewhere as I go.",
    "I need some way to remember what I've already seen.",
    "I'd maintain a collection of values I've encountered.",
    "I'd record each value so I can check it later.",
    "I'd keep the values I've processed so far.",
    "I'd store the numbers I've come across.",
    "I'd remember earlier values while scanning.",
  ]

  for (let i = 0; i < memoryPositives.length; i++) {
    const text = memoryPositives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, defaultThread, graphCD)
    assert(
      interp.touchedNodeIds.includes('memory'),
      `1.P${i + 1}. Positive memory: "${text.slice(0, 45)}..." grounds memory`
    )
    assert(
      interp.touchedEdgeIds.length === 0,
      `1.P${i + 1}. Edge invariant: no edge automatically claimed`
    )
  }

  const memoryNegatives = [
    'I like playing soccer on weekends.',
    "I'd sort the array using quicksort.",
    'We could do something with the data.',
    'What are the memory constraints of this problem?',
    "I can't remember the exact syntax for loops.",
  ]

  for (let i = 0; i < memoryNegatives.length; i++) {
    const text = memoryNegatives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, defaultThread, graphCD)
    assert(
      !interp.touchedNodeIds.includes('memory'),
      `1.N${i + 1}. Negative memory: "${text.slice(0, 45)}..." rejects memory`
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. SET_STRUCTURE CONCEPT ROBUSTNESS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Concept: set_structure ---')
  const setThread = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'set_structure',
      targetEdgeId: 'memory_to_set',
      cognitiveTask: 'JUSTIFY' as const,
      pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
    },
    returnStack: [],
  }

  const setPositives = [
    "I'd use a hash set for that.",
    'We can put elements in a set structure.',
    'A hash table would store the seen numbers.',
    'Store those values in a HashSet collection.',
    "I'll maintain a set of unique items.",
    'A hash set allows storing unique elements.',
    "Let's use a set data structure.",
    'Put each visited number into a set.',
    'A hashset is the right container here.',
    'We can hold them in a hash set.',
  ]

  for (let i = 0; i < setPositives.length; i++) {
    const text = setPositives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, setThread, graphCD)
    assert(
      interp.touchedNodeIds.includes('set_structure'),
      `2.P${i + 1}. Positive set_structure: "${text.slice(0, 45)}..." grounds set_structure`
    )
  }

  const setNegatives = [
    'I set the variable x equal to zero.',
    "Let's set up the test cases.",
    'Use a binary search tree to balance elements.',
    "I don't know which data structure to choose.",
  ]

  for (let i = 0; i < setNegatives.length; i++) {
    const text = setNegatives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, setThread, graphCD)
    assert(
      !interp.touchedNodeIds.includes('set_structure'),
      `2.N${i + 1}. Negative set_structure: "${text.slice(0, 45)}..." rejects set_structure`
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. MEMBERSHIP_LOOKUP CONCEPT ROBUSTNESS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Concept: membership_lookup ---')
  const lookupThread = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'membership_lookup',
      targetEdgeId: 'set_to_lookup',
      cognitiveTask: 'EXPLAIN' as const,
      pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
    },
    returnStack: [],
  }

  const lookupPositives = [
    "Before adding a value, I'd check whether it is already there.",
    'Check if the current number is in the set.',
    'Lookup the element in the set in O(1) time.',
    'Perform a constant-time membership query.',
    'See if the set contains this number.',
    'Query the set for the current value.',
    'Ask whether the number has already been added.',
    'Check if the item already exists in our collection.',
    'Look up the current element in our set.',
    'Verify if the number is already present.',
  ]

  for (let i = 0; i < lookupPositives.length; i++) {
    const text = lookupPositives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, lookupThread, graphCD)
    assert(
      interp.touchedNodeIds.includes('membership_lookup'),
      `3.P${i + 1}. Positive membership_lookup: "${text.slice(0, 45)}..." grounds membership_lookup`
    )
  }

  const lookupNegatives = [
    "I'll look up the problem description again.",
    'Check if the array index is out of bounds.',
    'Binary search does a lookup in logarithmic time.',
    'We need to check things carefully.',
  ]

  for (let i = 0; i < lookupNegatives.length; i++) {
    const text = lookupNegatives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, lookupThread, graphCD)
    assert(
      !interp.touchedNodeIds.includes('membership_lookup'),
      `3.N${i + 1}. Negative membership_lookup: "${text.slice(0, 45)}..." rejects membership_lookup`
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. HIT_BRANCH CONCEPT ROBUSTNESS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Concept: hit_branch ---')
  const hitThread = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'hit_branch',
      targetEdgeId: 'lookup_to_hit',
      cognitiveTask: 'APPLY' as const,
      pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
    },
    returnStack: [],
  }

  const hitPositives = [
    "If it is already there, we've found a duplicate.",
    'If the lookup succeeds, return true immediately.',
    'Finding an existing number means duplicate detected.',
    'If the set contains it, return true.',
    'When a number is already present, we have our answer true.',
    'If already in the set, that is a duplicate match.',
    'A hit in the set means return true.',
    'If we find it in the set, we return true.',
    'If seen before, return true.',
    'When the check returns true, we return true for duplicate.',
    'it tells us that it is a duplicate number',
  ]

  for (let i = 0; i < hitPositives.length; i++) {
    const text = hitPositives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, hitThread, graphCD)
    assert(
      interp.touchedNodeIds.includes('hit_branch'),
      `4.P${i + 1}. Positive hit_branch: "${text.slice(0, 45)}..." grounds hit_branch`
    )
  }

  const hitNegatives = [
    'If it is already there, continue to the next element.',
    'If we hit a wall, backtrack.',
    'Return true if the array is empty.',
    'Duplicates are interesting.',
  ]

  for (let i = 0; i < hitNegatives.length; i++) {
    const text = hitNegatives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, hitThread, graphCD)
    assert(
      !interp.touchedNodeIds.includes('hit_branch'),
      `4.N${i + 1}. Negative hit_branch: "${text.slice(0, 45)}..." rejects hit_branch`
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4b. DIALOGUE STATE VERIFICATION FOR "it tells us that it is a duplicate number"
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4b. Dialogue State: "it tells us that it is a duplicate number" ---')
  const hitStepHistory = [
    {
      role: 'assistant' as const,
      content: `**${cdProblem.title}**\n---\nWhere would you like to start?\n<!--lite:{"current":{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->`,
    },
    { role: 'user' as const, content: 'Use a Set' },
    { role: 'assistant' as const, content: `Why...\n<!--lite:{"current":{"approachId":"hash-set-canonical","targetNodeId":"membership_lookup","cognitiveTask":"EXPLAIN","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP","targetEdgeId":"set_to_lookup"},"returnStack":[]}-->` },
    { role: 'user' as const, content: 'bcs complexity is O(1)' },
    { role: 'assistant' as const, content: `Exactly — Set lookup is constant time. When you're scanning a number and find that it's already in the Set, what does that tell us?\n<!--lite:{"current":{"approachId":"hash-set-canonical","targetNodeId":"hit_branch","cognitiveTask":"JUSTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP","targetEdgeId":"lookup_to_hit"},"returnStack":[]}-->` },
  ]
  const hitStepText = 'it tells us that it is a duplicate number'
  const hitStep = await evaluateDialogueStepAsync(hitStepText, cdProblem, [...hitStepHistory, { role: 'user', content: hitStepText }])
  assert(hitStep.mentalModel.nodes['hit_branch']?.state === 'ARTICULATED', '4b.1 hit_branch = ARTICULATED')
  assert(hitStep.mentalModel.nodes['termination']?.state === 'UNKNOWN', '4b.2 termination = UNKNOWN')
  assert(hitStep.mentalModel.nodes['miss_branch']?.state === 'UNKNOWN', '4b.3 miss_branch = UNKNOWN unless independently grounded')
  assert(hitStep.decision.targetNodeId === 'miss_branch', '4b.4 planner target = miss_branch')
  assert(hitStep.decision.action !== 'OFFER_CODE_IMPLEMENTATION', '4b.5 MUST NOT = OFFER_CODE_IMPLEMENTATION')

  // ─────────────────────────────────────────────────────────────────────────
  // 4c. HIT_BRANCH CONVERSATIONAL PROGRESSION (Utterance A & Utterance B)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4c. Progression: Utterance A & Utterance B ---')
  const utteranceA = "If it is already there, we've found a duplicate."
  const resA = await evaluateDialogueStepAsync(utteranceA, cdProblem, [...hitStepHistory, { role: 'user', content: utteranceA }])
  assert(resA.mentalModel.nodes['hit_branch']?.state === 'ARTICULATED', '4c.1 Utterance A hit_branch = ARTICULATED')
  assert(resA.mentalModel.nodes['miss_branch']?.state === 'UNKNOWN', '4c.2 Utterance A miss_branch = UNKNOWN')
  assert(resA.mentalModel.nodes['termination']?.state === 'UNKNOWN', '4c.3 Utterance A termination = UNKNOWN')
  assert(resA.decision.targetNodeId === 'miss_branch', '4c.4 Utterance A target = miss_branch')
  assert(resA.decision.action !== 'OFFER_CODE_IMPLEMENTATION', '4c.5 Utterance A action != OFFER_CODE_IMPLEMENTATION')

  const utteranceB = "When the value is already in the set, we know we've seen it before."
  const resB = await evaluateDialogueStepAsync(utteranceB, cdProblem, [...hitStepHistory, { role: 'user', content: utteranceB }])
  assert(resB.mentalModel.nodes['hit_branch']?.state === 'ARTICULATED', '4c.6 Utterance B hit_branch = ARTICULATED')
  assert(resB.mentalModel.nodes['miss_branch']?.state === 'UNKNOWN', '4c.7 Utterance B miss_branch = UNKNOWN')
  assert(resB.mentalModel.nodes['termination']?.state === 'UNKNOWN', '4c.8 Utterance B termination = UNKNOWN')
  assert(resB.decision.targetNodeId === 'miss_branch', '4c.9 Utterance B target = miss_branch')
  assert(resB.decision.action !== 'OFFER_CODE_IMPLEMENTATION', '4c.10 Utterance B action != OFFER_CODE_IMPLEMENTATION')


  // ─────────────────────────────────────────────────────────────────────────
  // 5. MISS_BRANCH CONCEPT ROBUSTNESS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Concept: miss_branch ---')
  const missThread = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'miss_branch',
      targetEdgeId: 'lookup_to_miss',
      cognitiveTask: 'APPLY' as const,
      pedagogicalAction: 'PROBE_ADJACENT_RELATIONSHIP' as const,
    },
    returnStack: [],
  }

  const missPositives = [
    "Otherwise I'd add it and continue.",
    "If it's new, insert it into the set.",
    'If not found in the set, record it and keep scanning.',
    'Save unseen numbers into the set and move to next.',
    "When it's not present, store the number in the set.",
    "If it's absent from the set, add it.",
    'Put the new value in the set and advance.',
    'Insert the number into the set if missing.',
    'If not in set, add it and continue looping.',
    'Otherwise add the element to our set.',
    'we should add it in the set',
  ]

  for (let i = 0; i < missPositives.length; i++) {
    const text = missPositives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, missThread, graphCD)
    assert(
      interp.touchedNodeIds.includes('miss_branch'),
      `5.P${i + 1}. Positive miss_branch: "${text.slice(0, 45)}..." grounds miss_branch`
    )
  }

  const missNegatives = [
    'If not found, return false immediately.',
    'I missed what you said earlier.',
    'Add two numbers together.',
    'We could add something else later.',
  ]

  for (let i = 0; i < missNegatives.length; i++) {
    const text = missNegatives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, missThread, graphCD)
    assert(
      !interp.touchedNodeIds.includes('miss_branch'),
      `5.N${i + 1}. Negative miss_branch: "${text.slice(0, 45)}..." rejects miss_branch`
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. TERMINATION CONCEPT ROBUSTNESS
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Concept: termination ---')
  const termThread = {
    current: {
      approachId: 'canonical',
      targetNodeId: 'termination',
      cognitiveTask: 'APPLY' as const,
      pedagogicalAction: 'DEEPEN_PARTIAL_REASONING' as const,
    },
    returnStack: [],
  }

  const termPositives = [
    'If I reach the end without finding one, there are no duplicates.',
    'Return false after the loop finishes.',
    'If the entire array is scanned with no hits, return false.',
    'Exhausting the loop means all elements are unique, return false.',
    'If we finish scanning without duplicates, the answer is false.',
    'At the end of the loop, return false.',
    'If no duplicate was found throughout the whole list, return false.',
    'When loop terminates with no match, return false.',
    'Once the array is exhausted without a match, return false.',
    'Return false if we check all numbers without finding a duplicate.',
  ]

  for (let i = 0; i < termPositives.length; i++) {
    const text = termPositives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, termThread, graphCD)
    assert(
      interp.touchedNodeIds.includes('termination'),
      `6.P${i + 1}. Positive termination: "${text.slice(0, 45)}..." grounds termination`
    )
  }

  const termNegatives = [
    'Return true at the end of the loop.',
    'Terminate the program on error.',
    'End of story.',
    'We finish whenever.',
  ]

  for (let i = 0; i < termNegatives.length; i++) {
    const text = termNegatives[i]
    const interp = await interpretLearnerMessageAsync(text, cdProblem, termThread, graphCD)
    assert(
      !interp.touchedNodeIds.includes('termination'),
      `6.N${i + 1}. Negative termination: "${text.slice(0, 45)}..." rejects termination`
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. MULTI-CONCEPT UTTERANCE & EDGE NON-JUSTIFICATION INVARIANT
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Multi-Concept Utterance & Edge Invariant ---')
  const multiText = "I'd keep the values I've seen in a set and check the set before adding a new value."
  const interpMulti = await interpretLearnerMessageAsync(multiText, cdProblem, defaultThread, graphCD)
  assert(interpMulti.touchedNodeIds.includes('memory'), '7.1 Multi-concept: grounds memory')
  assert(interpMulti.touchedNodeIds.includes('set_structure'), '7.2 Multi-concept: grounds set_structure')
  assert(interpMulti.touchedNodeIds.includes('membership_lookup'), '7.3 Multi-concept: grounds membership_lookup')
  assert(!interpMulti.touchedEdgeIds.includes('memory_to_set'), '7.4 Invariant: memory_to_set NOT justified from node mentions')
  assert(!interpMulti.touchedEdgeIds.includes('set_to_lookup'), '7.5 Invariant: set_to_lookup NOT justified from node mentions')

  // ─────────────────────────────────────────────────────────────────────────
  // 8. FULL 7-TURN NATURAL DIALOGUE PROGRESSION
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. Full 7-Turn Natural Dialogue Progression ---')
  let history: { role: 'assistant' | 'user'; content: string }[] = [
    {
      role: 'assistant',
      content: `**${cdProblem.title}**\n---\nWhere would you like to start?\n<!--lite:{"current":{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->`,
    },
  ]

  // Turn 1
  const turn1Text = "I'll explain my approach"
  history.push({ role: 'user', content: turn1Text })
  const step1 = await evaluateDialogueStepAsync(turn1Text, cdProblem, history)
  assert(step1.decision.targetNodeId === 'goal', '8.Turn 1: planner targets goal on generic intent')
  history.push({ role: 'assistant', content: step1.fullResponseWithMeta })

  // Turn 2
  const turn2Text = "I'd keep the values we've encountered somewhere so we can check them quickly."
  history.push({ role: 'user', content: turn2Text })
  const step2 = await evaluateDialogueStepAsync(turn2Text, cdProblem, history)
  assert(step2.mentalModel.nodes['memory']?.state === 'ARTICULATED', '8.Turn 2: memory becomes ARTICULATED')
  assert(step2.decision.targetNodeId === 'set_structure', '8.Turn 2: planner advances to set_structure')
  assert(step2.decision.targetEdgeId === 'memory_to_set', '8.Turn 2: planner probes memory_to_set')
  history.push({ role: 'assistant', content: step2.fullResponseWithMeta })

  // Turn 3
  const turn3Text = "I'd use a hash set for that."
  history.push({ role: 'user', content: turn3Text })
  const step3 = await evaluateDialogueStepAsync(turn3Text, cdProblem, history)
  assert(step3.mentalModel.nodes['set_structure']?.state === 'ARTICULATED', '8.Turn 3: set_structure becomes ARTICULATED')
  assert(step3.decision.targetNodeId === 'membership_lookup', '8.Turn 3: planner advances to membership_lookup')
  assert(step3.decision.targetEdgeId === 'set_to_lookup', '8.Turn 3: planner probes set_to_lookup')
  history.push({ role: 'assistant', content: step3.fullResponseWithMeta })

  // Turn 4
  const turn4Text = "Before adding a value, I'd check whether it is already there."
  history.push({ role: 'user', content: turn4Text })
  const step4 = await evaluateDialogueStepAsync(turn4Text, cdProblem, history)
  assert(step4.mentalModel.nodes['membership_lookup']?.state === 'ARTICULATED', '8.Turn 4: membership_lookup becomes ARTICULATED')
  assert(step4.decision.targetNodeId === 'hit_branch', '8.Turn 4: planner advances to hit_branch')
  assert(step4.decision.targetEdgeId === 'lookup_to_hit', '8.Turn 4: planner probes lookup_to_hit')
  history.push({ role: 'assistant', content: step4.fullResponseWithMeta })

  // Turn 5
  const turn5Text = "If it is already there, we've found a duplicate."
  history.push({ role: 'user', content: turn5Text })
  const step5 = await evaluateDialogueStepAsync(turn5Text, cdProblem, history)
  assert(step5.mentalModel.nodes['hit_branch']?.state === 'ARTICULATED', '8.Turn 5: hit_branch becomes ARTICULATED')
  assert(step5.decision.targetNodeId === 'miss_branch', '8.Turn 5: planner advances to miss_branch')
  assert(step5.decision.targetEdgeId === 'lookup_to_miss', '8.Turn 5: planner probes lookup_to_miss')
  history.push({ role: 'assistant', content: step5.fullResponseWithMeta })

  // Turn 6
  const turn6Text = "Otherwise I'd add it and continue."
  history.push({ role: 'user', content: turn6Text })
  const step6 = await evaluateDialogueStepAsync(turn6Text, cdProblem, history)
  assert(step6.mentalModel.nodes['miss_branch']?.state === 'ARTICULATED', '8.Turn 6: miss_branch becomes ARTICULATED')
  assert(step6.decision.targetNodeId === 'termination', '8.Turn 6: planner advances to termination')
  assert(!step6.decision.targetEdgeId, '8.Turn 6: termination is a sink node without target edge')
  history.push({ role: 'assistant', content: step6.fullResponseWithMeta })

  // Turn 7
  const turn7Text = "If I reach the end without finding one, there are no duplicates."
  history.push({ role: 'user', content: turn7Text })
  const step7 = await evaluateDialogueStepAsync(turn7Text, cdProblem, history)
  assert(step7.mentalModel.nodes['termination']?.state === 'ARTICULATED', '8.Turn 7: termination becomes ARTICULATED')
  assert(step7.decision.action === 'OFFER_CODE_IMPLEMENTATION', '8.Turn 7: planner reaches OFFER_CODE_IMPLEMENTATION')
  assert(
    step7.decision.cognitiveTask === 'IMPLEMENT' || step7.decision.cognitiveTask === 'SUMMARIZE',
    '8.Turn 7: cognitiveTask is IMPLEMENT or SUMMARIZE'
  )

  // ─────────────────────────────────────────────────────────────────────────
  // 9. PHASE C — REGRESSION SUITE: CO-MENTION VS CAUSAL UNDERSTANDING
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 9. Phase C: Co-Mention vs Causal Grounding Regressions ---')

  // 9.A Pure co-mention: "I know about nested loops and hash sets."
  const coMentionTextA = 'I know about nested loops and hash sets.'
  const interpCoA = await interpretLearnerMessageAsync(coMentionTextA, cdProblem, defaultThread, graphCD)
  const baseModelCoA = createInitialMentalModel(graphCD)
  // Ensure repeated_work and set_structure are touched
  interpCoA.touchedNodeIds = ['repeated_work', 'set_structure']
  const modelCoA = applyInterpretationDelta(baseModelCoA, interpCoA, graphCD)
  const rwRecordCoA = modelCoA.nodes['repeated_work']
  const rwNode = graphCD.nodes.find((n) => n.id === 'repeated_work')!
  assert(
    rwRecordCoA !== undefined && rwRecordCoA.causalUnderstanding <= 0.2,
    `9.A Co-mention A: causalUnderstanding <= 0.2 (got ${rwRecordCoA?.causalUnderstanding})`
  )
  assert(
    !isNodeGrounded(rwRecordCoA, rwNode),
    '9.A Co-mention A: must NOT ground causal node repeated_work'
  )
  assert(
    rwRecordCoA?.state === 'NAMED',
    `9.A Co-mention A: state is NAMED (got ${rwRecordCoA?.state}), not ARTICULATED`
  )

  // 9.B Pure co-mention: "We have memory and a set."
  const coMentionTextB = 'We have memory and a set.'
  const interpCoB = await interpretLearnerMessageAsync(coMentionTextB, cdProblem, defaultThread, graphCD)
  const baseModelCoB = createInitialMentalModel(graphCD)
  const modelCoB = applyInterpretationDelta(baseModelCoB, interpCoB, graphCD)
  const memoryRecord = modelCoB.nodes['memory']
  const setRecordCoB = modelCoB.nodes['set_structure']
  assert(
    memoryRecord !== undefined && memoryRecord.causalUnderstanding <= 0.2,
    `9.B Co-mention B: memory causalUnderstanding <= 0.2 (got ${memoryRecord?.causalUnderstanding})`
  )
  assert(
    setRecordCoB !== undefined && setRecordCoB.causalUnderstanding <= 0.2,
    `9.B Co-mention B: set_structure causalUnderstanding <= 0.2 (got ${setRecordCoB?.causalUnderstanding})`
  )
  assert(
    !modelCoB.edges['memory_to_set'] || modelCoB.edges['memory_to_set'].state === 'UNCLAIMED',
    '9.B Co-mention B: edge memory_to_set remains UNCLAIMED'
  )

  // 9.C Genuine causal explanation
  const utteranceC =
    "We use a Set because we can check whether we've already seen the value without scanning the array again."
  const interpC = await interpretLearnerMessageAsync(utteranceC, cdProblem, defaultThread, graphCD)
  const baseModelC = createInitialMentalModel(graphCD)
  const modelC = applyInterpretationDelta(baseModelC, interpC, graphCD)
  const setRecordC = modelC.nodes['set_structure']
  const setNode = graphCD.nodes.find((n) => n.id === 'set_structure')!
  assert(
    setRecordC !== undefined && setRecordC.recognition >= 0.8,
    `9.C Genuine causal: High recognition on set_structure (got ${setRecordC?.recognition})`
  )
  assert(
    setRecordC !== undefined && setRecordC.causalUnderstanding >= 0.7,
    `9.C Genuine causal: High causalUnderstanding on set_structure (got ${setRecordC?.causalUnderstanding})`
  )
  assert(
    isNodeGrounded(setRecordC, setNode),
    '9.C Genuine causal: set_structure grounds successfully'
  )

  // 9.D Recognition-only: "A Set stores the values."
  const utteranceD = 'A Set stores the values.'
  const interpD = await interpretLearnerMessageAsync(utteranceD, cdProblem, defaultThread, graphCD)
  const baseModelD = createInitialMentalModel(graphCD)
  const modelD = applyInterpretationDelta(baseModelD, interpD, graphCD)
  const setRecordD = modelD.nodes['set_structure']
  assert(
    setRecordD !== undefined && setRecordD.recognition >= 0.8,
    `9.D Recognition-only: High recognition on set_structure (got ${setRecordD?.recognition})`
  )
  assert(
    setRecordD !== undefined && setRecordD.causalUnderstanding <= 0.2,
    `9.D Recognition-only: Low causalUnderstanding <= 0.2 on set_structure (got ${setRecordD?.causalUnderstanding})`
  )

  // 9.E Edge decoupling
  assert(
    !modelD.edges['set_to_lookup'] || modelD.edges['set_to_lookup'].state === 'UNCLAIMED',
    '9.E Edge decoupling: set_to_lookup remains UNCLAIMED on recognition alone'
  )
  assert(
    !modelD.edges['memory_to_set'] || modelD.edges['memory_to_set'].state === 'UNCLAIMED',
    '9.E Edge decoupling: memory_to_set remains UNCLAIMED on recognition alone'
  )

  // ─────────────────────────────────────────────────────────────────────────
  // 10. ASYMPTOTIC COMPLEXITY & CAUSAL CONNECTIVE REGRESSION
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 10. Asymptotic Complexity & Causal Connective Regressions ---')

  const lookupNode = graphCD.nodes.find((n) => n.id === 'membership_lookup')!
  const rwNode10 = graphCD.nodes.find((n) => n.id === 'repeated_work')!

  // 10.A Asymptotic matching cases demonstrating causal relationships
  const complexityCases = [
    { text: 'bcs complexity is O(1)', targetNode: 'membership_lookup', nodeDef: lookupNode },
    { text: 'because lookup takes O(1) time', targetNode: 'membership_lookup', nodeDef: lookupNode },
    { text: 'nested loop takes O(n^2) time so we should optimize it', targetNode: 'repeated_work', nodeDef: rwNode10 },
    { text: 'quadratic scan is O(n²) which causes repeated work', targetNode: 'repeated_work', nodeDef: rwNode10 },
    { text: 'linear scan takes O(n) work without a hash table', targetNode: 'repeated_work', nodeDef: rwNode10 },
    { text: 'so that search runs in O(log n) time', targetNode: 'membership_lookup', nodeDef: lookupNode },
  ]

  for (let i = 0; i < complexityCases.length; i++) {
    const cCase = complexityCases[i]
    const interpCase = await interpretLearnerMessageAsync(cCase.text, cdProblem, defaultThread, graphCD)
    interpCase.touchedNodeIds = [cCase.targetNode]
    const modelCase = applyInterpretationDelta(createInitialMentalModel(graphCD), interpCase, graphCD)
    const rec = modelCase.nodes[cCase.targetNode]
    assert(
      rec !== undefined && rec.causalUnderstanding >= 0.5,
      `10.A${i + 1}. Asymptotic causal credit: "${cCase.text}" -> causalUnderstanding >= 0.5 (got ${rec?.causalUnderstanding})`
    )
    assert(
      isNodeGrounded(rec, cCase.nodeDef),
      `10.A${i + 1}. Node ${cCase.targetNode} is grounded with asymptotic explanation`
    )
  }

  // 10.B Causal connective forms: bcs, bc, because, so that, in order to, prevents, avoids, allows, enables, since, due to, as a result, therefore, thus
  const connectiveForms = [
    'bcs it avoids nested scanning',
    'bc it avoids rescanning the array',
    'because it prevents duplicate checks',
    'so that we do not recheck numbers',
    'in order to avoid quadratic comparisons',
    'prevents rescanning from scratch',
    'avoids quadratic lookup work',
    'allows instant lookup without scanning',
    'enables fast check without looping',
    'since it avoids repeating the scan',
    'due to avoiding repeated comparisons',
    'as a result we avoid quadratic time',
    'therefore it eliminates quadratic rescanning',
    'thus avoiding quadratic checks',
  ]

  for (let i = 0; i < connectiveForms.length; i++) {
    const cText = connectiveForms[i]
    const interpC = await interpretLearnerMessageAsync(cText, cdProblem, defaultThread, graphCD)
    interpC.touchedNodeIds = ['membership_lookup']
    const modelConn = applyInterpretationDelta(createInitialMentalModel(graphCD), interpC, graphCD)
    const recConn = modelConn.nodes['membership_lookup']
    assert(
      recConn !== undefined && recConn.causalUnderstanding >= 0.5,
      `10.B${i + 1}. Causal connective: "${cText}" -> causalUnderstanding >= 0.5 (got ${recConn?.causalUnderstanding})`
    )
    assert(
      isNodeGrounded(recConn, lookupNode),
      `10.B${i + 1}. membership_lookup is grounded via "${cText}"`
    )
  }

  // 10.C Compound adjectives and state-tracking paraphrases
  const stateTrackingCases = [
    { text: 'constant-time lookup', targetNode: 'membership_lookup', nodeDef: lookupNode },
    { text: 'check whether this value was already recorded', targetNode: 'membership_lookup', nodeDef: lookupNode },
    { text: 'fast-lookup without scanning again', targetNode: 'membership_lookup', nodeDef: lookupNode },
    { text: 'value was previously saved in the collection', targetNode: 'membership_lookup', nodeDef: lookupNode },
  ]

  for (let i = 0; i < stateTrackingCases.length; i++) {
    const sCase = stateTrackingCases[i]
    const interpS = await interpretLearnerMessageAsync(sCase.text, cdProblem, defaultThread, graphCD)
    interpS.touchedNodeIds = [sCase.targetNode]
    const modelS = applyInterpretationDelta(createInitialMentalModel(graphCD), interpS, graphCD)
    const recS = modelS.nodes[sCase.targetNode]
    assert(
      recS !== undefined && recS.causalUnderstanding >= 0.5,
      `10.C${i + 1}. State-tracking causal credit: "${sCase.text}" -> causalUnderstanding >= 0.5 (got ${recS?.causalUnderstanding})`
    )
    assert(
      isNodeGrounded(recS, sCase.nodeDef),
      `10.C${i + 1}. ${sCase.targetNode} is grounded via "${sCase.text}"`
    )
  }

  // 10.D Binary Search midpoint_comparison grounding
  const bsProblem = PROBLEMS.find((p) => p.slug === 'binary-search')!
  const bsGraph = getActiveGraph('binary-search')
  const bsMidNode = bsGraph.nodes.find((n) => n.id === 'midpoint_comparison')!
  const interpBS = await interpretLearnerMessageAsync('the middle', bsProblem, defaultThread, bsGraph)
  interpBS.touchedNodeIds = ['midpoint_comparison']
  const modelBS = applyInterpretationDelta(createInitialMentalModel(bsGraph), interpBS, bsGraph)
  const recBS = modelBS.nodes['midpoint_comparison']
  assert(
    isNodeGrounded(recBS, bsMidNode),
    '10.D. Binary Search midpoint_comparison is grounded via "the middle"'
  )

  // ─────────────────────────────────────────────────────────────────────────
  // 11. STRUCTURED TUTOR CONTEXT FOR FULL AI
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 11. Structured Tutor Context Generation ---')

  const baseModel11 = createInitialMentalModel(graphCD)
  const baseInterp11 = await interpretLearnerMessageAsync('Use a Set', cdProblem, defaultThread, graphCD)
  const updatedModel11 = applyInterpretationDelta(baseModel11, baseInterp11, graphCD)
  const decision11 = planPedagogicalAction(updatedModel11, defaultThread, baseInterp11, graphCD)

  const contextText11 = formatStructuredTutorContext(cdProblem, {
    graph: graphCD,
    model: updatedModel11,
    decision: decision11,
  })

  assert(contextText11.includes('Pedagogical Focus:'), '11.1 Includes Pedagogical Focus header')
  assert(contextText11.includes('Demonstrated Knowledge:'), '11.2 Includes Demonstrated Knowledge')
  assert(
    contextText11.includes('DO NOT ask the learner to rediscover what is already listed under "Demonstrated Knowledge"'),
    '11.3 Has anti-rediscovery instruction'
  )
  assert(
    contextText11.includes('Sorting & adjacent comparison'),
    '11.4 Includes valid alternative strategies'
  )

  // ─────────────────────────────────────────────────────────────────────────
  // 12. PHASE E — ADVERSARIAL VALIDATION REGRESSION COVERAGE
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n--- 12. Phase E: Adversarial Validation Regressions ---')

  // Test A: Upstream-node repetition while targeting set_structure
  const historyA = [
    {
      role: 'assistant' as const,
      content:
        'Where to start? <!--lite:{"current":{"approachId":"canonical","targetNodeId":"set_structure","targetEdgeId":"memory_to_set","cognitiveTask":"IDENTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
    },
  ]
  const stepA = await evaluateDialogueStepAsync("That way I can remember what I've already seen.", cdProblem, historyA)
  assert(stepA.decision.targetNodeId === 'set_structure', '12.A. Target remains set_structure')
  assert(stepA.decision.targetEdgeId === 'memory_to_set', '12.A. Target edge remains memory_to_set')
  assert(
    !stepA.renderedText.includes("Yes — that's the important shift"),
    '12.A. Re-prompt does NOT replay first-time transition praise ("Yes — that\'s the important shift")'
  )
  assert(
    stepA.renderedText.includes('What kind of structure gives us instant constant-time lookups') ||
      stepA.renderedText.includes('What kind of structure'),
    '12.A. Re-prompt uses concise direct probe'
  )

  // Test B: Upstream mechanism repetition while targeting hit_branch
  const historyB = [
    {
      role: 'assistant' as const,
      content:
        'Next? <!--lite:{"current":{"approachId":"canonical","targetNodeId":"hit_branch","targetEdgeId":"lookup_to_hit","cognitiveTask":"APPLY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
    },
  ]
  const stepB = await evaluateDialogueStepAsync(
    "So I can check if I've already seen the number without scanning everything.",
    cdProblem,
    historyB
  )
  assert(stepB.decision.targetNodeId === 'hit_branch', '12.B. Target remains hit_branch')
  assert(stepB.decision.targetEdgeId === 'lookup_to_hit', '12.B. Target edge remains lookup_to_hit')
  assert(
    !stepB.renderedText.includes('Exactly — Set lookup is constant time'),
    '12.B. Re-prompt does NOT replay first-time praise ("Exactly — Set lookup is constant time")'
  )
  assert(
    stepB.renderedText.includes("When you're scanning a number and it's already in the Set, what does that tell you?"),
    '12.B. Re-prompt uses concise direct branch probe'
  )

  // Test C: Sorting + pairwise comparison
  const stepC = await evaluateDialogueStepAsync(
    "I'll sort the array first, then compare every pair of numbers.",
    cdProblem,
    historyA
  )
  assert(stepC.decision.action === 'EXPLORE_ALTERNATIVE_APPROACH', '12.C. Alternative approach recognized')
  assert(
    !stepC.renderedText.includes('check adjacent elements') && !stepC.renderedText.includes('adjacent elements'),
    '12.C. Response does NOT claim learner proposed adjacent comparison'
  )
  assert(
    stepC.renderedText.includes('avoid comparing every pair'),
    '12.C. Response probes how sorting avoids all-pairs comparison'
  )

  // Test D: Compound Set / lookup statement
  const stepD = await evaluateDialogueStepAsync(
    "I'd use a Set because checking whether a value is already present is constant time, so I don't need to scan all the previous values again.",
    cdProblem,
    historyA
  )
  assert(stepD.mentalModel.nodes['set_structure']?.state === 'ARTICULATED', '12.D. set_structure is recognized')
  assert(
    stepD.mentalModel.nodes['membership_lookup']?.state === 'ARTICULATED',
    '12.D. membership_lookup is recognized'
  )
  assert(
    !stepD.mentalModel.edges['lookup_to_hit'] || stepD.mentalModel.edges['lookup_to_hit'].state === 'UNCLAIMED',
    '12.D. No false edge invented merely from node evidence'
  )
  assert(
    stepD.decision.targetNodeId === 'hit_branch',
    '12.D. Planner advances appropriately toward hit_branch'
  )
  assert(
    stepD.decision.targetEdgeId === 'lookup_to_hit',
    '12.D. Planner targets unresolved downstream edge lookup_to_hit'
  )
  assert(
    stepD.decision.action === 'PROBE_ADJACENT_RELATIONSHIP',
    '12.D. Planner probes adjacent relationship toward next frontier'
  )

  // Test E: General Principle — Compound utterance grounding upstream and downstream nodes in one turn
  // A compound utterance that grounds an upstream node and its immediate downstream node in one turn
  // must not cause the planner to re-probe the upstream->downstream relationship when the destination is already grounded.
  const historyE = [
    {
      role: 'assistant' as const,
      content:
        'How could we optimize this? <!--lite:{"current":{"approachId":"canonical","targetNodeId":"set_structure","targetEdgeId":"memory_to_set","cognitiveTask":"IDENTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP"},"returnStack":[]}-->',
    },
  ]
  const stepE = await evaluateDialogueStepAsync(
    "Instead of quadratic rescanning, we could store seen numbers in a Hash Set and check membership in O(1) time.",
    cdProblem,
    historyE
  )
  assert(stepE.mentalModel.nodes['set_structure']?.state === 'ARTICULATED', '12.E. Upstream node set_structure grounded')
  assert(stepE.mentalModel.nodes['membership_lookup']?.state === 'ARTICULATED', '12.E. Downstream node membership_lookup grounded')
  assert(
    !stepE.mentalModel.edges['set_to_lookup'] || stepE.mentalModel.edges['set_to_lookup'].state === 'UNCLAIMED',
    '12.E. Upstream->downstream edge set_to_lookup NOT falsely grounded'
  )
  assert(
    !stepE.mentalModel.edges['lookup_to_hit'] || stepE.mentalModel.edges['lookup_to_hit'].state === 'UNCLAIMED',
    '12.E. Next edge lookup_to_hit NOT falsely grounded'
  )
  assert(
    stepE.decision.targetNodeId === 'hit_branch',
    '12.E. Planner chooses the next unresolved downstream frontier node (hit_branch)'
  )
  assert(
    stepE.decision.targetEdgeId === 'lookup_to_hit',
    '12.E. Planner chooses the next unresolved downstream edge (lookup_to_hit)'
  )
  assert(
    !stepE.renderedText.includes('avoid repeatedly searching through the array'),
    '12.E. Planner does NOT re-probe already-answered upstream relationship (set_to_lookup)'
  )

  console.log('\n============================================================')
  console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`)
  console.log('============================================================')
}

runSemanticRobustnessSuite()
