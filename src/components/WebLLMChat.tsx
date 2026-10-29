import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react'
import type { MLCEngine, WebWorkerMLCEngine, ChatCompletionMessageParam } from '@mlc-ai/web-llm'
import { liteRespond } from '../lib/liteSocratic'
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
import { getActiveGraph } from '../lib/problemGraphs'
import {
  evaluateDialogueStep,
  evaluateDialogueStepAsync,
  type SocraticEvaluationTrace,
} from '../lib/liteSocratic'
import {
  extractActiveThread,
  getPedagogicalStage,
  PEDAGOGICAL_STAGES,
  type PedagogicalStageInfo,
  type MessageHistoryItem,
} from '../lib/activeThread'
import { generateLessonTurn, getLessonState, prepareUserTurn, type LearningGoal, type LessonState, type LessonMessage } from '../lib/lessonTutor'
import { desktopCompletion, findDesktopModel } from '../lib/desktopTutor'
import { withModelDeadline, browserLoadProgress } from '../lib/modelDeadline'
import { type TutorChunk, type TutorCompletionOptions } from '../lib/conversationalTutor'
import { generateSmallModelTurn, smallestCompatibleModel } from '../lib/smallModel'
import OfflineLessons from './OfflineLessons'
import { MODEL_TIERS, activeModelTier, modelTierLabel, type ModelTier } from '../lib/modelTiers'
import { findTutorGpu, GpuUnavailableError, type TutorGpu } from '../lib/browserGpu'
import { CpuTutorClient, CPU_MODEL_ID } from '../lib/cpuTutor'
export { buildSystemPrompt, buildChatHistoryPayload } from '../lib/conversationalTutor'

type Message = LessonMessage

type Mode = 'lite' | 'loading' | 'ai'

export function computeFullAIFallbackContent(
  step?: SocraticEvaluationTrace
): string {
  return (
    step?.fullResponseWithMeta ??
    'I encountered an error. Let me try again — what was your question?'
  )
}

export type DialogueEvaluatorAsync = typeof evaluateDialogueStepAsync

let asyncEvaluatorOverride: DialogueEvaluatorAsync | null = null

export function setDialogueEvaluatorAsyncForTesting(
  fn: DialogueEvaluatorAsync | null
): void {
  asyncEvaluatorOverride = fn
}

export async function resolveDialogueStepSafe(
  userText: string,
  problem?: Problem,
  history: MessageHistoryItem[] = []
): Promise<SocraticEvaluationTrace> {
  try {
    const evaluator = asyncEvaluatorOverride ?? evaluateDialogueStepAsync
    return await evaluator(userText, problem, history)
  } catch (err) {
    console.warn('Async semantic evaluation failed, falling back to synchronous dialogue step:', err)
    return evaluateDialogueStep(userText, problem, history)
  }
}

export interface ExecuteFullAITurnParams {
  userText: string
  problem?: Problem
  messages: Message[]
  retrievedNotes?: { chunk: { text: string } }[]
  createCompletion: (payload: { role: string; content: string }[], options?: TutorCompletionOptions) => Promise<
    | AsyncIterable<TutorChunk>
    | { choices: { message?: { content: string | null } }[] }
  >
  learningGoal?: LearningGoal
  smallModel?: boolean
  timeoutMs?: number
  onTimeout?: () => void
  onStepEvaluated?: (step: SocraticEvaluationTrace) => void
  onChunk?: (currentText: string) => void
}

export interface ExecuteFullAITurnResult {
  step?: SocraticEvaluationTrace
  finalContent: string
  usedFallback: boolean
  lesson?: LessonState
}

