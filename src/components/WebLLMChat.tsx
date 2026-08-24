import { useEffect, useRef, useState, useCallback } from 'react'
import * as webllm from '@mlc-ai/web-llm'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface WebLLMChatProps {
  onStatusChange?: (status: string) => void
}

const SYSTEM_PROMPT = `You are a DSA interview coach. Your role is to help users develop problem-solving skills, not to give them answers.

RULES:
1. NEVER provide complete solutions or working code on the first response.
2. ALWAYS ask guiding Socratic questions to help the user discover the answer themselves.
3. If the user pastes code, analyze its Big-O complexity and ask what they think could be improved — do NOT fix it for them.
4. Focus on: (a) What data structure fits this problem? (b) What pattern might apply? (c) What edge cases should they consider? (d) What's the brute force vs optimal approach?
5. Be encouraging but firm. If they ask for the answer directly, redirect with a hint.
6. Keep responses concise (2-4 sentences) to maintain engagement.
7. Use the user's vocabulary and refer to patterns by name (Two Pointers, Sliding Window, etc.) when relevant.`

export default function WebLLMChat({ onStatusChange }: WebLLMChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to the Socratic Chamber. I'm your DSA interview coach. Paste a problem or your code, and I'll guide you through it with questions — never spoilers. What are we working on today?",
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [modelReady, setModelReady] = useState(false)
  const engineRef = useRef<webllm.MLCEngine | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize WebLLM engine
  useEffect(() => {
    let cancelled = false

    const initEngine = async () => {
      try {
        onStatusChange?.('Initializing AI engine...')

        const engine = await webllm.CreateMLCEngine(
          'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
          {
            initProgressCallback: (report) => {
              if (cancelled) return
              const pct = Math.round(report.progress * 100)
              const status = `Downloading model... ${pct}%`
              setProgress(status)
              onStatusChange?.(status)
            },
          }
        )

        if (cancelled) {
          engine.dispose()
          return
        }

        engineRef.current = engine
        setModelReady(true)
        setProgress('')
        onStatusChange?.('Model ready — works offline')
      } catch (err) {
        console.error('WebLLM init failed:', err)
        onStatusChange?.('Model load failed — using demo mode')
      }
    }

    initEngine()

    return () => {
      cancelled = true
      engineRef.current?.dispose()
    }
  }, [onStatusChange])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    if (!engineRef.current || !modelReady) {
      // Fallback demo response
      setTimeout(() => {
        const demoResponses = [
          "Good question. Before we dive in — what data structure do you think naturally fits this problem? Array? Hash Map? Something else?",
          "Interesting approach. Let's test your assumption: is the input guaranteed to be sorted? If not, how does that change your strategy?",
          "You're on the right track. What's the time complexity of your current approach? Can you think of a way to do it in a single pass?",
          "Solid start. Now consider the edge cases: what happens with empty input? Duplicate values? Negative numbers?",
        ]
        const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)]
        setMessages((prev) => [...prev, { role: 'assistant', content: randomResponse }])
        setIsLoading(false)
      }, 1500)
      return
    }

    try {
      const history = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg.content },
      ]

      const reply = await engineRef.current.chat.completions.create({
        messages: history as webllm.ChatCompletionMessageParam[],
        temperature: 0.7,
        max_tokens: 256,
      })

      const content = reply.choices[0]?.message?.content || 'Let me think about that...'
      setMessages((prev) => [...prev, { role: 'assistant', content: content }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'I encountered an error. Let me try again — what was your question?' },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, modelReady])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-140px)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-accent/15 text-text-primary rounded-br-md'
                  : 'bg-surface-raised border border-border-subtle text-text-secondary rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
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

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="mt-4 pt-4 border-t border-border-subtle">
        {progress && (
          <div className="mb-3 text-xs text-accent animate-pulse">
            {progress}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={modelReady ? 'Ask about a problem or paste your code...' : 'Model loading...'}
            disabled={!modelReady && !progress}
            className="flex-1 bg-surface-raised border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading || (!modelReady && !progress)}
            className="px-5 py-3 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-text-muted">
          <span>Press Enter to send</span>
          <span>{modelReady ? 'Local AI — no data leaves your browser' : 'Loading model...'}</span>
        </div>
      </div>
    </div>
  )
}