import { useEffect, useRef, useState, useCallback, memo } from 'react'
import type { MLCEngine, ChatCompletionMessageParam } from '@mlc-ai/web-llm'
import { liteRespond } from '../lib/liteSocratic'
import { useProgress } from '../hooks/useProgress'
import { retrieveForQuery } from '../lib/retrieval'
import {
  loadHistory,
  persistActiveSession,
  deleteSession,
  saveActiveSession,
  loadActiveSession,
  createSessionId,
  type ChatSession,
} from '../lib/chatHistory'
import { PROBLEMS, type Problem } from '../data/problems'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type Mode = 'lite' | 'loading' | 'ai'

// Builds a system prompt that includes the active problem's context.
// The AI knows the intended pattern internally but must NOT reveal it —
// it guides the learner Socratically through Observe → Structure → Pattern → Invariant → Implementation.
function buildSystemPrompt(problem: Problem | undefined): string {
  const base = `You are a DSA interview coach for PatternOS. Guide learners to RECOGNIZE algorithmic patterns through Socratic questioning — never give direct solutions.

RULES:
1. NEVER reveal the solution pattern name directly. Let the learner discover it.
2. Ask ONE focused Socratic question at a time.
3. Guide through: Observe → Structure → Pattern → Invariant → Implementation → Complexity.
4. If the user pastes code, analyze its complexity and ask what could be improved — do NOT fix it for them.
5. Be encouraging but firm — redirect direct solution requests with a targeted hint.
6. Keep responses to 2–4 sentences.
7. Refer to patterns by name (Two Pointers, Sliding Window, etc.) only AFTER the learner identifies them first.`

  if (!problem) return base

  return `${base}

ACTIVE PROBLEM: "${problem.title}" (${problem.difficulty})
TARGET PATTERN: ${problem.pattern} — DO NOT reveal this name directly. Guide the learner to discover it.
KEY OBSERVATION TO LEAD TOWARD: ${problem.observation}
STRUCTURAL CLUE: ${problem.structuralClue}
CORE INVARIANT: ${problem.invariant}
EXPECTED COMPLEXITY: Time ${problem.expectedTime}, Space ${problem.expectedSpace}

PROGRESSIVE HINTS — use sparingly, in order, only when the learner is stuck:
${problem.hints.map((h, i) => `  ${i + 1}. "${h}"`).join('\n')}`
}

// Welcome message seeded with the problem context.
function buildProblemWelcome(problem: Problem): Message {
  return {
    role: 'assistant',
    content: `Let's work through ${problem.title} together.\n\n${problem.description}\n\nBefore writing any code — what do you notice about this problem? What information are you given, and what are you trying to find?`,
  }
}

function isLowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 4
  const mem = nav.deviceMemory ?? 4
  return cores < 4 || mem < 4
}

const GENERIC_WELCOME: Message = {
  role: 'assistant',
  content:
    "Welcome to the Socratic Chamber. I'm your DSA interview coach. Paste a problem or your code, and I'll guide you through it with questions — never spoilers. What are we working on today?",
}

function initChatState(initialProblem?: Problem): { sessionId: string; messages: Message[] } {
  const saved = loadActiveSession(initialProblem?.id)
  if (saved && saved.messages.length > 0) {
    return {
      sessionId: saved.sessionId,
      messages: saved.messages,
    }
  }
  const newId = createSessionId('INITIAL_MOUNT_CLEAN_SLATE')
  const initialMessages: Message[] = [initialProblem ? buildProblemWelcome(initialProblem) : GENERIC_WELCOME]
  const state: ActiveChatState = {
    sessionId: newId,
    problemId: initialProblem?.id,
    messages: initialMessages,
  }
  // Immediately persist so StrictMode second-mount or quick remount finds this exact session
  saveActiveSession(state)
  return {
    sessionId: newId,
    messages: initialMessages,
  }
}

const MessageBubble = memo(function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-accent/15 text-text-primary rounded-br-md'
            : 'bg-surface-raised border border-border-subtle text-text-secondary rounded-bl-md'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
})

