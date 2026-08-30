// Zero-download, instant Socratic Pedagogical State Engine.
// Tracks conceptual learner progression through discrete discovery stages:
// UNDERSTANDING -> EXAMPLE_REASONING -> BRUTE_FORCE -> COMPLEXITY ->
// BOTTLENECK -> OPTIMIZATION -> DATA_STRUCTURE -> KEY_INSIGHT ->
// ALGORITHM -> IMPLEMENTATION -> VERIFICATION -> REFLECTION
//
// Core Invariant: Never reveal data structures, formulas, or patterns
// before the learner has articulated the conceptual need for them.

import type { Problem } from '../data/problems'

export enum SocraticStage {
  UNDERSTANDING = 0,
  EXAMPLE_REASONING = 1,
  BRUTE_FORCE = 2,
  COMPLEXITY = 3,
  BOTTLENECK = 4,
  OPTIMIZATION = 5,
  DATA_STRUCTURE = 6,
  KEY_INSIGHT = 7,
  ALGORITHM = 8,
  IMPLEMENTATION = 9,
  VERIFICATION = 10,
  REFLECTION = 11,
}

interface MessageHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

// ─── Stage Classification Helpers ─────────────────────────────────────────────

function isHintRequest(text: string): boolean {
  return /\b(hint|stuck|give me a hint|what should i think|where do i start|clue|help me)\b/i.test(text)
}

