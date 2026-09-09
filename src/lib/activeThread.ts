// ─────────────────────────────────────────────────────────────────────────────
// Active Thread — Authoritative Dialogue State & History Serialization
// ─────────────────────────────────────────────────────────────────────────────

import type { ApproachGraph, CognitiveTask, PedagogicalAction } from './problemGraphs'

export interface ActiveThreadFrame {
  approachId: string
  targetNodeId?: string
  targetEdgeId?: string
  cognitiveTask: CognitiveTask
  pedagogicalAction: PedagogicalAction
}

export interface ActiveThread {
  current: ActiveThreadFrame
  returnStack: ActiveThreadFrame[]
}

export interface MessageHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export type PedagogicalStageId = 1 | 2 | 3 | 4

export interface PedagogicalStageInfo {
  currentStage: PedagogicalStageId
  stageName: 'Understanding' | 'Brute Force' | 'Strategy' | 'Implementation'
  isSolved: boolean
  isAlternativeApproach: boolean
}

export const PEDAGOGICAL_STAGES = [
  { id: 1 as const, name: 'Understanding' as const },
  { id: 2 as const, name: 'Brute Force' as const },
  { id: 3 as const, name: 'Strategy' as const },
  { id: 4 as const, name: 'Implementation' as const },
]

export function getPedagogicalStage(
  thread?: ActiveThread | null,
  graph?: ApproachGraph | null,
  solved: boolean = false
): PedagogicalStageInfo {
  if (solved) {
    return {
      currentStage: 4,
      stageName: 'Implementation',
      isSolved: true,
      isAlternativeApproach: false,
    }
  }

  const isAlt = Boolean(
    thread?.current?.approachId &&
      thread.current.approachId !== 'canonical' &&
      graph &&
      !graph.isCanonical
  )

  if (!thread || !thread.current) {
    return {
      currentStage: 1,
      stageName: 'Understanding',
      isSolved: false,
      isAlternativeApproach: false,
    }
  }

  if (thread.current.pedagogicalAction === 'OFFER_CODE_IMPLEMENTATION') {
    return {
      currentStage: 4,
      stageName: 'Implementation',
      isSolved: false,
      isAlternativeApproach: isAlt,
    }
  }

  const targetNodeId = thread.current.targetNodeId
  const targetEdgeId = thread.current.targetEdgeId

  let category = graph?.nodes.find((n) => n.id === targetNodeId)?.category

  if (!category && targetEdgeId && graph?.edges) {
    const edge = graph.edges.find((e) => e.id === targetEdgeId)
    if (edge) {
      category =
        graph.nodes.find((n) => n.id === edge.to)?.category ??
        graph.nodes.find((n) => n.id === edge.from)?.category
    }
  }

  let stage: PedagogicalStageId = 1

  switch (category) {
    case 'GOAL':
      stage = 1
      break
    case 'BRUTE_FORCE':
    case 'BOTTLENECK':
      stage = 2
      break
    case 'OPTIMIZATION_STRATEGY':
    case 'DATA_STRUCTURE':
    case 'INVARIANT_MECHANISM':
      stage = 3
      break
    case 'OPERATIONAL_BRANCH':
    case 'TERMINATION':
      stage = 4
      break
    default:
      stage = 1
      break
  }

  const stageNames: Record<PedagogicalStageId, 'Understanding' | 'Brute Force' | 'Strategy' | 'Implementation'> = {
    1: 'Understanding',
    2: 'Brute Force',
    3: 'Strategy',
    4: 'Implementation',
  }

  return {
    currentStage: stage,
    stageName: stageNames[stage],
    isSolved: false,
    isAlternativeApproach: isAlt,
  }
}

export function getDefaultActiveThread(): ActiveThread {
  return {
    current: {
      approachId: 'canonical',
      targetNodeId: 'goal',
      cognitiveTask: 'IDENTIFY',
      pedagogicalAction: 'DEEPEN_PARTIAL_REASONING',
    },
    returnStack: [],
  }
}

export function extractActiveThreadFromContent(content: string): ActiveThread | null {
  const match = content.match(/<!--lite:([\s\S]*?)-->/)
  if (match) {
    try {
      const parsed = JSON.parse(match[1]) as any
      if (parsed && parsed.current) {
        return parsed as ActiveThread
      }
      if (parsed && parsed.approachId) {
        return {
          current: {
            approachId: parsed.approachId,
            targetNodeId: parsed.targetNodeId,
            targetEdgeId: parsed.targetEdgeId,
            cognitiveTask: parsed.cognitiveTask,
            pedagogicalAction: parsed.pedagogicalAction,
          },
          returnStack: parsed.returnStack ?? [],
        }
      }
    } catch (_) {
      // Fall through on parse failure
    }
  }
  return null
}

export function extractActiveThread(history: MessageHistoryItem[] = []): ActiveThread {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant') {
      const thread = extractActiveThreadFromContent(history[i].content)
      if (thread) {
        return thread
      }
    }
  }

  return getDefaultActiveThread()
}

export function serializeActiveThread(thread: ActiveThread): string {
  return `<!--lite:${JSON.stringify(thread)}-->`
}

