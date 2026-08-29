import { memo, useState } from 'react'
import type { Problem } from '../data/problems'
import { PROBLEMS, CATEGORIES } from '../data/problems'

interface ProblemSelectorProps {
  activeProblem: Problem
  onSelect: (problem: Problem) => void
  totalSolved: number
  solvedIds: Set<number>
  attemptedIds: Set<number>
}

const DIFF_COLOR: Record<string, string> = {
  Easy: 'text-success',
  Medium: 'text-warning',
  Hard: 'text-danger',
}

export const ProblemSelector = memo(function ProblemSelector({
  activeProblem,
  onSelect,
  totalSolved,
  solvedIds,
  attemptedIds,
}: ProblemSelectorProps) {
  const [open, setOpen] = useState(false)

  const currentIndex = PROBLEMS.findIndex((p) => p.id === activeProblem.id)
  const prevProblem = currentIndex > 0 ? PROBLEMS[currentIndex - 1] : null
  const nextProblem = currentIndex < PROBLEMS.length - 1 ? PROBLEMS[currentIndex + 1] : null

  return (
    <div className="mb-4 rounded-xl border border-border-hover bg-surface-raised">
      {/* Always-visible header row */}
      <div className="flex items-center px-3 py-3 gap-2">
        {/* Prev arrow */}
        <button
          onClick={() => prevProblem && onSelect(prevProblem)}
          disabled={!prevProblem}
          aria-label="Previous problem"
          title="Previous problem"
          className="shrink-0 text-text-muted hover:text-accent disabled:opacity-25 disabled:cursor-not-allowed transition-colors p-3 rounded-lg"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Toggle button — occupies the middle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-2.5 min-w-0 text-left"
        >
          <span className="font-mono text-[10px] text-text-muted shrink-0 w-5">
            {String(activeProblem.id).padStart(2, '0')}
          </span>
          <span className="text-sm font-medium text-text-primary truncate">
            {activeProblem.title}
          </span>
          <span className={`font-mono text-[10px] shrink-0 ${DIFF_COLOR[activeProblem.difficulty] ?? 'text-text-muted'}`}>
            {activeProblem.difficulty}
          </span>
          {/* Category pill — visible on wider screens */}
          <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wide text-text-muted border border-border-subtle rounded px-1.5 py-0.5 shrink-0">
            {activeProblem.category}
          </span>
          <span className="font-mono text-[10px] text-text-muted shrink-0 hidden lg:block">
            {activeProblem.pattern}
          </span>
        </button>

        {/* Progress + chevron */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="font-mono text-[10px] text-text-muted hidden sm:block">
            {totalSolved}&thinsp;/&thinsp;{PROBLEMS.length}&ensp;solved
          </span>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle problem list"
            className="text-text-muted hover:text-accent transition-colors p-1"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={`transition-transform ${open ? 'rotate-180' : ''}`}
            >
              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Next arrow */}
        <button
          onClick={() => nextProblem && onSelect(nextProblem)}
          disabled={!nextProblem}
          aria-label="Next problem"
          title="Next problem"
          className="shrink-0 text-text-muted hover:text-accent disabled:opacity-25 disabled:cursor-not-allowed transition-colors p-3 rounded-lg"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Expandable problem list — grouped by category */}
      {open && (
        <div className="border-t border-border-subtle px-2 pb-2 max-h-64 overflow-y-auto">
          {CATEGORIES.map((cat) => {
            const catProblems = PROBLEMS.filter((p) => p.category === cat)
            return (
              <div key={cat} className="mt-2">
                <div className="px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-text-muted">
                  {cat}
                </div>
                {catProblems.map((problem) => {
                  const isActive = problem.id === activeProblem.id
                  const isSolved = solvedIds.has(problem.id)
                  const isAttempted = !isSolved && attemptedIds.has(problem.id)
                  return (
                    <button
                      key={problem.id}
                      onClick={() => {
                        onSelect(problem)
                        setOpen(false)
                      }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
                        isActive
                          ? 'bg-accent/10 text-text-primary'
                          : 'hover:bg-surface/60 text-text-secondary'
                      }`}
                    >
                      <span className="font-mono text-[10px] text-text-muted w-5 shrink-0 text-right">
                        {String(problem.id).padStart(2, '0')}
                      </span>
                      <span className="text-xs flex-1 truncate">{problem.title}</span>
                      <span
                        className={`font-mono text-[10px] shrink-0 ${
                          DIFF_COLOR[problem.difficulty] ?? 'text-text-muted'
                        }`}
                      >
                        {problem.difficulty[0]}
                      </span>
                      {isSolved && (
                        <span className="text-success text-[10px] shrink-0 w-3">✓</span>
                      )}
                      {isAttempted && (
                        <span className="text-text-muted text-[10px] shrink-0 w-3">·</span>
                      )}
                      {!isSolved && !isAttempted && (
                        <span className="w-3 shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})
