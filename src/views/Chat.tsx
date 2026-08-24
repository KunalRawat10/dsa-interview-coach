import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'

interface Message {
  id: number
  text: string
  isUser: boolean
}

const DEMO_RESPONSES = [
  'Interesting approach! Before we dive into the solution, let me ask you: what data structure would let you check for the complement in O(1) time?',
  'Good thinking with the hash map. Now consider this: what if the array is not sorted? Does your approach still work? What is the trade-off?',
  'Exactly! The hash map gives us O(1) lookups. Can you walk me through the time and space complexity of your solution?',
  'Nice. Now think about edge cases. What if no pair sums to the target? What should you return?',
]

let demoIndex = 0

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      text: 'Welcome to the Socratic Chamber. I am your DSA interview coach.\n\nShare a problem or paste your code — I will guide you with questions before giving answers. What would you like to work on today?',
      isUser: false,
    },
  ])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const threadRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.chat-header'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      )
      gsap.fromTo(
        el.querySelectorAll('.chat-msg'),
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
      )
      gsap.fromTo(
        el.querySelectorAll('.chat-input-area'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.4 }
      )
    }, el)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages, isThinking])

  const sendMessage = () => {
    const text = input.trim()
    if (!text) return

    const userMsg: Message = { id: Date.now(), text, isUser: true }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsThinking(true)

    setTimeout(() => {
      const response = DEMO_RESPONSES[demoIndex % DEMO_RESPONSES.length]
      demoIndex++
      const aiMsg: Message = { id: Date.now() + 1, text: response, isUser: false }
      setMessages((prev) => [...prev, aiMsg])
      setIsThinking(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div ref={containerRef} className="h-[calc(100vh-140px)] flex flex-col">
      <div className="chat-header text-center space-y-1 mb-4">
        <h2 className="text-2xl font-medium">Socratic Chamber</h2>
        <p className="text-text-tertiary text-sm">Ask questions. Get hints. Discover the solution yourself.</p>
      </div>

      <div
        ref={threadRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2"
        style={{ scrollbarWidth: 'thin' }}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={'chat-msg flex gap-3 ' + (msg.isUser ? 'justify-end' : 'justify-start')}>
            {!msg.isUser && (
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm flex-shrink-0 mt-1">
                ◉
              </div>
            )}
            <div
              className={
                'max-w-[70%] px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ' +
                (msg.isUser
                  ? 'bg-accent text-black'
                  : 'bg-surface-raised border border-border-subtle')
              }
            >
              {msg.text}
            </div>
            {msg.isUser && (
              <div className="w-8 h-8 rounded-full bg-surface-strong flex items-center justify-center text-text-secondary text-xs flex-shrink-0 mt-1">
                You
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="chat-msg flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm flex-shrink-0">
              ◉
            </div>
            <div className="bg-surface-raised border border-border-subtle rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="relative w-6 h-6">
                  <div className="absolute inset-0 rounded-full border border-accent/40 animate-ping" />
                  <div className="absolute inset-1 rounded-full bg-accent/60" />
                </div>
                <span className="text-text-tertiary text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="chat-input-area mt-4 pt-4 border-t border-border-subtle">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste a LeetCode problem, your code, or ask about a pattern..."
            className="flex-1 bg-surface-muted border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted resize-none outline-none focus:border-border-hover transition-colors"
            rows={2}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isThinking}
            className="px-5 bg-accent text-black rounded-xl font-medium text-lg hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            →
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-surface-muted border border-border-subtle text-text-muted">
            RAG: Striver's A2Z
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-surface-muted border border-border-subtle text-text-muted">
            Model: Qwen2.5-1.5B
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-md bg-surface-muted border border-border-subtle text-text-muted">
            Mode: Socratic
          </span>
        </div>
      </div>
    </div>
  )
}