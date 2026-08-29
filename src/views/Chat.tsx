import { useState } from 'react'
import WebLLMChat from '../components/WebLLMChat'
import { ProblemSelector } from '../components/ProblemSelector'
import { PROBLEMS } from '../data/problems'
import type { Problem } from '../data/problems'
import { usePracticeProgress } from '../hooks/usePracticeProgress'

export default function Chat() {
  const [status, setStatus] = useState('Initializing...')
  const {
    progress,
    totalSolved,
    solvedIds,
    attemptedIds,
    setCurrentProblem,
    recordAttempt,
    recordSolved,
  } = usePracticeProgress()

  // Initialize from persisted problem id, default to first problem
  const [activeProblem, setActiveProblem] = useState<Problem>(() => {
    return PROBLEMS.find((p) => p.id === progress.currentProblemId) ?? PROBLEMS[0]
  })

  const handleSelectProblem = (problem: Problem) => {
    setActiveProblem(problem)
    setCurrentProblem(problem.id)
    recordAttempt(problem.id)
  }

  const handleSolved = (problemId: number) => {
    recordSolved(problemId)
  }

  return (
    // Use flex-col + overflow-y-auto so the header and selector are always
    // visible and the chamber fills only the remaining space — no fixed
    // h-calc that causes overflow on varying viewport sizes.
    <div className="animate-fade-in flex flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-medium">Socratic Chamber</h2>
          <p className="text-sm text-text-tertiary mt-1">
            AI-powered interview coaching. Your code never leaves your browser.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              status.includes('ready') ? 'bg-success' : status.includes('failed') ? 'bg-danger' : 'bg-warning animate-pulse'
            }`}
          />
          <span className="text-text-muted">{status}</span>
        </div>
      </div>

      {/* Problem Selector — above the chamber, outside the scroll area.
          No backdrop-filter. Solid bg-surface-raised surface. */}
      <ProblemSelector
        activeProblem={activeProblem}
        onSelect={handleSelectProblem}
        totalSolved={totalSolved}
        solvedIds={solvedIds}
        attemptedIds={attemptedIds}
      />

      {/* Chat Interface — height is managed inside WebLLMChat via
          max-h so it fills available space without leaving dead air.
          No backdrop-filter. bg-surface/75 is plain alpha compositing. */}
      <div className="rounded-xl border border-border-subtle bg-surface/75 shadow-xl shadow-black/40 p-5">
        <WebLLMChat
          onStatusChange={setStatus}
          problem={activeProblem}
          onSolved={handleSolved}
        />
      </div>
    </div>
  )
}