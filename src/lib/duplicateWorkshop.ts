export type Value = number | string
export const STAGES = ['trace', 'compare', 'order', 'build', 'challenge'] as const
export type WorkshopStage = typeof STAGES[number]
export const STAGE_NAMES: Record<WorkshopStage, string> = {
  trace: 'Check each number', compare: 'Compare two methods', order: 'Find the mistake', build: 'Put the steps in order', challenge: 'Try it yourself',
}
export const PRACTICE_CASES: { name: string; values: Value[] }[] = [
  { name: 'A repeated value', values: [4, 7, 4] },
  { name: 'Every value is different', values: [4, 7, 9] },
  { name: 'Zero and negative values', values: [-2, 0, -2] },
  { name: 'A single value', values: [7] },
]
export interface TraceState { index: number; seen: Value[]; phase: 'predict' | 'add' | 'complete'; result: boolean | null; mistakes: number; feedback: string }
export const freshTrace = (): TraceState => ({ index: 0, seen: [], phase: 'predict', result: null, mistakes: 0, feedback: 'Start with the highlighted number. Nothing has been saved yet.' })
export function predictMembership(values: Value[], state: TraceState, prediction: boolean): TraceState {
  if (state.phase !== 'predict' || state.index >= values.length) return state
  const value = values[state.index], present = state.seen.includes(value)
  if (present !== prediction) return { ...state, mistakes: state.mistakes + 1, feedback: present ? `${value} is already in the seen list. It matches a number we saved earlier.` : `${value} is not in the seen list. It has not appeared before. Look at the saved numbers and try again.` }
  return present
    ? { ...state, phase: 'complete', result: true, feedback: `${value} matches a number we saved earlier. We found a repeat (true), so we can stop.` }
    : { ...state, phase: 'add', feedback: `${value} is new. Save it, then look at the next number.` }
}
export function recordCurrent(values: Value[], state: TraceState): TraceState {
  if (state.phase !== 'add' || state.index >= values.length) return state
  const seen = [...state.seen, values[state.index]], index = state.index + 1
  return index === values.length
    ? { ...state, index, seen, phase: 'complete', result: false, feedback: 'Every position was checked without finding a repeat. Return false.' }
    : { ...state, index, seen, phase: 'predict', feedback: 'That number is saved. Now check whether the next number is already there.' }
}
export function hasDuplicate(values: readonly Value[]): boolean {
  for (let i = 0; i < values.length; i++) for (let j = 0; j < i; j++) if (values[i] === values[j]) return true
  return false
}
export interface ApproachRun { result: boolean; visited: number; stored: number; listComparisons: number; setMembershipCalls: number }
export function compareApproaches(values: readonly Value[]): ApproachRun {
  const list: Value[] = [], seen = new Set<Value>()
  let listComparisons = 0, setMembershipCalls = 0
  for (const value of values) {
    let listFound = false
    for (const previous of list) { listComparisons++; if (previous === value) { listFound = true; break } }
    setMembershipCalls++
    const setFound = seen.has(value)
    if (listFound !== setFound) throw new Error('Approaches disagreed')
    if (setFound) return { result: true, visited: setMembershipCalls, stored: seen.size, listComparisons, setMembershipCalls }
    list.push(value); seen.add(value)
  }
  return { result: false, visited: values.length, stored: seen.size, listComparisons, setMembershipCalls }
}
export function comparisonInput(count: number, repeats: boolean): number[] {
  const length = Math.max(2, Math.min(1000, Math.floor(count)))
  const values = Array.from({ length }, (_, i) => i + 1)
  if (repeats) values[length - 1] = 1
  return values
}
export interface OrderFrame { index: number; value: Value; before: Value[]; after: Value[]; checkFound: boolean; actualEarlier: boolean; stopped: boolean }
export function orderExperiment(values: Value[], addFirst: boolean): OrderFrame[] {
  const seen = new Set<Value>(), frames: OrderFrame[] = []
  for (const [index, value] of values.entries()) {
    const before = [...seen], actualEarlier = seen.has(value)
    if (addFirst) seen.add(value)
    const checkFound = seen.has(value)
    if (!checkFound) seen.add(value)
    frames.push({ index, value, before, after: [...seen], checkFound, actualEarlier, stopped: checkFound })
    if (checkFound) break
  }
  return frames
}
export const BLOCKS = {
  init: { text: 'Start with an empty Set called seen', scope: 'setup' },
  loop: { text: 'Repeat these steps for each input number', scope: 'loop' },
  check: { text: 'If this number is already saved, answer true (a repeat)', scope: 'inside loop' },
  add: { text: 'Save this number in the Set', scope: 'inside loop' },
  finish: { text: 'After checking every number, answer false (no repeat)', scope: 'after loop' },
} as const
export type BlockId = keyof typeof BLOCKS
export const STARTING_BLOCKS: BlockId[] = ['init', 'loop', 'add', 'check', 'finish']
export interface ProgramRun { result: boolean | null; error?: string; visited: number }
// Interpret only these five known instructions; never evaluate arbitrary code.
export function executeBlocks(blocks: readonly BlockId[], values: readonly Value[]): ProgramRun {
  if (blocks.length !== 5 || new Set(blocks).size !== 5 || blocks.some(id => !(id in BLOCKS))) return { result: null, error: 'Use each instruction exactly once.', visited: 0 }
  if (blocks[0] !== 'init' || blocks[1] !== 'loop' || blocks[4] !== 'finish') return { result: null, error: 'Create the Set before the loop. Put the final false after the loop; keep the membership check and add inside it.', visited: 0 }
  const seen = new Set<Value>()
  for (const [index, value] of values.entries()) {
    for (const instruction of blocks.slice(2, 4)) {
      if (instruction === 'check' && seen.has(value)) return { result: true, visited: index + 1 }
      if (instruction === 'add') seen.add(value)
    }
  }
  return { result: false, visited: values.length }
}
export const PROGRAM_CASES: Value[][] = [[4, 7, 4], [4, 7, 9], [7], [-2, 0, -2], [0, 0], []]
export function checkProgram(blocks: readonly BlockId[]) {
  const cases = PROGRAM_CASES.map(values => {
    const run = executeBlocks(blocks, values), expected = hasDuplicate(values)
    return { values, ...run, expected, passed: !run.error && run.result === expected }
  })
  return { passed: cases.every(item => item.passed), cases }
}
export interface ChallengeAnswers { repeats: string; structure: string; order: string; time: string; space: string; reason: string }
export const emptyChallengeAnswers = (): ChallengeAnswers => ({ repeats: '', structure: '', order: '', time: '', space: '', reason: '' })
export function challengeCase(seed: number): Value[] {
  const n = 4 + Math.abs(seed % 3)
  let state = (Math.abs(seed) + 1) * 7919
  const values: Value[] = []
  while (values.length < n) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const candidate = (state % 101) - 50
    if (!values.includes(candidate)) values.push(candidate)
  }
  if (seed % 2 === 0) values[n - 1] = values[0]
  return seed % 3 === 2 ? values.map(value => `user_${value}`) : values
}
export function checkChallenge(values: Value[], answers: ChallengeAnswers) {
  const errors: string[] = []
  if (answers.repeats !== String(hasDuplicate(values))) errors.push('Recheck whether any value occurs in two different positions.')
  if (answers.structure !== 'set') errors.push('For the requested fast membership approach, choose a Set. A list or sorting can also solve the problem, with different costs.')
  if (answers.order !== 'check-first') errors.push('Check before adding, so the current occurrence cannot match itself.')
  if (answers.time !== 'linear') errors.push('With average constant-time Set operations, one pass gives expected O(n) total time.')
  if (answers.space !== 'linear') errors.push('Up to n distinct values can be stored, so worst-case extra space is O(n).')
  if (answers.reason !== 'earlier') errors.push('During a check, seen must contain only values from earlier positions.')
  return { passed: errors.length === 0, errors }
}
export interface StageEvidence { id: WorkshopStage; completedAt: string; mistakes: number; hintUsed: boolean; caseId?: number }
export interface WorkshopRecord { version: 1; stage: WorkshopStage; evidence: StageEvidence[]; challenge: { caseId: number; mistakes: number; hintUsed: boolean } }
export const newWorkshopRecord = (): WorkshopRecord => ({ version: 1, stage: 'trace', evidence: [], challenge: { caseId: 0, mistakes: 0, hintUsed: false } })
export function readWorkshopRecord(raw: string | null): WorkshopRecord {
  try {
    const data = JSON.parse(raw ?? 'null')
    if (data?.version !== 1) return newWorkshopRecord()
    const validCount = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0 && n < 1_000_000
    return { version: 1, stage: STAGES.includes(data.stage) ? data.stage : 'trace',
      evidence: Array.isArray(data.evidence) ? data.evidence.filter((item: StageEvidence) => item && STAGES.includes(item.id) && typeof item.completedAt === 'string' && validCount(item.mistakes) && typeof item.hintUsed === 'boolean' && (item.caseId === undefined || validCount(item.caseId))).filter((item: StageEvidence, index: number, all: StageEvidence[]) => all.findIndex(x => x.id === item.id) === index) : [],
      challenge: { caseId: validCount(data.challenge?.caseId) ? data.challenge.caseId : 0, mistakes: validCount(data.challenge?.mistakes) ? data.challenge.mistakes : 0, hintUsed: data.challenge?.hintUsed === true } }
  } catch { return newWorkshopRecord() }
}
export function saveStageEvidence(record: WorkshopRecord, id: WorkshopStage, mistakes: number, hintUsed = false): WorkshopRecord {
  const evidence: StageEvidence = { id, completedAt: new Date().toISOString(), mistakes, hintUsed, ...(id === 'challenge' ? { caseId: record.challenge.caseId } : {}) }
  const old = record.evidence.find(item => item.id === id)
  if (old && Number(old.hintUsed) + old.mistakes <= Number(hintUsed) + mistakes) return record
  return { ...record, evidence: [...record.evidence.filter(item => item.id !== id), evidence] }
}
