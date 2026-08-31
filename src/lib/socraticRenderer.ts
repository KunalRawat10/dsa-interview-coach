// ─────────────────────────────────────────────────────────────────────────────
// Socratic Renderer — Decoupled Response Generation from Semantic Data
// ─────────────────────────────────────────────────────────────────────────────

import type { Problem } from '../data/problems'
import type {
  ApproachGraph,
  CognitiveTask,
  PedagogicalAction,
  ConceptNode,
  ConceptEdge,
} from './problemGraphs'
import type { LearnerInterpretation } from './socraticInterpreter'

export function renderSocraticResponse(
  action: PedagogicalAction,
  cognitiveTask: CognitiveTask,
  node: ConceptNode | undefined,
  edge: ConceptEdge | undefined,
  interpretation: LearnerInterpretation,
  problem?: Problem,
  graph?: ApproachGraph,
  isRePrompt: boolean = false
): string {
  const exInput = problem?.examples?.[0]?.input ?? '[1,2,3,1]'

  // ── 1. ANSWER QUESTION AND RESUME ──────────────────────────────────────────
  if (action === 'ANSWER_QUESTION_AND_RESUME') {
    if (interpretation.questionContext === 'hash_table_o1_mechanism') {
      return `A Set computes a hash code from the number to jump directly to its memory slot in one step, rather than scanning from index 0. What would you ask the Set for each number?`
    }
    if (interpretation.questionContext === 'set_vs_map_index_preservation') {
      return `We need the map because Two Sum asks for the original indices, not just whether a value exists. A Set could tell us that 2 exists, but it couldn't tell us where that 2 occurred. With that in mind, what should the map store for each number?`
    }
    if (interpretation.questionContext === 'map_index_value_role') {
      return `Because when we find the matching complement, we need to return its original index alongside the current index. If current number is x and target is T, what complement are you looking for in the Hash Map?`
    }
    if (interpretation.questionContext === 'array_vs_set_time_complexity') {
      return `An array requires scanning through all previous elements one by one, which takes O(n) per lookup and puts us back at O(n²) total. A Set avoids that scan with O(1) lookup. What would we check in the Set for each element?`
    }
    if (interpretation.questionContext === 'set_unordered_property') {
      return `A Set doesn't need elements to be sorted because it looks up values by their hash code rather than their sorted position, allowing us to finish in a single O(n) pass. When we check a number and it's already in the Set, what does that tell us?`
    }
    if (interpretation.questionContext === 'edge_case_trace') {
      return `For [1,1], the first 1 is added to the Set. When we reach the second 1, the membership check succeeds, so we know we've found a duplicate. What would happen with [1,2,3]?`
    }
    if (interpretation.questionContext === 'quadratic_growth_cause') {
      return `Because for 4 elements, the 1st pairs with 3 others, the 2nd with 2, the 3rd with 1, giving 3 + 2 + 1 = 6 comparisons. For n elements, that sum grows quadratically, reaching billions on large inputs. What causes us to need so many comparisons?`
    }
    if (interpretation.questionContext === 'complement_uniqueness') {
      return `Because for any number x, there is only one unique value (target - x) that can add with x to reach target. When we check if that complement is in the Hash Map and find it, what do we return?`
    }
    return `${node?.semanticSummary ?? ''} What question are we trying to resolve here?`.trim()
  }

  // ── 2. CORRECT MISCONCEPTION ───────────────────────────────────────────────
  if (action === 'CORRECT_MISCONCEPTION') {
    if (interpretation.misconceptions.includes('SINGLE_LOOP_IMPLIES_LINEAR')) {
      return `There's one pass through the array, but each step of that pass compares the current value against many earlier values. So the loop itself is linear, but the work inside it is larger. How many comparisons can one element make in the worst case?`
    }
    if (interpretation.misconceptions.includes('STRUCTURE_SORTS_VALUES')) {
      return `A Hash Set is a reasonable choice here, but it doesn't sort values. What operation are we actually trying to make faster while scanning through the array?`
    }
    if (interpretation.misconceptions.includes('CONFLATES_INSTANCE_COUNT_WITH_GROWTH_RATE')) {
      return `Six is the comparison count for this specific 4-element example, not the general Big-O growth rate. What happens to that count as the number of elements n grows?`
    }
    return `${interpretation.misconceptionExplanation ?? 'Not quite.'} What comparison are we making at each step?`
  }

  // ── 3. TEST CONCRETE APPLICATION (Passive Agreement) ───────────────────────
  if (action === 'TEST_CONCRETE_APPLICATION') {
    if (node?.id === 'hit_branch' || node?.id === 'miss_branch' || node?.id === 'membership_lookup') {
      return `Good — let's trace that with numbers. If we are scanning ${exInput} and reach the second 1, what is currently in our Set?`
    }
    return `Good — let's verify that idea on ${exInput}. What would happen on the first step?`
  }

  // ── 4. ANCHOR FRAGILE KNOWLEDGE (Hedging / Uncertain Correct) ──────────────
  if (action === 'ANCHOR_FRAGILE_KNOWLEDGE') {
    if (node?.id === 'brute_force' || node?.id === 'repeated_work') {
      return `Yes — exactly. Those 3 + 2 + 1 comparisons are the total work for four elements. As the array gets larger, that number grows quickly. What do you notice about why we need so many comparisons?`
    }
    return `Yes, that's right. ${edge?.semanticMeaning ?? node?.semanticSummary ?? ''} Why does that relationship hold?`
  }

  // ── 5. EXPLORE ALTERNATIVE APPROACH ────────────────────────────────────────
  if (action === 'EXPLORE_ALTERNATIVE_APPROACH') {
    return `Yes. Sorting would put equal values next to each other, so you could check adjacent elements. What tradeoff does sorting introduce compared with remembering values in a Set?`
  }

  // ── 6. OFFER CODE IMPLEMENTATION ───────────────────────────────────────────
  if (action === 'OFFER_CODE_IMPLEMENTATION') {
    if (cognitiveTask === 'SUMMARIZE' || cognitiveTask === 'TRACE' || isRePrompt) {
      const timeComp = problem?.expectedTime ?? 'O(n)'
      const spaceComp = problem?.expectedSpace ?? 'O(n)'
      return `Excellent work! That complete implementation runs in ${timeComp} time and ${spaceComp} space, satisfying the problem constraints.`
    }
    return `Yes — that covers the complete logic: setup, lookup on hit, insert on miss, and return on completion. Can you write the code?`
  }

  // ── 7. PROBE ADJACENT RELATIONSHIP & DEEPEN REASONING ──────────────────────
  if (edge?.id === 'brute_to_bottleneck') {
    if (isRePrompt) {
      return `What work could we avoid instead of searching through the array from scratch each time?`
    }
    return `Yes — the number of comparisons grows quadratically. The interesting part is that we're repeatedly searching through values we've already looked at. What work could we avoid instead of searching through the array from scratch each time?`
  }
  if (edge?.id === 'bottleneck_to_memory') {
    if (isRePrompt) {
      return `What information about the numbers we have already seen could we keep track of so we don't have to scan backwards?`
    }
    return `Exactly — we're repeatedly searching through information we've already examined. What could we remember while scanning so we don't have to start that search again?`
  }
  if (edge?.id === 'memory_to_set') {
    if (isRePrompt) {
      return `What kind of structure gives us instant constant-time lookups for values we have already encountered?`
    }
    return `Yes — that's the important shift. Instead of searching the earlier part of the array again, we keep the values we've already encountered somewhere. What kind of structure could make checking that collection fast?`
  }
  if (edge?.id === 'set_to_lookup') {
    return `Why does a Set help us avoid repeatedly searching through the array?`
  }
  if (edge?.id === 'lookup_to_hit') {
    if (isRePrompt) {
      return `When you're scanning a number and it's already in the Set, what does that tell you?`
    }
    return `Exactly — Set lookup is constant time. When you're scanning a number and find that it's already in the Set, what does that tell us?`
  }
  if (edge?.id === 'lookup_to_miss') {
    if (isRePrompt) {
      return `What should we do when the current value is NOT in the Set?`
    }
    return `Right — when it's already in the Set, we found a duplicate and return true. What should we do when the current value is NOT in the Set?`
  }

  // Two Sum Specific Relational Bridges
  if (edge?.id === 'bottleneck_to_complement') {
    if (isRePrompt) {
      return `If current number is x and target is T, what partner value completes the sum?`
    }
    return `Exactly — we're repeatedly searching through information we've already examined. If current number is x and target is T, what complement are you looking for?`
  }
  if (edge?.id === 'complement_to_map') {
    return `We need the map because Two Sum asks for the original indices, not just whether a value exists. A Set could tell us that 2 exists, but it couldn't tell us where that 2 occurred. With that in mind, what should the map store for each number?`
  }
  if (edge?.id === 'map_to_key_val') {
    if (isRePrompt) {
      return `When we store numbers and their indices in the Hash Map, what should be the key and what should be the value?`
    }
    return `Exactly — number as key, index as value lets us instantly find original positions. If current number is x and target is T, what complement are you looking for in the Hash Map?`
  }

  // Stock Specific Relational Bridges
  if (edge?.id === 'bottleneck_to_min_price') {
    if (isRePrompt) {
      return `What price from past days do we need to remember to calculate the best profit if selling today?`
    }
    return `Exactly — we're repeatedly searching through information we've already examined. What could we remember while scanning so we don't have to look back through previous days?`
  }
  if (edge?.id === 'min_price_to_profit') {
    if (isRePrompt) {
      return `If we know the cheapest past price, how do we calculate today's profit?`
    }
    return `Exactly — if we always remember the cheapest earlier price, what could we compare today's price against to calculate today's best profit?`
  }

  // Container With Most Water Bridges
  if (edge?.id === 'formula_to_pointers') {
    return `Right — area is limited by the shorter line multiplied by distance. If we want to test the widest container first, where should we place two pointers?`
  }
  if (edge?.id === 'pointers_to_movement') {
    return `If the line at Left is shorter than the line at Right, why does moving the taller Right pointer inward never help find a larger area?`
  }

  // Binary Search Bridges
  if (edge?.id === 'sorted_to_mid') {
    return `Because the array is already sorted, how can comparing target with the middle element help us avoid checking every element?`
  }
  if (edge?.id === 'mid_to_halve') {
    return `If nums[mid] is smaller than target, which half of the array can we completely eliminate from our search?`
  }

  // Node-specific Tasks
  if (node?.id === 'goal') {
    return `Looking at ${exInput}, what stands out about what the problem is asking for?`
  }
  if (node?.id === 'brute_force') {
    return `Looking at ${exInput}, if you solved this without any special data structures, how would you test all possibilities?`
  }
  if (node?.id === 'repeated_work') {
    return `What specifically causes us to repeat so much work as we scan through the elements?`
  }
  if (node?.id === 'memory') {
    return `What could we remember while scanning so we don't have to start that search again?`
  }
  if (node?.id === 'set_structure') {
    return `What data structure gives us instant constant-time membership lookups?`
  }
  if (node?.id === 'membership_lookup') {
    return `When you're scanning a number, what specific question do you ask the data structure?`
  }
  if (node?.id === 'hit_branch') {
    return `When you're scanning a number and it's already in the Set, what does that tell you?`
  }
  if (node?.id === 'miss_branch') {
    return `What should we do when the current value is NOT in the Set?`
  }
  if (node?.id === 'termination') {
    return `If we reach the end of the array without finding any duplicate, what should we return?`
  }

  // Generic Dynamic Construction
  if (cognitiveTask === 'IMPLEMENT') {
    return `Can you write out the code for this logic?`
  }
  if (cognitiveTask === 'TRACE') {
    return `Can you trace how this applies to ${exInput}?`
  }
  return `${graph?.name ? `In ${graph.name}: ` : ''}Let's focus on ${node?.label ?? 'the next step'}: ${node?.semanticSummary ?? ''}`
}
