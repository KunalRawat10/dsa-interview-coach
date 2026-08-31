/**
 * Comprehensive Verification & Generalization Suite for Graph-Backed Cognitive Socratic Engine
 */

import { liteRespond, evaluateDialogueStep } from '../src/lib/liteSocratic.js'
import { PROBLEMS } from '../src/data/problems.js'
import { getActiveGraph } from '../src/lib/problemGraphs.js'

const containsDuplicate = PROBLEMS.find((p) => p.slug === 'contains-duplicate')
const twoSum = PROBLEMS.find((p) => p.slug === 'two-sum')
const stock = PROBLEMS.find((p) => p.slug === 'best-time-to-buy-and-sell-stock')
const validParens = PROBLEMS.find((p) => p.slug === 'valid-parentheses')
const containerWater = PROBLEMS.find((p) => p.slug === 'container-with-most-water')
const binarySearch = PROBLEMS.find((p) => p.slug === 'binary-search')

console.log('============================================================');
console.log('GRAPH-BACKED COGNITIVE SOCRATIC ENGINE TEST SUITE');
console.log('============================================================\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, name, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${name}`);
  } else {
    console.log(`[FAIL] ${name}`);
    if (details) console.log(`  Details: ${details}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONTAINS DUPLICATE SCENARIOS (Tests A to J)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- 1. CONTAINS DUPLICATE SCENARIOS ---');

// Test A: Normal Learner Brute Force -> Complexity
{
  const trace = evaluateDialogueStep("I'd compare every number against the others.", containsDuplicate, []);
  assert(
    trace.decision.targetNodeId === 'repeated_work' || trace.decision.targetEdgeId === 'brute_to_bottleneck',
    'Test A: Normal brute force establishes pairwise comparisons and targets repeated work',
    `Action: ${trace.decision.action}, Node: ${trace.decision.targetNodeId}`
  );
}

// Test B: Wrong Complexity Misconception
{
  const trace = evaluateDialogueStep("O(n), because we only loop once.", containsDuplicate, [
    { role: 'assistant', content: 'If there are n elements, roughly how does the amount of work grow as n increases?' }
  ]);
  assert(
    trace.interpretation.misconceptions.includes('SINGLE_LOOP_IMPLIES_LINEAR') && trace.decision.action === 'CORRECT_MISCONCEPTION',
    'Test B: Wrong complexity detects SINGLE_LOOP_IMPLIES_LINEAR and triggers CORRECT_MISCONCEPTION',
    `Misconceptions: ${trace.interpretation.misconceptions.join(', ')}`
  );
}

// Test C: Hesitant Correct Answer
{
  const trace = evaluateDialogueStep("Maybe O(n²)?", containsDuplicate, [
    { role: 'assistant', content: 'If there are n elements, roughly how does the amount of work grow as n increases?' }
  ]);
  assert(
    trace.interpretation.confidence === 'FRAGILE' && trace.decision.action === 'ANCHOR_FRAGILE_KNOWLEDGE',
    'Test C: Hesitant correct answer is marked FRAGILE and triggers ANCHOR_FRAGILE_KNOWLEDGE',
    `Confidence: ${trace.interpretation.confidence}, Action: ${trace.decision.action}`
  );
}

// Test D: Passive Agreement
{
  const trace = evaluateDialogueStep("Okay, that makes sense.", containsDuplicate, [
    { role: 'assistant', content: 'If the number is already in the Set, return true. <!--lite:{"approachId":"hash-set-canonical","targetNodeId":"hit_branch","cognitiveTask":"IDENTIFY","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP","returnStack":[]}-->' }
  ]);
  assert(
    trace.interpretation.isPassiveAgreement && trace.decision.action === 'TEST_CONCRETE_APPLICATION',
    'Test D: Passive agreement triggers TEST_CONCRETE_APPLICATION without advancing knowledge state',
    `Action: ${trace.decision.action}`
  );
}

// Test E: Premature Set Selection (without bottleneck)
{
  const trace = evaluateDialogueStep("I'll use a Set.", containsDuplicate, []);
  assert(
    trace.interpretation.touchedNodeIds.includes('set_structure') && trace.mentalModel.nodes['set_structure'].state === 'NAMED',
    'Test E: Premature Set is marked NAMED and deepens reasoning rather than skipping prerequisites',
    `Set state: ${trace.mentalModel.nodes['set_structure']?.state}`
  );
}

// Test F: Set with Wrong Justification (Set sorts values)
{
  const trace = evaluateDialogueStep("I'll use a Set because it sorts the array.", containsDuplicate, []);
  assert(
    trace.interpretation.misconceptions.includes('STRUCTURE_SORTS_VALUES') && trace.decision.action === 'CORRECT_MISCONCEPTION',
    'Test F: Set with sorting misconception triggers CORRECT_MISCONCEPTION',
    `Misconceptions: ${trace.interpretation.misconceptions.join(', ')}`
  );
}

// Test G: Learner Question Interruption & Return Stack
{
  const history = [
    { role: 'assistant', content: 'What causes the brute-force approach to repeat work? <!--lite:{"approachId":"hash-set-canonical","targetNodeId":"repeated_work","cognitiveTask":"EXPLAIN","pedagogicalAction":"PROBE_ADJACENT_RELATIONSHIP","returnStack":[]}-->' }
  ];
  const trace = evaluateDialogueStep("Why is Set faster?", containsDuplicate, history);
  assert(
    trace.interpretation.isQuestion &&
    trace.decision.action === 'ANSWER_QUESTION_AND_RESUME' &&
    trace.decision.newThread.returnStack.length === 1 &&
    trace.decision.newThread.returnStack[0].targetNodeId === 'repeated_work',
    'Test G: Learner question pushes current frame onto returnStack and explains mechanism directly',
    `ReturnStack depth: ${trace.decision.newThread.returnStack.length}`
  );
}

// Test H: Alternative Approach (Sorting)
{
  const trace = evaluateDialogueStep("I'd sort the array first.", containsDuplicate, []);
  assert(
    trace.interpretation.suggestedApproachId === 'sorting-alternative' &&
    trace.decision.action === 'EXPLORE_ALTERNATIVE_APPROACH',
    'Test H: Proposing sorting switches to sorting-alternative approach graph without error',
    `Active approach: ${trace.decision.newThread.current.approachId}`
  );
}

// Test I: Full Jump-Ahead Implementation Readiness
{
  const history = [
    { role: 'user', content: 'I check each number in a Set.' },
    { role: 'user', content: 'If it is in the Set, return true because it is a duplicate.' },
    { role: 'user', content: 'If not, add it to the set.' },
  ];
  const trace = evaluateDialogueStep("And if we finish the array without finding any duplicate, return false.", containsDuplicate, history);
  assert(
    trace.decision.action === 'OFFER_CODE_IMPLEMENTATION' && trace.renderedText.includes('write the code'),
    'Test I: Demonstrating all operational branches reaches OFFER_CODE_IMPLEMENTATION directly',
    `Action: ${trace.decision.action}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GENERALIZATION ACROSS 6 PROBLEM ARCHETYPES
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- 2. GENERALIZATION ACROSS 6 PROBLEM ARCHETYPES ---');

// Test K: Two Sum
{
  const trace = evaluateDialogueStep("We should calculate target minus current number.", twoSum, []);
  assert(
    trace.interpretation.touchedNodeIds.includes('complement_formula'),
    'Test K (Two Sum): Recognizes complement arithmetic node',
    `Touched nodes: ${trace.interpretation.touchedNodeIds.join(', ')}`
  );
}

// Test L: Best Time to Buy and Sell Stock
{
  const trace = evaluateDialogueStep("We only need to track the cheapest price seen so far.", stock, []);
  assert(
    trace.interpretation.touchedNodeIds.includes('min_price_invariant'),
    'Test L (Stock): Recognizes cheapest-so-far invariant node',
    `Touched nodes: ${trace.interpretation.touchedNodeIds.join(', ')}`
  );
}

// Test M: Valid Parentheses
{
  const trace = evaluateDialogueStep("We need a Stack to match the most recently opened bracket.", validParens, []);
  assert(
    trace.interpretation.touchedNodeIds.includes('stack_structure') || trace.interpretation.touchedNodeIds.includes('lifo_requirement'),
    'Test M (Valid Parentheses): Recognizes Stack and LIFO requirement nodes',
    `Touched nodes: ${trace.interpretation.touchedNodeIds.join(', ')}`
  );
}

// Test N: Container With Most Water
{
  const trace = evaluateDialogueStep("Start with two pointers at the ends and always move the shorter line inward.", containerWater, []);
  assert(
    trace.interpretation.touchedNodeIds.includes('two_pointers') || trace.interpretation.touchedNodeIds.includes('move_shorter_pointer'),
    'Test N (Container With Most Water): Recognizes two-pointer inward movement node',
    `Touched nodes: ${trace.interpretation.touchedNodeIds.join(', ')}`
  );
}

// Test O: Binary Search
{
  const trace = evaluateDialogueStep("Because the array is sorted, we can check the middle element and eliminate half.", binarySearch, []);
  assert(
    trace.interpretation.touchedNodeIds.includes('sorted_property') || trace.interpretation.touchedNodeIds.includes('midpoint_comparison'),
    'Test O (Binary Search): Recognizes sorted property and midpoint halving nodes',
    `Touched nodes: ${trace.interpretation.touchedNodeIds.join(', ')}`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. MULTI-TURN REALISTIC CONVERSATION TRACE
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n--- 3. MULTI-TURN REALISTIC CONVERSATION TRACE ---');

function runSimulatedChat(title, problem, turns) {
  console.log(`\n============================================================`);
  console.log(`SIMULATION: ${title}`);
  console.log(`============================================================`);
  const history = [{ role: 'assistant', content: 'Where would you like to start? What stands out about the inputs or what the problem is asking for?' }];
  console.log(`Coach: "${history[0].content}"\n`);

  for (let i = 0; i < turns.length; i++) {
    const userMsg = turns[i];
    console.log(`Learner [Turn ${i + 1}]: "${userMsg}"`);
    const replyWithMeta = liteRespond(userMsg, problem, history);
    const visibleReply = replyWithMeta.replace(/<!--lite:[\s\S]*?-->/, '').trim();
    console.log(`Coach [Turn ${i + 1}]: "${visibleReply}"\n`);

    history.push({ role: 'user', content: userMsg });
    history.push({ role: 'assistant', content: replyWithMeta });
  }
}

runSimulatedChat('Contains Duplicate Full Messy Dialogue', containsDuplicate, [
  "I'd compare every number against the others.",
  "Maybe O(n²)?",
  "Why is it n²?",
  "Oh because we'd keep checking stuff we've already seen.",
  "So maybe store the previous numbers?",
  "Set?",
  "Why is Set faster?",
  "Okay, got it.",
  "So if the number is already there that's the duplicate right?",
  "And if it's not in the set we add it.",
  "Then return false at the end if none found."
]);

console.log(`\n============================================================`);
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`============================================================\n`);
