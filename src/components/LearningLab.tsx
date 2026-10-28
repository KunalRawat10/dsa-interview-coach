import { useState } from 'react'
import { ACTIVITIES, PREREQUISITES, answerActivity, freshActivity, type ActivityId, type LearningRecord } from '../lib/learningActivities'

interface Props { record: LearningRecord; onComplete: (id: ActivityId, mistakes: number) => void; onViewed: (id: string) => void; duplicateProblem: boolean }
export default function LearningLab({ record, onComplete, onViewed, duplicateProblem }: Props) {
  const [selected, setSelected] = useState<ActivityId>('repeat')
  const [state, setState] = useState(freshActivity)
  const activity = ACTIVITIES.find(item => item.id === selected)!
  const choose = (id: ActivityId) => { setSelected(id); setState(freshActivity()) }
  const answer = (repeated: boolean) => {
    const next = answerActivity(activity, state, repeated)
    setState(next)
    if (next.complete) onComplete(selected, next.mistakes)
  }
  const button = 'rounded-lg border border-border-subtle px-3 py-2 text-sm hover:bg-accent/15 focus-visible:outline-2 focus-visible:outline-accent'
  return <section aria-label="Learning workshop" className="workspace-panel mb-4 p-4 sm:p-6">
    <h3 className="font-medium">Learn by doing · no code needed</h3>
    <p className="text-xs text-text-tertiary mt-1">Explore the idea with a simple exercise.</p>
    <details className="mt-3">
      <summary className="cursor-pointer text-sm text-accent">Need a quick explanation?</summary>
      <div className="grid gap-2 sm:grid-cols-2 mt-3">{PREREQUISITES.map(item => <details key={item.id} onToggle={event => { if (event.currentTarget.open) onViewed(item.id) }} className="rounded-lg border border-border-subtle p-3">
        <summary className="cursor-pointer text-sm">{item.title}</summary><p className="text-sm text-text-secondary mt-2">{item.text}</p>
      </details>)}</div>
    </details>
    {duplicateProblem ? <>
      <div className="mt-4"><label htmlFor="workshop-exercise" className="mr-3 text-xs text-text-tertiary">Exercise</label><select id="workshop-exercise" value={selected} onChange={event => choose(event.target.value as ActivityId)} className="max-w-full rounded-lg border border-border-subtle bg-surface-raised p-2 text-sm">{ACTIVITIES.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
      <h4 className="mt-4 text-sm font-medium">{activity.title}</h4>
      <p className="text-sm text-text-secondary mt-1">{activity.prompt}</p>
      <div aria-label="Input values" className="flex gap-2 my-3">{activity.values.map((value, index) => <span key={index} className={`rounded-lg border p-3 ${!state.complete && index === state.index ? 'border-accent text-accent' : 'border-border-subtle'}`}>{value}</span>)}</div>
      <div className="seen-box rounded-lg p-3 text-sm"><strong>Already seen:</strong> {state.seen.length ? state.seen.join(', ') : '(empty)'}</div>
      {!state.complete && <div className="mt-3"><p className="text-sm mb-2">Is “{activity.values[state.index]}” already in the seen box?</p><div className="flex gap-2"><button className={button} onClick={() => answer(true)}>Yes, already seen</button><button className={button} onClick={() => answer(false)}>No, new value</button></div></div>}
      <p role="status" className="text-sm text-accent mt-3 min-h-5">{state.feedback}</p>
      {state.complete && <div className="flex flex-wrap gap-2 mt-2"><button className={button} onClick={() => choose(ACTIVITIES[(ACTIVITIES.findIndex(x => x.id === selected) + 1) % ACTIVITIES.length].id)}>Try the next exercise</button><button className={button} onClick={() => setState(freshActivity())}>Try this again</button></div>}
      {ACTIVITIES.every(item => record.activities.some(evidence => evidence.id === item.id)) && <p role="status" className="text-sm text-success mt-3">Concept workshop complete. You can finish here; coding is optional.</p>}
      <details className="mt-4"><summary className="text-sm cursor-pointer">Your learning record · {record.activities.length} / {ACTIVITIES.length}</summary>
        <ul className="text-xs text-text-secondary space-y-2 mt-2">{ACTIVITIES.map(item => { const evidence = record.activities.find(x => x.id === item.id); return <li key={item.id}>{item.title}: {evidence ? evidence.mistakes ? `completed with feedback (${evidence.mistakes} ${evidence.mistakes === 1 ? 'correction' : 'corrections'})` : 'completed without corrections' : 'not demonstrated yet'}</li> })}<li>Coding: not assessed here.</li><li>Opening an explanation does not mark a concept as understood.</li></ul>
      </details>
    </> : <p className="mt-3 text-xs text-text-tertiary">The interactive workshop currently covers Contains Duplicate and its username transfer exercise. Quick explanations are available for every problem.</p>}
  </section>
}
