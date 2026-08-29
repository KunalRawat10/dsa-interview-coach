import { useEffect, useRef, useState, useCallback, memo } from 'react'
import type { MLCEngine, ChatCompletionMessageParam } from '@mlc-ai/web-llm'
import { liteRespond } from '../lib/liteSocratic'
import { useProgress } from '../hooks/useProgress'
import { retrieveForQuery } from '../lib/retrieval'
import { loadHistory, archiveSession, deleteSession, type ChatSession } from '../lib/chatHistory'
import type { Problem } from '../data/problems'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface WebLLMChatProps {
  onStatusChange?: (status: string) => void
  problem?: Problem
  onSolved?: (problemId: number) => void
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

const CHAT_STORAGE_KEY = 'dsa-coach:chat'

const GENERIC_WELCOME: Message = {
  role: 'assistant',
  content:
    "Welcome to the Socratic Chamber. I'm your DSA interview coach. Paste a problem or your code, and I'll guide you through it with questions — never spoilers. What are we working on today?",
}

function loadInitialMessages(problem: Problem | undefined): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore
  }
  return [problem ? buildProblemWelcome(problem) : GENERIC_WELCOME]
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
  onLoadSession: (session: ChatSession) => void
  onRemoveSession: (id: string) => void
  onClearChat: () => void
}

const ChatInputBar = memo(function ChatInputBar({
  onSend,
  disabled,
  mode,
  history,
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
    <div className="mt-4 pt-4 border-t border-border-subtle">
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
            <div className="absolute bottom-full right-0 mb-2 w-80 max-h-72 overflow-y-auto rounded-xl border border-border-subtle bg-surface-raised shadow-xl p-2 text-left z-20">
              {history.length === 0 ? (
                <div className="text-xs text-text-muted p-3">
                  No past sessions yet — cleared conversations show up here.
                </div>
              ) : (
                history.map((session) => {
                  const firstUserMsg = session.messages.find((m) => m.role === 'user')
                  const preview = firstUserMsg?.content.slice(0, 60) || 'Empty session'
                  const date = new Date(session.timestamp)
                  return (
                    <div
                      key={session.id}
                      className="flex items-start justify-between gap-2 rounded-lg px-2 py-2 hover:bg-surface/60 transition-colors"
                    >
                      <button
                        onClick={() => {
                          onLoadSession(session)
                          setShowHistory(false)
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="text-xs text-text-primary line-clamp-1">
                          {preview}
                          {firstUserMsg && firstUserMsg.content.length > 60 ? '…' : ''}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          {date.toLocaleDateString()}{' '}
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' · '}
                          {session.messages.length} messages
                        </div>
                      </button>
                      <button
                        onClick={() => onRemoveSession(session.id)}
                        className="text-text-muted hover:text-danger text-xs shrink-0 mt-0.5"
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

export default function WebLLMChat({ onStatusChange, problem, onSolved }: WebLLMChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => loadInitialMessages(problem))
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
  // Stable ref to current messages — used by clearChat/loadSession/problemSwitch
  // without adding `messages` to their useCallback dep arrays.
  const messagesRef = useRef(messages)
  // Stable ref to current problem — used by clearChat without adding `problem` to deps.
  const problemRef = useRef(problem)
  // Guards the problem-switch effect so it does not fire on first mount.
  const isProblemFirstMount = useRef(true)
  const { recordActivity, recordProblemSolved } = useProgress()

  // Keep refs in sync with state/props
  useEffect(() => { messagesRef.current = messages }, [messages])
  useEffect(() => { problemRef.current = problem }, [problem])

  // Reset conversation when the selected problem changes (skip first mount)
  const problemId = problem?.id
  useEffect(() => {
    if (isProblemFirstMount.current) {
      isProblemFirstMount.current = false
      return
    }
    if (!problem) return
    archiveSession(messagesRef.current)
    setHistory(loadHistory())
    setMessages([buildProblemWelcome(problem)])
    try { localStorage.removeItem(CHAT_STORAGE_KEY) } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId])

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

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // localStorage unavailable — chat still works in-session
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
    setMessages((prev) => [...prev, userMsg])
    setIsThinking(true)
    recordActivity()

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
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
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
        ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg.content },
      ]
      const reply = await engineRef.current.chat.completions.create({
        messages: historyPayload as ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens: 256,
      })
      const content = reply.choices[0]?.message?.content || 'Let me think about that...'
      setMessages((prev) => [...prev, { role: 'assistant', content }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I encountered an error. Let me try again — what was your question?' },
      ])
    } finally {
      setIsThinking(false)
    }
  }, [isThinking, messages, mode, recordActivity])

  const clearChat = useCallback(() => {
    archiveSession(messagesRef.current)
    setHistory(loadHistory())
    const resetMsg = problemRef.current ? buildProblemWelcome(problemRef.current) : GENERIC_WELCOME
    setMessages([resetMsg])
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  const loadSession = useCallback((session: ChatSession) => {
    archiveSession(messagesRef.current)
    setMessages(session.messages)
    setHistory(loadHistory())
  }, [])

  const removeHistorySession = useCallback((id: string) => {
    setHistory(deleteSession(id))
  }, [])

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
        onLoadSession={loadSession}
        onRemoveSession={removeHistorySession}
        onClearChat={clearChat}
      />
    </div>
  )
}