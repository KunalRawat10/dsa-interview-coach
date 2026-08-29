// PatternOS Practice Problem Library
// 20 problems organized by learning progression.
// All pedagogical metadata lives here — UI imports only what it needs.

export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard'
export type ProblemCategory = 'Foundations' | 'Core Patterns' | 'Intermediate' | 'Advanced'

// Used to map to liteSocratic categories without importing from UI
export type PatternTag =
  | 'hash-set'
  | 'hash-map'
  | 'frequency-map'
  | 'stack'
  | 'running-min'
  | 'binary-search'
  | 'sliding-window'
  | 'kadane'
  | 'prefix-suffix'
  | 'sorting-intervals'
  | 'sorting-two-pointers'
  | 'two-pointers'
  | 'monotonic-stack'
  | 'bfs-dfs'
  | 'heap-bucket'
  | 'graph-traversal'
  | 'topological-sort'
  | 'tree-recursion'
  | 'dynamic-programming'

export interface ProblemExample {
  input: string
  output: string
  note?: string
}

export interface Problem {
  id: number
  title: string
  slug: string
  difficulty: ProblemDifficulty
  pattern: string
  patternTag: PatternTag
  category: ProblemCategory
  description: string
  examples: ProblemExample[]
  constraints: string[]
  observation: string
  structuralClue: string
  invariant: string
  hints: string[]
  expectedTime: string
  expectedSpace: string
}

