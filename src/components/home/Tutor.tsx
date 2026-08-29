export default function Tutor() {
  return (
    <section id="tutor" className="relative py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          {/* Left: conversation */}
          <div className="reveal order-2 lg:order-1">
            <TutorConversation />
          </div>

          {/* Right: text */}
          <div className="reveal reveal-delay-1 order-1 lg:order-2">
            <div className="section-label mb-4">AI Tutor</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-paper-50">
              A mentor,
              <br />
              <span className="text-paper-400">not an answer engine.</span>
            </h2>
            <p className="mt-6 max-w-md text-base sm:text-lg leading-relaxed text-paper-300">
              The tutor asks questions, surfaces misconceptions, and guides you
              toward invariants — without spoiling the solution.
            </p>

            <div className="mt-8 space-y-4">
              <TutorPrinciple
                num="01"
                text="Asks questions before giving hints"
              />
              <TutorPrinciple
                num="02"
                text="Identifies misconceptions and redirects"
              />
              <TutorPrinciple
                num="03"
                text="Guides toward invariants, not implementations"
              />
              <TutorPrinciple
                num="04"
                text="Never reveals the solution upfront"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TutorPrinciple({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-xs text-accent-400 font-semibold">{num}</span>
      <span className="text-xs sm:text-sm text-paper-200">{text}</span>
    </div>
  )
}

type Msg = {
  role: 'user' | 'tutor'
  text: string
  kind?: 'question' | 'hint' | 'misconception' | 'insight'
}

const messages: Msg[] = [
  { role: 'user', text: "I'm stuck. I don't see how to avoid checking every pair." },
  {
    role: 'tutor',
    kind: 'question',
    text: "Let's slow down. You have two boundaries — left and right. If you move the taller one inward, what happens to the water?",
  },
  { role: 'user', text: "The width shrinks... and the height can only stay the same or get smaller?" },
  {
    role: 'tutor',
    kind: 'insight',
    text: "Exactly. So moving the taller side can never improve the result. Now — what about moving the shorter side?",
  },
  { role: 'user', text: "The width still shrinks, but the height might increase if the new boundary is taller." },
  {
    role: 'tutor',
    kind: 'hint',
    text: "That's the key insight. Can you state it as an invariant — a property that always holds at each step?",
  },
  { role: 'user', text: "Moving the shorter boundary is the only move that can potentially improve the result." },
  {
    role: 'tutor',
    kind: 'insight',
    text: "That's your invariant. Now implement it — two pointers, start wide, move the shorter side inward each step.",
  },
]

function TutorConversation() {
  return (
    <div className="product-frame overflow-hidden">
      <div className="product-bar">
        <span className="product-dot bg-accent-400/70" />
        <span className="product-dot bg-accent-400/50" />
        <span className="product-dot bg-accent-400/30" />
        <span className="ml-3 font-mono text-xs text-paper-400 truncate">
          patternos — tutor / session
        </span>
        <span className="ml-auto flex items-center gap-2 shrink-0">
          <span className="h-2 w-2 rounded-full bg-success-500 animate-pulse-soft" />
          <span className="font-mono text-xs text-paper-400">Active</span>
        </span>
      </div>

      <div className="max-h-[520px] space-y-4 overflow-y-auto bg-ink-900 p-4 sm:p-6">
        {/* Problem context */}
        <div className="mb-2 rounded-lg border border-ink-600 bg-ink-850 p-3">
          <span className="font-mono text-xs text-paper-400">
            Context: Container With Most Water — Two Pointers
          </span>
        </div>

        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {/* Typing indicator */}
        <div className="flex items-center gap-2 pl-11">
          <span className="font-mono text-xs text-paper-500">Tutor is reflecting</span>
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse-soft" />
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse-soft" style={{ animationDelay: '0.2s' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse-soft" style={{ animationDelay: '0.4s' }} />
          </span>
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-3 border-t border-ink-600 bg-ink-850 px-4 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-ink-600 bg-ink-900 px-3 py-2">
          <span className="font-mono text-sm text-paper-500">|</span>
          <span className="font-mono text-xs sm:text-sm text-paper-500">Type your reasoning...</span>
        </div>
        <button className="rounded-lg bg-accent-500 px-3 py-2 cursor-pointer hover:bg-accent-400 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2">
            <path d="M2 8h12M9 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user'

  const kindStyles: Record<string, string> = {
    question: 'border-accent-500/20 bg-accent-500/5',
    hint: 'border-gold-500/20 bg-gold-500/5',
    misconception: 'border-error-500/20 bg-error-500/5',
    insight: 'border-success-500/20 bg-success-500/5',
  }

  const kindLabels: Record<string, { text: string; class: string }> = {
    question: { text: 'QUESTION', class: 'text-accent-300' },
    hint: { text: 'HINT', class: 'text-gold-300' },
    misconception: { text: 'MISCONCEPTION', class: 'text-error-400' },
    insight: { text: 'INSIGHT', class: 'text-success-400' },
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
          isUser
            ? 'border-ink-600 bg-ink-800'
            : 'border-accent-500/30 bg-accent-500/10'
        }`}
      >
        {isUser ? (
          <span className="font-mono text-xs text-paper-400 font-bold">U</span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#4B8FE7" strokeWidth="1.5">
            <circle cx="8" cy="8" r="6" />
            <path d="M5 8h6M8 5v6" strokeLinecap="round" />
          </svg>
        )}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[85%] sm:max-w-[80%] rounded-xl border p-3.5 sm:p-4 ${
          isUser
            ? 'border-ink-600 bg-ink-800'
            : msg.kind
              ? kindStyles[msg.kind]
              : 'border-ink-600 bg-ink-850'
        }`}
      >
        {!isUser && msg.kind && (
          <div className={`mb-1.5 font-mono text-[10px] font-semibold ${kindLabels[msg.kind].class}`}>
            {kindLabels[msg.kind].text}
          </div>
        )}
        <p className="text-xs sm:text-sm leading-relaxed text-paper-200">{msg.text}</p>
      </div>
    </div>
  )
}
