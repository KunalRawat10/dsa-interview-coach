export default function Problem() {
  return (
    <section className="relative py-20 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal">
          <div className="section-label mb-4">The Problem</div>
          <h2 className="max-w-3xl font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-paper-50">
            You solved it before.
            <br />
            <span className="text-paper-400">But can you recognize it again?</span>
          </h2>
        </div>

        <div className="mt-12 sm:mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Memorize */}
          <div className="reveal reveal-delay-1">
            <div className="product-frame h-full overflow-hidden">
              <div className="product-bar">
                <span className="product-dot bg-error-500/70" />
                <span className="product-dot bg-error-500/50" />
                <span className="product-dot bg-error-500/30" />
                <span className="ml-3 font-mono text-xs text-paper-400">
                  the old way
                </span>
              </div>
              <div className="p-6">
                <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-error-500/20 bg-error-500/5 px-3 py-1.5">
                  <span className="font-mono text-xs text-error-400">MEMORIZE SOLUTION</span>
                </div>

                <div className="space-y-3">
                  <MemorizeRow text="Search: 'two sum solution'" />
                  <MemorizeRow text="Read the code. Copy it." />
                  <MemorizeRow text="Submit. It passes." />
                  <MemorizeRow text="Two weeks later..." />
                  <MemorizeRow text="See a variation. Blank." textClass="text-error-400" />
                </div>

                <div className="mt-6 rounded-lg border border-error-500/15 bg-ink-900 p-4">
                  <p className="text-xs sm:text-sm leading-relaxed text-paper-300">
                    You memorized <span className="text-paper-100 font-medium">one answer</span> to{' '}
                    <span className="text-paper-100 font-medium">one problem</span>. The next
                    problem looks different, so the memory doesn&apos;t trigger.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pattern */}
          <div className="reveal reveal-delay-2">
            <div className="product-frame h-full overflow-hidden">
              <div className="product-bar">
                <span className="product-dot bg-accent-400/70" />
                <span className="product-dot bg-accent-400/50" />
                <span className="product-dot bg-accent-400/30" />
                <span className="ml-3 font-mono text-xs text-paper-400">
                  the patternos way
                </span>
              </div>
              <div className="p-6">
                <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-accent-500/20 bg-accent-500/5 px-3 py-1.5">
                  <span className="font-mono text-xs text-accent-300">UNDERSTAND PATTERN</span>
                </div>

                <div className="space-y-3">
                  <PatternRow text="Observe the structure of the problem." />
                  <PatternRow text="Recognize: this is a hash-map lookup." />
                  <PatternRow text="Find the invariant: complement = target - num." />
                  <PatternRow text="Implement from understanding." />
                  <PatternRow text="See a variation. Recognize the same structure." textClass="text-success-400" />
                </div>

                <div className="mt-6 rounded-lg border border-accent-500/15 bg-ink-900 p-4">
                  <p className="text-xs sm:text-sm leading-relaxed text-paper-300">
                    You learned <span className="text-accent-300 font-medium">one pattern</span> that
                    applies to <span className="text-accent-300 font-medium">dozens of problems</span>.
                    The next problem looks different, but the structure is the same.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom statement */}
        <div className="reveal mt-12 text-center">
          <p className="mx-auto max-w-2xl text-base sm:text-lg leading-relaxed text-paper-300">
            The difference isn&apos;t intelligence. It&apos;s the layer you operate on.
            Solutions are specific. Patterns are transferable.
          </p>
        </div>
      </div>
    </section>
  )
}

function MemorizeRow({ text, textClass = 'text-paper-300' }: { text: string; textClass?: string }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <path d="M4 4l8 8M12 4l-8 8" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span className={`font-mono text-xs sm:text-sm ${textClass}`}>{text}</span>
    </div>
  )
}

function PatternRow({ text, textClass = 'text-paper-200' }: { text: string; textClass?: string }) {
  return (
    <div className="flex items-center gap-3">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <path d="M4 8l2.5 2.5L12 5" stroke="#4B8FE7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`font-mono text-xs sm:text-sm ${textClass}`}>{text}</span>
    </div>
  )
}
