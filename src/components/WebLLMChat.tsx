import { useEffect, useRef, useState, useCallback, memo } from 'react'
import type { MLCEngine, ChatCompletionMessageParam } from '@mlc-ai/web-llm'
import { liteRespond, liteRespondAsync } from '../lib/liteSocratic'
import { useProgress } from '../hooks/useProgress'
import { retrieveForQuery } from '../lib/retrieval'
import {
  loadHistory,
  persistActiveSession,
  deleteSession,
  clearHistory,
  saveActiveSession,
  loadActiveSession,
  createSessionId,
  type ChatSession,
  type ActiveChatState,
} from '../lib/chatHistory'
import { PROBLEMS, type Problem } from '../data/problems'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

type Mode = 'lite' | 'loading' | 'ai'

// Builds a system prompt that includes the active problem's context.
// The AI knows the intended pattern internally but must NOT reveal it —
// it must guide the user Socratically through hints, invariants, and questions.
function buildSystemPrompt(problem?: Problem): string {
  if (!problem) {
    return `You are a world-class DSA interview coach using the Socratic method.
Guide the user to discover data structure and algorithmic patterns on their own.
Rules:
- NEVER write complete solutions or code unless the user explicitly asks for code review after attempting it.
- Ask one focused question at a time to build intuition.
- Help them identify problem structure: inputs, constraints, invariants, patterns.
- If they are stuck, give the gentlest possible hint.
- Validate good thinking and gently probe flawed assumptions.
- Keep responses concise (2-4 sentences max per turn).`
  }

  return `You are a world-class DSA interview coach using the Socratic method.
You are coaching the user on the problem "${problem.title}" (${problem.difficulty}).

INTERNAL PEDAGOGICAL DESTINATION (DO NOT REVEAL DIRECTLY OR PREMATURELY):
- Intended Pattern: ${problem.pattern}
- Key Observation: ${problem.observation}
- Structural Clue: ${problem.structuralClue}
- Invariant: ${problem.invariant}
- Target Complexities: Time ${problem.expectedTime}, Space ${problem.expectedSpace}
- Progressive Hints:
${problem.hints.map((h, i) => `  ${i + 1}. ${h}`).join('\n')}

STRICT SOCRATIC PROGRESSION RULES:
1. PROGRESS THROUGH STAGES GRADUALLY:
   - UNDERSTANDING / EXAMPLE -> BRUTE FORCE -> COMPLEXITY -> BOTTLENECK -> OPTIMIZATION -> DATA STRUCTURE -> KEY INSIGHT / COMPLEMENT -> ALGORITHM -> IMPLEMENTATION -> VERIFICATION -> REFLECTION.
2. ADVANCE BY AT MOST ONE CONCEPTUAL STAGE PER TURN.
3. NEVER reveal the pattern name, data structure, formula, or optimal algorithm BEFORE the learner has discovered the need for it.
4. If the learner understands the problem, ask how they would solve it with a basic brute-force approach first.
5. If the learner proposes brute force, validate it and ask for its time complexity and where redundant work occurs.
6. If the learner jumps directly to the optimal approach, validate their insight and verify WHY it works (invariants, key-value mappings) before coding.
7. If the learner is stuck or says "I don't know", break down the current step into a simpler question grounded in Example 1.
8. STRUCTURE EVERY RESPONSE:
   - Sentence 1: Briefly acknowledge what they got right.
   - Sentence 2-3: Ask exactly ONE focused question to advance to the immediate next stage.`
}

// Builds the initial welcome message seeded with the problem context
function buildProblemWelcome(problem: Problem): Message {
  const exampleText = problem.examples
    .slice(0, 2)
    .map((e, i) => `Example ${i + 1}: ${e.input} → ${e.output}${e.note ? ` (${e.note})` : ''}`)
    .join('\n')

  return {
    role: 'assistant',
    content: `**${problem.title}** (${problem.difficulty} · ${problem.category})

${problem.description}

\`\`\`
${exampleText}
\`\`\`

Constraints: ${problem.constraints.join(', ')}

---
Where would you like to start? What stands out about the inputs or what the problem is asking for?
<!--lite:{"current":{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->`,
  }
}

function isLowPowerDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { deviceMemory?: number; hardwareConcurrency?: number }
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

// ─── Lightweight Markdown Renderer ────────────────────────────────────────────
// Handles: **bold**, *italic*, `inline code`, fenced code blocks, ---, paragraphs.
// No external deps. Designed to match the existing dark UI.

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Matches: **bold** or __bold__, *italic* or _italic_, `code`
  const re = /(\*\*(.+?)\*\*|__(.+?)__|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index))
    }
    if (m[2] !== undefined || m[3] !== undefined) {
      const boldText = m[2] ?? m[3]
      parts.push(<strong key={key++} className="font-semibold text-text-primary">{boldText}</strong>)
    } else if (m[4] !== undefined) {
      parts.push(
        <code
          key={key++}
          className="font-mono text-[0.82em] bg-white/8 text-accent px-1.5 py-0.5 rounded border border-white/5"
        >
          {m[4]}
        </code>
      )
    } else if (m[5] !== undefined || m[6] !== undefined) {
      const italicText = m[5] ?? m[6]
      parts.push(<em key={key++} className="italic text-text-secondary">{italicText}</em>)
    }
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  const nodes: React.ReactNode[] = []
  const lines = content.split('\n')
  let i = 0
  let blockKey = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const fenceLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        fenceLines.push(lines[i])
        i++
      }
      i++ // consume closing fence
      nodes.push(
        <pre
          key={blockKey++}
          className="my-2 overflow-x-auto rounded-lg bg-ink-900 border border-ink-700 px-3 py-2.5 font-mono text-[0.8em] text-paper-200 leading-relaxed whitespace-pre"
        >
          {fenceLines.join('\n')}
        </pre>
      )
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={blockKey++} className="my-2 border-t border-border-subtle" />)
      i++
      continue
    }

    // Empty line — paragraph break
    if (line.trim() === '' || /^<!--[\s\S]*?-->$/.test(line.trim())) {
      i++
      continue
    }

    // Bulleted list item (- item or * item)
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/)
    if (bulletMatch) {
      nodes.push(
        <div key={blockKey++} className="my-1 flex items-start gap-2 pl-2">
          <span className="text-accent shrink-0 select-none leading-relaxed">•</span>
          <span className="leading-relaxed">{renderInline(bulletMatch[2])}</span>
        </div>
      )
      i++
      continue
    }

    // Numbered list item (1. item)
    const orderedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/)
    if (orderedMatch) {
      nodes.push(
        <div key={blockKey++} className="my-1 flex items-start gap-2 pl-2">
          <span className="font-mono text-xs text-text-muted shrink-0 select-none leading-relaxed">
            {orderedMatch[2]}.
          </span>
          <span className="leading-relaxed">{renderInline(orderedMatch[3])}</span>
        </div>
      )
      i++
      continue
    }

    // Regular paragraph line (with inline formatting)
    nodes.push(
      <p key={blockKey++} className="my-1 leading-relaxed">
        {renderInline(line)}
      </p>
    )
    i++
  }

  return <div className="space-y-0.5">{nodes}</div>
})

// ─── Message Bubble ────────────────────────────────────────────────────────────

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
        {isUser ? (
          // User messages: plain text (they may contain newlines from the textarea)
          <span className="whitespace-pre-wrap">{msg.content}</span>
        ) : (
          // Assistant messages: render Markdown
          <MarkdownContent content={msg.content} />
        )}
      </div>
    </div>
  )
})

// ─── Hint Strip ───────────────────────────────────────────────────────────────
// Deterministic, no AI, no session writes, no chat messages.

interface HintStripProps {
  hints: string[]
  hintIndex: number          // which hint to show (-1 = none shown yet)
  onRevealNextHint: () => void
}

