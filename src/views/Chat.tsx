import { useState } from 'react'
import WebLLMChat from '../components/WebLLMChat'
import { ProblemSelector } from '../components/ProblemSelector'
import { PROBLEMS } from '../data/problems'
import type { Problem } from '../data/problems'
import { usePracticeProgress } from '../hooks/usePracticeProgress'
import { loadActiveSession } from '../lib/chatHistory'
import LearningLab from '../components/LearningLab'
import { emptyLearningRecord, learningContext, readLearningRecord, recordActivity, type ActivityId } from '../lib/learningActivities'

export default function Chat() {
  const [learningRecord, setLearningRecord] = useState(() => {
    try { return readLearningRecord(localStorage.getItem('patternos-learning-v1')) } catch { return emptyLearningRecord() }
  })
  const [storageWarning, setStorageWarning] = useState('')
  const [panel, setPanel] = useState<'conversation' | 'workshop'>('conversation')
  const saveLearning = (next: typeof learningRecord) => {
    setLearningRecord(next)
    try { localStorage.setItem('patternos-learning-v1', JSON.stringify(next)); setStorageWarning('') }
    catch { setStorageWarning('Progress is available for this visit, but your browser could not save it.') }
  }
  const completeActivity = (id: ActivityId, mistakes: number) => saveLearning(recordActivity(learningRecord, id, mistakes))
  const viewExplanation = (id: string) => {
    if (!learningRecord.viewed.includes(id)) saveLearning({ ...learningRecord, viewed: [...learningRecord.viewed, id] })
  }
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

  // Initialize from active chat problem if present, otherwise fall back to persisted progress, then default to first problem
  const [activeProblem, setActiveProblem] = useState<Problem>(() => {
    const activeChat = loadActiveSession()
    const targetId = activeChat?.problemId ?? progress.currentProblemId
    return PROBLEMS.find((p) => p.id === targetId) ?? PROBLEMS[0]
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
          <h2 className="text-2xl font-medium">Practice</h2>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              status.includes('ready') ? 'bg-success' : status.includes('failed') ? 'bg-danger' : 'bg-warning animate-pulse'
            }`}
          />
          <span className="text-text-muted" title={status}>{status.includes('ready') ? 'AI ready' : /loading|download|connecting|starting/i.test(status) ? 'Loading AI' : 'Basic hints'}</span>
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

      <div role="tablist" aria-label="Practice workspace" className="mb-4 flex gap-5 border-b border-border-subtle">
        {(['conversation', 'workshop'] as const).map(item => <button key={item} id={`tab-${item}`} role="tab" tabIndex={panel === item ? 0 : -1} aria-selected={panel === item} aria-controls={`panel-${item}`} onClick={() => setPanel(item)} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const next = event.key === 'Home' ? 'conversation' : event.key === 'End' ? 'workshop' : panel === 'conversation' ? 'workshop' : 'conversation'
          setPanel(next)
          document.getElementById(`tab-${next}`)?.focus()
        }} className={`workspace-tab border-b-2 px-1 py-3 text-sm transition-colors ${panel === item ? 'border-accent text-text-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}>{item === 'conversation' ? 'Conversation' : 'Workshop'}</button>)}
      </div>
      <div id="panel-workshop" role="tabpanel" aria-labelledby="tab-workshop" hidden={panel !== 'workshop'}>
        <LearningLab key={activeProblem.id} record={learningRecord} onComplete={completeActivity} onViewed={viewExplanation} duplicateProblem={activeProblem.slug === 'contains-duplicate'} />
      </div>
      {storageWarning && <p role="status" className="mb-3 text-xs text-warning">{storageWarning}</p>}
      {/* Chat Interface — naturally sizes to the conversation content without
          artificial empty space below the input, while growing as conversation deepens.
          No backdrop-filter. bg-surface/75 is plain alpha compositing. */}
      <div id="panel-conversation" role="tabpanel" aria-labelledby="tab-conversation" hidden={panel !== 'conversation'} className="workspace-panel p-4 sm:p-5">
        <WebLLMChat
          onStatusChange={setStatus}
          problem={activeProblem}
          userSelectionToken={userSelectionToken}
          onSolved={handleSolved}
          onHistorySyncProblem={handleHistorySyncProblem}
          learningContext={activeProblem.slug === 'contains-duplicate' ? learningContext(learningRecord) : ''}
        />
      </div>
    </div>
  )
}
