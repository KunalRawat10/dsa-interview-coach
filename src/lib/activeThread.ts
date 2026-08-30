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

export function extractActiveThread(history: MessageHistoryItem[] = []): ActiveThread {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant') {
      const match = history[i].content.match(/<!--lite:([\s\S]*?)-->/)
      if (match) {
        try {
          const parsed = JSON.parse(match[1]) as ActiveThread
          if (parsed && parsed.current) {
            return parsed
          }
        } catch (_) {
          // Fall through to initial frame on parse failure
        }
      }
    }
  }

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

export function serializeActiveThread(thread: ActiveThread): string {
  return `<!--lite:${JSON.stringify(thread)}-->`
}
