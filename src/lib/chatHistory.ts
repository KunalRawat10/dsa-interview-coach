export interface StoredMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatSession {
  id: string
  createdAt: number
  updatedAt: number
  timestamp?: number
  problemId?: number
  problemTitle?: string
  messages: StoredMessage[]
}

export interface ActiveChatState {
  sessionId: string
  problemId?: number
  messages: StoredMessage[]
}

export const HISTORY_KEY = 'dsa-coach:chat-history'
export const ACTIVE_CHAT_KEY = 'dsa-coach:chat'
const MAX_SESSIONS = 20 // cap so localStorage doesn't grow unbounded

export function createSessionId(reason: string): string {
  const id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  console.log('[SESSION CREATED]', {
    id,
    reason,
    timestamp: Date.now(),
    stack: new Error().stack,
  })
  return id
}

/**
 * Normalizes history records based strictly on Session ID identity.
 * - Same exact session ID -> consolidated.
 * - Different session IDs -> strictly preserved as distinct separate conversations.
 */
export function deduplicateHistory(rawSessions: ChatSession[]): ChatSession[] {
  if (!Array.isArray(rawSessions) || rawSessions.length === 0) return []

  const validSessions = rawSessions
    .map((s) => {
      const createdAt =
        typeof s.createdAt === 'number'
          ? s.createdAt
          : typeof s.timestamp === 'number'
            ? s.timestamp
            : Date.now()
      const updatedAt =
        typeof s.updatedAt === 'number'
          ? s.updatedAt
          : typeof s.timestamp === 'number'
            ? s.timestamp
            : createdAt
      return {
        id: String(s.id),
        createdAt,
        updatedAt,
        timestamp: updatedAt,
        problemId: typeof s.problemId === 'number' ? s.problemId : undefined,
        problemTitle: typeof s.problemTitle === 'string' ? s.problemTitle : undefined,
        messages: Array.isArray(s.messages) ? s.messages : [],
      }
    })
    .filter((s) => s.messages.some((m) => m.role === 'user')) // only keep conversations with user messages

  // Group strictly by authoritative Session ID
  const byId = new Map<string, ChatSession>()
  for (const session of validSessions) {
    const existing = byId.get(session.id)
    if (!existing) {
      byId.set(session.id, session)
    } else {
      // Same ID -> keep longest messages, earliest createdAt, latest updatedAt
      const longerMessages =
        session.messages.length >= existing.messages.length
          ? session.messages
          : existing.messages
      byId.set(session.id, {
        ...existing,
        messages: longerMessages,
        createdAt: Math.min(existing.createdAt, session.createdAt),
        updatedAt: Math.max(existing.updatedAt, session.updatedAt),
        timestamp: Math.max(existing.updatedAt, session.updatedAt),
        problemId: session.problemId ?? existing.problemId,
        problemTitle: session.problemTitle ?? existing.problemTitle,
      })
    }
  }

  const resultList = Array.from(byId.values())
  resultList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  return resultList.slice(0, MAX_SESSIONS)
}

export function loadHistory(): ChatSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return deduplicateHistory(parsed)
  } catch {
    return []
  }
}

export function upsertHistorySession(sessionData: {
  id: string
  messages: StoredMessage[]
  problemId?: number
  problemTitle?: string
  createdAt?: number
  updatedAt?: number
}): ChatSession[] {
  const targetId = String(sessionData.id)
  const hasUserMessage = sessionData.messages.some((m) => m.role === 'user')
  if (!hasUserMessage) {
    return loadHistory()
  }

  const history = loadHistory()
  const existingIndex = history.findIndex((s) => String(s.id) === targetId)
  const now = Date.now()

  let updatedSession: ChatSession
  if (existingIndex >= 0) {
    const existing = history[existingIndex]
    updatedSession = {
      ...existing,
      id: targetId,
      problemId: sessionData.problemId !== undefined ? sessionData.problemId : existing.problemId,
      problemTitle: sessionData.problemTitle !== undefined ? sessionData.problemTitle : existing.problemTitle,
      messages: sessionData.messages,
      updatedAt: now,
      timestamp: now,
    }
  } else {
    updatedSession = {
      id: targetId,
      createdAt: sessionData.createdAt ?? now,
      updatedAt: sessionData.updatedAt ?? now,
      timestamp: sessionData.updatedAt ?? now,
      problemId: sessionData.problemId,
      problemTitle: sessionData.problemTitle,
      messages: sessionData.messages,
    }
  }

  const filtered = history.filter((s) => String(s.id) !== targetId)
  const updatedHistory = deduplicateHistory([updatedSession, ...filtered])

  console.log('[HISTORY WRITE]', {
    operation: 'UPSERT',
    sessionId: targetId,
    previousHistoryLength: history.length,
    newHistoryLength: updatedHistory.length,
    timestamp: now,
    stack: new Error().stack,
  })

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory))
  } catch {
    // storage full or unavailable
  }
  return updatedHistory
}