export async function executeFullAITurnSafe({
  userText,
  problem,
  messages,
  retrievedNotes = [],
  createCompletion,
  onStepEvaluated,
  learningGoal = 'concepts',
  smallModel = false,
  timeoutMs = 120000,
  onTimeout,
  onChunk,
}: ExecuteFullAITurnParams): Promise<ExecuteFullAITurnResult> {
  // Open conversation must not wait for or be gated by the Lite phrase matcher.
  void onStepEvaluated
  try {
    const notes = retrievedNotes.map(r => r.chunk.text).join('\n\n')
    void userText
    const result = await withModelDeadline(() => (smallModel ? generateSmallModelTurn : generateLessonTurn)(messages, problem, learningGoal, createCompletion, notes), timeoutMs, onTimeout)
    onChunk?.(result.reply)
    return { finalContent: result.reply, lesson: result.lesson, usedFallback: false }
  } catch (err) {
    console.error('Chat error in Full AI generation:', err)
    return {
      finalContent: 'The AI could not finish this reply. Please send your message again, or switch to Lite hints. Your conversation has been kept.',
      usedFallback: true,
      lesson: (err as { lesson?: LessonState } | null)?.lesson,
    }
  }
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
Tell me how you understand the problem, ask about an unfamiliar term, or share an approach. We can start wherever you need.
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

interface CodeBlockProps {
  code: string
  language?: string
}

const CodeBlock = memo(function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = code
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        textarea.style.top = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (err) {
      console.warn('Copy to clipboard failed:', err)
    }
  }

  const label = language ? language : 'Code'

  return (
    <div className="my-2 rounded-lg bg-ink-900 border border-ink-700 overflow-hidden text-left">
      <div className="flex items-center justify-between px-3 py-1.5 bg-ink-950/80 border-b border-ink-700/60 text-[11px]">
        <span className="font-mono text-paper-400 uppercase tracking-wider text-[10px]">
          {label}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
            copied
              ? 'text-success bg-success/10 font-semibold'
              : 'text-paper-400 hover:text-paper-100 hover:bg-ink-800'
          }`}
        >
          {copied ? (
            <>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <path d="M2.5 6.5L5 9l4.5-5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Copied ✓</span>
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0">
                <rect x="4" y="4" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
                <path d="M2.5 7.5V3a.5.5 0 01.5-.5h4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto font-mono text-[0.8em] text-paper-200 leading-relaxed whitespace-pre m-0">
        <code>{code}</code>
      </pre>
    </div>
  )
})

const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  const nodes: React.ReactNode[] = []
  const lines = content.split('\n')
  let i = 0
  let blockKey = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.trimStart().startsWith('```')) {
      const lang = line.trimStart().replace(/^```/, '').trim()
      const fenceLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trimStart().startsWith('```')) {
        fenceLines.push(lines[i])
        i++
      }
      i++ // consume closing fence
      nodes.push(
        <CodeBlock
          key={blockKey++}
          code={fenceLines.join('\n')}
          language={lang || undefined}
        />
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
        className={`max-w-[94%] sm:max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'message-user bg-accent/15 text-text-primary rounded-br-md'
            : 'message-assistant bg-surface-raised border border-border-subtle text-text-secondary rounded-bl-md'
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

// ─── Pedagogical Stage Progress Indicator ─────────────────────────────────────
// 4-stage segmented bar derived from ActiveThread + ApproachGraph truth.
// Spoiler-free, accessible, responsive.

interface PedagogicalStageProgressProps {
  stageInfo: PedagogicalStageInfo
}

const PedagogicalStageProgress = memo(function PedagogicalStageProgress({
  stageInfo,
}: PedagogicalStageProgressProps) {
  const { currentStage, stageName, isSolved, isAlternativeApproach } = stageInfo

  const ariaLabel = isSolved
    ? 'Interview progress: Problem solved, all stages complete'
    : `Interview progress: Stage ${currentStage} of 4: ${stageName}`

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={1}
      aria-valuemax={4}
      aria-valuenow={currentStage}
      className="mb-3 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          {PEDAGOGICAL_STAGES.map((step) => {
            const isCompleted = isSolved || step.id < currentStage
            const isCurrent = !isSolved && step.id === currentStage

            return (
              <div
                key={step.id}
                className={`flex-1 flex items-center justify-center sm:justify-start gap-1.5 px-2 py-1 rounded-md transition-colors min-w-0 ${
                  isCurrent
                    ? 'bg-accent/15 border border-accent/40 text-text-primary font-medium shadow-sm'
                    : isCompleted
                      ? 'bg-success/10 text-success border border-transparent'
                      : 'text-text-muted border border-transparent opacity-60'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                    isCurrent
                      ? 'bg-accent text-white font-semibold'
                      : isCompleted
                        ? 'bg-success/20 text-success font-semibold'
                        : 'bg-white/5 text-text-muted'
                  }`}
                >
                  {isCompleted ? '✓' : step.id}
                </span>
                <span className="truncate hidden sm:inline text-[11px]">
                  {step.name}
                </span>
              </div>
            )
          })}
        </div>

        {isAlternativeApproach && (
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-wide text-accent px-1.5 py-0.5 rounded border border-accent/30 bg-accent/10">
            Strategy: Alternative
          </span>
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
  const [showConfirmReset, setShowConfirmReset] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [input])

  // Close popovers on Escape key
  useEffect(() => {
    if (!showHistory && !showConfirmClear && !showConfirmReset) return
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHistory(false)
        setShowConfirmClear(false)
        setShowConfirmReset(false)
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [showHistory, showConfirmClear, showConfirmReset])

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
                setShowConfirmReset(false)
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
                  setShowConfirmReset(false)
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

          <div className="relative inline-flex items-center">
            <button
              onClick={() => {
                setShowConfirmReset((v) => !v)
                setShowConfirmClear(false)
                setShowHistory(false)
              }}
              className="text-text-muted hover:text-danger transition-colors"
            >
              Reset chat
            </button>

            {showConfirmReset && (
              <div
                role="dialog"
                aria-labelledby="reset-dialog-title"
                className="absolute bottom-full right-0 mb-2 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] rounded-xl border border-ink-600 bg-ink-900 shadow-xl p-3.5 text-left z-30"
              >
                <div id="reset-dialog-title" className="text-xs font-medium text-paper-100 mb-1">
                  Reset current conversation?
                </div>
                <div className="text-[11px] text-paper-400 leading-relaxed mb-3">
                  This starts a fresh interview for this problem. Previous messages remain available through History.
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="px-2.5 py-1 text-xs text-paper-300 hover:text-paper-100 transition-colors rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearChat()
                      setShowConfirmReset(false)
                    }}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-danger/80 hover:bg-danger rounded-md transition-colors shadow-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
          <span>
            {mode === 'ai'
              ? 'Local AI — conversation stays on this computer'
              : 'Lite hints — limited language understanding'}
          </span>
        </div>
      </div>
    </div>
  )
})

// ─── WebLLMChat ────────────────────────────────────────────────────────────────

interface WebLLMChatProps {
  learningContext?: string
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
  learningContext = '',
}: WebLLMChatProps) {
  const [initialData] = useState(() => initChatState(problem))
  const [sessionId, setSessionId] = useState(initialData.sessionId)
  const [messages, setMessages] = useState<Message[]>(initialData.messages)
  const [learningGoal, setLearningGoal] = useState<LearningGoal>(() => getLessonState(initialData.messages, problem?.slug).goal)
  const [isThinking, setIsThinking] = useState(false)
  const [mode, setMode] = useState<Mode>('lite')
  const [downloadProgress, setDownloadProgress] = useState('')
  const [aiError, setAiError] = useState('')
  const [gpuHelp, setGpuHelp] = useState(false)
  const [cpuActive, setCpuActive] = useState(false)
  const [desktopModel, setDesktopModel] = useState('')
  const modelLoadId = useRef(0)
  const [modelSize, setModelSize] = useState<ModelTier>(() => {
    try { const saved = localStorage.getItem('patternos-model-tier'); return MODEL_TIERS.some(item => item.id === saved) ? saved as ModelTier : 'smallest' } catch { return 'smallest' }
  })
  const [activeBrowserModel, setActiveBrowserModel] = useState('')
  const [lowPowerWarning] = useState(isLowPowerDevice)
  const [history, setHistory] = useState<ChatSession[]>(loadHistory)
  const [solvedConfirmed, setSolvedConfirmed] = useState(false)

  // ── Hint state: index of the last revealed hint (-1 = none revealed yet)
  // Pure UI state — no session writes, no AI calls, no chat messages.
  const [hintIndex, setHintIndex] = useState(-1)

  const engineRef = useRef<WebWorkerMLCEngine | MLCEngine | null>(null)
  const workerRef = useRef<Worker | null>(null)
  const cpuRef = useRef<CpuTutorClient | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isInitialMount = useRef(true)
  const lastStatusRef = useRef<string>('')

  // Stable refs to avoid stale closures in callbacks
  const messagesRef = useRef(messages)
  const sessionIdRef = useRef(sessionId)
  const problemRef = useRef(problem)
  const prevSelectionTokenRef = useRef(userSelectionToken ?? 0)

  const { recordActivity, recordProblemSolved } = useProgress()

  const cleanupEngine = useCallback(() => {
    modelLoadId.current++
    cpuRef.current?.dispose()
    cpuRef.current = null
    if (engineRef.current) {
      engineRef.current.unload().catch((err) => {
        console.warn('Error unloading WebLLM engine:', err)
      })
      engineRef.current = null
    }
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
  }, [])

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
    setIsThinking(false)
    setSessionId(nextId)
  }, [])

  // Track component mount and unmount with active session ID and unload WebLLM engine
  useEffect(() => {
    console.log('[CHAT MOUNT]', { sessionId: sessionIdRef.current })
    return () => {
      console.log('[CHAT UNMOUNT]', { sessionId: sessionIdRef.current })
      cleanupEngine()
    }
  }, [cleanupEngine])

  // Broadcast AI mode state to isolate background GPU animations (e.g. Silk)
  useEffect(() => {
    const isAiActive = mode === 'loading' || mode === 'ai'
    window.dispatchEvent(
      new CustomEvent('patternos:ai-mode', { detail: { active: isAiActive } })
    )
    return () => {
      if (isAiActive) {
        window.dispatchEvent(
          new CustomEvent('patternos:ai-mode', { detail: { active: false } })
        )
      }
    }
  }, [mode])

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
    setLearningGoal('concepts')
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
        ? 'Lite hints — limited language understanding'
        : mode === 'loading'
          ? downloadProgress || 'Starting download...'
          : 'Local AI ready'

    if (lastStatusRef.current !== status) {
      lastStatusRef.current = status
      onStatusChange?.(status)
    }
  }, [mode, downloadProgress, onStatusChange])

  useEffect(() => {
    const thread = messagesEndRef.current?.parentElement
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Scroll the conversation itself, not the entire page under the fixed nav.
    thread?.scrollTo({ top: thread.scrollHeight, behavior: isInitialMount.current || reduceMotion ? 'auto' : 'smooth' })
    isInitialMount.current = false
  }, [messages])

  const enableFullAI = useCallback(async () => {
    cleanupEngine()
    setCpuActive(false)
    setIsThinking(false)
    setDesktopModel('')
    const loadId = modelLoadId.current
    setAiError('')
    setGpuHelp(false)
    setMode('loading')
    try {
      const adapter = await findTutorGpu((navigator as Navigator & { gpu?: TutorGpu }).gpu, window.isSecureContext, modelSize === '7B')
      const webllmModule = await import('@mlc-ai/web-llm')
      const selectedModel = modelSize === 'smallest'
        ? smallestCompatibleModel(webllmModule.prebuiltAppConfig.model_list, adapter.features)
        : webllmModule.prebuiltAppConfig.model_list.find(item => item.model_id === `Qwen2.5-${modelSize}-Instruct-q4f32_1-MLC`)!
      if (!selectedModel) throw new Error('The selected model is unavailable in this runtime.')
      if (loadId !== modelLoadId.current) return
      setActiveBrowserModel(selectedModel.model_id)
      let lastProgressUpdate = 0
      const THROTTLE_MS = 200

      const worker = new Worker(
        new URL('../workers/webllm.worker.ts', import.meta.url),
        { type: 'module' }
      )
      workerRef.current = worker

      const engine = await webllmModule.CreateWebWorkerMLCEngine(
        worker,
        selectedModel.model_id,
        {
          initProgressCallback: (report) => {
            if (loadId !== modelLoadId.current) return
            const pct = Math.round(report.progress * 100)
            const now = Date.now()
            if (pct >= 100 || now - lastProgressUpdate >= THROTTLE_MS) {
              lastProgressUpdate = now
            setDownloadProgress(browserLoadProgress(report.progress, report.text))
            }
          },
        },
        { context_window_size: modelSize === '1.5B' ? 8192 : 4096 }
      )
      if (loadId !== modelLoadId.current) {
        await engine.unload()
        return
      }
      engineRef.current = engine
      if (modelSize === '7B') {
        setDownloadProgress('Checking that Advanced 7B can generate a reply…')
        await withModelDeadline(() => engine.chat.completions.create({ messages: [{ role: 'user', content: 'Reply with the word Ready.' }], max_tokens: 8, stream: false }), 60000, () => engine.interruptGenerate())
        if (loadId !== modelLoadId.current) return
        await engine.resetChat()
      }
      setMode('ai')
      setDownloadProgress('')
    } catch (err) {
      if (loadId !== modelLoadId.current) return
      console.error('WebLLM Web Worker init failed:', err)
      cleanupEngine()
      setIsThinking(false)
      setMode('lite')
      setAiError(err instanceof Error ? err.message : 'The local model could not load. Check your connection and GPU support, then retry.')
      setGpuHelp(err instanceof GpuUnavailableError)
      setDownloadProgress('')
    }
  }, [cleanupEngine, modelSize])

  const enableCpuAI = useCallback(async () => {
    cleanupEngine()
    const loadId = modelLoadId.current
    setIsThinking(false); setDesktopModel(''); setCpuActive(false)
    setAiError(''); setGpuHelp(false); setModelSize('smallest')
    try { localStorage.setItem('patternos-model-tier', 'smallest') } catch { /* CPU selection still works for this visit. */ }
    setMode('loading'); setDownloadProgress('Loading CPU Light — no graphics adapter needed…')
    try {
      const client = new CpuTutorClient(new Worker(new URL('../workers/cpuTutor.worker.ts', import.meta.url), { type: 'module' }), progress => {
        if (loadId === modelLoadId.current) setDownloadProgress(progress)
      }, message => {
        if (loadId === modelLoadId.current) { setCpuActive(false); setMode('lite'); setAiError(message) }
      })
      cpuRef.current = client
      await client.load()
      if (loadId !== modelLoadId.current) return
      setActiveBrowserModel(CPU_MODEL_ID); setCpuActive(true); setMode('ai'); setDownloadProgress('')
    } catch (error) {
      if (loadId !== modelLoadId.current) return
      cleanupEngine(); setCpuActive(false); setMode('lite'); setDownloadProgress('')
      setAiError(error instanceof Error ? error.message : 'CPU Light could not load. Check your connection and retry.')
    }
  }, [cleanupEngine])

  const enableDesktopAI = useCallback(async () => {
    cleanupEngine()
    setCpuActive(false)
    setIsThinking(false)
    const loadId = modelLoadId.current
    setAiError('')
    setDownloadProgress('Connecting to installed desktop AI...')
    setMode('loading')
    try {
      const selected = await findDesktopModel()
      if (loadId !== modelLoadId.current) return
      setDesktopModel(selected)
      setMode('ai')
      setDownloadProgress('')
    } catch (error) {
      if (loadId !== modelLoadId.current) return
      setAiError(error instanceof Error ? error.message : 'Start Ollama and retry desktop AI.')
      setMode('lite')
    }
  }, [cleanupEngine])

  const sendMessage = useCallback(async (text: string, retry = false) => {
    if (!text.trim() || isThinking) return

    const turnSessionId = sessionIdRef.current
    const turnProblem = problemRef.current
    const turnModelId = modelLoadId.current
    const isCurrentTurn = () => sessionIdRef.current === turnSessionId && modelLoadId.current === turnModelId
    const userMsg: Message = { role: 'user', content: text.trim(), learningGoal }
    const nextMessages = prepareUserTurn(messagesRef.current, userMsg.content, learningGoal, retry)
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

    const retrieved = await retrieveForQuery(userMsg.content, 2, true).catch((err) => {
      console.error('Retrieval failed:', err)
      return []
    })

    if (!isCurrentTurn()) return

    if (mode !== 'ai' || (!desktopModel && !engineRef.current && !cpuRef.current)) {
      // Basic hints must not silently download a second embedding model.
      const base = liteRespond(userMsg.content, turnProblem, nextMessages)

      if (!isCurrentTurn()) return
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

    let lastChunkRender = 0
    const CHUNK_RENDER_THROTTLE_MS = 100

    const result = await executeFullAITurnSafe({
      userText: userMsg.content,
      learningGoal,
      timeoutMs: desktopModel || cpuActive ? 120000 : 90000,
      onTimeout: () => {
        if (!isCurrentTurn()) return
        engineRef.current?.interruptGenerate()
        workerRef.current?.terminate()
        workerRef.current = null
        engineRef.current = null
        setMode('lite')
        setAiError('The model did not reply in time. Your chat is saved. Try a smaller browser model or installed desktop AI.')
      },
      smallModel: cpuActive || (desktopModel ? /:(?:0\.5|1\.5)b$/.test(desktopModel) : !['1.5B', '7B'].includes(activeModelTier(activeBrowserModel))),
      problem: turnProblem,
      messages: nextMessages,
      retrievedNotes: [...retrieved, ...(learningContext ? [{ chunk: { text: learningContext } }] : [])],
      createCompletion: async (payload, options) => cpuActive
        ? cpuRef.current!.complete(payload)
        : desktopModel
        ? desktopCompletion(desktopModel, payload, options)
        : engineRef.current!.chat.completions.create({
          messages: payload as ChatCompletionMessageParam[],
          response_format: options?.responseFormat === 'json' ? { type: 'json_object', schema: options.jsonSchema ? JSON.stringify(options.jsonSchema) : undefined } : undefined,
          temperature: options?.temperature ?? 0.4,
          max_tokens: options?.maxTokens ?? 768,
          // Teaching replies are validated before display, so avoid a second streaming protocol here.
          stream: false,
        }),
      onChunk: (currentText) => {
        if (!isCurrentTurn()) return
        const now = performance.now()
        if (now - lastChunkRender >= CHUNK_RENDER_THROTTLE_MS) {
          lastChunkRender = now
          const streamedMessages = [
            ...nextMessages,
            { role: 'assistant' as const, content: currentText },
          ]
          messagesRef.current = streamedMessages
          setMessages(streamedMessages)
        }
      },
    })

    if (!isCurrentTurn()) return
    if (result.lesson) setLearningGoal(result.lesson.goal)
    const finalMessages = [
      ...nextMessages,
      { role: 'assistant' as const, content: result.finalContent, lesson: result.lesson, replyFailed: result.usedFallback },
    ]
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
  }, [isThinking, mode, desktopModel, recordActivity, learningGoal, learningContext, activeBrowserModel, cpuActive])

  const clearChat = useCallback(() => {
    // Start a fresh session with a new unique session ID
    const newId = createSessionId('RESET_CHAT')
    const resetMsg = problemRef.current ? buildProblemWelcome(problemRef.current) : GENERIC_WELCOME
    setLearningGoal('concepts')
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
    setLearningGoal(getLessonState(session.messages, PROBLEMS.find(item => item.id === session.problemId)?.slug).goal)
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

  // Active thread extracted from conversation truth
  const activeThread = useMemo(() => extractActiveThread(messages), [messages])
  const activeGraph = useMemo(
    () => getActiveGraph(problem?.slug, activeThread.current.approachId, problem),
    [problem, activeThread.current.approachId]
  )
  const stageInfo = useMemo(
    () => getPedagogicalStage(activeThread, activeGraph, solvedConfirmed),
    [activeThread, activeGraph, solvedConfirmed]
  )

  // Fresh session: only the initial welcome assistant message, no user messages yet
  const lessonState = useMemo(() => getLessonState(messages, problem?.slug), [messages, problem?.slug])
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
      {import.meta.env.DEV && !desktopModel && <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded border border-border-subtle bg-surface-raised px-4 py-3 text-xs">
        <span><strong className="font-medium">Use the desktop demonstration setup</strong><span className="mt-1 block text-text-secondary">Connect to your installed model through this computer. The 7B tutor uses the full guided lesson flow.</span></span>
        <button onClick={enableDesktopAI} disabled={isThinking || mode === 'loading'} className="rounded bg-accent px-3 py-2 text-white disabled:opacity-50">Use installed desktop tutor</button>
      </div>}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <label htmlFor="learning-goal" className="text-text-secondary">Learning goal</label>
        <select id="learning-goal" value={learningGoal} disabled={isThinking}
          onChange={event => setLearningGoal(event.target.value as LearningGoal)}
          className="rounded-md border border-border-subtle bg-surface-raised p-2 text-text-primary">
          <option value="concepts">Understand the concept</option>
          <option value="pseudocode">Plan in plain language</option>
          <option value="code">Practice coding</option>
        </select>
        {learningGoal === 'concepts' && <span className="text-text-tertiary">No coding required.</span>}
        {lessonState.complete && <span role="status" className="text-success">Concept lesson complete</span>}
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="ai-model-tier" className="text-text-secondary">AI model</label>
          <select id="ai-model-tier" value={modelSize} disabled={isThinking || mode === 'loading'} onChange={event => {
            const next = event.target.value as ModelTier
            setModelSize(next)
            try { localStorage.setItem('patternos-model-tier', next) } catch { /* Selection still works for this visit. */ }
          }} className="rounded-md border border-border-subtle bg-surface-raised p-2 text-text-primary">
            {MODEL_TIERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          {mode !== 'loading' && <button onClick={enableFullAI} disabled={isThinking || (mode === 'ai' && !desktopModel && activeModelTier(activeBrowserModel) === modelSize)} className="rounded-md bg-accent/15 px-3 py-2 font-medium text-accent hover:bg-accent/25 disabled:opacity-50">
            {mode === 'ai' && !desktopModel && activeModelTier(activeBrowserModel) === modelSize ? 'Active' : `${mode === 'ai' ? 'Switch to' : 'Load'} ${modelTierLabel(modelSize)}`}
          </button>}
        </div>
      </div>
      {modelSize === '7B' && !desktopModel && <p className="mb-3 text-xs text-text-secondary">Advanced 7B runs entirely in this browser. Experimental: plan for 16 GB RAM, an 8 GB compatible GPU, and about 6 GB free browser storage. The first load is a large download; close other AI sessions. It may fail on integrated graphics.</p>}
      <details className="mb-4 border-b border-border-subtle pb-3 text-xs">
        <summary className="w-fit cursor-pointer text-text-tertiary hover:text-text-primary">Chat settings &amp; offline access</summary>
        <div className="pt-3">
      {/* Mode banner */}
      {mode === 'lite' && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-y-2 rounded-lg border border-border-subtle bg-surface-raised px-4 py-2.5 text-xs">
          <span className="text-text-tertiary">
            Lite hints use limited answer matching. Enable AI for a conversation in your own words.
          </span>
        </div>
      )}
      <p className="mb-3 text-text-secondary">{MODEL_TIERS.find(item => item.id === modelSize)?.description} Switching loads the selected model and keeps your conversation.</p>
      <div className="mb-3 text-text-secondary">
        <button onClick={enableCpuAI} disabled={isThinking || mode === 'loading' || (mode === 'ai' && cpuActive)} className="text-accent underline disabled:opacity-50">{mode === 'ai' && cpuActive ? 'CPU Light is active' : 'Use CPU Light (no GPU)'}</button>
        <p className="mt-1">A small model running on your processor. First use downloads model files. It can be slower and less capable than the GPU models; no paid service is needed.</p>
      </div>
      {cpuActive && mode === 'ai' && <button onClick={enableFullAI} disabled={isThinking} className="mb-3 text-accent underline">Try GPU Light instead</button>}
      {mode === 'ai' && <p className="mb-3 break-all text-text-tertiary">Active model: {desktopModel || activeBrowserModel}</p>}
      {import.meta.env.DEV && mode !== 'ai' && (
        <button onClick={enableDesktopAI} className="mb-3 text-xs text-accent underline">
          Use installed desktop AI (Ollama, local preview)
        </button>
      )}
      {mode === 'lite' && (
        <p className="mb-3 text-[11px] text-text-muted">
          GPU Light selects the lowest-memory compatible model. First use downloads model files. GPU models require WebGPU; CPU Light does not. Small models can misunderstand questions. Workshop progress is checked separately.
        </p>
      )}
      {mode === 'lite' && lowPowerWarning && (
        <div className="mb-3 text-[11px] text-text-muted">
          This device may have limited resources. Try the smallest AI option; the visual workshop remains available if it cannot load.
        </div>
      )}
          <OfflineLessons />
        </div>
      </details>
      {aiError && <div role="alert" className="mb-3 rounded border border-danger/30 p-3 text-xs text-danger"><p>{aiError}</p>{gpuHelp && <button onClick={enableCpuAI} disabled={isThinking || mode === 'loading'} className="mt-2 rounded bg-accent px-3 py-2 text-white">Use CPU Light</button>}</div>}
      {mode === 'loading' && (
        <div className="mb-3 rounded-lg border border-border-subtle bg-surface-raised px-4 py-2.5 text-xs text-accent animate-pulse">
          {downloadProgress || 'Starting download...'} — Lite hints remain available.
          <button className="ml-3 underline" onClick={() => { cleanupEngine(); setIsThinking(false); setMode('lite') }}>Cancel loading</button>
        </div>
      )}
      {mode === 'ai' && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-raised px-4 py-2 text-xs">
          <span className="text-text-tertiary">
            <span title={desktopModel || activeBrowserModel}>{cpuActive ? 'CPU Light' : desktopModel ? `Desktop AI · ${desktopModel}` : `${modelTierLabel(activeModelTier(activeBrowserModel))} AI`} active · stays on your device</span>
            <span className="mt-1 block">{cpuActive || (desktopModel ? /:(?:0\.5|1\.5)b$/.test(desktopModel) : !['1.5B', '7B'].includes(activeModelTier(activeBrowserModel))) ? 'Compact tutor · basic explanations and limited conversation understanding' : 'Guided tutor · follows your lesson context and learning goal'}</span>
          </span>
          <button
            onClick={() => {
              cleanupEngine()
              setIsThinking(false)
              setMode('lite')
            }}
            className="ml-3 shrink-0 rounded-md bg-surface-hover px-2.5 py-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Switch to Lite Mode
          </button>
        </div>
      )}

      {/* Pedagogical Stage Progress Indicator */}
      {mode !== 'ai' && learningGoal === 'code' && <PedagogicalStageProgress stageInfo={stageInfo} />}

      {/* Messages — naturally sizes without artificial empty dead air.
          Scrollable as messages accumulate. */}
      <div className="chat-thread overflow-y-auto space-y-4 pr-2 overscroll-y-contain">
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

        {!isThinking && messages.at(-1)?.replyFailed && (
          <button className="text-xs text-accent underline" onClick={() => sendMessage(messages.at(-2)?.content ?? '', true)}>
            Retry reply
          </button>
        )}
        {/* Solved action — clear chip, not just a text link */}
        {learningGoal === 'code' && !isThinking && lastIsAssistant && !solvedConfirmed && (
          <div className="flex justify-start pt-1">
            <button
              onClick={handleSolvedWithConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-raised px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-success/40 hover:text-success transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0">
                <path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Mark coding practice complete
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
              Coding practice complete (self-assessed) ✓
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