function isDirectSolutionRequest(text: string): boolean {
  return /\b(give me the answer|what('s| is) the solution|just tell me|write the code for me|solve it for me|give me code)\b/i.test(text)
}

function isStrugglingOrUncertain(text: string): boolean {
  return /\b(i don'?t know|not sure|no idea|confused|lost|dont know|dunno|idk)\b/i.test(text)
}

function hasCodeImplementation(text: string): boolean {
  return (
    /\b(function|def|class|const|let|var|for\s*\(|while\s*\(|return\b|=>|{\s*[\w\s;]+\s*})/i.test(text) ||
    text.includes('```') ||
    text.split('\n').length > 3
  )
}

function mentionsAlgorithmSummary(text: string): boolean {
  return /\b(first|then|after that|step 1|step 2|iterate|loop through|for each|initialize|finally)\b/i.test(text) && text.length > 40
}

function mentionsKeyInsight(text: string, problem?: Problem): boolean {
  if (!problem) return false
  // Check for problem-specific insight keywords
  switch (problem.patternTag) {
    case 'hash-map':
    case 'hash-set':
    case 'frequency-map':
      return /\b(complement|target\s*-\s*\w+|target minus|difference|seen before|already exists in)\b/i.test(text)
    case 'running-min':
      return /\b(min so far|minimum price|lowest price|running min|current - min|price - min)\b/i.test(text)
    case 'stack':
    case 'monotonic-stack':
      return /\b(top of the stack|peek|pop when|most recent opener|match with top|empty stack)\b/i.test(text)
    case 'binary-search':
      return /\b(mid|middle|left = mid|right = mid|eliminate half|discard half)\b/i.test(text)
    case 'two-pointers':
    case 'sorting-two-pointers':
      return /\b(move left|move right|sum < target|sum > target|shrink|left\+\+|right--)\b/i.test(text)
    case 'sliding-window':
      return /\b(expand right|shrink left|window size|duplicate in window|valid window)\b/i.test(text)
    default:
      return /\b(invariant|base case|subproblem|memoiz|optimal)\b/i.test(text)
  }
}

function mentionsDataStructure(text: string): boolean {
  return /\b(hash\s*map|hashmap|hash\s*set|hashset|map|set|dictionary|dict|stack|queue|deque|two\s*pointers?|binary\s*search|heap|priority\s*queue|tree|graph)\b/i.test(text)
}

function mentionsOptimizationOrMemory(text: string): boolean {
  return /\b(remember|store|keep track|cache|lookup|record|save|track of|seen|history|look up|o\(1\))\b/i.test(text)
}

function mentionsBottleneck(text: string): boolean {
  return /\b(waste|repeated|redundant|duplicate work|searching again|scanning again|starting over|recomput|slow)\b/i.test(text)
}

function mentionsComplexity(text: string): boolean {
  return /\b(o\(n\^?2\)|o\(n\^2\)|o\(n\s*\*\s*n\)|o\(n\)|o\(log\s*n\)|o\(n\s*log\s*n\)|quadratic|linear|logarithmic|time complexity|nested loops?)\b/i.test(text)
}

function mentionsBruteForce(text: string): boolean {
  return /\b(brute\s*force|check (every|all)|all pairs|nested loop|two loops|compare each|test all|scan through|try every|every combination)\b/i.test(text)
}

function mentionsUnderstanding(text: string): boolean {
  return /\b(find|return|sum up|pair|indices|subarrays?|substring|target|matches|duplicate|valid|profit|longest)\b/i.test(text)
}

// ─── State Evaluator: Infer Current Learner Stage From Trajectory ────────────

function inferHighestStageFromHistory(history: MessageHistoryItem[], problem?: Problem): SocraticStage {
  let highest = SocraticStage.UNDERSTANDING

  for (const msg of history) {
    if (msg.role !== 'user') continue
    const t = msg.content

    if (hasCodeImplementation(t)) {
      highest = Math.max(highest, SocraticStage.IMPLEMENTATION)
    } else if (mentionsAlgorithmSummary(t)) {
      highest = Math.max(highest, SocraticStage.ALGORITHM)
    } else if (mentionsKeyInsight(t, problem)) {
      highest = Math.max(highest, SocraticStage.KEY_INSIGHT)
    } else if (mentionsDataStructure(t)) {
      highest = Math.max(highest, SocraticStage.DATA_STRUCTURE)
    } else if (mentionsOptimizationOrMemory(t)) {
      highest = Math.max(highest, SocraticStage.OPTIMIZATION)
    } else if (mentionsBottleneck(t)) {
      highest = Math.max(highest, SocraticStage.BOTTLENECK)
    } else if (mentionsComplexity(t)) {
      highest = Math.max(highest, SocraticStage.COMPLEXITY)
    } else if (mentionsBruteForce(t)) {
      highest = Math.max(highest, SocraticStage.BRUTE_FORCE)
    } else if (mentionsUnderstanding(t)) {
      highest = Math.max(highest, SocraticStage.EXAMPLE_REASONING)
    }
  }

  return highest
}

// ─── Socratic Question Generators By Archetype & Stage ────────────────────────

function getExampleSnippet(problem?: Problem): string {
  if (problem?.examples && problem.examples.length > 0) {
    return problem.examples[0].input
  }
  return 'the first example'
}

function generateResponseForStage(
  stage: SocraticStage,
  problem?: Problem,
  userText: string = ''
): string {
  const ex = getExampleSnippet(problem)
  const tag = problem?.patternTag ?? 'generic'

  switch (stage) {
    case SocraticStage.UNDERSTANDING:
    case SocraticStage.EXAMPLE_REASONING: {
      // Guide learner to think about brute-force / naive approach first
      if (tag === 'running-min') {
        return `Good understanding. Let's look at ${ex}. If you didn't know any special technique, how could you find the maximum profit by checking all possible buy and sell days?`
      }
      if (tag === 'stack' || tag === 'monotonic-stack') {
        return `Good. Let's trace ${ex}. When you encounter each element as you move left to right, what do you need to check about previous elements?`
      }
      if (tag === 'binary-search') {
        return `Good. Notice in ${ex} that the input is already sorted. If you searched for the target using a basic linear scan, how would that work?`
      }
      if (tag === 'two-pointers' || tag === 'sorting-two-pointers' || tag === 'sliding-window') {
        return `Good understanding. Looking at ${ex}, what would a naive brute-force approach do to test all possible ranges or pairs?`
      }
      // Hash-map, hash-set, frequency-map, and general
      return `Good. Let's use ${ex}. If you didn't know any special data structures or techniques, how could you find the answer with a basic brute-force approach?`
    }

    case SocraticStage.BRUTE_FORCE: {
      // Learner stated understanding or initial idea -> ask for brute force complexity
      return `Exactly, checking all combinations or pairs works. If the input has size n, what would be the time complexity of that brute-force approach?`
    }

    case SocraticStage.COMPLEXITY: {
      // Learner stated brute force -> ask for time complexity
      return `Right. If we check every pair or subarray with nested loops, what is the resulting time complexity?`
    }

    case SocraticStage.BOTTLENECK: {
      // Learner stated O(n^2) -> ask where work is wasted
      if (tag === 'binary-search') {
        return `Right, linear search takes O(n). Since the array is already sorted, what can you infer immediately if you look at the middle element?`
      }
      if (tag === 'running-min') {
        return `Right, checking all pairs of days is O(n²). As you scan prices from left to right, where is work being wasted on repeated comparisons?`
      }
      return `Right, checking all possibilities takes O(n²). As you scan through the elements one by one, where is time being wasted on repeated work?`
    }

    case SocraticStage.OPTIMIZATION: {
      // Learner identified bottleneck -> ask what info to remember
      if (tag === 'running-min') {
        return `Exactly! To calculate the best profit ending on any day, what single piece of information from earlier days do you need to track as you scan?`
      }
      if (tag === 'stack' || tag === 'monotonic-stack') {
        return `Notice that we always need to match against the *most recently seen* unclosed item. What LIFO (Last-In, First-Out) data structure fits that order?`
      }
      if (tag === 'binary-search') {
        return `If the middle element is greater than the target, which entire half of the search space can you safely eliminate?`
      }
      if (tag === 'two-pointers' || tag === 'sliding-window') {
        return `How can we maintain pointers at the boundaries and move them based on a condition, rather than re-evaluating from scratch?`
      }
      return `Exactly. To avoid repeatedly scanning backward through elements, what information about earlier numbers would be useful to remember as we scan?`
    }

    case SocraticStage.DATA_STRUCTURE: {
      // Learner identified need to remember / store -> ask for data structure
      if (tag === 'running-min') {
        return `A single variable for the minimum price so far works in O(1) space! How will you compute the profit on each day as you scan?`
      }
      if (tag === 'stack' || tag === 'monotonic-stack') {
        return `A Stack is ideal here. When you iterate through the input, what should you push onto the stack, and when should you pop?`
      }
      if (tag === 'binary-search') {
        return `Binary search with two boundary pointers lets us halve the search space each step. What are your initial left and right pointers?`
      }
      if (tag === 'two-pointers' || tag === 'sorting-two-pointers') {
        return `Two pointers let us scan in linear time. What condition tells you to move the left pointer versus the right pointer?`
      }
      return `What data structure gives us O(1) instantaneous lookup to check if a value has been seen before?`
    }

    case SocraticStage.KEY_INSIGHT: {
      // Learner identified data structure -> ask for complement / key-value mapping / invariant
      if (tag === 'hash-map') {
        return `Good. If the current number is x and the target is T, what exact complement value are you searching for in the map, and what needs to be stored as the value?`
      }
      if (tag === 'hash-set' || tag === 'frequency-map') {
        return `Good. For each item as you scan, what do you check in the set/map before deciding whether to add it or return true?`
      }
      if (tag === 'running-min') {
        return `Exactly: profit = current_price - min_so_far. How do you update both the minimum price and the maximum profit at each step?`
      }
      if (tag === 'stack') {
        return `When you encounter a closing bracket, what should you compare against the top of the stack, and what makes the string invalid?`
      }
      if (tag === 'binary-search') {
        return `When nums[mid] is not the target, how do you update your left or right pointer, and what is your loop condition?`
      }
      if (tag === 'sliding-window') {
        return `What invariant defines a valid window, and what condition triggers shrinking the window from the left?`
      }
      return `Spot on. How does that key insight translate into the core condition of your scan?`
    }

    case SocraticStage.ALGORITHM: {
      return `Great! Can you summarize the complete step-by-step algorithm in your own words before writing code?`
    }

    case SocraticStage.IMPLEMENTATION: {
      return `Nicely structured! Go ahead and write out your solution in code, or describe the exact loop structure.`
    }

    case SocraticStage.VERIFICATION: {
      return `Let's trace your code against an edge case or ${ex}. Does your solution handle empty inputs or single elements properly, and what is its final time and space complexity?`
    }

    case SocraticStage.REFLECTION: {
      return `Excellent work! What was the fundamental pattern here that allowed us to improve upon the naive brute-force approach?`
    }

    default:
      return `Where would you like to start? What stands out about the inputs or what the problem is asking for?`
  }
}

// ─── Main Entry Point: liteRespond ────────────────────────────────────────────

export function liteRespond(
  userText: string,
  problem?: Problem,
  history: MessageHistoryItem[] = []
): string {
  const trimmed = userText.trim()

  // 1. Direct request for complete answer / code dump
  if (isDirectSolutionRequest(trimmed)) {
    const ex = getExampleSnippet(problem)
    return `I won't give away the complete code directly — you'll learn much more by discovering it! Let's take it one step at a time. Looking at ${ex}, what would be the simplest, naive way to try solving it?`
  }

  // 2. Explicit hint request
  if (isHintRequest(trimmed)) {
    if (problem?.hints && problem.hints.length > 0) {
      // Find current inferred stage to pick the most relevant hint
      const currentStage = inferHighestStageFromHistory(history, problem)
      let hintIndex = 0
      if (currentStage >= SocraticStage.KEY_INSIGHT) {
        hintIndex = Math.min(problem.hints.length - 1, 2)
      } else if (currentStage >= SocraticStage.DATA_STRUCTURE) {
        hintIndex = Math.min(problem.hints.length - 1, 1)
      }
      return `Here's a gentle hint to guide your thinking:\n\n${problem.hints[hintIndex]}\n\nHow does that apply to the current example?`
    }
    return `Think about what redundant work is happening in a naive scan. What information could we record to avoid searching repeatedly?`
  }

  // 3. User says "I don't know" / confused / stuck
  if (isStrugglingOrUncertain(trimmed)) {
    const ex = getExampleSnippet(problem)
    return `That's completely fine! Let's break it down into a smaller step. Look at ${ex}. If you were doing this manually with pencil and paper, what is the very first thing you would check?`
  }

  // 4. Evaluate demonstrated concepts in CURRENT user message + history
  const currentMsgHasCode = hasCodeImplementation(trimmed)
  const currentMsgHasAlgo = mentionsAlgorithmSummary(trimmed)
  const currentMsgHasInsight = mentionsKeyInsight(trimmed, problem)
  const currentMsgHasDS = mentionsDataStructure(trimmed)
  const currentMsgHasOpt = mentionsOptimizationOrMemory(trimmed)
  const currentMsgHasBottleneck = mentionsBottleneck(trimmed)
  const currentMsgHasComplexity = mentionsComplexity(trimmed)
  const currentMsgHasBruteForce = mentionsBruteForce(trimmed)
  const currentMsgHasUnderstanding = mentionsUnderstanding(trimmed)

  // Determine the highest stage demonstrated in the entire conversation
  const priorHighest = inferHighestStageFromHistory(history, problem)

  // Determine what stage the current message demonstrates
  let currentDemonstrated = SocraticStage.UNDERSTANDING
  if (currentMsgHasCode) currentDemonstrated = SocraticStage.IMPLEMENTATION
  else if (currentMsgHasAlgo) currentDemonstrated = SocraticStage.ALGORITHM
  else if (currentMsgHasInsight) currentDemonstrated = SocraticStage.KEY_INSIGHT
  else if (currentMsgHasDS) currentDemonstrated = SocraticStage.DATA_STRUCTURE
  else if (currentMsgHasOpt) currentDemonstrated = SocraticStage.OPTIMIZATION
  else if (currentMsgHasBottleneck) currentDemonstrated = SocraticStage.BOTTLENECK
  else if (currentMsgHasComplexity) currentDemonstrated = SocraticStage.COMPLEXITY
  else if (currentMsgHasBruteForce) currentDemonstrated = SocraticStage.BRUTE_FORCE
  else if (currentMsgHasUnderstanding) currentDemonstrated = SocraticStage.EXAMPLE_REASONING

  const effectiveStage = Math.max(priorHighest, currentDemonstrated)

  // 5. Adaptive Advance: move to the NEXT stage that has not yet been demonstrated
  // Special Handling if learner jumps directly to optimal data structure / insight
  if (currentMsgHasDS && priorHighest < SocraticStage.DATA_STRUCTURE) {
    // User jumped straight to data structure (e.g. "Use a hash map")
    // Validate it and ask WHY / what is stored
    return generateResponseForStage(SocraticStage.KEY_INSIGHT, problem, trimmed)
  }

  if (currentMsgHasInsight && priorHighest < SocraticStage.KEY_INSIGHT) {
    // User jumped to key insight (e.g. "Look for target - x")
    return generateResponseForStage(SocraticStage.ALGORITHM, problem, trimmed)
  }

  if (currentMsgHasCode) {
    return generateResponseForStage(SocraticStage.VERIFICATION, problem, trimmed)
  }

  if (currentMsgHasAlgo) {
    return generateResponseForStage(SocraticStage.IMPLEMENTATION, problem, trimmed)
  }

  // Normal progression: Advance to immediate next stage
  if (currentMsgHasComplexity && (currentMsgHasBruteForce || priorHighest >= SocraticStage.BRUTE_FORCE)) {
    // User provided brute force AND complexity at once -> jump straight to bottleneck
    return generateResponseForStage(SocraticStage.BOTTLENECK, problem, trimmed)
  }

  if (effectiveStage === SocraticStage.UNDERSTANDING || effectiveStage === SocraticStage.EXAMPLE_REASONING) {
    if (currentMsgHasBruteForce) {
      return generateResponseForStage(SocraticStage.BRUTE_FORCE, problem, trimmed)
    }
    return generateResponseForStage(SocraticStage.EXAMPLE_REASONING, problem, trimmed)
  }

  if (effectiveStage === SocraticStage.BRUTE_FORCE) {
    return generateResponseForStage(SocraticStage.BRUTE_FORCE, problem, trimmed)
  }

  if (effectiveStage === SocraticStage.COMPLEXITY) {
    return generateResponseForStage(SocraticStage.BOTTLENECK, problem, trimmed)
  }

  if (effectiveStage === SocraticStage.BOTTLENECK) {
    return generateResponseForStage(SocraticStage.OPTIMIZATION, problem, trimmed)
  }

  if (effectiveStage === SocraticStage.OPTIMIZATION) {
    return generateResponseForStage(SocraticStage.DATA_STRUCTURE, problem, trimmed)
  }

  if (effectiveStage === SocraticStage.DATA_STRUCTURE) {
    return generateResponseForStage(SocraticStage.KEY_INSIGHT, problem, trimmed)
  }

  if (effectiveStage === SocraticStage.KEY_INSIGHT) {
    return generateResponseForStage(SocraticStage.ALGORITHM, problem, trimmed)
  }

  if (effectiveStage === SocraticStage.ALGORITHM) {
    return generateResponseForStage(SocraticStage.IMPLEMENTATION, problem, trimmed)
  }

  return generateResponseForStage(SocraticStage.EXAMPLE_REASONING, problem, trimmed)
}