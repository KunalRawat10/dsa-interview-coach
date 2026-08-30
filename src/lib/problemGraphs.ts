// ─────────────────────────────────────────────────────────────────────────────
// Problem Graphs — Pure Semantic DSA Domain Models (No Dialogue Scripts)
// ─────────────────────────────────────────────────────────────────────────────

export type NodeUnderstandingState =
  | 'UNKNOWN'      // Has not been introduced or recognized
  | 'NAMED'        // Keyword mentioned without operational mechanism
  | 'ARTICULATED'  // Explained conceptually or connected to mechanism
  | 'APPLIED'      // Applied to concrete example, edge case, or code

export type EdgeUnderstandingState =
  | 'UNCLAIMED'    // Connection not stated by learner
  | 'CLAIMED'      // Asserted A leads to B without explaining why
  | 'JUSTIFIED'    // Explained the causal/structural reason why A leads to B

export type EpistemicConfidence = 'SOLID' | 'FRAGILE'

export type MisconceptionType =
  | 'SINGLE_LOOP_IMPLIES_LINEAR'
  | 'STRUCTURE_SORTS_VALUES'
  | 'CONFLATES_INSTANCE_COUNT_WITH_GROWTH_RATE'
  | 'LINEAR_SCAN_IS_CONSTANT_TIME'
  | 'PASSIVE_AGREEMENT_WITHOUT_APPLICATION'
  | 'MISSING_INDEX_PRESERVATION'
  | 'INCORRECT_POINTER_MOVEMENT'
  | 'GREEDY_WITHOUT_PRECONDITION'

export type CognitiveTask =
  | 'IDENTIFY'     // "What data structure / concept is relevant?"
  | 'EXPLAIN'      // "How does this step work?"
  | 'JUSTIFY'      // "Why does this structure/step avoid redundant work?"
  | 'COMPARE'      // "What is the tradeoff between sorting and hashing?"
  | 'APPLY'        // "What happens when we process element X?"
  | 'TRACE'        // "Step through [1, 2, 3] with your idea."
  | 'PREDICT'      // "What will this condition evaluate to?"
  | 'CORRECT'      // "Notice the inner loop work — how many checks happen?"
  | 'SUMMARIZE'    // "Assemble the complete step-by-step logic."
  | 'IMPLEMENT'    // "Write out the code."

export type PedagogicalAction =
  | 'ANSWER_QUESTION_AND_RESUME'
  | 'CORRECT_MISCONCEPTION'
  | 'ANCHOR_FRAGILE_KNOWLEDGE'
  | 'TEST_CONCRETE_APPLICATION'
  | 'PROBE_ADJACENT_RELATIONSHIP'
  | 'DEEPEN_PARTIAL_REASONING'
  | 'EXPLORE_ALTERNATIVE_APPROACH'
  | 'SWITCH_APPROACH'
  | 'OFFER_CODE_IMPLEMENTATION'

export type ConceptCategory =
  | 'GOAL'
  | 'BRUTE_FORCE'
  | 'BOTTLENECK'
  | 'OPTIMIZATION_STRATEGY'
  | 'DATA_STRUCTURE'
  | 'INVARIANT_MECHANISM'
  | 'OPERATIONAL_BRANCH'
  | 'TERMINATION'

export interface ConceptNode {
  id: string
  label: string
  category: ConceptCategory
  semanticSummary: string            // What this concept means (facts, not dialogue)
  expectedEvidencePatterns: string[] // Semantic keywords/phrases indicating this concept
  prerequisiteNodeIds: string[]      // Concepts that should ideally be grounded first
}

export type RelationshipType =
  | 'causes'
  | 'solved_by'
  | 'implemented_by'
  | 'provides'
  | 'enables'
  | 'branches_to'

export interface ConceptEdge {
  id: string
  from: string
  to: string
  type: RelationshipType
  semanticMeaning: string            // Factual reason why from -> to holds
  expectedJustification: string      // Core justification expected from learner
}

