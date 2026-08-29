import type { TabId } from '../App'

interface PatternHeroProps {
  onNavigate?: (tab: TabId) => void
}

export default function PatternHero({ onNavigate }: PatternHeroProps) {
  return (
    <div className="relative min-h-[82vh] flex flex-col items-center justify-center text-center px-4 py-12 select-none">
      {/* Subtle radial ambient highlight */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[420px] bg-accent/10 rounded-full blur-[120px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* PatternOS Wordmark / Brand Tag */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border-subtle bg-surface-raised/60 backdrop-blur-md mb-8 animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="font-display font-medium text-xs tracking-widest uppercase text-accent">
          PatternOS
        </span>
        <span className="text-text-muted text-xs">•</span>
        <span className="text-text-tertiary text-xs font-sans tracking-wide">Algorithmic Engine</span>
      </div>

      {/* Hero Headline */}
      <h1 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-text-primary leading-[1.08] max-w-4xl mx-auto mb-6">
        <span className="block text-white">THINK IN PATTERNS.</span>
        <span className="block bg-gradient-to-r from-accent via-indigo-300 to-blue-200 bg-clip-text text-transparent">
          NOT SOLUTIONS.
        </span>
      </h1>

      {/* Supporting Text */}
      <p className="font-sans text-base sm:text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
        Deconstruct complex data structures and algorithmic challenges into first-principle structural
        blueprints. Build lasting intuition instead of rote memorization.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-md mx-auto">
        <button
          onClick={() => onNavigate?.('practice')}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-accent hover:bg-accent/90 text-white font-sans font-semibold text-sm sm:text-base shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Start Learning</span>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>

        <button
          onClick={() => onNavigate?.('constellation')}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-surface-raised hover:bg-surface-strong border border-border-subtle hover:border-border-hover text-text-primary font-sans font-medium text-sm sm:text-base backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Explore</span>
          <svg
            className="w-4 h-4 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </div>

      {/* Pattern Nodes Quick Tags */}
      <div className="mt-14 pt-8 border-t border-border-subtle/50 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-text-tertiary font-sans">
        <span className="text-text-muted mr-1 font-medium">Core Mental Models:</span>
        {['Two Pointers', 'Sliding Window', 'Interval Trees', 'Monotonic Stack', 'Dynamic Programming'].map((pattern) => (
          <span
            key={pattern}
            className="px-2.5 py-1 rounded-md bg-surface-raised/40 border border-border-subtle/40 text-text-secondary"
          >
            {pattern}
          </span>
        ))}
      </div>
    </div>
  )
}
