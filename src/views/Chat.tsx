import { useCallback, useRef, useState } from 'react'
import WebLLMChat from '../components/WebLLMChat'
import { ProblemSelector } from '../components/ProblemSelector'
import { PROBLEMS } from '../data/problems'
import type { Problem } from '../data/problems'
import { usePracticeProgress } from '../hooks/usePracticeProgress'
import { loadActiveSession } from '../lib/chatHistory'
import LearningLab from '../components/LearningLab'
import DuplicateWorkshop, { type WorkshopHelpHandle } from '../components/DuplicateWorkshop'
import PatternJourney from '../components/PatternJourney'
import RequirementLab from '../components/RequirementLab'
import MinimumWindowWorkshop from '../components/MinimumWindowWorkshop'
import { emptyLearningRecord, learningContext, readLearningRecord, recordActivity, type ActivityId } from '../lib/learningActivities'

export default function Chat() {
  const [learningRecord, setLearningRecord] = useState(() => {
    try { return readLearningRecord(localStorage.getItem('patternos-learning-v1')) } catch { return emptyLearningRecord() }
  })
  const [storageWarning, setStorageWarning] = useState('')
  const [panel, setPanel] = useState<'conversation' | 'workshop'>('workshop')
  const [tutorOpen, setTutorOpen] = useState(false)
  const [workshopContext, setWorkshopContext] = useState('')
  const workshopRef = useRef<WorkshopHelpHandle>(null)
  const openWorkshopTutor = useCallback(() => { workshopRef.current?.markTutorUsed(); setTutorOpen(true) }, [])
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
    setWorkshopContext('')
    setTutorOpen(false)
    setPanel(['contains-duplicate','container-with-most-water','longest-substring-no-repeat','minimum-window-substring'].includes(problem.slug) ? 'workshop' : 'conversation')
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
          <p className="practice-intro">A place to work things out. Pick a journey, then take it one step at a time.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              panel === 'workshop' || status.includes('ready') ? 'bg-success' : status.includes('failed') ? 'bg-danger' : 'bg-warning animate-pulse'
            }`}
          />
          <span className="text-text-muted" title={status}>{panel === 'workshop' ? 'Workshop · no model required' : status.includes('ready') ? 'AI ready' : /loading|download|connecting|starting/i.test(status) ? 'Loading AI' : 'Basic hints'}</span>
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
        hidePattern={panel === 'workshop'}
      />

      <div role="tablist" aria-label="Practice workspace" className="mb-4 flex gap-5 border-b border-border-subtle">
        {(['workshop', 'conversation'] as const).map(item => <button key={item} id={`tab-${item}`} role="tab" tabIndex={panel === item ? 0 : -1} aria-selected={panel === item} aria-controls={`panel-${item}`} onClick={() => { if (item === 'conversation') workshopRef.current?.markTutorUsed(); setPanel(item) }} onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
          event.preventDefault()
          const next = event.key === 'Home' ? 'workshop' : event.key === 'End' ? 'conversation' : panel === 'conversation' ? 'workshop' : 'conversation'
          if (next === 'conversation') workshopRef.current?.markTutorUsed()
          setPanel(next)
          document.getElementById(`tab-${next}`)?.focus()
        }} className={`workspace-tab border-b-2 px-1 py-3 text-sm transition-colors ${panel === item ? 'border-accent text-text-primary' : 'border-transparent text-text-tertiary hover:text-text-primary'}`}>{item === 'conversation' ? 'Tutor' : 'Workshop'}</button>)}
      </div>
      <div className={`practice-workspace ${panel === 'workshop' ? `is-workshop${tutorOpen ? ' has-tutor' : ''}` : ''}`}>
      <div id="panel-workshop" role="tabpanel" aria-labelledby="tab-workshop" hidden={panel !== 'workshop'}>
        <div className="journey-picker" aria-label="Hands-on learning journeys"><span>Hands-on journeys</span>{['contains-duplicate','container-with-most-water','longest-substring-no-repeat','minimum-window-substring'].map((slug,i)=><button key={slug} aria-pressed={activeProblem.slug===slug} onClick={()=>handleUserSelectProblem(PROBLEMS.find(p=>p.slug===slug)!)}>{['Contains Duplicate','Two Pointers','Sliding Window','Minimum Window · Hard'][i]}</button>)}</div>
        {activeProblem.slug === 'contains-duplicate'
          ? <><DuplicateWorkshop ref={workshopRef} tutorOpen={tutorOpen || panel === 'conversation'} onAskTutor={openWorkshopTutor} onContextChange={setWorkshopContext} /><RequirementLab /></>
          : activeProblem.slug==='minimum-window-substring'
          ? <MinimumWindowWorkshop ref={workshopRef} tutorOpen={tutorOpen||panel==='conversation'} onAskTutor={openWorkshopTutor} onContextChange={setWorkshopContext}/>
          : ['container-with-most-water','longest-substring-no-repeat'].includes(activeProblem.slug)
          ? <PatternJourney key={activeProblem.slug} kind={activeProblem.slug==='container-with-most-water'?'pointers':'window'} ref={workshopRef} tutorOpen={tutorOpen || panel==='conversation'} onAskTutor={openWorkshopTutor} onContextChange={setWorkshopContext}/>
          : <LearningLab key={activeProblem.id} record={learningRecord} onComplete={completeActivity} onViewed={viewExplanation} duplicateProblem={false} />}
      </div>
      {panel === 'workshop' && !tutorOpen && <aside className="workshop-help-card" aria-label="Optional tutor"><p className="lab-eyebrow">YOUR FIELD NOTES</p><h3>Make the idea your own.</h3><ol className="workshop-method"><li><span>01</span> Predict before you run.</li><li><span>02</span> Notice what changed.</li><li><span>03</span> Try a fresh example.</li></ol><div className="workshop-help-divider"><p>Need another way to see it? Ask about the step you are working on.</p><button onClick={openWorkshopTutor}>Ask about this step ↗</button></div><details><summary>About hints & progress</summary><p>Core exercises work without loading AI. AI guidance receives your exercise context; basic Lite hints are general. Independent checks record when help was opened.</p></details></aside>}
      {/* Chat Interface — naturally sizes to the conversation content without
          artificial empty space below the input, while growing as conversation deepens.
          No backdrop-filter. bg-surface/75 is plain alpha compositing. */}
      <div id="panel-conversation" role={panel === 'conversation' ? 'tabpanel' : 'region'} aria-labelledby={panel === 'conversation' ? 'tab-conversation' : 'workshop-tutor-label'} hidden={panel !== 'conversation' && !tutorOpen} className="workspace-panel workshop-tutor p-4 sm:p-5">
        <div className="workshop-tutor-heading"><strong id="workshop-tutor-label">Your tutor</strong><button onClick={() => { setPanel('workshop'); setTutorOpen(false) }}>{panel === 'workshop' ? 'Close tutor' : 'Back to workshop'}</button></div>
        <WebLLMChat
          onStatusChange={setStatus}
          problem={activeProblem}
          userSelectionToken={userSelectionToken}
          onSolved={handleSolved}
          onHistorySyncProblem={handleHistorySyncProblem}
          learningContext={`${workshopContext}\n${activeProblem.slug === 'contains-duplicate' ? learningContext(learningRecord) : ''}`}
        />
      </div>
      </div>
      {storageWarning && <p role="status" className="mb-3 text-xs text-warning">{storageWarning}</p>}
    </div>
  )
}
