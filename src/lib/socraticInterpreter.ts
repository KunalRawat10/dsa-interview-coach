// ─────────────────────────────────────────────────────────────────────────────
// Socratic Interpreter — Decoupled Semantic Interpretation & Signal Extraction
// ─────────────────────────────────────────────────────────────────────────────

import type { Problem } from '../data/problems'
import {
  type ApproachGraph,
  type EpistemicConfidence,
  type MisconceptionType,
  getActiveGraph,
} from './problemGraphs'
import type { ActiveThread } from './activeThread'
import { type SemanticMatch, matchSemanticConcepts } from './semanticMatcher'

export interface NodeMatch {
  nodeId: string
  score: number
  matchedPatterns: string[]
  isContextual: boolean
}

export interface LearnerInterpretation {
  rawText: string
  cleanedText: string
  confidence: EpistemicConfidence
  isHedged: boolean

  isQuestion: boolean
  questionTargetNodeId?: string
  questionContext?: string

  isPassiveAgreement: boolean

  primaryTouchedNodeId?: string
  touchedNodeIds: string[]
  nodeMatches?: NodeMatch[]
  touchedEdgeIds: string[]
  contextuallyMatchedNodeIds?: string[]

  suggestedApproachId?: string

  misconceptions: MisconceptionType[]
  misconceptionExplanation?: string

  hasCode: boolean
  isSelfCorrection: boolean
  correctionContent?: string

  claimedFact?: string
  mechanism?: string
  justification?: string
}

// ─── Low-Level Helper Extractors (Raw Signals Only) ───────────────────────────

export function stripHedge(text: string): { cleaned: string; wasHedged: boolean } {
  const trimmed = text.trim()
  const hedgePattern = /^(i think|i believe|i guess|maybe|perhaps|probably|i'm not sure but|i'd say|i feel like|wait,?\s*i think|wait,?\s*maybe|could we just|what if we|would)\s+/i
  const hasHedge = hedgePattern.test(trimmed) || /\?$/.test(trimmed)
  const cleaned = trimmed.replace(hedgePattern, '').replace(/\?+$/, '').trim()
  return { cleaned: cleaned || trimmed, wasHedged: hasHedge }
}

export function detectPassiveAgreement(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[.!?,;]+$/, '')
  return /^(okay|ok|got it|makes sense|that makes sense|yeah|yes|right|understood|i see|sure|alright|cool)$/i.test(t)
}

