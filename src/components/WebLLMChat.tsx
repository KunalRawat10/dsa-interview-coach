import { useEffect, useRef, useState, useCallback } from 'react'
import * as webllm from '@mlc-ai/web-llm'
import { liteRespond } from '../lib/liteSocratic'
import { useProgress } from '../hooks/useProgress'
import { retrieveForQuery } from '../lib/retrieval'
import { loadHistory, archiveSession, deleteSession, type ChatSession } from '../lib/chatHistory'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface WebLLMChatProps {
  onStatusChange?: (status: string) => void
}

type Mode = 'lite' | 'loading' | 'ai'

const SYSTEM_PROMPT = `You are a DSA interview coach. Your role is to help users develop problem-solving skills, not to give them answers.

RULES:
1. NEVER provide complete solutions or working code on the first response.
2. ALWAYS ask guiding Socratic questions to help the user discover the answer themselves.
3. If the user pastes code, analyze its Big-O complexity and ask what they think could be improved — do NOT fix it for them.
4. Focus on: (a) What data structure fits this problem? (b) What pattern might apply? (c) What edge cases should they consider? (d) What's the brute force vs optimal approach?
5. Be encouraging but firm. If they ask for the answer directly, redirect with a hint.
6. Keep responses concise (2-4 sentences) to maintain engagement.
7. Use the user's vocabulary and refer to patterns by name (Two Pointers, Sliding Window, etc.) when relevant.`

function isLowPowerDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number }
  const cores = nav.hardwareConcurrency ?? 4
  const mem = nav.deviceMemory ?? 4
  return cores < 4 || mem < 4
}

const CHAT_STORAGE_KEY = 'dsa-coach:chat'

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content:
    "Welcome to the Socratic Chamber. I'm your DSA interview coach. Paste a problem or your code, and I'll guide you through it with questions — never spoilers. What are we working on today?",
}

// Persists across tab switches (Chat unmounts when you leave the tab) and
// page reloads — reads once on mount, writes on every change.
function loadStoredMessages(): Message[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // ignore — fall through to default
  }
  return [WELCOME_MESSAGE]
}

export default function WebLLMChat({ onStatusChange }: WebLLMChatProps) {
  const [messages, setMessages] = useState<Message[]>(loadStoredMessages)
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [mode, setMode] = useState<Mode>('lite') // starts instant, zero download
  const [downloadProgress, setDownloadProgress] = useState('')
  const [lowPowerWarning] = useState(isLowPowerDevice)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState<ChatSession[]>(loadHistory)
  const engineRef = useRef<webllm.MLCEngine | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { recordActivity, recordProblemSolved } = useProgress()

  useEffect(() => {
    onStatusChange?.(
      mode === 'lite'
        ? 'Lite Mode — instant, no download'
        : mode === 'loading'
          ? downloadProgress || 'Starting download...'
          : 'Full AI ready — works offline'
    )
  }, [mode, downloadProgress, onStatusChange])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch {
      // localStorage unavailable (private mode, quota) — chat still works in-session
    }
  }, [messages])

  // Only runs when the user explicitly opts in — never on mount.
  const enableFullAI = useCallback(async () => {
    setMode('loading')
    try {
      const engine = await webllm.CreateMLCEngine('Qwen2.5-1.5B-Instruct-q4f32_1-MLC', {
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

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isThinking) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)
    recordActivity()

    // Returns [] instantly if no notes are stored — no embedding model
    // download for anyone who hasn't used the Knowledge Base.
    const retrieved = await retrieveForQuery(userMsg.content).catch((err) => {
      console.error('Retrieval failed:', err)
      return []
    })

    if (mode !== 'ai' || !engineRef.current) {
      // Lite Mode: instant, rule-based, zero cost — no network, no GPU.
      const base = liteRespond(userMsg.content)
      const reply =
        retrieved.length > 0
          ? `From your notes ("${retrieved[0].chunk.sourceTitle}"): "${retrieved[0].chunk.text.slice(0, 160)}${retrieved[0].chunk.text.length > 160 ? '…' : ''
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
      const history = [
        { role: 'system', content: SYSTEM_PROMPT + noteContext },
        ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg.content },
      ]
      const reply = await engineRef.current.chat.completions.create({
        messages: history as webllm.ChatCompletionMessageParam[],
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
  }, [input, isThinking, messages, mode, recordActivity])

  const clearChat = useCallback(() => {
    archiveSession(messages)
    setHistory(loadHistory())
    setMessages([WELCOME_MESSAGE])
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY)
    } catch {
      // ignore — in-memory state is already cleared regardless
    }
  }, [messages])

  const loadSession = useCallback(
    (session: ChatSession) => {
      // Archive whatever's currently active before switching away from it,
      // so re-opening this session later doesn't lose the in-progress one.
      archiveSession(messages)
      setMessages(session.messages)
      setShowHistory(false)
      setHistory(loadHistory())
    },
    [messages]
  )

  const removeHistorySession = useCallback((id: string) => {
    setHistory(deleteSession(id))
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const lastIsAssistant = messages.length > 1 && messages[messages.length - 1].role === 'assistant'

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-140px)]">
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
          {downloadProgress || 'Starting download...'} — Lite Mode still works while this downloads in the background tab.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-accent/15 text-text-primary rounded-br-md'
                  : 'bg-surface-raised border border-border-subtle text-text-secondary rounded-bl-md'
                }`}
            >
              {msg.content}
            </div>
          </div>
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

        {!isThinking && lastIsAssistant && (
          <div className="flex justify-start">
            <button
              onClick={recordProblemSolved}
              className="text-xs text-accent/80 hover:text-accent font-medium pl-1"
            >
              ✓ I solved this problem
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about a problem or paste your code..."
            className="flex-1 bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isThinking}
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
              onClick={clearChat}
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
                          onClick={() => loadSession(session)}
                          className="flex-1 text-left"
                        >
                          <div className="text-xs text-text-primary line-clamp-1">
                            {preview}
                            {firstUserMsg && firstUserMsg.content.length > 60 ? '…' : ''}
                          </div>
                          <div className="text-[10px] text-text-muted mt-0.5">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {session.messages.length} messages
                          </div>
                        </button>
                        <button
                          onClick={() => removeHistorySession(session.id)}
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
    </div>
  )
}