const HintStrip = memo(function HintStrip({ hints, hintIndex, onRevealNextHint }: HintStripProps) {
  const total = hints.length
  const allRevealed = hintIndex >= total - 1 && hintIndex >= 0
  const noneRevealed = hintIndex < 0

  return (
    <div className="mt-3 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2.5 text-xs">
      {noneRevealed ? (
        // Initial state: just a Hint button
        <div className="flex items-center justify-between">
          <span className="text-text-muted">Stuck? Use a hint.</span>
          <button
            onClick={onRevealNextHint}
            className="rounded-md bg-accent/10 px-3 py-1 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
          >
            Hint
          </button>
        </div>
      ) : (
        // Hint revealed
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wide">
              Hint {hintIndex + 1} of {total}
            </span>
            {!allRevealed && (
              <button
                onClick={onRevealNextHint}
                className="rounded-md bg-accent/10 px-2.5 py-1 text-[10px] font-medium text-accent hover:bg-accent/20 transition-colors"
              >
                Next hint
              </button>
            )}
            {allRevealed && (
              <span className="font-mono text-[10px] text-text-muted">All hints revealed</span>
            )}
          </div>
          <p className="text-text-secondary leading-relaxed">{hints[hintIndex]}</p>
        </div>
      )}
    </div>
  )
})

// ─── Conversation Starters ────────────────────────────────────────────────────
// Shown only when messages.length === 1 (only the welcome assistant message).
// "Give me a hint" triggers the hint system instead of sending a message.

interface ConversationStartersProps {
  onSendMessage: (text: string) => void
  onRevealHint: () => void
  disabled: boolean
}

const ConversationStarters = memo(function ConversationStarters({
  onSendMessage,
  onRevealHint,
  disabled,
}: ConversationStartersProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <button
        onClick={() => onSendMessage("What should I think about?")}
        disabled={disabled}
        className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs text-text-secondary hover:border-border-hover hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        What should I think about?
      </button>
      <button
        onClick={onRevealHint}
        disabled={disabled}
        className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs text-text-secondary hover:border-border-hover hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Give me a hint
      </button>
      <button
        onClick={() => onSendMessage("I'll explain my approach")}
        disabled={disabled}
        className="rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs text-text-secondary hover:border-border-hover hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        I'll explain my approach
      </button>
    </div>
  )
})

// ─── Chat Input Bar ────────────────────────────────────────────────────────────

