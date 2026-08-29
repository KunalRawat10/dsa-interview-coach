export default function Method() {
  const steps = [
    { label: 'Problem', desc: 'A specific coding challenge appears.', numClass: 'text-paper-300', labelClass: 'text-paper-200' },
    { label: 'Observe', desc: 'What inputs? What are we optimizing?', numClass: 'text-paper-200', labelClass: 'text-paper-100' },
    { label: 'Structure', desc: 'Is it ordered? Bounded? A pair?', numClass: 'text-accent-300', labelClass: 'text-accent-300' },
    { label: 'Pattern', desc: 'Which known pattern matches this structure?', numClass: 'text-accent-300', labelClass: 'text-accent-300' },
    { label: 'Invariant', desc: 'What property always holds at each step?', numClass: 'text-gold-300', labelClass: 'text-gold-300' },
    { label: 'Implement', desc: 'Code flows from understanding, not memory.', numClass: 'text-success-400', labelClass: 'text-success-400' },
  ]

  return (
    <section id="method" className="relative py-20 sm:py-24 lg:py-32">
      <div className="absolute inset-0 grid-bg-fine opacity-40 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="reveal text-center">
          <div className="section-label mb-4">The PatternOS Method</div>
          <h2 className="mx-auto max-w-3xl font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-paper-50">
            From problem to intuition,
            <br />
            <span className="text-accent-300">one step at a time.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-paper-300">
            PatternOS doesn&apos;t hand you the answer. It walks you through the
            reasoning that makes the answer inevitable.
          </p>
        </div>

        {/* Pipeline */}
        <div className="mt-14 sm:mt-16">
          {/* Desktop: horizontal flow */}
          <div className="hidden lg:block">
            <div className="reveal flex items-stretch justify-center gap-1 xl:gap-2">
              {steps.map((step, i) => (
                <div key={step.label} className="flex items-stretch">
                  <div className="w-36 xl:w-44 text-center">
                    <div className="relative mb-4 flex h-20 items-center justify-center">
                      <div className="absolute inset-0 rounded-2xl border border-ink-600 bg-ink-850" />
                      <span className={`relative font-display text-2xl font-bold ${step.numClass}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className={`font-display text-base xl:text-lg font-semibold ${step.labelClass}`}>
                      {step.label}
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-paper-400">
                      {step.desc}
                    </p>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="flex items-center pt-10 px-1">
                      <svg width="24" height="16" viewBox="0 0 32 16" fill="none">
                        <path d="M2 8h26M22 3l6 5-6 5" stroke="#2C313A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: vertical flow */}
          <div className="space-y-4 lg:hidden">
            {steps.map((step, i) => (
              <div key={step.label} className="reveal flex items-start gap-4">
                <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl border border-ink-600 bg-ink-850">
                  <span className={`font-display text-lg sm:text-xl font-bold ${step.numClass}`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="pt-2">
                  <div className={`font-display text-base sm:text-lg font-semibold ${step.labelClass}`}>
                    {step.label}
                  </div>
                  <p className="mt-0.5 text-xs sm:text-sm leading-relaxed text-paper-400">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example callout */}
        <div className="reveal mt-14 sm:mt-16">
          <div className="product-frame overflow-hidden">
            <div className="product-bar">
              <span className="product-dot bg-accent-400/70" />
              <span className="product-dot bg-accent-400/50" />
              <span className="product-dot bg-accent-400/30" />
              <span className="ml-3 font-mono text-xs text-paper-400">
                example walkthrough
              </span>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              <div className="border-b border-ink-600 p-5 sm:p-6 md:border-b-0 md:border-r">
                <div className="mb-3 font-mono text-xs text-paper-400">PROBLEM</div>
                <p className="text-xs sm:text-sm leading-relaxed text-paper-200 mb-4">
                  Given an array of heights, find two lines that form a container
                  holding the most water.
                </p>
                <div className="flex items-end gap-1.5 pt-2">
                  {[5, 2, 6, 4, 7, 3].map((h, i) => (
                    <div
                      key={i}
                      className="w-7 rounded-t bg-ink-600"
                      style={{ height: h * 6 }}
                    />
                  ))}
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="space-y-3">
                  <MethodStep label="OBSERVE" value="We need two boundaries. Width matters." />
                  <MethodStep label="STRUCTURE" value="Ordered array, optimizing a pair." />
                  <MethodStep label="PATTERN" value="Two Pointers — start wide, narrow in." valueClass="text-accent-300 font-medium" />
                  <MethodStep label="INVARIANT" value="Move the shorter side — it's the only move that can help." valueClass="text-gold-300 font-medium" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function MethodStep({ label, value, valueClass = 'text-paper-200' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 font-mono text-xs text-paper-400">{label}</span>
      <span className={`text-xs sm:text-sm leading-relaxed ${valueClass}`}>{value}</span>
    </div>
  )
}