export function deleteSession(id: string): ChatSession[] {
  const targetId = String(id)
  const history = loadHistory()
  const updated = history.filter((s) => String(s.id) !== targetId)
  console.log('[HISTORY WRITE]', {
    operation: 'DELETE',
    sessionId: targetId,
    previousHistoryLength: history.length,
    newHistoryLength: updated.length,
    timestamp: Date.now(),
    stack: new Error().stack,
  })
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // ignore
  }
  return updated
}

export function clearHistory(): ChatSession[] {
  const previousLength = loadHistory().length
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    // ignore
  }
  console.log('[HISTORY CLEAR]', {
    previousCount: previousLength,
    newCount: 0,
    timestamp: Date.now(),
  })
  return []
}

export function saveActiveSession(state: ActiveChatState): void {
  try {
    localStorage.setItem(ACTIVE_CHAT_KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable
  }
}

export function loadActiveSession(defaultProblemId?: number): ActiveChatState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CHAT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)

    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.sessionId === 'string' &&
      Array.isArray(parsed.messages)
    ) {
      return {
        sessionId: String(parsed.sessionId),
        problemId: typeof parsed.problemId === 'number' ? parsed.problemId : defaultProblemId,
        messages: parsed.messages,
      }
    }

    // Legacy array format: Message[]
    if (Array.isArray(parsed) && parsed.length > 0) {
      const history = loadHistory()
      const matching = history.find(
        (h) => h.messages.length === parsed.length && h.messages[0]?.content === parsed[0]?.content
      )
      const sessionId = matching ? matching.id : createSessionId('LEGACY_MIGRATION')
      const migratedState: ActiveChatState = {
        sessionId,
        problemId: matching?.problemId ?? defaultProblemId,
        messages: parsed,
      }
      saveActiveSession(migratedState)
      return migratedState
    }
    return null
  } catch {
    return null
  }
}

/**
 * Single authoritative persistence function for the active conversation.
 * Persists active state to localStorage AND updates history if user messages exist.
 * NEVER creates a new session ID.
 */
export function persistActiveSession(session: {
  sessionId: string
  problemId?: number
  problemTitle?: string
  messages: StoredMessage[]
}): { active: ActiveChatState; history: ChatSession[] } {
  const state: ActiveChatState = {
    sessionId: String(session.sessionId),
    problemId: session.problemId,
    messages: session.messages,
  }
  saveActiveSession(state)

  if (session.messages.some((m) => m.role === 'user')) {
    const updatedHistory = upsertHistorySession({
      id: String(session.sessionId),
      problemId: session.problemId,
      problemTitle: session.problemTitle,
      messages: session.messages,
    })
    return { active: state, history: updatedHistory }
  }
  return { active: state, history: loadHistory() }
}

/**
 * Development diagnostic function to inspect localStorage history and active chat state.
 * Always reads live values directly from localStorage at invocation time.
 */