interface ChatInputBarProps {
  onSend: (text: string) => void
  disabled: boolean
  mode: Mode
  history: ChatSession[]
  activeSessionId: string
  onLoadSession: (session: ChatSession) => void
  onRemoveSession: (id: string) => void
  onClearAllHistory: () => void
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
  onClearAllHistory,
  onClearChat,
}: ChatInputBarProps) {
  const [input, setInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setInput('')
    // Reset height after send
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Shift+Enter: default textarea behavior inserts newline — no special handling needed
  }

  return (
    <div className="mt-4 pt-3 border-t border-border-subtle">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this problem or paste your code…"
          rows={1}
          className="flex-1 bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors resize-none overflow-y-auto leading-relaxed"
          style={{ maxHeight: '160px' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="px-5 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
        >
          Send
        </button>
      </div>
      <div className="flex justify-between items-center mt-2 text-[10px] text-text-muted flex-wrap gap-2">
        <span>Enter to send · Shift+Enter for new line</span>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative inline-flex items-center">
            <button
              onClick={() => {
                setShowHistory((v) => !v)
                setShowConfirmClear(false)
              }}
              className="text-text-muted hover:text-accent transition-colors"
            >
              History{history.length > 0 ? ` (${history.length})` : ''}
            </button>

            {showHistory && (
              <div
                className="absolute bottom-full right-0 mb-2 w-72 sm:w-80 md:w-96 max-w-[calc(100vw-2.5rem)] max-h-80 overflow-y-auto rounded-xl border border-ink-600 bg-ink-900 shadow-xl p-2 text-left z-30"
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

          {history.length > 0 && (
            <div className="relative inline-flex items-center">
              <button
                onClick={() => {
                  setShowConfirmClear((v) => !v)
                  setShowHistory(false)
                }}
                className="text-text-muted hover:text-danger transition-colors"
              >
                Clear History
              </button>

              {showConfirmClear && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border border-ink-600 bg-ink-900 shadow-xl p-3.5 text-left z-30"
                >
                  <div className="text-xs font-medium text-paper-100 mb-1">
                    Clear all chat history?
                  </div>
                  <div className="text-[11px] text-paper-400 leading-relaxed mb-3">
                    This will permanently remove all saved Practice conversations.
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="px-2.5 py-1 text-xs text-paper-300 hover:text-paper-100 transition-colors rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onClearAllHistory()
                        setShowConfirmClear(false)
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-white bg-danger/80 hover:bg-danger rounded-md transition-colors shadow-sm"
                    >
                      Clear History
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => {
              setShowConfirmClear(false)
              onClearChat()
            }}
            className="text-text-muted hover:text-danger transition-colors"
          >
            Reset chat
          </button>
          <span>
            {mode === 'ai'
              ? 'Full local AI — no data leaves your browser'
              : 'Lite Mode — instant, no download'}
          </span>
        </div>
      </div>
    </div>
  )
})

// ─── WebLLMChat ────────────────────────────────────────────────────────────────

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

  // ── Hint state: index of the last revealed hint (-1 = none revealed yet)
  // Pure UI state — no session writes, no AI calls, no chat messages.
  const [hintIndex, setHintIndex] = useState(-1)

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
    // Reset hint state for the new problem
    setHintIndex(-1)
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
      // Lite Mode: Hybrid Socratic Pedagogical State Engine (Tier 1 Exact + Tier 2 Semantic)
      let base: string
      try {
        base = await liteRespondAsync(userMsg.content, problemRef.current, nextMessages)
      } catch (err) {
        console.warn('Semantic Socratic engine failed, falling back to rule-based path:', err)
        base = liteRespond(userMsg.content, problemRef.current, nextMessages)
      }

      const reply =
        retrieved.length > 0
          ? `From your notes ("${retrieved[0].chunk.sourceTitle}"): "${retrieved[0].chunk.text.slice(0, 160)}${
              retrieved[0].chunk.text.length > 160 ? '…' : ''
            }"\n\n${base}`
          : base

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
    // Reset hint state on fresh start
    setHintIndex(-1)
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
    // Reset hint display when loading a historical session — do not inject into restored messages
    setHintIndex(-1)

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

  const handleClearAllHistory = useCallback(() => {
    const updated = clearHistory()
    setHistory(updated)
  }, [])

  // ── Derived state ────────────────────────────────────────────────────────────

  // Fresh session: only the initial welcome assistant message, no user messages yet
  const isFreshSession = messages.length === 1 && messages[0].role === 'assistant'

  // Current problem's hints (empty array if no problem or no hints)
  const currentHints = problem?.hints ?? []

  // Reveal the next hint (pure UI state — no AI, no session writes)
  const revealNextHint = useCallback(() => {
    setHintIndex((idx) => Math.min(idx + 1, currentHints.length - 1))
  }, [currentHints.length])

  return (
    // WebLLMChat sizes naturally to content inside the chamber card.
    // The messages area grows as the conversation deepens and becomes scrollable.
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

      {/* Messages — naturally sizes without artificial empty dead air.
          Scrollable as messages accumulate. */}
      <div className="overflow-y-auto space-y-4 pr-2 overscroll-y-contain max-h-[calc(100vh-340px)] min-h-[60px]">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {/* Socratic coach note — shown only on a fresh session, after the welcome message */}
        {isFreshSession && (
          <div className="flex justify-start">
            <p className="text-[11px] text-text-muted italic px-1">
              I'll guide you with questions and hints rather than immediately giving you the answer.
            </p>
          </div>
        )}

        {/* Conversation starters — shown only on fresh session */}
        {isFreshSession && (
          <ConversationStarters
            onSendMessage={sendMessage}
            onRevealHint={revealNextHint}
            disabled={isThinking}
          />
        )}

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

      {/* Hint strip — below the message area, above the input. Always visible when a problem is loaded. */}
      {currentHints.length > 0 && (
        <HintStrip
          hints={currentHints}
          hintIndex={hintIndex}
          onRevealNextHint={revealNextHint}
        />
      )}

      {/* Input */}
      <ChatInputBar
        onSend={sendMessage}
        disabled={isThinking}
        mode={mode}
        history={history}
        activeSessionId={sessionId}
        onLoadSession={loadSession}
        onRemoveSession={removeHistorySession}
        onClearAllHistory={handleClearAllHistory}
        onClearChat={clearChat}
      />
    </div>
  )
}