export function detectCodeSyntax(text: string): boolean {
  if (text.includes('```')) return true
  return [
    /\bfunction\s+\w+\s*\(/i,
    /\bdef\s+\w+\s*\(/i,
    /\b(const|let|var)\s+\w+\s*=/i,
    /\bfor\s*\(\s*(let|var|int|const)?\s*\w+/i,
    /\breturn\s+(true|false|null|None|\w+\[|-1|\d+)/i,
    /=>\s*\{/,
  ].some((p) => p.test(text))
}

export function detectMisconceptions(text: string): {
  types: MisconceptionType[]
  explanation?: string
} {
  const lower = text.toLowerCase()
  const types: MisconceptionType[] = []
  let explanation: string | undefined

  // 1. Single loop implies O(n) linear complexity
  if (
    /\bo\s*\(\s*n\s*\)/i.test(lower) &&
    /\b(single loop|one loop|loop once|only loop|going through.*once|one pass)\b/i.test(lower) &&
    !/\b(hash|set|map|dictionary|two pointers|binary)\b/i.test(lower)
  ) {
    types.push('SINGLE_LOOP_IMPLIES_LINEAR')
    explanation = 'A single outer loop can still perform quadratic work if each step looks back across earlier elements.'
  }

  // 2. Set sorts elements
  if (
    /\b(set|hashset|hash map|map)\b/i.test(lower) &&
    /\b(sorts?|orders?|keeps? (the numbers |everything )?sorted|arranges? in order)\b/i.test(lower)
  ) {
    types.push('STRUCTURE_SORTS_VALUES')
    explanation = 'A Hash Set does not sort elements; it uses hash indexing to provide constant-time membership lookups.'
  }

  // 3. Array scan is O(1)
  if (
    /\b(array|list)\b/i.test(lower) &&
    /\b(o\s*\(\s*1\s*\)|instant|constant time|fast lookup)\b/i.test(lower)
  ) {
    types.push('LINEAR_SCAN_IS_CONSTANT_TIME')
    explanation = 'Searching an unordered array takes linear O(n) time per lookup, not constant O(1) time.'
  }

  // 4. Instance count vs growth rate (e.g. O(6))
  if (/\bo\s*\(\s*6\s*\)/i.test(lower)) {
    types.push('CONFLATES_INSTANCE_COUNT_WITH_GROWTH_RATE')
    explanation = 'Six is the comparison count for a 4-element example, not the general Big-O growth rate.'
  }

  return { types, explanation }
}

// ─── Main Interpretation Function ────────────────────────────────────────────

export function interpretLearnerMessage(
  userText: string,
  problem?: Problem,
  activeThread?: ActiveThread,
  graph?: ApproachGraph
): LearnerInterpretation {
  const rawText = userText.trim()
  const { cleaned, wasHedged } = stripHedge(rawText)
  const lower = cleaned.toLowerCase()
  const activeGraph = graph ?? { id: 'default', name: 'Default', isCanonical: true, nodes: [], edges: [] }

  const hasCode = detectCodeSyntax(rawText)
  const isPassiveAgreement = detectPassiveAgreement(rawText)

  // 1. Self correction detection ("Wait, actually...")
  const isSelfCorrection = /\b(actually|wait|i mean|no wait|correction|i meant|rather)\b/i.test(rawText)
  let correctionContent: string | undefined
  if (isSelfCorrection) {
    const m = rawText.match(/\b(actually|i mean|no wait|correction|i meant|rather)[,:]?\s+(.+)/i)
    if (m) correctionContent = m[2].trim()
  }

  // 2. Learner Question / Interrupt Identification
  const isQuestion =
    /^\s*why\s*\??\s*$/i.test(rawText) ||
    /\b(why (is|do we need|are we|not|does)|how does|can't we use|what if|what does o\(1\)|what happens with)\b/i.test(lower)

  let questionTargetNodeId: string | undefined
  let questionContext: string | undefined

  if (isQuestion) {
    if (/\b(why is (lookup|set|a set|it) (faster|fast|o\(1\))|what does o\(1\)|how does (a )?set)\b/i.test(lower)) {
      questionTargetNodeId = 'membership_lookup'
      questionContext = 'hash_table_o1_mechanism'
    } else if (/\b(can't we use|why not|couldn't we use)\s+(a\s+)?set\b/i.test(lower)) {
      questionTargetNodeId = 'map_structure'
      questionContext = 'set_vs_map_index_preservation'
    } else if (/\bwhy is (the )?index (the )?value\b/i.test(lower)) {
      questionTargetNodeId = 'key_value_roles'
      questionContext = 'map_index_value_role'
    } else if (/\bwhy not (an? )?(array|list)\b/i.test(lower)) {
      questionTargetNodeId = 'set_structure'
      questionContext = 'array_vs_set_time_complexity'
    } else if (/\bwhy does (a )?set not need (sorting|to be sorted)\b/i.test(lower)) {
      questionTargetNodeId = 'set_structure'
      questionContext = 'set_unordered_property'
    } else if (/\bwhat (happens|if) \[/i.test(lower) || /\bwhat happens with\b/i.test(lower)) {
      questionTargetNodeId = 'hit_branch'
      questionContext = 'edge_case_trace'
    } else if (/why is (o\(n\^?2?\)|quadratic|n\^2|it n\^2|it n²)/i.test(lower)) {
      questionTargetNodeId = 'repeated_work'
      questionContext = 'quadratic_growth_cause'
    } else if (/why (do we need )?(the )?complement/i.test(lower)) {
      questionTargetNodeId = 'complement_formula'
      questionContext = 'complement_uniqueness'
    } else {
      // Default to the current active node
      questionTargetNodeId = activeThread?.current.targetNodeId ?? 'goal'
    }
  }

  // 3. Alternative Approach Suggestions
  let suggestedApproachId: string | undefined
  if (/\b(sort|sorting|sort the array|sort first)\b/i.test(lower) && !/\b(not need sorting|why does)\b/i.test(lower)) {
    suggestedApproachId = 'sorting-alternative'
  }

  // 4. Node & Edge Touched Matching
  const normalizedLower = lower
    .replace(/['’]ve\b/g, ' have')
    .replace(/['’]d\b/g, ' would')
    .replace(/['’]ll\b/g, ' will')
    .replace(/['’]re\b/g, ' are')
    .replace(/['’]s\b/g, ' is')
    .replace(/n['’]t\b/g, ' not')
    .replace(/['’]m\b/g, ' am')

  const textVariants = [normalizedLower, lower, rawText]

  interface MatchedSpan {
    nodeId: string
    pattern: string
    startIndex: number
    endIndex: number
    wordCount: number
    charLength: number
    isContextual: boolean
  }

  function findSpans(pattern: string, text: string, nodeId: string, isContextual: boolean): MatchedSpan[] {
    const words = pattern.trim().split(/\s+/).filter(Boolean)
    if (words.length === 0) return []

    let regex: RegExp
    if (words.length > 1) {
      const parts = words.map((w) => {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const startB = /^\w/.test(w) ? '\\b' : ''
        const endB = /\w$/.test(w) ? '\\b' : ''
        return `${startB}${escaped}${endB}`
      })
      regex = new RegExp(parts.join('.*?'), 'gi')
    } else {
      const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const startB = /^\w/.test(pattern) ? '\\b' : ''
      const endB = /\w$/.test(pattern) ? '\\b' : ''
      regex = new RegExp(`${startB}${escaped}${endB}`, 'gi')
    }

    const spans: MatchedSpan[] = []
    let m: RegExpExecArray | null
    while ((m = regex.exec(text)) !== null) {
      spans.push({
        nodeId,
        pattern,
        startIndex: m.index,
        endIndex: m.index + m[0].length,
        wordCount: words.length,
        charLength: m[0].length,
        isContextual,
      })
      if (m[0].length === 0) break
    }
    return spans
  }

  const rawSpans: MatchedSpan[] = []

  // 4a. Expected evidence patterns for all graph nodes
  for (const node of activeGraph.nodes) {
    for (const pattern of node.expectedEvidencePatterns) {
      for (const text of textVariants) {
        const found = findSpans(pattern, text, node.id, false)
        rawSpans.push(...found)
      }
    }
  }

  // 4b. Active-Target Contextual Evidence Matching
  const currentTargetNodeId = activeThread?.current.targetNodeId
  const currentTargetEdgeId = activeThread?.current.targetEdgeId
  const targetEdge = currentTargetEdgeId
    ? activeGraph.edges.find((e) => e.id === currentTargetEdgeId)
    : undefined

  const candidateTargetNodeIds = Array.from(
    new Set([currentTargetNodeId, targetEdge?.to].filter(Boolean) as string[])
  )

  for (const targetId of candidateTargetNodeIds) {
    const targetNode = activeGraph.nodes.find((n) => n.id === targetId)
    if (!targetNode?.contextualEvidencePatterns) continue

    for (const pattern of targetNode.contextualEvidencePatterns) {
      for (const text of textVariants) {
        const found = findSpans(pattern, text, targetNode.id, true)
        rawSpans.push(...found)
      }
    }
  }

  // 4c. Problem-specific examples (e.g. arithmetic complements in Two Sum)
  if (problem?.examples && problem.patternTag === 'hash-map') {
    const compRegex = /\b(target\s*-\s*\w+|\bcomplement\b|\b\d+\s*-\s*\d+)/gi
    let compMatch: RegExpExecArray | null
    while ((compMatch = compRegex.exec(lower)) !== null) {
      rawSpans.push({
        nodeId: 'complement_formula',
        pattern: compMatch[0],
        startIndex: compMatch.index,
        endIndex: compMatch.index + compMatch[0].length,
        wordCount: compMatch[0].split(/\s+/).filter(Boolean).length,
        charLength: compMatch[0].length,
        isContextual: false,
      })
      if (compMatch[0].length === 0) break
    }
  }

  // Deduplicate identical spans (same node, same start and end index)
  const uniqueSpans: MatchedSpan[] = []
  for (const span of rawSpans) {
    const exists = uniqueSpans.some(
      (u) =>
        u.nodeId === span.nodeId &&
        u.startIndex === span.startIndex &&
        u.endIndex === span.endIndex
    )
    if (!exists) {
      uniqueSpans.push(span)
    }
  }

  // 4d. Span Subsumption: A span for node A is subsumed if a strictly longer span for node B covers it
  const nonSubsumedSpans = uniqueSpans.filter((spanA) => {
    return !uniqueSpans.some((spanB) => {
      if (spanB.nodeId === spanA.nodeId) return false
      const covers = spanB.startIndex <= spanA.startIndex && spanB.endIndex >= spanA.endIndex
      const strictlyLonger = (spanB.endIndex - spanB.startIndex) > (spanA.endIndex - spanA.startIndex)
      return covers && strictlyLonger
    })
  })

  // 4e. Relevance Scoring & Ranking per Node
  const matchedNodeIds = Array.from(new Set(nonSubsumedSpans.map((s) => s.nodeId)))
  const nodeMatches: NodeMatch[] = []

  for (const nodeId of matchedNodeIds) {
    const spans = nonSubsumedSpans.filter((s) => s.nodeId === nodeId)
    const isContextual = spans.some((s) => s.isContextual)
    const matchedPatterns = Array.from(new Set(spans.map((s) => s.pattern)))

    let bestPatternScore = 0
    for (const s of spans) {
      let score = s.wordCount * 10 + s.charLength
      if (cleaned.toLowerCase() === s.pattern.toLowerCase()) {
        score += 20 // exact full-match bonus
      }
      if (score > bestPatternScore) {
        bestPatternScore = score
      }
    }

    let totalScore = bestPatternScore + (spans.length - 1) * 5

    // Active target relevance bonus
    const isActiveTarget = candidateTargetNodeIds.includes(nodeId)
    if (isActiveTarget) {
      totalScore += isContextual ? 30 : 20
    }

    nodeMatches.push({
      nodeId,
      score: totalScore,
      matchedPatterns,
      isContextual,
    })
  }

  // Sort nodes by match score descending
  nodeMatches.sort((a, b) => b.score - a.score)

  const touchedNodeIds = nodeMatches.map((m) => m.nodeId)
  const primaryTouchedNodeId = touchedNodeIds[0]
  const contextuallyMatchedNodeIds = nodeMatches.filter((m) => m.isContextual).map((m) => m.nodeId)

  // 4f. Edge Touched Matching
  const touchedEdgeIds: string[] = []
  for (const edge of activeGraph.edges) {
    if (touchedNodeIds.includes(edge.from) && touchedNodeIds.includes(edge.to)) {
      touchedEdgeIds.push(edge.id)
    }
  }

  // 5. Misconception Detection
  const { types: misconceptions, explanation: misconceptionExplanation } = detectMisconceptions(rawText)

  // 6. Epistemic Confidence
  const confidence: EpistemicConfidence = wasHedged || /\?$/.test(rawText) ? 'FRAGILE' : 'SOLID'

  return {
    rawText,
    cleanedText: cleaned,
    confidence,
    isHedged: wasHedged,
    isQuestion,
    questionTargetNodeId,
    questionContext,
    isPassiveAgreement,
    primaryTouchedNodeId,
    touchedNodeIds,
    nodeMatches,
    touchedEdgeIds,
    contextuallyMatchedNodeIds,
    suggestedApproachId,
    misconceptions,
    misconceptionExplanation,
    hasCode,
    isSelfCorrection,
    correctionContent,
    claimedFact: cleaned,
  }
}

export function applySemanticMatches(
  baseInterpretation: LearnerInterpretation,
  semanticMatches: SemanticMatch[],
  activeGraph: ApproachGraph
): LearnerInterpretation {
  // Question / interruption priority: do not graft concept matches onto questions
  if (baseInterpretation.isQuestion) {
    return baseInterpretation
  }

  const updatedNodeMatches = [...(baseInterpretation.nodeMatches ?? [])]
  const updatedTouchedNodeIds = [...baseInterpretation.touchedNodeIds]
  const updatedTouchedEdgeIds = [...baseInterpretation.touchedEdgeIds]

  for (const match of semanticMatches) {
    if (match.conceptType === 'NODE') {
      const nodeExists = activeGraph.nodes.some((n) => n.id === match.conceptId)
      if (!nodeExists) continue

      if (!updatedTouchedNodeIds.includes(match.conceptId)) {
        updatedTouchedNodeIds.push(match.conceptId)
        updatedNodeMatches.push({
          nodeId: match.conceptId,
          score: Math.round(match.score * 50),
          matchedPatterns: [`semantic:${match.prototypeId}`],
          isContextual: false,
        })
      }
    } else if (match.conceptType === 'EDGE') {
      const edgeExists = activeGraph.edges.some((e) => e.id === match.conceptId)
      if (!edgeExists) continue

      if (!updatedTouchedEdgeIds.includes(match.conceptId)) {
        updatedTouchedEdgeIds.push(match.conceptId)
      }
    }
  }

  updatedNodeMatches.sort((a, b) => b.score - a.score)
  const primaryTouchedNodeId = updatedNodeMatches[0]?.nodeId ?? updatedTouchedNodeIds[0]

  return {
    ...baseInterpretation,
    primaryTouchedNodeId,
    touchedNodeIds: updatedTouchedNodeIds,
    nodeMatches: updatedNodeMatches,
    touchedEdgeIds: updatedTouchedEdgeIds,
  }
}

export async function interpretLearnerMessageAsync(
  rawText: string,
  problem?: Problem,
  activeThread?: ActiveThread,
  graph?: ApproachGraph
): Promise<LearnerInterpretation> {
  const activeGraph = graph ?? getActiveGraph(problem?.slug, activeThread?.current.approachId)
  const baseInterpretation = interpretLearnerMessage(rawText, problem, activeThread, activeGraph)

  if (baseInterpretation.isQuestion) {
    return baseInterpretation
  }

  const semanticMatches = await matchSemanticConcepts(
    rawText,
    activeThread?.current.targetNodeId,
    activeThread?.current.targetEdgeId,
    problem?.slug
  )

  return applySemanticMatches(baseInterpretation, semanticMatches, activeGraph)
}
