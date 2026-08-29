import type { TabId } from '../../App'

interface CTAProps {
  onNavigate: (tab: TabId) => void
}

export default function CTA({ onNavigate }: CTAProps) {
  return (
    <section id="cta" className="relative overflow-hidden py-24 lg:py-36 border-t border-ink-700">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div
        className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.08] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, #2E72D0, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <div className="reveal">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-ink-600 bg-ink-850 shadow-lg">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="10" cy="10" r="3" fill="#4B8FE7" />
              <circle cx="22" cy="10" r="3" fill="#2E72D0" />
              <circle cx="16" cy="22" r="3" fill="#C9A961" />
              <line x1="10" y1="10" x2="22" y2="10" stroke="#2C313A" strokeWidth="1.5" />
              <line x1="10" y1="10" x2="16" y2="22" stroke="#2C313A" strokeWidth="1.5" />
              <line x1="22" y1="10" x2="16" y2="22" stroke="#2C313A" strokeWidth="1.5" />
            </svg>
          </div>

          <h2 className="display-xl text-4xl sm:text-6xl lg:text-7xl text-paper-50">
            Stop memorizing.
            <br />
            <span className="text-accent-300">Start seeing.</span>
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-base sm:text-lg leading-relaxed text-paper-300">
            Build the intuition that stays with you. Learn to see the structure
            behind any algorithmic problem — and solve it from understanding.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => onNavigate('practice')}
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-8 py-4 text-base sm:text-lg font-medium text-white transition-all hover:bg-accent-400 hover:shadow-xl hover:shadow-accent-500/25 cursor-pointer"
            >
              <span>Start Learning</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-0.5">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <button
              onClick={() => onNavigate('constellation')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-ink-500 px-8 py-4 text-base sm:text-lg font-medium text-paper-200 transition-all hover:border-ink-400 hover:bg-ink-850 cursor-pointer"
            >
              <span>Explore patterns</span>
            </button>
          </div>

          <p className="mt-6 font-mono text-xs text-paper-500">
            Free to start. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}
