export default function Knowledge() {
  return (
    <section id="knowledge" className="relative py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
          {/* Left: text & flow */}
          <div className="reveal">
            <div className="section-label mb-4">Knowledge</div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-paper-50">
              Your personal
              <br />
              <span className="text-paper-400">DSA memory.</span>
            </h2>
            <p className="mt-6 max-w-md text-base sm:text-lg leading-relaxed text-paper-300">
              Save notes, connect ideas, and PatternOS retrieves your stored
              knowledge to ground future answers in what you&apos;ve already learned.
            </p>

            {/* Flow */}
            <div className="mt-8 space-y-3">
              <FlowStep num="01" label="Learn" desc="Study a pattern or solve a problem" />
              <FlowArrow />
              <FlowStep num="02" label="Save" desc="Store your notes and insights" />
              <FlowArrow />
              <FlowStep num="03" label="Retrieve" desc="PatternOS finds relevant notes when you need them" />
              <FlowArrow />
              <FlowStep num="04" label="Connect" desc="Your knowledge base grows and interconnects over time" highlight />
            </div>
          </div>

          {/* Right: knowledge interface */}
          <div className="reveal reveal-delay-1">
            <KnowledgeInterface />
          </div>
        </div>
      </div>
    </section>
  )
}

function FlowStep({
  num,
  label,
  desc,
  highlight,
}: {
  num: string
  label: string
  desc: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        highlight
          ? 'border-accent-500/30 bg-accent-500/5'
          : 'border-ink-600 bg-ink-850'
      }`}
    >
      <span className="mt-0.5 font-mono text-xs text-accent-400 font-semibold">{num}</span>
      <div>
        <div className="font-display text-sm font-semibold text-paper-100">{label}</div>
        <div className="text-xs text-paper-400">{desc}</div>
      </div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="ml-4">
      <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
        <path d="M6 2v10M2 9l4 4 4-4" stroke="#2C313A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

type Note = {
  title: string
  pattern: string
  preview: string
  date: string
  tags: string[]
}

const notes: Note[] = [
  {
    title: "Two Pointers — when to move which side",
    pattern: "Two Pointers",
    preview: "The key insight: moving the shorter boundary is the only move that can improve the result. Moving the taller side can only shrink or maintain...",
    date: "Aug 24",
    tags: ['invariant', 'container'],
  },
  {
    title: "Sliding Window vs Two Pointers",
    pattern: "Sliding Window",
    preview: "Sliding Window maintains a contiguous range; Two Pointers can be non-contiguous. Window is about what's inside; pointers are about boundaries...",
    date: "Aug 22",
    tags: ['comparison', 'window'],
  },
  {
    title: "Binary Search — the invariant that makes it work",
    pattern: "Binary Search",
    preview: "The search space must be monotonic — each comparison eliminates half. If the predicate isn't monotonic, binary search doesn't apply...",
    date: "Aug 20",
    tags: ['invariant', 'monotonic'],
  },
]

function KnowledgeInterface() {
  return (
    <div className="product-frame overflow-hidden">
      <div className="product-bar">
        <span className="product-dot bg-accent-400/70" />
        <span className="product-dot bg-accent-400/50" />
        <span className="product-dot bg-accent-400/30" />
        <span className="ml-3 font-mono text-xs text-paper-400 truncate">
          patternos — knowledge base
        </span>
        <span className="ml-auto font-mono text-xs text-paper-500 shrink-0">12 notes</span>
      </div>

      <div className="grid lg:grid-cols-[200px_1fr]">
        {/* Sidebar */}
        <div className="border-b border-ink-600 bg-ink-900 p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-850 px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#6B7280" strokeWidth="1.5">
              <circle cx="6" cy="6" r="4" />
              <path d="M9 9l3 3" strokeLinecap="round" />
            </svg>
            <span className="font-mono text-xs text-paper-500">Search notes...</span>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="rounded-md bg-accent-500/10 px-3 py-1.5 text-accent-300 font-medium">
              All notes
            </div>
            <div className="px-3 py-1.5 text-paper-400 hover:text-paper-200 cursor-pointer">
              Two Pointers
            </div>
            <div className="px-3 py-1.5 text-paper-400 hover:text-paper-200 cursor-pointer">
              Sliding Window
            </div>
            <div className="px-3 py-1.5 text-paper-400 hover:text-paper-200 cursor-pointer">
              Binary Search
            </div>
            <div className="px-3 py-1.5 text-paper-400 hover:text-paper-200 cursor-pointer">
              Dynamic Programming
            </div>
          </div>
        </div>

        {/* Notes list */}
        <div className="space-y-3 p-4 bg-ink-950">
          {notes.map((note, i) => (
            <NoteCard key={i} note={note} highlighted={i === 0} />
          ))}

          {/* Retrieval indicator */}
          <div className="mt-2 rounded-lg border border-accent-500/20 bg-accent-500/5 p-3">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#4B8FE7" strokeWidth="1.5">
                <path d="M3 5a4 4 0 1 1 0 4M3 5v4" />
              </svg>
              <span className="font-mono text-xs text-accent-300 font-semibold">RETRIEVED</span>
              <span className="font-mono text-xs text-paper-400">
                3 notes matched &quot;two pointers invariant&quot;
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function NoteCard({ note, highlighted }: { note: Note; highlighted?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3.5 sm:p-4 transition-colors ${
        highlighted
          ? 'border-accent-500/30 bg-accent-500/5'
          : 'border-ink-600 bg-ink-850 hover:border-ink-500'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded border border-ink-500 px-2 py-0.5 font-mono text-[10px] text-paper-400">
            {note.pattern}
          </span>
          <span className="font-mono text-[10px] text-paper-500">{note.date}</span>
        </div>
        {highlighted && (
          <span className="flex items-center gap-1 font-mono text-[10px] text-accent-300">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
            match
          </span>
        )}
      </div>
      <h4 className="mt-2 font-display text-sm font-semibold text-paper-100">
        {note.title}
      </h4>
      <p className="mt-1.5 text-xs leading-relaxed text-paper-400">{note.preview}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-ink-700 px-2 py-0.5 font-mono text-[10px] text-paper-400"
          >
            #{tag}
          </span>
        ))}
      </div>
    </div>
  )
}
