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

  // Explicit token that only increments when user clicks ProblemSelector
  const [userSelectionToken, setUserSelectionToken] = useState<number>(0)

  // Triggered ONLY when the user clicks ProblemSelector to switch problems
  const handleUserSelectProblem = (problem: Problem) => {
    setActiveProblem(problem)
    setCurrentProblem(problem.id)
    recordAttempt(problem.id)
    setUserSelectionToken((t) => t + 1)
  }

  // Triggered ONLY when a historical conversation is loaded to sync ProblemSelector display
  const handleHistorySyncProblem = (problem: Problem) => {
    setActiveProblem(problem)
    setCurrentProblem(problem.id)
  }

  const handleSolved = (problemId: number) => {
    recordSolved(problemId)
  }

  return (
    <div className="animate-fade-in flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
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
        onSelect={handleUserSelectProblem}
        totalSolved={totalSolved}
        solvedIds={solvedIds}
        attemptedIds={attemptedIds}
      />

      {/* Chat Interface — min-h-[420px] gives the chamber workspace presence
          on large screens without reintroducing the flex-fill dead-air problem.
          The card grows naturally as conversation deepens.
          No backdrop-filter. bg-surface/75 is plain alpha compositing. */}
      <div className="rounded-xl border border-border-subtle bg-surface/75 shadow-xl shadow-black/40 p-5 min-h-[420px]">
        <WebLLMChat
          onStatusChange={setStatus}
          problem={activeProblem}
          userSelectionToken={userSelectionToken}
          onSolved={handleSolved}
          onHistorySyncProblem={handleHistorySyncProblem}
        />
      </div>
    </div>
  )
}