export interface ApproachGraph {
  id: string
  name: string
  isCanonical: boolean
  nodes: ConceptNode[]
  edges: ConceptEdge[]
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONTAINS DUPLICATE
// ─────────────────────────────────────────────────────────────────────────────

export const CONTAINS_DUPLICATE_CANONICAL: ApproachGraph = {
  id: 'hash-set-canonical',
  name: 'Hash Set Single Pass',
  isCanonical: true,
  nodes: [
    {
      id: 'goal',
      label: 'Duplicate Detection Goal',
      category: 'GOAL',
      semanticSummary: 'Determine whether any value in the array appears at least twice.',
      expectedEvidencePatterns: ['duplicate', 'appears twice', 'two of the same', 'repeats', 'asking for', 'stands out', 'seen twice', 'same number', 'distinct'],
      prerequisiteNodeIds: [],
    },
    {
      id: 'brute_force',
      label: 'Pairwise Comparison',
      category: 'BRUTE_FORCE',
      semanticSummary: 'Compare each element against every other element in O(n²) time.',
      expectedEvidencePatterns: ['compare', 'check each', 'all pairs', 'nested loop', 'check each against', 'two loops', 'pairwise', 'compare each', 'check all', 'check every', 'compare all', 'try each'],
      prerequisiteNodeIds: ['goal'],
    },
    {
      id: 'repeated_work',
      label: 'Redundant Rescanning',
      category: 'BOTTLENECK',
      semanticSummary: 'Rescanning previously examined numbers from scratch for every element creates quadratic O(n²) growth.',
      expectedEvidencePatterns: ['repeatedly', 'rescan', 'looking through old', 'checking again', 'search from scratch', 'repeat work', 'o(n^2)', 'o(n²)', 'quadratic', 'already checked', 'already seen', 'checked before'],
      prerequisiteNodeIds: ['brute_force'],
    },
    {
      id: 'memory',
      label: 'Seen Elements Memory',
      category: 'OPTIMIZATION_STRATEGY',
      semanticSummary: 'Remembering already encountered values avoids backwards array scans.',
      expectedEvidencePatterns: ['remember', 'keep track', 'store what we saw', 'save previous', 'record seen', 'keep the numbers', 'keep previous', 'store seen', 'save what we have seen'],
      prerequisiteNodeIds: ['repeated_work'],
    },
    {
      id: 'set_structure',
      label: 'Hash Set Collection',
      category: 'DATA_STRUCTURE',
      semanticSummary: 'A Hash Set provides average O(1) constant-time membership lookups without ordering.',
      expectedEvidencePatterns: ['set', 'hashset', 'hash set'],
      prerequisiteNodeIds: ['memory'],
    },
    {
      id: 'membership_lookup',
      label: 'O(1) Membership Check',
      category: 'INVARIANT_MECHANISM',
      semanticSummary: 'Querying whether the current number already exists in the Set via hash indexing in O(1) time.',
      expectedEvidencePatterns: ['check if in set', 'already there', 'contains', 'membership', 'ask whether', 'already exists', 'exists', 'look up in set', 'in the set', 'in set'],
      prerequisiteNodeIds: ['set_structure'],
    },
    {
      id: 'hit_branch',
      label: 'Duplicate Found (Hit)',
      category: 'OPERATIONAL_BRANCH',
      semanticSummary: 'If the current number is already in the Set, a duplicate is confirmed; return true immediately.',
      expectedEvidencePatterns: ['return true', 'found duplicate', 'match', 'it is a duplicate', 'already there', 'duplicate'],
      prerequisiteNodeIds: ['membership_lookup'],
    },
    {
      id: 'miss_branch',
      label: 'Add to Set (Miss)',
      category: 'OPERATIONAL_BRANCH',
      semanticSummary: 'If the current number is not in the Set, insert it and continue scanning.',
      expectedEvidencePatterns: ['add it', 'insert', 'put in set', 'add to the set', 'add to set', 'save it', 'store it in set'],
      prerequisiteNodeIds: ['membership_lookup'],
    },
    {
      id: 'termination',
      label: 'Distinct Return False',
      category: 'TERMINATION',
      semanticSummary: 'If the scan reaches the end of the array without any membership hits, return false.',
      expectedEvidencePatterns: ['return false', 'end of array', 'no duplicates', 'finished loop', 'finish without', 'none found'],
      prerequisiteNodeIds: ['hit_branch', 'miss_branch'],
    },
  ],
  edges: [
    {
      id: 'brute_to_bottleneck',
      from: 'brute_force',
      to: 'repeated_work',
      type: 'causes',
      semanticMeaning: 'Pairwise nested checks repeat comparisons for each new element.',
      expectedJustification: 'Each element checks all previous elements from scratch.',
    },
    {
      id: 'bottleneck_to_memory',
      from: 'repeated_work',
      to: 'memory',
      type: 'solved_by',
      semanticMeaning: 'Tracking visited numbers allows instant past checks without rescanning.',
      expectedJustification: 'Direct access to past values eliminates backwards array scans.',
    },
    {
      id: 'memory_to_set',
      from: 'memory',
      to: 'set_structure',
      type: 'implemented_by',
      semanticMeaning: 'A Hash Set achieves O(1) membership lookups whereas an array takes O(n).',
      expectedJustification: 'Array lookup is O(n); Hash Set lookup is O(1).',
    },
    {
      id: 'set_to_lookup',
      from: 'set_structure',
      to: 'membership_lookup',
      type: 'provides',
      semanticMeaning: 'Hash indexing gives direct bucket access in one step.',
      expectedJustification: 'Computes hash code to jump straight to the slot.',
    },
    {
      id: 'lookup_to_hit',
      from: 'membership_lookup',
      to: 'hit_branch',
      type: 'branches_to',
      semanticMeaning: 'Only seen elements exist in the Set, so a hit confirms duplicate.',
      expectedJustification: 'Presence in Set proves previous encounter in array.',
    },
  ],
}

export const CONTAINS_DUPLICATE_SORTING: ApproachGraph = {
  id: 'sorting-alternative',
  name: 'Sorting Adjacent Check',
  isCanonical: false,
  nodes: [
    {
      id: 'sorting_structure',
      label: 'Array Sorting',
      category: 'OPTIMIZATION_STRATEGY',
      semanticSummary: 'Sorting the array brings identical duplicate values adjacent to each other.',
      expectedEvidencePatterns: ['sort', 'sorting', 'sort the array', 'sort first'],
      prerequisiteNodeIds: ['goal'],
    },
    {
      id: 'sorting_cost',
      label: 'O(n log n) Complexity',
      category: 'BOTTLENECK',
      semanticSummary: 'Sorting requires O(n log n) time and mutates the array order or takes auxiliary memory.',
      expectedEvidencePatterns: ['n log n', 'o(n log n)', 'slower than o(n)', 'sorting cost'],
      prerequisiteNodeIds: ['sorting_structure'],
    },
    {
      id: 'adjacent_check',
      label: 'Adjacent Comparison',
      category: 'INVARIANT_MECHANISM',
      semanticSummary: 'Compare nums[i] with nums[i-1] in a single linear pass.',
      expectedEvidencePatterns: ['adjacent', 'next to each other', 'neighbor', 'nums[i] == nums[i-1]'],
      prerequisiteNodeIds: ['sorting_structure'],
    },
  ],
  edges: [
    {
      id: 'sort_to_adjacent',
      from: 'sorting_structure',
      to: 'adjacent_check',
      type: 'enables',
      semanticMeaning: 'Equal elements are forced into contiguous positions by sorting.',
      expectedJustification: 'Duplicates will be right next to each other after sorting.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. TWO SUM
// ─────────────────────────────────────────────────────────────────────────────

export const TWO_SUM_CANONICAL: ApproachGraph = {
  id: 'two-sum-canonical',
  name: 'Hash Map Single Pass',
  isCanonical: true,
  nodes: [
    {
      id: 'goal',
      label: 'Two Sum Target Match Goal',
      category: 'GOAL',
      semanticSummary: 'Find two distinct indices whose values sum up to target.',
      expectedEvidencePatterns: ['add up to target', 'sum to target', 'find two numbers', 'indices', 'target', 'sum', 'asking for'],
      prerequisiteNodeIds: [],
    },
    {
      id: 'brute_force',
      label: 'Pairwise Summation',
      category: 'BRUTE_FORCE',
      semanticSummary: 'Check every pair (nums[i], nums[j]) in O(n²) time to see if they sum to target.',
      expectedEvidencePatterns: ['compare', 'all pairs', 'check every pair', 'two loops', 'nested loops', 'every pair', 'check each pair', 'check all pairs', 'pairwise'],
      prerequisiteNodeIds: ['goal'],
    },
    {
      id: 'repeated_work',
      label: 'Repeated Partner Search',
      category: 'BOTTLENECK',
      semanticSummary: 'Scanning the rest of the array repeatedly for each number creates quadratic work.',
      expectedEvidencePatterns: ['looking for matching', 'rescanning', 'searching the rest', 'repeatedly looking', 'o(n^2)', 'o(n²)', 'quadratic', 'already checked', 'checked before'],
      prerequisiteNodeIds: ['brute_force'],
    },
    {
      id: 'complement_formula',
      label: 'Complement Arithmetic',
      category: 'OPTIMIZATION_STRATEGY',
      semanticSummary: 'For any number x, there is exactly one partner (target - x) that completes the sum.',
      expectedEvidencePatterns: ['target - current', 'target minus', 'complement', '9 - 7', 'target - nums[i]', 'subtract', 'target - x'],
      prerequisiteNodeIds: ['repeated_work'],
    },
    {
      id: 'map_structure',
      label: 'Hash Map with Index Preservation',
      category: 'DATA_STRUCTURE',
      semanticSummary: 'Hash Map stores the number as the key and its original array index as the value.',
      expectedEvidencePatterns: ['hashmap', 'hash map', 'map', 'dictionary', 'key and value', 'dict'],
      prerequisiteNodeIds: ['complement_formula'],
    },
    {
      id: 'key_value_roles',
      label: 'Key: Number, Value: Index',
      category: 'INVARIANT_MECHANISM',
      semanticSummary: 'Key is nums[i] for fast lookup; value is index i to return the required indices.',
      expectedEvidencePatterns: ['number as key', 'index as value', 'key is number', 'value is index', 'store the index', 'save index', 'keep index'],
      prerequisiteNodeIds: ['map_structure'],
    },
    {
      id: 'hit_branch',
      label: 'Complement Match (Hit)',
      category: 'OPERATIONAL_BRANCH',
      semanticSummary: 'If complement is found in map, return [map.get(complement), currentIndex].',
      expectedEvidencePatterns: ['return both indices', 'return [map[comp], i]', 'return the indices', 'found complement', 'in the map', 'in map'],
      prerequisiteNodeIds: ['key_value_roles'],
    },
    {
      id: 'miss_branch',
      label: 'Record Current in Map (Miss)',
      category: 'OPERATIONAL_BRANCH',
      semanticSummary: 'If complement is not in map, save map.set(nums[i], i) and continue.',
      expectedEvidencePatterns: ['save in map', 'map.set', 'store current number and index', 'add to map', 'put in map'],
      prerequisiteNodeIds: ['key_value_roles'],
    },
    {
      id: 'termination',
      label: 'Unique Pair Guaranteed',
      category: 'TERMINATION',
      semanticSummary: 'Problem guarantees exactly one valid pair exists.',
      expectedEvidencePatterns: ['found solution', 'guaranteed answer', 'one solution'],
      prerequisiteNodeIds: ['hit_branch'],
    },
  ],
  edges: [
    {
      id: 'brute_to_bottleneck',
      from: 'brute_force',
      to: 'repeated_work',
      type: 'causes',
      semanticMeaning: 'Pairwise sum tests rescan the array repeatedly.',
      expectedJustification: 'Looking for a matching second number for every element from scratch.',
    },
    {
      id: 'bottleneck_to_complement',
      from: 'repeated_work',
      to: 'complement_formula',
      type: 'solved_by',
      semanticMeaning: 'Complement arithmetic specifies the exact single value required.',
      expectedJustification: 'Only target - current can form the target sum.',
    },
    {
      id: 'complement_to_map',
      from: 'complement_formula',
      to: 'map_structure',
      type: 'implemented_by',
      semanticMeaning: 'Hash Map preserves indices whereas Set only tests boolean existence.',
      expectedJustification: 'Problem asks for indices; Hash Map stores both value and position.',
    },
    {
      id: 'map_to_key_val',
      from: 'map_structure',
      to: 'key_value_roles',
      type: 'provides',
      semanticMeaning: 'Mapping number -> index provides O(1) lookup and instant index recovery.',
      expectedJustification: 'Number is searched by value; index is retrieved on hit.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BEST TIME TO BUY AND SELL STOCK
// ─────────────────────────────────────────────────────────────────────────────

export const STOCK_CANONICAL: ApproachGraph = {
  id: 'stock-running-min-canonical',
  name: 'Running Minimum Invariant Single Pass',
  isCanonical: true,
  nodes: [
    {
      id: 'goal',
      label: 'Max Profit Goal',
      category: 'GOAL',
      semanticSummary: 'Find maximum difference prices[j] - prices[i] where j > i (sell day is after buy day).',
      expectedEvidencePatterns: ['max profit', 'buy low sell high', 'maximum profit', 'biggest difference', 'profit', 'asking for'],
      prerequisiteNodeIds: [],
    },
    {
      id: 'brute_force',
      label: 'Pairwise Buy/Sell Days',
      category: 'BRUTE_FORCE',
      semanticSummary: 'Compare every buying day with every subsequent selling day in O(n²) time.',
      expectedEvidencePatterns: ['compare every buy day', 'all pairs of days', 'two loops', 'check each sell day', 'all pairs', 'try every pair', 'nested loop'],
      prerequisiteNodeIds: ['goal'],
    },
    {
      id: 'repeated_work',
      label: 'Rescanning Past Prices',
      category: 'BOTTLENECK',
      semanticSummary: 'Looking back through all previous days for every selling day is redundant.',
      expectedEvidencePatterns: ['checking old days', 'looking through previous days', 'rescanning past', 'o(n^2)', 'o(n²)', 'quadratic', 'already checked'],
      prerequisiteNodeIds: ['brute_force'],
    },
    {
      id: 'min_price_invariant',
      label: 'Cheapest Price So Far Invariant',
      category: 'OPTIMIZATION_STRATEGY',
      semanticSummary: 'To maximize profit selling today, the best buy day is simply the lowest price seen so far.',
      expectedEvidencePatterns: ['cheapest price', 'lowest price so far', 'min price', 'track the minimum', 'remember the cheapest', 'lowest price', 'min_price', 'minimum price'],
      prerequisiteNodeIds: ['repeated_work'],
    },
    {
      id: 'today_profit_calc',
      label: 'Current Day Profit Calculation',
      category: 'INVARIANT_MECHANISM',
      semanticSummary: 'Profit if selling today = prices[i] - minPrice.',
      expectedEvidencePatterns: ['today price minus min', 'prices[i] - min_price', 'current - min', 'subtract min', 'today - min', 'price - min'],
      prerequisiteNodeIds: ['min_price_invariant'],
    },
    {
      id: 'update_max_profit',
      label: 'Track Global Max Profit',
      category: 'OPERATIONAL_BRANCH',
      semanticSummary: 'maxProfit = max(maxProfit, prices[i] - minPrice); minPrice = min(minPrice, prices[i]).',
      expectedEvidencePatterns: ['update max profit', 'max(maxProfit', 'keep highest profit', 'track max profit', 'max_profit'],
      prerequisiteNodeIds: ['today_profit_calc'],
    },
    {
      id: 'termination',
      label: 'Return Max Profit',
      category: 'TERMINATION',
      semanticSummary: 'After one linear pass, return maxProfit (defaults to 0 if no positive profit).',
      expectedEvidencePatterns: ['return maxProfit', 'return max profit', 'return 0 if no profit', 'return 0', 'end of days'],
      prerequisiteNodeIds: ['update_max_profit'],
    },
  ],
  edges: [
    {
      id: 'brute_to_bottleneck',
      from: 'brute_force',
      to: 'repeated_work',
      type: 'causes',
      semanticMeaning: 'Pairwise day checks re-evaluate past days.',
      expectedJustification: 'Comparing today with all previous days is quadratic.',
    },
    {
      id: 'bottleneck_to_min_price',
      from: 'repeated_work',
      to: 'min_price_invariant',
      type: 'solved_by',
      semanticMeaning: 'Only the single lowest price before today matters for selling today.',
      expectedJustification: 'Any price higher than the minimum yields less profit.',
    },
    {
      id: 'min_price_to_profit',
      from: 'min_price_invariant',
      to: 'today_profit_calc',
      type: 'enables',
      semanticMeaning: 'Subtracting lowest prior price gives the optimal profit for selling on current day.',
      expectedJustification: 'Profit is maximized when buying at the lowest previous price.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. VALID PARENTHESES
// ─────────────────────────────────────────────────────────────────────────────

export const VALID_PARENTHESES_CANONICAL: ApproachGraph = {
  id: 'valid-parentheses-canonical',
  name: 'Stack LIFO Matching Single Pass',
  isCanonical: true,
  nodes: [
    {
      id: 'goal',
      label: 'Valid Bracket Nesting Goal',
      category: 'GOAL',
      semanticSummary: 'Determine if every opening bracket is closed by the same type in correct LIFO order.',
      expectedEvidencePatterns: ['valid parentheses', 'matching brackets', 'closed in correct order', 'nested', 'parentheses', 'brackets', 'asking for'],
      prerequisiteNodeIds: [],
    },
    {
      id: 'brute_force',
      label: 'Repeated Substring Replacement',
      category: 'BRUTE_FORCE',
      semanticSummary: 'Repeatedly searching and removing "()", "[]", "{}" pairs in O(n²) time.',
      expectedEvidencePatterns: ['replace pairs', 'remove ()', 'substitute strings', 'string replace', 'replace', 'remove matched'],
      prerequisiteNodeIds: ['goal'],
    },
    {
      id: 'lifo_requirement',
      label: 'Last-In, First-Out Matching',
      category: 'OPTIMIZATION_STRATEGY',
      semanticSummary: 'The most recently opened bracket must be the first one closed.',
      expectedEvidencePatterns: ['most recent', 'last opened', 'lifo', 'innermost bracket first', 'most recently', 'last in first out'],
      prerequisiteNodeIds: ['goal'],
    },
    {
      id: 'stack_structure',
      label: 'Stack Data Structure',
      category: 'DATA_STRUCTURE',
      semanticSummary: 'A Stack provides O(1) push and pop honoring the LIFO order.',
      expectedEvidencePatterns: ['stack', 'push and pop', 'use a stack'],
      prerequisiteNodeIds: ['lifo_requirement'],
    },
    {
      id: 'push_open_branch',
      label: 'Push Open Brackets',
      category: 'OPERATIONAL_BRANCH',
      semanticSummary: 'When an opening bracket (, [, { is scanned, push it onto the Stack.',
      expectedEvidencePatterns: ['push opening', 'push to stack', 'if open bracket push', 'push it', 'add open to stack'],
      prerequisiteNodeIds: ['stack_structure'],
    },
    {
      id: 'match_pop_branch',
      label: 'Pop and Verify Closing Brackets',
      category: 'OPERATIONAL_BRANCH',
      semanticSummary: 'When a closing bracket is scanned, pop the stack top; if it does not match, return false.',
      expectedEvidencePatterns: ['pop and check', 'matches top', 'mismatch return false', 'pop from stack', 'pop', 'match closing'],
      prerequisiteNodeIds: ['stack_structure'],
    },
    {
      id: 'termination',
      label: 'Empty Stack Check',
      category: 'TERMINATION',
      semanticSummary: 'At the end of the string, return stack.length === 0 (all opened brackets were matched).',
      expectedEvidencePatterns: ['stack is empty', 'return stack.length == 0', 'no leftover brackets', 'stack is clear', 'empty stack'],
      prerequisiteNodeIds: ['push_open_branch', 'match_pop_branch'],
    },
  ],
  edges: [
    {
      id: 'lifo_to_stack',
      from: 'lifo_requirement',
      to: 'stack_structure',
      type: 'implemented_by',
      semanticMeaning: 'Stack structure natively manages LIFO access.',
      expectedJustification: 'Stack push/pop naturally matches the innermost-first bracket nesting.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CONTAINER WITH MOST WATER
// ─────────────────────────────────────────────────────────────────────────────

export const CONTAINER_WATER_CANONICAL: ApproachGraph = {
  id: 'container-water-canonical',
  name: 'Two Pointers Greedy Invariant',
  isCanonical: true,
  nodes: [
    {
      id: 'goal',
      label: 'Max Water Container Area Goal',
      category: 'GOAL',
      semanticSummary: 'Find two lines that together with the x-axis form a container holding the maximum water.',
      expectedEvidencePatterns: ['max water', 'container area', 'maximum area', 'width times height', 'most water', 'hold the most water', 'container', 'area', 'asking for'],
      prerequisiteNodeIds: [],
    },
    {
      id: 'brute_force',
      label: 'All Pairs of Lines',
      category: 'BRUTE_FORCE',
      semanticSummary: 'Compute area for all n(n-1)/2 pairs of lines in O(n²) time.',
      expectedEvidencePatterns: ['all pairs', 'check every line with every other', 'nested loops', 'two loops', 'every pair of lines', 'all lines', 'calculate area for each pair', 'pairs of lines', 'compare lines'],
      prerequisiteNodeIds: ['goal'],
    },
    {
      id: 'area_formula',
      label: 'Area = min(h[L], h[R]) * (R - L)',
      category: 'INVARIANT_MECHANISM',
      semanticSummary: 'Area is constrained by the shorter line multiplied by the distance between them.',
      expectedEvidencePatterns: ['min height times width', 'min(h[l], h[r])', 'shorter line limits water', 'width times height', 'height times width', 'shorter line'],
      prerequisiteNodeIds: ['goal'],
    },
    {
      id: 'two_pointers',
      label: 'Two Pointers at Boundaries',
      category: 'OPTIMIZATION_STRATEGY',
      semanticSummary: 'Start with maximum width (L = 0, R = n - 1) and contract inward.',
      expectedEvidencePatterns: ['two pointers', 'start at ends', 'left at 0 right at n-1', 'pointers at boundaries', 'keep the two ends', 'pointers at ends'],
      prerequisiteNodeIds: ['area_formula'],
    },
    {
      id: 'move_shorter_pointer',
      label: 'Greedy Inward Pointer Movement',
      category: 'OPERATIONAL_BRANCH',
      semanticSummary: 'Moving the taller line only decreases width without increasing height constraint. Therefore, always advance the shorter line.',
      expectedEvidencePatterns: ['move shorter line', 'advance smaller height', 'increment left if shorter', 'decrement right if shorter', 'move the shorter', 'move shorter pointer', 'move smaller'],
      prerequisiteNodeIds: ['two_pointers'],
    },
    {
      id: 'termination',
      label: 'Pointers Meet Termination',
      category: 'TERMINATION',
      semanticSummary: 'Terminate when L >= R and return the recorded maxArea.',
      expectedEvidencePatterns: ['while l < r', 'pointers meet', 'return max area', 'stop when pointers meet', 'pointers cross'],
      prerequisiteNodeIds: ['move_shorter_pointer'],
    },
  ],
  edges: [
    {
      id: 'formula_to_pointers',
      from: 'area_formula',
      to: 'two_pointers',
      type: 'enables',
      semanticMeaning: 'Maximum width boundary gives the best starting point.',
      expectedJustification: 'Starting at ends tests the widest container first.',
    },
    {
      id: 'pointers_to_movement',
      from: 'two_pointers',
      to: 'move_shorter_pointer',
      type: 'enables',
      semanticMeaning: 'Moving the taller line cannot increase height because the shorter line still limits the area.',
      expectedJustification: 'The shorter line is the bottleneck; keeping it while reducing width guarantees a smaller area.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. BINARY SEARCH
// ─────────────────────────────────────────────────────────────────────────────

export const BINARY_SEARCH_CANONICAL: ApproachGraph = {
  id: 'binary-search-canonical',
  name: 'Binary Search Halving Invariant',
  isCanonical: true,
  nodes: [
    {
      id: 'goal',
      label: 'Sorted Target Search Goal',
      category: 'GOAL',
      semanticSummary: 'Find target index in a sorted array in O(log n) runtime.',
      expectedEvidencePatterns: ['find target', 'search target', 'return index', 'target', 'search', 'asking for'],
      prerequisiteNodeIds: [],
    },
    {
      id: 'brute_force',
      label: 'Linear Scan',
      category: 'BRUTE_FORCE',
      semanticSummary: 'Scan elements from index 0 to n-1 in O(n) time.',
      expectedEvidencePatterns: ['linear scan', 'check one by one', 'loop from 0', 'o(n) scan', 'scan', 'check each element', 'scan through'],
      prerequisiteNodeIds: ['goal'],
    },
    {
      id: 'sorted_property',
      label: 'Sorted Order Property',
      category: 'OPTIMIZATION_STRATEGY',
      semanticSummary: 'Because the array is sorted, comparing target with the middle element eliminates half of the remaining elements.',
      expectedEvidencePatterns: ['array is sorted', 'sorted order', 'elements are sorted', 'sorted property', 'sorted', 'ordered'],
      prerequisiteNodeIds: ['goal'],
    },
    {
      id: 'midpoint_comparison',
      label: 'Midpoint Halving Decision',
      category: 'INVARIANT_MECHANISM',
      semanticSummary: 'Calculate mid = L + Math.floor((R - L) / 2). If nums[mid] === target, return mid.',
      expectedEvidencePatterns: ['check middle', 'nums[mid]', 'midpoint', 'compare with middle', 'look at the middle', 'middle element', 'middle'],
      prerequisiteNodeIds: ['sorted_property'],
    },
    {
      id: 'halve_search_space',
      label: 'Adjust Left / Right Boundaries',
      category: 'OPERATIONAL_BRANCH',
      semanticSummary: 'If nums[mid] < target, search right half (L = mid + 1); if nums[mid] > target, search left half (R = mid - 1).',
      expectedEvidencePatterns: ['left = mid + 1', 'right = mid - 1', 'eliminate half', 'halve search space', 'throw away half', 'discard half', 'impossible'],
      prerequisiteNodeIds: ['midpoint_comparison'],
    },
    {
      id: 'termination',
      label: 'Target Not Found (Return -1)',
      category: 'TERMINATION',
      semanticSummary: 'If L > R without finding target, target is not present; return -1.',
      expectedEvidencePatterns: ['return -1', 'left > right', 'target not in array', 'not found', 'l > r'],
      prerequisiteNodeIds: ['halve_search_space'],
    },
  ],
  edges: [
    {
      id: 'sorted_to_mid',
      from: 'sorted_property',
      to: 'midpoint_comparison',
      type: 'enables',
      semanticMeaning: 'Sorted property guarantees all elements to the left are smaller and all to the right are larger.',
      expectedJustification: 'Because elements are ordered, comparing with mid determines which half must contain the target.',
    },
    {
      id: 'mid_to_halve',
      from: 'midpoint_comparison',
      to: 'halve_search_space',
      type: 'branches_to',
      semanticMeaning: 'Eliminates half the search space per comparison, yielding O(log n) complexity.',
      expectedJustification: 'Cutting the remaining space in half on each step gives logarithmic time.',
    },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// REGISTRY
// ─────────────────────────────────────────────────────────────────────────────

export const PROBLEM_GRAPHS: Record<string, ApproachGraph[]> = {
  'contains-duplicate': [CONTAINS_DUPLICATE_CANONICAL, CONTAINS_DUPLICATE_SORTING],
  'two-sum': [TWO_SUM_CANONICAL],
  'best-time-to-buy-and-sell-stock': [STOCK_CANONICAL],
  'valid-parentheses': [VALID_PARENTHESES_CANONICAL],
  'container-with-most-water': [CONTAINER_WATER_CANONICAL],
  'binary-search': [BINARY_SEARCH_CANONICAL],
}

export function getProblemGraphs(slug?: string): ApproachGraph[] {
  if (!slug) return [CONTAINS_DUPLICATE_CANONICAL]
  return PROBLEM_GRAPHS[slug] ?? [CONTAINS_DUPLICATE_CANONICAL]
}

export function getActiveGraph(slug?: string, approachId?: string): ApproachGraph {
  const graphs = getProblemGraphs(slug)
  if (!approachId) return graphs.find((g) => g.isCanonical) ?? graphs[0]
  return graphs.find((g) => g.id === approachId) ?? graphs[0]
}
