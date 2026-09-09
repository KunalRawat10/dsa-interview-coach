import { memo, useState, useMemo } from 'react'
import type { Problem, ProblemCategory, ProblemDifficulty } from '../data/problems'
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

const DIFFICULTIES: ProblemDifficulty[] = ['Easy', 'Medium', 'Hard']

export const ProblemSelector = memo(function ProblemSelector({
  activeProblem,
  onSelect,
  totalSolved,
  solvedIds,
  attemptedIds,
}: ProblemSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ProblemCategory | 'All'>('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState<ProblemDifficulty | 'All'>('All')

  const currentIndex = PROBLEMS.findIndex((p) => p.id === activeProblem.id)
  const prevProblem = currentIndex > 0 ? PROBLEMS[currentIndex - 1] : null
  const nextProblem = currentIndex < PROBLEMS.length - 1 ? PROBLEMS[currentIndex + 1] : null

  const filteredProblems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return PROBLEMS.filter((problem) => {
      // 1. Category filter
      if (selectedCategory !== 'All' && problem.category !== selectedCategory) {
        return false
      }
      // 2. Difficulty filter
      if (selectedDifficulty !== 'All' && problem.difficulty !== selectedDifficulty) {
        return false
      }
      // 3. Search query filter (matches title, pattern, patternTag, difficulty, category)
      if (query) {
        const matchTitle = problem.title.toLowerCase().includes(query)
        const matchPattern = problem.pattern.toLowerCase().includes(query)
        const matchTag = problem.patternTag.toLowerCase().includes(query)
        const matchDiff = problem.difficulty.toLowerCase().includes(query)
        const matchCat = problem.category.toLowerCase().includes(query)
        if (!matchTitle && !matchPattern && !matchTag && !matchDiff && !matchCat) {
          return false
        }
      }
      return true
    })
  }, [searchQuery, selectedCategory, selectedDifficulty])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All')
    setSelectedDifficulty('All')
  }

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'All' || selectedDifficulty !== 'All'

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
          className="shrink-0 text-text-muted hover:text-accent disabled:opacity-25 disabled:cursor-not-allowed transition-colors p-3 rounded-lg cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Toggle button — occupies the middle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
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
            className="text-text-muted hover:text-accent transition-colors p-1 cursor-pointer"
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
          className="shrink-0 text-text-muted hover:text-accent disabled:opacity-25 disabled:cursor-not-allowed transition-colors p-3 rounded-lg cursor-pointer"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Expandable problem list with search & filters */}
      {open && (
        <div className="border-t border-border-subtle p-2.5">
          {/* Search Input Bar */}
          <div className="relative mb-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search problems by name, pattern, or tag…"
              aria-label="Search problems"
              className="w-full bg-surface border border-border-subtle rounded-lg px-3 py-1.5 pl-8 pr-7 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition-colors"
            />
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            >
              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7.5 7.5L10.5 10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs p-0.5 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Chips: Category & Difficulty */}
          <div className="flex items-center gap-1 mb-2.5 overflow-x-auto pb-1 text-[10px]">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-2 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-accent text-white font-medium shadow-sm'
                  : 'bg-surface text-text-secondary hover:text-text-primary border border-border-subtle'
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat === selectedCategory ? 'All' : cat)}
                className={`px-2 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-accent text-white font-medium shadow-sm'
                    : 'bg-surface text-text-secondary hover:text-text-primary border border-border-subtle'
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="text-border-subtle px-0.5 select-none">|</span>
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff === selectedDifficulty ? 'All' : diff)}
                className={`px-2 py-0.5 rounded-full shrink-0 transition-colors cursor-pointer ${
                  selectedDifficulty === diff
                    ? 'bg-accent text-white font-medium shadow-sm'
                    : 'bg-surface text-text-secondary hover:text-text-primary border border-border-subtle'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Problem list or empty state */}
          <div className="max-h-60 overflow-y-auto pr-1">
            {filteredProblems.length === 0 ? (
              <div className="py-6 text-center text-xs text-text-muted">
                <p>
                  No problems matching {searchQuery ? `"${searchQuery}"` : 'selected filters'}.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-2 text-accent hover:underline text-[11px] font-medium cursor-pointer"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              CATEGORIES.map((cat) => {
                const catProblems = filteredProblems.filter((p) => p.category === cat)
                if (catProblems.length === 0) return null

                return (
                  <div key={cat} className="mt-1.5 first:mt-0">
                    <div className="px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-text-muted flex justify-between">
                      <span>{cat}</span>
                      <span>{catProblems.length}</span>
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
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-accent/10 text-text-primary'
                              : 'hover:bg-surface/60 text-text-secondary'
                          }`}
                        >
                          <span className="font-mono text-[10px] text-text-muted w-5 shrink-0 text-right">
                            {String(problem.id).padStart(2, '0')}
                          </span>
                          <span className="text-xs flex-1 truncate">{problem.title}</span>
                          <span className="font-mono text-[9px] text-text-muted hidden md:inline truncate max-w-[130px]">
                            {problem.pattern}
                          </span>
                          <span
                            className={`font-mono text-[10px] shrink-0 ${
                              DIFF_COLOR[problem.difficulty] ?? 'text-text-muted'
                            }`}
                          >
                            {problem.difficulty[0]}
                          </span>
                          {isSolved && (
                            <span className="text-success text-[10px] shrink-0 w-3 text-center">✓</span>
                          )}
                          {isAttempted && (
                            <span className="text-text-muted text-[10px] shrink-0 w-3 text-center">·</span>
                          )}
                          {!isSolved && !isAttempted && (
                            <span className="w-3 shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
})
