// Zero-download, instant Socratic engine. Pattern-matches the user's message
// against DSA topic keywords and returns a guiding question — no model needed.
// This is what every visitor gets by default; WebLLM is opt-in on top of it.
//
// liteRespond accepts an optional patternTag (from the active Problem) so when
// a problem is selected the hints are contextually correct without requiring
// the user to type pattern keywords first.

type Category =
  | 'array'
  | 'hashmap'
  | 'twoPointer'
  | 'slidingWindow'
  | 'graph'
  | 'dp'
  | 'code'
  | 'generic'

const BANK: Record<Category, string[]> = {
  array: [
    "What do you know about the array up front — is it sorted, or could it be in any order?",
    "Would a brute-force nested loop work here? What's its time complexity, and where does it waste work?",
    "Could you solve this in a single pass if you tracked one extra piece of information as you go?",
  ],
  hashmap: [
    "A hash map trades space for speed — what would you use as the key here, and what would the value represent?",
    "If you've seen a value before, how would you know instantly instead of searching again?",
    "What's the lookup cost of a hash map versus scanning the array each time?",
  ],
  twoPointer: [
    "Since the data's ordered, what happens if you start one pointer at each end and move them based on a comparison?",
    "Two pointers usually replace an O(n²) nested loop — what condition would tell you to move the left pointer versus the right?",
    "What invariant stays true about the region between your two pointers as they move?",
  ],
  slidingWindow: [
    "As your window grows or shrinks, what condition tells you it's time to shrink it from the left?",
    "What are you tracking inside the window — a sum, a count, a set of characters?",
    "Could you update your running total in O(1) as the window slides, instead of recomputing it each time?",
  ],
  graph: [
    "Would BFS or DFS fit better here — does the problem care about shortest path, or just reachability?",
    "How are you representing the graph — adjacency list or matrix — and why does that choice matter for this problem's size?",
    "What do you need to track to avoid revisiting the same node forever?",
  ],
  dp: [
    "What's the smallest version of this problem you could solve directly, and how does a bigger case build on it?",
    "If you solved this recursively first, where would you see the same subproblem being solved more than once?",
    "What would your state represent — one variable, or a combination of a few?",
  ],
  code: [
    "Walk through your code's loops — are any of them nested, and if so, what's the resulting time complexity?",
    "What's the space complexity here — are you allocating any new structures proportional to the input size?",
    "Is there a step in here that repeats work you could cache or avoid entirely?",
  ],
  generic: [
    "Before diving in — what data structure do you think naturally fits this problem?",
    "What's the brute-force approach, and what's its time complexity? That's usually the right starting point.",
    "What edge cases should you consider — empty input, duplicates, negative numbers?",
    "Is the input sorted, or could it be in any order? That often changes the whole strategy.",
  ],
}

// Maps PatternTag values (from problems.ts) directly to BANK categories.
// Kept here to avoid a circular import; patterns not listed fall back to keyword detection.
const TAG_TO_CATEGORY: Record<string, Category> = {
  'hash-set': 'hashmap',
  'hash-map': 'hashmap',
  'frequency-map': 'hashmap',
  'stack': 'array',
  'running-min': 'array',
  'binary-search': 'array',
  'sliding-window': 'slidingWindow',
  'kadane': 'array',
  'prefix-suffix': 'array',
  'sorting-intervals': 'array',
  'sorting-two-pointers': 'twoPointer',
  'two-pointers': 'twoPointer',
  'monotonic-stack': 'array',
  'bfs-dfs': 'graph',
  'heap-bucket': 'array',
  'graph-traversal': 'graph',
  'topological-sort': 'graph',
  'tree-recursion': 'graph',
  'dynamic-programming': 'dp',
}

const KEYWORDS: Array<[Category, RegExp]> = [
  ['code', /function\s|def\s|=>|{[\s\S]*}/],
  ['hashmap', /hash\s?map|dictionary|frequency|complement|seen before/i],
  ['twoPointer', /two.?pointer|sorted array|palindrome/i],
  ['slidingWindow', /sliding.?window|substring|contiguous|subarray sum/i],
  ['graph', /\bgraph\b|\bnode\b|\bedge\b|\bbfs\b|\bdfs\b|\btree\b/i],
  ['dp', /dynamic programming|\bdp\b|memoiz|subsequence|optimal substructure/i],
  ['array', /\barray\b|\blist\b|\bindex\b/i],
]

// Tracks which question index we're on per category so repeats don't happen
// back-to-back within a session.
const cursor: Partial<Record<Category, number>> = {}

// patternTag: optional — when a Problem is active, pass problem.patternTag so
// Lite Mode returns hints relevant to the selected problem instead of guessing
// from keyword matching alone.
export function liteRespond(userText: string, patternTag?: string): string {
  let category: Category = 'generic'

  if (patternTag) {
    const mapped = TAG_TO_CATEGORY[patternTag]
    if (mapped) {
      category = mapped
    }
  }

  // If no tag was resolved, fall through to keyword detection on the user's text.
  if (category === 'generic') {
    for (const [cat, re] of KEYWORDS) {
      if (re.test(userText)) {
        category = cat
        break
      }
    }
  }

  const bank = BANK[category]
  const i = (cursor[category] ?? 0) % bank.length
  cursor[category] = i + 1
  return bank[i]
}