interface ChatInputBarProps {
  onSend: (text: string) => void
  disabled: boolean
  mode: Mode
  history: ChatSession[]
  activeSessionId: string
  onLoadSession: (session: ChatSession) => void
  onRemoveSession: (id: string) => void
  onClearChat: () => void
}

const ChatInputBar = memo(function ChatInputBar({
  onSend,
  disabled,
  mode,
  history,
  activeSessionId,
  onLoadSession,
  onRemoveSession,
  onClearChat,
}: ChatInputBarProps) {
  const [input, setInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-border-subtle relative isolate">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this problem or paste your code..."
          className="flex-1 bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="px-5 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Send
        </button>
      </div>
      <div className="flex justify-between items-center mt-2 text-[10px] text-text-muted">
        <span>Press Enter to send</span>
        <div className="flex items-center gap-3 relative">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className="text-text-muted hover:text-accent transition-colors"
          >
            History{history.length > 0 ? ` (${history.length})` : ''}
          </button>
          <button
            onClick={onClearChat}
            className="text-text-muted hover:text-danger transition-colors"
          >
            Reset chat
          </button>
          <span>
            {mode === 'ai'
              ? 'Full local AI — no data leaves your browser'
              : 'Lite Mode — instant, no download'}
          </span>

          {showHistory && (
            <div
              className="absolute bottom-full right-0 mb-2 w-84 sm:w-96 max-h-80 overflow-y-auto rounded-xl border border-ink-600 shadow-2xl shadow-black/95 p-2 text-left z-50 isolate"
              style={{ backgroundColor: '#0A0B0E', opacity: 1 }}
            >
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-ink-700/60 mb-1">
                <span className="font-mono text-[10px] uppercase tracking-wider text-paper-400 font-medium">
                  Past Sessions ({history.length})
                </span>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-paper-400 hover:text-paper-100 text-xs transition-colors p-0.5"
                  aria-label="Close history"
                >
                  ✕
                </button>
              </div>
              {history.length === 0 ? (
                <div className="text-xs text-paper-400 p-4 text-center">
                  No saved conversations yet.
                </div>
              ) : (
                history.map((session) => {
                  const isActive = String(session.id) === String(activeSessionId)
                  const firstUserMsg = session.messages.find((m) => m.role === 'user')
                  const preview = firstUserMsg?.content.slice(0, 60) || 'Empty session'
                  const date = new Date(session.updatedAt || session.timestamp || session.createdAt || Date.now())
                  return (
                    <div
                      key={session.id}
                      className={`flex items-start justify-between gap-2 rounded-lg px-2.5 py-2 transition-colors border ${
                        isActive
                          ? 'border-accent/40 bg-ink-800'
                          : 'border-transparent hover:bg-ink-800/80'
                      }`}
                      style={{ backgroundColor: isActive ? '#111317' : undefined }}
                    >
                      <button
                        onClick={() => {
                          onLoadSession(session)
                          setShowHistory(false)
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-1.5 text-xs text-paper-100 line-clamp-1 font-medium">
                          {session.problemTitle ? (
                            <span className="text-accent text-[11px] shrink-0 font-medium">
                              [{session.problemTitle}]
                            </span>
                          ) : null}
                          <span className="truncate">{preview}</span>
                          {firstUserMsg && firstUserMsg.content.length > 60 ? '…' : ''}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-paper-400 mt-1">
                          <span>
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span>·</span>
                          <span>{session.messages.length} msgs</span>
                          {isActive && (
                            <span className="ml-auto text-accent text-[9px] font-mono uppercase tracking-wide">
                              Active
                            </span>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemoveSession(session.id)
                        }}
                        className="text-paper-400 hover:text-danger text-xs shrink-0 mt-0.5 p-1 transition-colors"
                        title="Delete conversation"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

interface WebLLMChatProps {
  onStatusChange?: (status: string) => void
  problem?: Problem
  userSelectionToken?: number
  onSolved?: (problemId: number) => void
  onHistorySyncProblem?: (problem: Problem) => void
}

export default function WebLLMChat({
  onStatusChange,
  problem,
  userSelectionToken,
  onSolved,
  onHistorySyncProblem,
}: WebLLMChatProps) {
  const [initialData] = useState(() => initChatState(problem))
  const [sessionId, setSessionId] = useState(initialData.sessionId)
  const [messages, setMessages] = useState<Message[]>(initialData.messages)
  const [isThinking, setIsThinking] = useState(false)
  const [mode, setMode] = useState<Mode>('lite')
  const [downloadProgress, setDownloadProgress] = useState('')
  const [lowPowerWarning] = useState(isLowPowerDevice)
  const [history, setHistory] = useState<ChatSession[]>(loadHistory)
  const [solvedConfirmed, setSolvedConfirmed] = useState(false)
  const engineRef = useRef<MLCEngine | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)
  const lastStatusRef = useRef<string>('')

  // Stable refs to avoid stale closures in callbacks
  const messagesRef = useRef(messages)
  const sessionIdRef = useRef(sessionId)
  const problemRef = useRef(problem)
  const prevSelectionTokenRef = useRef(userSelectionToken ?? 0)

  const { recordActivity, recordProblemSolved } = useProgress()

  // Centralized session ID updater with stack trace logging
  const setActiveSessionId = useCallback((nextId: string, reason: string) => {
    console.log('[SESSION ID CHANGE]', {
      previous: sessionIdRef.current,
      next: nextId,
      reason,
      timestamp: Date.now(),
      stack: new Error().stack,
    })
    sessionIdRef.current = nextId
    setSessionId(nextId)
  }, [])

  // Track component mount and unmount with active session ID
  useEffect(() => {
    console.log('[CHAT MOUNT]', { sessionId: sessionIdRef.current })
    return () => {
      console.log('[CHAT UNMOUNT]', { sessionId: sessionIdRef.current })
    }
  }, [])

  // Keep refs in sync with state/props
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])
  useEffect(() => { problemRef.current = problem }, [problem])

  // Handle intentional problem switching ONLY when user clicks ProblemSelector (userSelectionToken increments)
  useEffect(() => {
    if (userSelectionToken === undefined) return
    if (userSelectionToken === prevSelectionTokenRef.current) return
    prevSelectionTokenRef.current = userSelectionToken

    if (!problem) return

    // User intentionally selected a different problem from ProblemSelector: start a fresh session
    const newId = createSessionId('USER_PROBLEM_SELECT')
    const welcome = buildProblemWelcome(problem)
    setActiveSessionId(newId, 'USER_PROBLEM_SELECT')
    messagesRef.current = [welcome]
    setMessages([welcome])
    saveActiveSession({
      sessionId: newId,
      problemId: problem.id,
      messages: [welcome],
    })
  }, [userSelectionToken, problem, setActiveSessionId])

  useEffect(() => {
    const status =
      mode === 'lite'
        ? 'Lite Mode — instant, no download'
        : mode === 'loading'
          ? downloadProgress || 'Starting download...'
          : 'Full AI ready — works offline'

    if (lastStatusRef.current !== status) {
      lastStatusRef.current = status
      onStatusChange?.(status)
    }
  }, [mode, downloadProgress, onStatusChange])

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const enableFullAI = useCallback(async () => {
    setMode('loading')
    try {
      const webllmModule = await import('@mlc-ai/web-llm')
      const engine = await webllmModule.CreateMLCEngine('Qwen2.5-1.5B-Instruct-q4f32_1-MLC', {
        initProgressCallback: (report) => {
          const pct = Math.round(report.progress * 100)
          setDownloadProgress(`Downloading model... ${pct}%`)
        },
      })
      engineRef.current = engine
      setMode('ai')
      setDownloadProgress('')
    } catch (err) {
      console.error('WebLLM init failed:', err)
      setMode('lite')
      setDownloadProgress('')
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return

    const userMsg: Message = { role: 'user', content: text.trim() }
    const nextMessages = [...messagesRef.current, userMsg]
    messagesRef.current = nextMessages
    setMessages(nextMessages)
    setIsThinking(true)
    recordActivity()

    // 1. Authoritative persistence under the stable active session ID
    const { history: updatedHistory } = persistActiveSession({
      sessionId: sessionIdRef.current,
      problemId: problemRef.current?.id,
      problemTitle: problemRef.current?.title,
      messages: nextMessages,
    })
    setHistory(updatedHistory)

    const retrieved = await retrieveForQuery(userMsg.content).catch((err) => {
      console.error('Retrieval failed:', err)
      return []
    })

    if (mode !== 'ai' || !engineRef.current) {
      // Lite Mode: instant, rule-based — passes patternTag for problem-aware hints
      const base = liteRespond(userMsg.content, problemRef.current?.patternTag)
      const reply =
        retrieved.length > 0
          ? `From your notes ("${retrieved[0].chunk.sourceTitle}"): "${retrieved[0].chunk.text.slice(0, 160)}${
              retrieved[0].chunk.text.length > 160 ? '…' : ''
            }"\n\n${base}`
          : base
      setTimeout(() => {
        const finalMessages = [...nextMessages, { role: 'assistant' as const, content: reply }]
        messagesRef.current = finalMessages
        setMessages(finalMessages)
        const { history: savedHistory } = persistActiveSession({
          sessionId: sessionIdRef.current,
          problemId: problemRef.current?.id,
          problemTitle: problemRef.current?.title,
          messages: finalMessages,
        })
        setHistory(savedHistory)
        setIsThinking(false)
      }, 300)
      return
    }

    try {
      const noteContext =
        retrieved.length > 0
          ? `\n\nRelevant notes from the user's own material — ground your guidance in these where they apply:\n${retrieved
              .map((r) => '- ' + r.chunk.text)
              .join('\n')}`
          : ''
      const historyPayload = [
        { role: 'system', content: buildSystemPrompt(problemRef.current) + noteContext },
        ...messagesRef.current.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg.content },
      ]
      const reply = await engineRef.current.chat.completions.create({
        messages: historyPayload as ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens: 256,
      })
      const content = reply.choices[0]?.message?.content || 'Let me think about that...'
      const finalMessages = [...nextMessages, { role: 'assistant' as const, content }]
      messagesRef.current = finalMessages
      setMessages(finalMessages)
      const { history: savedHistory } = persistActiveSession({
        sessionId: sessionIdRef.current,
        problemId: problemRef.current?.id,
        problemTitle: problemRef.current?.title,
        messages: finalMessages,
      })
      setHistory(savedHistory)
    } catch (err) {
      console.error('Chat error:', err)
      const errorMessages = [
        ...nextMessages,
        { role: 'assistant' as const, content: 'I encountered an error. Let me try again — what was your question?' },
      ]
      messagesRef.current = errorMessages
      setMessages(errorMessages)
      const { history: savedHistory } = persistActiveSession({
        sessionId: sessionIdRef.current,
        problemId: problemRef.current?.id,
        problemTitle: problemRef.current?.title,
        messages: errorMessages,
      })
      setHistory(savedHistory)
    } finally {
      setIsThinking(false)
    }
  }, [isThinking, mode, recordActivity])

  const clearChat = useCallback(() => {
    // Start a fresh session with a new unique session ID
    const newId = createSessionId('RESET_CHAT')
    const resetMsg = problemRef.current ? buildProblemWelcome(problemRef.current) : GENERIC_WELCOME
    setActiveSessionId(newId, 'RESET_CHAT')
    messagesRef.current = [resetMsg]
    setMessages([resetMsg])
    saveActiveSession({
      sessionId: newId,
      problemId: problemRef.current?.id,
      messages: [resetMsg],
    })
  }, [setActiveSessionId])

  const loadSession = useCallback((session: ChatSession) => {
    const restoredId = String(session.id)
    console.log('[HISTORY RESTORE]', {
      sessionId: restoredId,
      previousActiveSessionId: sessionIdRef.current,
      timestamp: Date.now(),
      stack: new Error().stack,
    })

    // Pure in-memory update: NO saveActiveSession, NO persistActiveSession, NO upsertHistorySession, NO createSessionId
    sessionIdRef.current = restoredId
    setSessionId(restoredId)
    messagesRef.current = session.messages
    setMessages(session.messages)

    // If the restored session belongs to a different problem, sync ProblemSelector display only
    if (session.problemId && onHistorySyncProblem) {
      const matchingProblem = PROBLEMS.find((p) => p.id === session.problemId)
      if (matchingProblem && matchingProblem.id !== problemRef.current?.id) {
        onHistorySyncProblem(matchingProblem)
      }
    }
  }, [onHistorySyncProblem])

  const removeHistorySession = useCallback((id: string) => {
    const targetId = String(id)
    const updated = deleteSession(targetId)
    setHistory(updated)
    // If the user deleted the active session, assign a new session ID to the active chat
    if (sessionIdRef.current === targetId) {
      const newId = createSessionId('DELETE_ACTIVE_SESSION')
      setActiveSessionId(newId, 'DELETE_ACTIVE_SESSION')
      saveActiveSession({
        sessionId: newId,
        problemId: problemRef.current?.id,
        messages: messagesRef.current,
      })
    }
  }, [setActiveSessionId])

  const handleSolvedClick = useCallback(() => {
    // recordProblemSolved bumps the global streak counter (Constellation-agnostic)
    recordProblemSolved()
    // onSolved notifies Chat.tsx to update Practice-only progress
    if (problemRef.current) {
      onSolved?.(problemRef.current.id)
    }
  }, [recordProblemSolved, onSolved])

  const lastIsAssistant = messages.length > 1 && messages[messages.length - 1].role === 'assistant'

  const handleSolvedWithConfirm = useCallback(() => {
    handleSolvedClick()
    setSolvedConfirmed(true)
    // Reset confirmation badge after 3 s so it shows again if the user keeps going
    setTimeout(() => setSolvedConfirmed(false), 3000)
  }, [handleSolvedClick])




  return (
    // No h-full — WebLLMChat sizes to content inside its p-5 card.
    // The messages area uses max-h so there is no dead vertical space
    // when only 2-3 messages exist, and it becomes scrollable as the
    // conversation grows.
    <div className="flex flex-col">
      {/* Mode banner */}
      {mode === 'lite' && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-raised px-4 py-2.5 text-xs">
          <span className="text-text-tertiary">
            Lite Mode active — instant, rule-based hints, works on any device.
          </span>
          <button
            onClick={enableFullAI}
            className="ml-3 shrink-0 rounded-md bg-accent/15 px-3 py-1.5 font-medium text-accent hover:bg-accent/25 transition-colors"
          >
            Enable Full AI (~1.5GB)
          </button>
        </div>
      )}
      {mode === 'lite' && lowPowerWarning && (
        <div className="mb-3 text-[11px] text-text-muted">
          Your device looks lighter on resources — Lite Mode is recommended, but Full AI is still available if you want to try it.
        </div>
      )}
      {mode === 'loading' && (
        <div className="mb-3 rounded-lg border border-border-subtle bg-surface-raised px-4 py-2.5 text-xs text-accent animate-pulse">
          {downloadProgress || 'Starting download...'} — Lite Mode still works while this downloads.
        </div>
      )}

      {/* Messages — max-h keeps the area proportional to the conversation;
          no flex-1 here so a short conversation doesn't leave empty air.
          Becomes scrollable as messages accumulate. */}
      <div className="overflow-y-auto space-y-4 pr-2 transform-gpu overscroll-y-contain max-h-[calc(100vh-420px)] min-h-[120px]">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-surface-raised border border-border-subtle px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse delay-100" />
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse delay-200" />
              </div>
            </div>
          </div>
        )}

        {/* Solved action — clear chip, not just a text link */}
        {!isThinking && lastIsAssistant && !solvedConfirmed && (
          <div className="flex justify-start pt-1">
            <button
              onClick={handleSolvedWithConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-success/40 hover:text-success transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0">
                <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Mark as solved
            </button>
          </div>
        )}

        {/* Solved confirmation badge */}
        {!isThinking && solvedConfirmed && (
          <div className="flex justify-start pt-1">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0">
                <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Problem solved ✓
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInputBar
        onSend={sendMessage}
        disabled={isThinking}
        mode={mode}
        history={history}
        activeSessionId={sessionId}
        onLoadSession={loadSession}
        onRemoveSession={removeHistorySession}
        onClearChat={clearChat}
      />
    </div>
  )
}