// ─────────────────────────────────────────────────────────────────────────────
// Active Thread — Authoritative Dialogue State & History Serialization
// ─────────────────────────────────────────────────────────────────────────────

import type { CognitiveTask, PedagogicalAction } from './problemGraphs'

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