export function debugChatHistory(): void {
  let history: ChatSession[] = []
  try {
    const rawHist = localStorage.getItem(HISTORY_KEY)
    history = rawHist ? JSON.parse(rawHist) : []
  } catch {
    history = []
  }

  let active: ActiveChatState | null = null
  try {
    const rawActive = localStorage.getItem(ACTIVE_CHAT_KEY)
    active = rawActive ? JSON.parse(rawActive) : null
  } catch {
    active = null
  }

  const uniqueCount = new Set(history.map((h) => h.id)).size
  const activeExistsInHistory = active ? history.some((h) => String(h.id) === String(active.sessionId)) : false

  console.log('%c========================================\nACTIVE CHAT\n========================================', 'color: #3b82f6; font-weight: bold')
  console.log('sessionId:', active?.sessionId || '(none)')
  console.log('problemId:', active?.problemId ?? '(none)')
  console.log('messageCount:', active?.messages?.length ?? 0)

  console.log('%c========================================\nHISTORY\n========================================', 'color: #10b981; font-weight: bold')
  if (history.length === 0) {
    console.log('(No history records in storage)')
  } else {
    console.table(
      history.map((h, i) => ({
        index: i,
        id: h.id,
        problemId: h.problemId ?? 'N/A',
        messageCount: h.messages ? h.messages.length : 0,
        firstUserMessage: h.messages?.find((m) => m.role === 'user')?.content.slice(0, 40) || '(none)',
      }))
    )
  }

  console.log('%c========================================\nCOUNTS\n========================================', 'color: #f59e0b; font-weight: bold')
  console.log('history.length:', history.length)
  console.log('unique IDs:', uniqueCount)

  console.log('%c========================================\nACTIVE ID MATCH\n========================================', 'color: #8b5cf6; font-weight: bold')
  console.log(activeExistsInHistory ? 'true' : 'false')

  console.log('%c========================================\nRAW STORAGE\n========================================', 'color: #ec4899; font-weight: bold')
  console.log('dsa-coach:chat:', localStorage.getItem(ACTIVE_CHAT_KEY))
  console.log('dsa-coach:chat-history:', localStorage.getItem(HISTORY_KEY))
  console.log('========================================')
}

/**
 * Returns and logs raw localStorage strings without parsing.
 */
export function debugChatHistoryRaw(): { chat: string | null; history: string | null } {
  const chat = localStorage.getItem(ACTIVE_CHAT_KEY)
  const history = localStorage.getItem(HISTORY_KEY)
  console.log('[RAW] dsa-coach:chat:', chat)
  console.log('[RAW] dsa-coach:chat-history:', history)
  return { chat, history }
}

/**
 * Diagnostic specifically for session lifecycle and storage health.
 */
export function debugSessionLifecycle(): void {
  let history: ChatSession[] = []
  try {
    const rawHist = localStorage.getItem(HISTORY_KEY)
    history = rawHist ? JSON.parse(rawHist) : []
  } catch {
    history = []
  }

  let active: ActiveChatState | null = null
  try {
    const rawActive = localStorage.getItem(ACTIVE_CHAT_KEY)
    active = rawActive ? JSON.parse(rawActive) : null
  } catch {
    active = null
  }

  const allIds = history.map((h) => h.id)
  const uniqueIds = new Set(allIds)
  const hasDuplicateIds = allIds.length !== uniqueIds.size
  const activeExists = active ? history.some((h) => String(h.id) === String(active.sessionId)) : false

  console.group('=== [DSA COACH] SESSION LIFECYCLE DIAGNOSTIC ===')
  console.log('Active Session ID:', active?.sessionId || '(none)')
  console.log('Active Problem ID:', active?.problemId ?? '(none)')
  console.log('History Count:', history.length)
  console.log('Unique History IDs:', uniqueIds.size)
  console.log('Has Duplicate IDs in Storage:', hasDuplicateIds)
  console.log('Active Session ID Exists in History:', activeExists)

  console.table(
    history.map((h, i) => ({
      index: i,
      id: h.id,
      problemId: h.problemId ?? 'N/A',
      messageCount: h.messages ? h.messages.length : 0,
      createdAt: new Date(h.createdAt).toLocaleTimeString(),
      updatedAt: new Date(h.updatedAt).toLocaleTimeString(),
    }))
  )
  console.groupEnd()
}

declare global {
  interface Window {
    debugChatHistory: () => void
    debugChatHistoryRaw: () => { chat: string | null; history: string | null }
    debugSessionLifecycle: () => void
  }
}

// Attach immediately on module load
if (typeof window !== 'undefined') {
  window.debugChatHistory = debugChatHistory
  window.debugChatHistoryRaw = debugChatHistoryRaw
  window.debugSessionLifecycle = debugSessionLifecycle
}