export const PROBLEMS: Problem[] = [
  // ── FOUNDATIONS ─────────────────────────────────────────────────────────────
  {
    id: 1,
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    difficulty: 'Easy',
    pattern: 'Hash Set',
    patternTag: 'hash-set',
    category: 'Foundations',
    description:
      'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
    examples: [
      { input: 'nums = [1,2,3,1]', output: 'true' },
      { input: 'nums = [1,2,3,4]', output: 'false' },
      { input: 'nums = [1,1,1,3,3,4,3,2,4,2]', output: 'true' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁹ ≤ nums[i] ≤ 10⁹'],
    observation: 'You need to know whether a number has been seen before. That is a membership question, not a value question.',
    structuralClue: 'No ordering constraints — you only need O(1) membership lookup, not search.',
    invariant: 'If a number is already in the set when you try to insert it, it is a duplicate.',
    hints: [
      'What data structure gives you O(1) membership lookup?',
      'A Hash Set stores only unique values — what happens when you try to insert something that is already there?',
      'Can you solve this in a single pass through the array?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(n)',
  },
  {
    id: 2,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    pattern: 'Hash Map',
    patternTag: 'hash-map',
    category: 'Foundations',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume exactly one solution exists, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', note: '2 + 7 = 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁴', 'Exactly one valid answer exists'],
    observation: 'For each number x, you are really looking for target - x. That is the complement.',
    structuralClue: 'You need to record both the value and its index — a Map, not a Set.',
    invariant: 'If complement = target - nums[i] is already in the map, the pair is found.',
    hints: [
      'A brute-force checks all pairs — what is its time complexity?',
      "For each number x, what value are you searching for?",
      'How can you record what you have seen so far, along with each value\'s index?',
      'If you store each number\'s index in a map as you scan, what can you look up in O(1)?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(n)',
  },
  {
    id: 3,
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    difficulty: 'Easy',
    pattern: 'Frequency Map',
    patternTag: 'frequency-map',
    category: 'Foundations',
    description:
      'Given two strings s and t, return true if t is an anagram of s. An anagram uses all the original letters exactly once.',
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' },
    ],
    constraints: ['1 ≤ s.length, t.length ≤ 5 × 10⁴', 's and t consist of lowercase English letters'],
    observation: 'Two strings are anagrams if and only if they have identical character frequencies.',
    structuralClue: 'The alphabet is bounded to 26 letters — a fixed-size frequency array works, giving O(1) space.',
    invariant: 'Every character in s must cancel exactly with a character in t.',
    hints: [
      'What is the simplest way to compare two sets of characters?',
      'Could you count how many times each letter appears in each string?',
      'What condition makes two frequency maps equal?',
      'Can you do this with one pass through both strings simultaneously?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(1)',
  },
  {
    id: 4,
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    pattern: 'Stack',
    patternTag: 'stack',
    category: 'Foundations',
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed in the correct order.",
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    constraints: ['1 ≤ s.length ≤ 10⁴', 's consists of parentheses only'],
    observation: 'Every closing bracket must match the most recently opened unclosed bracket.',
    structuralClue: 'You need to remember the most recently seen opener — that is a Last-In-First-Out structure.',
    invariant: 'The top of the stack is always the innermost unclosed opener.',
    hints: [
      'What does "correct order" mean in terms of nesting depth?',
      'What data structure gives you access to the most recently added item?',
      'When you see a closing bracket, what should you compare it against?',
      'What should the stack look like at the very end if the string is fully valid?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(n)',
  },
  {
    id: 5,
    title: 'Best Time to Buy and Sell Stock',
    slug: 'buy-sell-stock',
    difficulty: 'Easy',
    pattern: 'One-Pass / Running Minimum',
    patternTag: 'running-min',
    category: 'Foundations',
    description:
      'You are given an array prices where prices[i] is the price on the ith day. Choose a single day to buy and a future day to sell to maximize profit. Return the maximum profit, or 0 if no profit is possible.',
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', note: 'Buy day 2 (price=1), sell day 5 (price=6)' },
      { input: 'prices = [7,6,4,3,1]', output: '0', note: 'No profit possible' },
    ],
    constraints: ['1 ≤ prices.length ≤ 10⁵', '0 ≤ prices[i] ≤ 10⁴'],
    observation: 'You must buy before you sell — scan left to right. At any point, the best buy price is the lowest price seen so far.',
    structuralClue: 'One variable tracks the running minimum; another tracks the best profit seen.',
    invariant: 'For each price, the maximum profit ending here is price − min_so_far.',
    hints: [
      'If you are at day i, what is the best price you could have bought at?',
      'How can you track that as you scan left to right?',
      'Can you compute profit at each step without revisiting previous days?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(1)',
  },
  // ── CORE PATTERNS ────────────────────────────────────────────────────────────
  {
    id: 6,
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    pattern: 'Binary Search',
    patternTag: 'binary-search',
    category: 'Core Patterns',
    description:
      "Given an array of integers nums sorted in ascending order and an integer target, return the target's index, or -1 if it does not exist.",
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' },
    ],
    constraints: ['All integers in nums are unique', 'nums is sorted ascending'],
    observation: 'The array is sorted — any midpoint comparison eliminates half the search space immediately.',
    structuralClue: 'Sorted input + halving strategy = O(log n) time.',
    invariant: 'The target, if it exists, is always within the current [left, right] range.',
    hints: [
      'If the array were unsorted, how would you search it?',
      'What does being sorted let you infer when you look at the middle element?',
      'After comparing mid to target, how many elements can you safely eliminate?',
      'What are the two termination conditions for your loop?',
    ],
    expectedTime: 'O(log n)',
    expectedSpace: 'O(1)',
  },
  {
    id: 7,
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-no-repeat',
    difficulty: 'Medium',
    pattern: 'Sliding Window',
    patternTag: 'sliding-window',
    category: 'Core Patterns',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', note: '"abc"' },
      { input: 's = "bbbbb"', output: '1', note: '"b"' },
      { input: 's = "pwwkew"', output: '3', note: '"wke"' },
    ],
    constraints: ['0 ≤ s.length ≤ 5 × 10⁴'],
    observation: 'A valid window is a contiguous substring with all unique characters. You expand from the right and contract from the left.',
    structuralClue: 'A set or map tracks which characters are in the current window.',
    invariant: 'The window [left, right] always contains only unique characters.',
    hints: [
      'What makes a window invalid?',
      'When you encounter a duplicate character at position right, how far left do you need to move?',
      'What data structure tells you in O(1) if a character is already in the window?',
      "Can you track each character's most recent index to jump the left pointer efficiently?",
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(min(n, charset))',
  },
  {
    id: 8,
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    pattern: "Kadane's Algorithm",
    patternTag: 'kadane',
    category: 'Core Patterns',
    description: 'Given an integer array nums, find the subarray with the largest sum and return its sum.',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', note: '[4,-1,2,1]' },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', '-10⁴ ≤ nums[i] ≤ 10⁴'],
    observation: 'At each element you have exactly two choices: extend the previous subarray, or start a fresh one here.',
    structuralClue: 'If the running sum is negative before adding nums[i], it is always better to start fresh.',
    invariant: 'current = max(nums[i], current + nums[i]) at every step.',
    hints: [
      'What is the brute-force approach, and where does it recompute work?',
      'At index i, what are your two choices for the subarray that ends at i?',
      'When is it better to start a fresh subarray rather than extending the current one?',
      'Can you maintain the best answer in a single variable as you scan?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(1)',
  },
  {
    id: 9,
    title: 'Product of Array Except Self',
    slug: 'product-except-self',
    difficulty: 'Medium',
    pattern: 'Prefix / Suffix Products',
    patternTag: 'prefix-suffix',
    category: 'Core Patterns',
    description:
      'Given an integer array nums, return an array answer such that answer[i] is the product of all elements except nums[i]. Solve without division in O(n) time.',
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' },
    ],
    constraints: ['2 ≤ nums.length ≤ 10⁵', 'No division allowed'],
    observation: 'answer[i] = (product of everything left of i) × (product of everything right of i).',
    structuralClue: 'Two separate passes — one left-to-right for prefix products, one right-to-left for suffix products.',
    invariant: 'prefix[i] = product of nums[0..i-1]; suffix[i] = product of nums[i+1..n-1].',
    hints: [
      'If division were allowed, what would the trivial O(n) solution look like?',
      'Without division, can you split the contribution into two halves?',
      'What is the product of all elements to the left of index i?',
      'Can you build the result array in-place to achieve O(1) extra space?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(1) extra',
  },
  {
    id: 10,
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    difficulty: 'Medium',
    pattern: 'Sorting + Intervals',
    patternTag: 'sorting-intervals',
    category: 'Core Patterns',
    description:
      'Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return the result.',
    examples: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', output: '[[1,5]]' },
    ],
    constraints: ['1 ≤ intervals.length ≤ 10⁴', '0 ≤ start_i ≤ end_i ≤ 10⁴'],
    observation: 'Two intervals overlap if and only if one starts before the other ends.',
    structuralClue: 'Sorting by start time lets you detect overlaps greedily — each interval can only conflict with the one immediately before it.',
    invariant: 'After sorting, an interval can only overlap with the last merged interval in the result.',
    hints: [
      'Without sorting, could you efficiently detect overlaps?',
      'After sorting by start time, which previously seen interval can possibly overlap the current one?',
      'How do you decide whether to extend the last merged interval or start a new entry?',
      'What comparison determines if two consecutive sorted intervals overlap?',
    ],
    expectedTime: 'O(n log n)',
    expectedSpace: 'O(n)',
  },
  // ── INTERMEDIATE ─────────────────────────────────────────────────────────────
  {
    id: 11,
    title: '3Sum',
    slug: '3sum',
    difficulty: 'Medium',
    pattern: 'Sorting + Two Pointers',
    patternTag: 'sorting-two-pointers',
    category: 'Intermediate',
    description:
      'Given an integer array nums, return all unique triplets [nums[i], nums[j], nums[k]] such that i ≠ j ≠ k and nums[i] + nums[j] + nums[k] == 0.',
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]' },
      { input: 'nums = [0,1,1]', output: '[]' },
      { input: 'nums = [0,0,0]', output: '[[0,0,0]]' },
    ],
    constraints: ['3 ≤ nums.length ≤ 3000', '-10⁵ ≤ nums[i] ≤ 10⁵'],
    observation: 'Fixing one element reduces this to a Two Sum problem on the remaining subarray.',
    structuralClue: 'Sorting first enables two-pointer scanning and makes duplicate-skipping trivial.',
    invariant: 'Move left pointer right when sum < 0; move right pointer left when sum > 0.',
    hints: [
      'How did Two Sum work? Can that idea extend to three numbers?',
      'If you fix nums[i], what problem are you solving on the rest of the array?',
      'Why does sorting help with both finding pairs and avoiding duplicate triplets?',
      'How do you skip duplicate values of i, left, and right during the scan?',
    ],
    expectedTime: 'O(n²)',
    expectedSpace: 'O(1) extra',
  },
  {
    id: 12,
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'Medium',
    pattern: 'Two Pointers',
    patternTag: 'two-pointers',
    category: 'Intermediate',
    description:
      'You are given an integer array height of length n. Find two lines that together with the x-axis form a container holding the most water. Return the maximum amount of water.',
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49' },
      { input: 'height = [1,1]', output: '1' },
    ],
    constraints: ['2 ≤ n ≤ 10⁵', '0 ≤ height[i] ≤ 10⁴'],
    observation: 'Area = min(height[L], height[R]) × (R − L). The shorter boundary is always the limiting factor.',
    structuralClue: 'Start with the widest possible container, then narrow inward based on which boundary is shorter.',
    invariant: 'Moving the taller boundary can only decrease width without gaining height — always move the shorter pointer.',
    hints: [
      'What is the formula for the area of the container formed by two lines?',
      'If you start with pointers at both ends you have the maximum width — what can you do from there?',
      'If height[L] < height[R], what happens to the area if you move R inward?',
      'Which pointer should you advance, and why can you safely discard the other possibility?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(1)',
  },
  {
    id: 13,
    title: 'Daily Temperatures',
    slug: 'daily-temperatures',
    difficulty: 'Medium',
    pattern: 'Monotonic Stack',
    patternTag: 'monotonic-stack',
    category: 'Intermediate',
    description:
      'Given an array of integers temperatures, return an array answer where answer[i] is the number of days until a warmer temperature. If no warmer day exists, answer[i] = 0.',
    examples: [
      { input: '[73,74,75,71,69,72,76,73]', output: '[1,1,4,2,1,1,0,0]' },
      { input: '[30,40,50,60]', output: '[1,1,1,0]' },
    ],
    constraints: ['1 ≤ temperatures.length ≤ 10⁵', '30 ≤ temperatures[i] ≤ 100'],
    observation: 'For each day, you need the index of the next greater element to its right.',
    structuralClue: 'Unresolved days sit on the stack; a warmer day pops and resolves them all at once.',
    invariant: 'The stack always holds indices in monotonically decreasing order of temperature.',
    hints: [
      'A brute-force scans right for each day — can you avoid that repeated work?',
      "What if you pushed each day's index onto a stack, popping only when you find a warmer day?",
      'What temperature property does the stack maintain at every step?',
      'How do you compute the number of waiting days from two indices on the stack?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(n)',
  },
  {
    id: 14,
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'Medium',
    pattern: 'BFS / DFS (Flood Fill)',
    patternTag: 'bfs-dfs',
    category: 'Intermediate',
    description:
      "Given an m × n binary grid representing land ('1') and water ('0'), return the number of islands. An island is formed by connecting adjacent land cells horizontally or vertically.",
    examples: [
      { input: '4×5 grid with one contiguous land mass', output: '1' },
      { input: '4×5 grid with three separate land masses', output: '3' },
    ],
    constraints: ['1 ≤ m, n ≤ 300', "grid[i][j] is '0' or '1'"],
    observation: 'Each unvisited land cell is the starting point of a new island. Visiting all connected land from that point counts as one island.',
    structuralClue: 'Flood-fill (mark-as-visited) from each starting cell eliminates its entire island.',
    invariant: 'When DFS/BFS finishes from a cell, all connected land cells reachable from it are marked visited.',
    hints: [
      'How do you define "connected" — what directions count?',
      'If you visit a land cell, which other cells do you need to visit?',
      'How do you avoid visiting the same cell twice?',
      'Each time you start a fresh BFS/DFS from an unvisited land cell, what does that represent?',
    ],
    expectedTime: 'O(m × n)',
    expectedSpace: 'O(m × n)',
  },
  {
    id: 15,
    title: 'Top K Frequent Elements',
    slug: 'top-k-frequent',
    difficulty: 'Medium',
    pattern: 'Heap / Bucket Sort',
    patternTag: 'heap-bucket',
    category: 'Intermediate',
    description:
      'Given an integer array nums and an integer k, return the k most frequent elements. You may return the answer in any order.',
    examples: [
      { input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1,2]' },
      { input: 'nums = [1], k = 1', output: '[1]' },
    ],
    constraints: ['1 ≤ nums.length ≤ 10⁵', 'k is in the range [1, unique elements]'],
    observation: 'You need frequencies first, then the top k elements ranked by frequency.',
    structuralClue: 'A min-heap of size k maintains the k highest frequencies seen so far in O(n log k).',
    invariant: 'Frequencies range from 1 to n — bucket sort on frequency achieves O(n) total.',
    hints: [
      'How do you compute the frequency of each element?',
      'Once you have frequencies, how do you select the top k efficiently?',
      'A min-heap of size k — what do you do when the heap exceeds size k?',
      'Is there a way to avoid a heap entirely, given that frequency is bounded by n?',
    ],
    expectedTime: 'O(n log k)',
    expectedSpace: 'O(n)',
  },
  // ── ADVANCED ─────────────────────────────────────────────────────────────────
  {
    id: 16,
    title: 'Longest Consecutive Sequence',
    slug: 'longest-consecutive-sequence',
    difficulty: 'Medium',
    pattern: 'Hash Set',
    patternTag: 'hash-set',
    category: 'Advanced',
    description:
      'Given an unsorted array of integers nums, return the length of the longest consecutive elements sequence. Your algorithm must run in O(n) time.',
    examples: [
      { input: 'nums = [100,4,200,1,3,2]', output: '4', note: '[1,2,3,4]' },
      { input: 'nums = [0,3,7,2,5,8,4,6,0,1]', output: '9' },
    ],
    constraints: ['0 ≤ nums.length ≤ 10⁵'],
    observation: 'A sequence can only start where num − 1 does not exist. Counting only from starts avoids O(n²).',
    structuralClue: 'Put all numbers into a set for O(1) lookup. Only extend from sequence starts.',
    invariant: 'A number is a sequence start if and only if num − 1 is not in the set.',
    hints: [
      'If you were allowed O(n log n), how would you solve this?',
      'Can you get O(n) without sorting? What structure allows O(1) lookups?',
      'Not every number should trigger a full count — which ones should?',
      'How do you identify the start of a new sequence?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(n)',
  },
  {
    id: 17,
    title: 'Clone Graph',
    slug: 'clone-graph',
    difficulty: 'Medium',
    pattern: 'Graph Traversal + Memoization',
    patternTag: 'graph-traversal',
    category: 'Advanced',
    description:
      'Given a reference to a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node contains an integer value and a list of its neighbors.',
    examples: [
      { input: 'adjList = [[2,4],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]', note: 'A complete deep copy' },
    ],
    constraints: ['Number of nodes in [0, 100]', 'Each Node.val is unique'],
    observation: 'You need to clone every node exactly once, then wire up its neighbors using the cloned versions.',
    structuralClue: 'A hash map from original node → cloned node prevents infinite loops and duplicate cloning.',
    invariant: 'If a node is in the visited map, its clone already exists — use it directly.',
    hints: [
      'What happens if you naively recurse through neighbors without tracking visited nodes?',
      'How does a map from original → clone help you avoid re-cloning and infinite cycles?',
      'When visiting a neighbor, how do you know if it has been cloned already?',
      'Would DFS or BFS work? Is one implementation simpler here?',
    ],
    expectedTime: 'O(V + E)',
    expectedSpace: 'O(V)',
  },
  {
    id: 18,
    title: 'Course Schedule',
    slug: 'course-schedule',
    difficulty: 'Medium',
    pattern: 'Topological Sort',
    patternTag: 'topological-sort',
    category: 'Advanced',
    description:
      'There are numCourses courses labeled 0 to numCourses − 1. prerequisites[i] = [a, b] means you must take b before a. Return true if you can finish all courses.',
    examples: [
      { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true' },
      { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', note: 'Cycle detected' },
    ],
    constraints: ['1 ≤ numCourses ≤ 2000', '0 ≤ prerequisites.length ≤ 5000'],
    observation: 'You can finish all courses if and only if the prerequisite graph contains no cycles.',
    structuralClue: "Model as a directed graph. Topological sort (BFS with in-degree) or DFS cycle detection both work.",
    invariant: 'A course can be taken when all its prerequisites have been processed (in-degree reaches 0).',
    hints: [
      'Model courses and prerequisites as a directed graph — what do the edges represent?',
      'What does a cycle in the prerequisite graph mean in real terms?',
      "What is in-degree, and how does it help identify which courses can start first?",
      "Kahn's algorithm: start with zero-in-degree nodes, process them — what do you enqueue next?",
    ],
    expectedTime: 'O(V + E)',
    expectedSpace: 'O(V + E)',
  },
  {
    id: 19,
    title: 'Lowest Common Ancestor',
    slug: 'lowest-common-ancestor',
    difficulty: 'Medium',
    pattern: 'Binary Tree Recursion',
    patternTag: 'tree-recursion',
    category: 'Advanced',
    description:
      'Given a binary tree, find the lowest common ancestor (LCA) of two given nodes p and q. The LCA is the lowest node that has both p and q as descendants (a node can be a descendant of itself).',
    examples: [
      { input: 'tree = [3,5,1,...], p = 5, q = 1', output: '3' },
      { input: 'tree = [3,5,1,...], p = 5, q = 4', output: '5', note: '5 is ancestor of 4' },
    ],
    constraints: ['Number of nodes in [2, 10⁵]', 'All Node.val are unique', 'p ≠ q, both exist in tree'],
    observation: 'If p and q split across left and right subtrees, the current node is the LCA.',
    structuralClue: 'Post-order recursion: gather results from children before deciding at the current node.',
    invariant: 'A non-null return from a subtree means p, q, or their LCA was found in that subtree.',
    hints: [
      'What are the base cases for your recursion?',
      'If you find p in the left subtree and q in the right (or vice versa), what does that mean for the current node?',
      'If both p and q are found in the same subtree, what should you return from the other subtree?',
      'Can you write this without any helper state — using only the return values of recursive calls?',
    ],
    expectedTime: 'O(n)',
    expectedSpace: 'O(h)',
  },
  {
    id: 20,
    title: 'Word Break',
    slug: 'word-break',
    difficulty: 'Medium',
    pattern: 'Dynamic Programming',
    patternTag: 'dynamic-programming',
    category: 'Advanced',
    description:
      'Given a string s and a dictionary wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.',
    examples: [
      { input: 's = "leetcode", wordDict = ["leet","code"]', output: 'true' },
      { input: 's = "applepenapple", wordDict = ["apple","pen"]', output: 'true' },
      { input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', output: 'false' },
    ],
    constraints: ['1 ≤ s.length ≤ 300', '1 ≤ wordDict.length ≤ 1000'],
    observation: 'dp[i] = true if s[0..i-1] can be segmented using the dictionary.',
    structuralClue: 'Build the answer left to right — dp[i] depends on dp[j] for all j < i.',
    invariant: 'dp[i] = true if there exists j < i where dp[j] is true and s[j..i-1] is in the dictionary.',
    hints: [
      'Can you define a recursive function first? Where does the overlapping substructure appear?',
      'What does dp[i] represent in a bottom-up solution?',
      'To fill dp[i], which earlier positions j do you check?',
      'How do you efficiently check if s[j..i-1] is in the dictionary?',
    ],
    expectedTime: 'O(n² × m)',
    expectedSpace: 'O(n)',
  },
]

export const CATEGORIES: ProblemCategory[] = [
  'Foundations',
  'Core Patterns',
  'Intermediate',
  'Advanced',
]
