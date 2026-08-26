export interface StoredMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface ChatSession {
    id: string
    timestamp: number
    messages: StoredMessage[]
}

const HISTORY_KEY = 'dsa-coach:chat-history'
const MAX_SESSIONS = 20 // cap so localStorage doesn't grow unbounded

export function loadHistory(): ChatSession[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

// Only archives sessions that actually have a real exchange in them —
// skips saving if it's just the untouched welcome message.
export function archiveSession(messages: StoredMessage[]): void {
    if (messages.length <= 1) return
    const history = loadHistory()
    const session: ChatSession = { id: `${Date.now()}`, timestamp: Date.now(), messages }
    const updated = [session, ...history].slice(0, MAX_SESSIONS)
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    } catch {
        // storage full or unavailable — silently skip archiving, current session still clears fine
    }
}

export function deleteSession(id: string): ChatSession[] {
    const updated = loadHistory().filter((s) => s.id !== id)
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
    } catch {
        // ignore
    }
    return updated
}