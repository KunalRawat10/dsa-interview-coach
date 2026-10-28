export type ActivityId = 'repeat' | 'distinct' | 'transfer'
export interface Activity { id: ActivityId; title: string; values: readonly (number | string)[]; prompt: string }
export const ACTIVITIES: Activity[] = [
  { id: 'repeat', title: 'Find a repeated number', values: [1, 2, 1], prompt: 'Check whether each value is in the seen box BEFORE adding it.' },
  { id: 'distinct', title: 'Check the no-repeat case', values: [4, 7, 9], prompt: 'If every value is new, keep going until you reach the end.' },
  { id: 'transfer', title: 'Apply it to usernames', values: ['maya', 'arun', 'maya'], prompt: 'A registration list must flag repeated usernames. Can the same idea work here?' },
]
export interface ActivityState { index: number; seen: (number | string)[]; complete: boolean; mistakes: number; feedback: string }
export const freshActivity = (): ActivityState => ({ index: 0, seen: [], complete: false, mistakes: 0, feedback: '' })
export function answerActivity(activity: Activity, state: ActivityState, answer: boolean): ActivityState {
  if (state.complete) return state
  const value = activity.values[state.index]
  const repeated = state.seen.includes(value)
  if (answer !== repeated) return { ...state, mistakes: state.mistakes + 1, feedback: repeated ? `${value} is already in the seen box. Check the box before adding.` : `${value} is not in the seen box yet. A value is not its own earlier occurrence.` }
  if (repeated) return { ...state, complete: true, feedback: `${value} was seen earlier. A repeat exists, so the answer is true.` }
  const seen = [...state.seen, value]
  const index = state.index + 1
  return { ...state, index, seen, complete: index === activity.values.length, feedback: index === activity.values.length ? 'Every value was checked and none repeated. The answer is false.' : `${value} was new, so we added it. Now check the next value.` }
}
export interface ActivityEvidence { id: ActivityId; completedAt: string; mistakes: number }
export interface LearningRecord { version: 1; activities: ActivityEvidence[]; viewed: string[] }
export const emptyLearningRecord = (): LearningRecord => ({ version: 1, activities: [], viewed: [] })
export function readLearningRecord(raw: string | null): LearningRecord {
  try {
    const value = JSON.parse(raw ?? 'null')
    if (value?.version !== 1 || !Array.isArray(value.activities) || !Array.isArray(value.viewed)) return emptyLearningRecord()
    return { version: 1, activities: value.activities.filter((x: ActivityEvidence) => x && ACTIVITIES.some(a => a.id === x.id) && typeof x.completedAt === 'string' && Number.isInteger(x.mistakes) && x.mistakes >= 0), viewed: value.viewed.filter((x: unknown) => typeof x === 'string') }
  } catch { return emptyLearningRecord() }
}
export function recordActivity(record: LearningRecord, id: ActivityId, mistakes: number): LearningRecord {
  const old = record.activities.find(item => item.id === id)
  if (old && old.mistakes <= mistakes) return record
  return { ...record, activities: [...record.activities.filter(item => item.id !== id), { id, mistakes, completedAt: new Date().toISOString() }] }
}
export const PREREQUISITES = [
  { id: 'array', title: 'Array', text: 'An array is an ordered list. In [4, 7, 4], there are three positions. Equal values can occupy different positions.' },
  { id: 'loop', title: 'Loop', text: 'A loop repeats an action for each item. For [4, 7, 9], inspect 4, then 7, then 9. The loop does not decide what action to take; your plan does.' },
  { id: 'set', title: 'Set and membership', text: 'A Set stores distinct values. Membership means asking whether a value is already there. With {1, 2}, 1 is present and 3 is absent. For duplicate detection, check first, then add only a new value.' },
  { id: 'boolean', title: 'True and false', text: 'A boolean has two possible values: true or false. Contains Duplicate asks whether any repeat exists, rather than asking you to return the repeated number.' },
]
export function learningContext(record: LearningRecord): string {
  return `App exercise evidence for Contains Duplicate only: ${record.activities.map(x => `${x.id}: completed with ${x.mistakes} corrected mistakes`).join('; ') || 'none yet'}. Viewed explanations (not proof of understanding): ${record.viewed.join(', ') || 'none'}. An exercise completed after feedback is guided practice, not proof of independent mastery. Do not quiz a completed exercise again unless asked. Coding has not been assessed by these exercises.`
}
