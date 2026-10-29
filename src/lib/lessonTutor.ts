import type { Problem } from '../data/problems'
import { buildSystemPrompt, buildChatHistoryPayload, generateTutorReply, type TutorMessage } from './conversationalTutor'
import { generateTeachingReply, guidedReplyViolations, requestsFullSolution, needsWorkedExample } from './teachingPolicy'
import { asksAboutPrerequisite } from './tutorIntent'

export type LearningGoal = 'concepts' | 'pseudocode' | 'code'
export const LESSON_CONCEPTS = ['goal', 'approach', 'memory', 'membership', 'repeat_case', 'no_repeat_case', 'check_before_add', 'set_basics', 'other'] as const
type Concept = typeof LESSON_CONCEPTS[number]
export interface LessonEvidence { concept: Concept; quote: string }
export interface LessonState {
  version: 1
  problemSlug: string
  goal: LearningGoal
  demonstrated: LessonEvidence[]
  taught: Concept[]
  questions: Partial<Record<Concept, number>>
  complete: boolean
}
export interface LessonMessage extends TutorMessage { lesson?: LessonState; learningGoal?: LearningGoal; replyFailed?: boolean }

export function prepareUserTurn(messages: LessonMessage[], text: string, goal: LearningGoal, retry = false): LessonMessage[] {
  if (retry) {
    if (!messages.at(-1)?.replyFailed || messages.at(-2)?.role !== 'user') throw new Error('No failed reply to retry')
    return messages.slice(0, -1)
  }
  return [...messages, { role: 'user', content: text.trim(), learningGoal: goal }]
}

export function getLessonState(messages: LessonMessage[], slug = ''): LessonState {
  for (const message of [...messages].reverse()) {
    const state = message.lesson
    if (message.role === 'assistant' && state?.version === 1 && state.problemSlug === slug
      && Array.isArray(state.demonstrated) && Array.isArray(state.taught) && state.questions
      && ['concepts', 'pseudocode', 'code'].includes(state.goal)) return structuredClone(state)
  }
  return { version: 1, problemSlug: slug, goal: 'concepts', demonstrated: [], taught: [], questions: {}, complete: false }
}

export const LESSON_REPLY_SCHEMA = {
  type: 'object', properties: {
    reply: { type: 'string', description: 'Student-facing reply, normally 2-4 sentences. Teach or advance, do not repeat demonstrated facts as questions.' },
    taught: { type: 'array', items: { type: 'string', enum: [...LESSON_CONCEPTS] } },
    questionConcept: { type: 'string', enum: [...LESSON_CONCEPTS, 'none'] },
    nextAction: { type: 'string', enum: ['explain', 'clarify', 'advance', 'check', 'finish', 'offer_code'] },
    requestedGoal: { type: 'string', enum: ['unchanged', 'concepts', 'pseudocode', 'code'] },
    goalEvidence: { type: 'string', description: 'Exact user quote explicitly requesting a different learning goal. Empty unless they requested a change. okay or thanks are not consent to code.' },
  }, required: ['reply', 'taught', 'questionConcept', 'nextAction', 'requestedGoal', 'goalEvidence'], additionalProperties: false,
}

export const LEARNER_CHECK_SCHEMA = {
  type: 'object', properties: {
    goal: { type: 'boolean' }, approach: { type: 'boolean' }, repeat: { type: 'boolean' }, noRepeat: { type: 'boolean' },
  }, required: ['goal', 'approach', 'repeat', 'noRepeat'], additionalProperties: false,
}

async function assessLearnerUnderstanding(state: LessonState, messages: LessonMessage[], complete: Parameters<typeof generateTutorReply>[1]): Promise<LessonState> {
  if (state.problemSlug !== 'contains-duplicate') return state
  const current = messages.findLast(message => message.role === 'user')?.content ?? ''
  const previousUsers = messages.filter(message => message.role === 'user').slice(0, -1)
  if (/^(?:ok+k?|okay|thanks|thank you|got it)[.!\s]*$/i.test(current.trim())
    || previousUsers.some(message => normalize(message.content) === normalize(current))) return state
  const previousTeacher = messages.slice(0, -1).findLast(message => message.role === 'assistant')?.content ?? ''
  const result = await generateTutorReply([
    { role: 'system', content: `Assess ONLY what the latest student message demonstrates about Contains Duplicate. Do not teach. Return four booleans.
goal: understands the task asks whether a value repeats.
approach: describes a sensible plan to find repeats, such as making a list of names/numbers and checking whether any occurs twice, comparing pairs, counting frequencies or sorting and comparing neighbours. Informal analogies count. Merely naming a data structure is NOT enough.
repeat: identifies an ACTUAL repeated value in a specific example, such as noticing the second 8 in [8,3,8] or stopping because 8 was written before. A general statement of the task does NOT count.
noRepeat: explicitly explains an ALL-DISTINCT example or finishing the ENTIRE input without finding a repeat. "I stop because I do not want to write 8 twice" is a REPEAT case, never a no-repeat case. Wanting to avoid a duplicate is not evidence about a distinct input.
Use prior conversation only to resolve references like "the same". Do not credit knowledge explained by the teacher. A restatement of the task can establish goal ONLY, never approach or repeat. Acknowledgment alone proves nothing. Examples: "I write down each arriving guest and check whether any name occurs twice" demonstrates approach, even though it is an analogy. "The second 8 in [8,3,8] matches the earlier 8" demonstrates repeat. "I use a data structure" demonstrates neither approach nor repeat. "I stop because I don't want to write 8 twice" is about a repeat, not an all-distinct case. Previous teacher reply, for context only: ${JSON.stringify(previousTeacher)}
Judge the next USER message only. The teacher reply is not evidence of student understanding.` },
    { role: 'user', content: current },
  ], complete, undefined, { responseFormat: 'json', jsonSchema: LEARNER_CHECK_SCHEMA, temperature: 0, maxTokens: 128 })
  const assessment = JSON.parse(result) as Record<string, unknown>
  const mapping: Record<string, Concept[]> = { goal: ['goal'], approach: ['approach'], repeat: ['repeat_case'], noRepeat: ['no_repeat_case'] }
  const next = structuredClone(state)
  for (const [key, concepts] of Object.entries(mapping)) {
    if (assessment[key] !== true) continue
    // Do not award a negative-case demonstration from an ambiguous "don't repeat".
    // This is conservative provenance checking, not a required learner answer.
    if (key === 'noRepeat' && !/\b(?:false|distinct|unique|different|none|nothing|finish|end|all)\b|\bno\s+(?:repeats?|duplicates?|number|value|element)|without\b.*\brepeat/i.test(current)) continue
    for (const concept of concepts) if (!next.demonstrated.some(item => item.concept === concept)) next.demonstrated.push({ concept, quote: current })
  }
  return next
}

interface LessonPacket {
  reply: string
  demonstrated: LessonEvidence[]
  taught: Concept[]
  questionConcept: Concept | 'none'
  nextAction: 'explain' | 'clarify' | 'advance' | 'check' | 'finish' | 'offer_code'
  requestedGoal: LearningGoal | 'unchanged'
  goalEvidence: string
}

const normalize = (text: string) => text.toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ').trim()
const isConcept = (value: unknown): value is Concept => LESSON_CONCEPTS.includes(value as Concept)

function hasDemonstratedApproach(state: LessonState): boolean {
  return state.demonstrated.some(item => item.concept === 'approach')
    || ['memory', 'membership'].every(concept => state.demonstrated.some(item => item.concept === concept))
}

export function conceptLessonSummary(state: LessonState): string {
  const checkedDistinct = state.demonstrated.some(item => item.concept === 'no_repeat_case')
  return checkedDistinct
    ? "You've demonstrated a plan for checking values, how to recognize a repeat, and finish with false when every value is distinct. You can finish the conceptual lesson here; coding is optional."
    : "You've demonstrated a plan for checking values and how to recognize a repeat. I also explained the no-repeat case: for [4,7,9], all values differ, so the answer is false after checking every value. You haven't demonstrated that last case yourself yet, so you can practice it later if you want. You can finish this conceptual lesson here; no coding is required."
}

function withoutQuestion(reply: string): string {
  return reply.replace(/(?:^|(?<=[.!]))\s*[^.!?]*\?\s*$/, '').trim()
}

function teachMissingPiece(state: LessonState, target?: Concept): string {
  const hasApproach = hasDemonstratedApproach(state)
  const hasRepeat = state.demonstrated.some(item => item.concept === 'repeat_case')
  if (hasApproach && hasRepeat) {
    state.taught = [...new Set([...state.taught, 'no_repeat_case' as const])]
    state.complete = true
    return conceptLessonSummary(state)
  }
  if (target === 'no_repeat_case') {
    state.taught = [...new Set([...state.taught, 'no_repeat_case' as const])]
    return 'For [4,7,9], none of the values repeats. We check the entire input and finish with false. This is different from stopping early because a repeated value was found.'
  }
  if (hasApproach) {
    if (!(state.questions.repeat_case)) {
      state.questions.repeat_case = 1
      return 'Your plan gives us a way to check the values. Let\'s apply it once: if 1 and 2 have already been recorded, what does seeing another 1 tell us?'
    }
    state.taught = [...new Set([...state.taught, 'repeat_case' as const, 'no_repeat_case' as const])]
    return 'With [1,2,1], the last 1 matches a value already recorded, so a repeat exists and the answer is true. With [4,7,9], every value differs, so checking the entire input finds no repeat and the answer is false. These are the two outcomes your plan needs to handle.'
  }
  state.taught = [...new Set([...state.taught, 'memory' as const, 'membership' as const])]
  return 'A concrete way to start is to record the first value, such as 1, then compare each later value with what was recorded. When another 1 arrives, it matches an earlier value, which means a repeat exists. A list with comparisons is a valid approach; no special data-structure name is required.'
}

function removeCodingInvitations(reply: string): string {
  return (reply.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [reply]).filter(sentence =>
    !(/\b(?:implement\w*|cod(?:e|ing)|program\w*|language|Python|JavaScript)\b/i.test(sentence)
      && /\?|let'?s|now|try|show you|i can show|before (?:we|you)|write (?:the |some |your )?code|you (?:should|need|must)/i.test(sentence)
      && !/optional|not required|no coding|no code|without (?:code|coding)/i.test(sentence))).join(' ').trim()
}

function truthfulStudentReply(reply: string, state: LessonState): string {
  const knowsDistinct = state.demonstrated.some(item => item.concept === 'no_repeat_case')
  let sentences: string[] = reply.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [reply]
  if (!knowsDistinct) sentences = sentences.filter(sentence => !(
    /you(?:'ve| have)?\b/i.test(sentence) && /demonstrat|understand|master|correctly.*handle/i.test(sentence)
    && /both|no[-_ ]repeat|distinct/i.test(sentence)))
  return sentences.join(' ').trim()
    .replace(/\bno_repeat_case\b/g, 'the no-repeat case').replace(/\brepeat_case\b/g, 'the repeated-value case')
    .replace(/\bset_basics\b/g, 'Set membership').replace(/\bcheck_before_add\b/g, 'checking before adding')
}

function isAcknowledgment(text: string): boolean {
  return /^(?:ok+k?|okay|thanks|thank you|got it)[.!\s]*$/i.test(text.trim())
    || (/^oh\s+ok\b/i.test(text.trim()) && text.split(/\s+/).length <= 12 && !/\d|\?/.test(text))
}

function paceConcreteExercises(reply: string, state: LessonState, previous: LessonState): string {
  const task = /\b(?:try|apply|practice|work through|walk through|trace|handle|what would|how would|can you follow)\b/i
  const pieces = reply.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [reply]
  let repeated = false
  let lastExample: number[] | undefined
  const kept: string[] = []
  for (const sentence of pieces) {
    const arrays = sentence.match(/\[\s*-?\d+(?:\s*,\s*-?\d+)*\s*\]/g) ?? []
    for (const array of arrays) lastExample = JSON.parse(array) as number[]
    const optional = /optional|later if|if you (?:want|like)|whenever you want/i.test(sentence)
    if (!optional && task.test(sentence) && lastExample && lastExample.length >= 2) {
      const concept = new Set(lastExample).size < lastExample.length ? 'repeat_case' : 'no_repeat_case'
      if (previous.complete || (previous.questions[concept] ?? 0) >= 1) { repeated = true; continue }
      state.questions[concept] = Math.max(state.questions[concept] ?? 0, 1)
    }
    kept.push(sentence)
  }
  if (!repeated) return reply
  let result = kept.join(' ').trim()
  if (previous.complete || state.complete) return result || 'The conceptual lesson is complete; further practice is optional.'
  const explainsDistinct = /\bfalse\b/i.test(result) && (result.match(/\[\s*-?\d+(?:\s*,\s*-?\d+)*\s*\]/g) ?? [])
    .some(array => { const values = JSON.parse(array) as number[]; return values.length >= 2 && new Set(values).size === values.length })
  if (explainsDistinct) {
    state.taught = [...new Set([...state.taught, 'no_repeat_case' as const])]
    if (hasDemonstratedApproach(state) && state.demonstrated.some(item => item.concept === 'repeat_case')) state.complete = true
    return result
  }
  if (!(previous.questions.no_repeat_case)) {
    result += ' What would your plan conclude for [4,7,9], where all values are different?'
    state.questions.no_repeat_case = 1
  } else {
    result += ' For [4,7,9], no value repeats, so checking the whole input finishes with false.'
    state.taught = [...new Set([...state.taught, 'no_repeat_case' as const])]
    if (hasDemonstratedApproach(state) && state.demonstrated.some(item => item.concept === 'repeat_case')) state.complete = true
  }
  return result.trim()
}

function prerequisiteExplanation(state: LessonState, text: string): string | undefined {
  if (requestsFullSolution(text) || state.goal === 'code') return undefined
  const support = needsWorkedExample(text)
  if (!support && !/^\s*what (?:is|are)\b/i.test(text)) return undefined
  if (asksAboutPrerequisite(text, 'set')) {
    state.taught = [...new Set([...state.taught, 'set_basics' as const])]
    return 'A Set stores each distinct value once. To check for a repeat, ask whether the current value is already present before adding it. If the Set contains 1 and 2, checking for 1 answers yes, while checking for 3 answers no. You can understand and practice that idea without writing code.'
  }
  if (asksAboutPrerequisite(text, 'loop')) {
    return 'A loop repeats an action for each item. For [4,7,9], it can first look at 4, then 7, then 9, instead of needing a separate instruction for every item. We can practice that sequence in plain language before learning any programming syntax.'
  }
  if (asksAboutPrerequisite(text, 'array')) {
    return 'An array is an ordered list of values. In [4,7,4], the first item is 4, the second is 7, and the third is another 4. Two positions can hold the same value; that is what a repeat means here.'
  }
  if (/\bapproach\b|first step|one (?:small )?step|(?:where|how) to start/i.test(text)) {
    state.taught = [...new Set([...state.taught, 'goal' as const])]
    const check = !state.demonstrated.some(item => item.concept === 'repeat_case') && !(state.questions.repeat_case)
    if (check) state.questions.repeat_case = 1
    return 'An approach is simply a plan for checking the values. For example, compare the first 4 in [4,7,4] with 7: they differ, so that pair is not a repeat. '
      + (check ? 'What would comparing that first 4 with the last 4 tell us?' : 'Comparing the first and last 4 shows a matching pair. No coding is required to practice these comparisons.')
  }
  return undefined
}

export function applyLessonPacket(previous: LessonState, packet: LessonPacket, messages: LessonMessage[], selectedGoal: LearningGoal): LessonState {
  const state = structuredClone(previous)
  state.goal = selectedGoal
  const users = messages.filter(message => message.role === 'user')
  const explicitGoalChange = packet.requestedGoal === 'code'
    ? (requestsFullSolution(users.at(-1)?.content ?? '') && /\b(?:code|coding|implementation|function|programming)\b/i.test(users.at(-1)?.content ?? '')) || /\b(?:want|ready|learn|practice|teach|help)\b.*\b(?:coding|programming|implement|write code)\b/i.test(users.at(-1)?.content ?? '')
    : packet.requestedGoal === 'pseudocode'
      ? /\bpseudocode\b|plain.language (?:plan|steps)/i.test(users.at(-1)?.content ?? '')
      : /\bconcept|no coding|don'?t.*(?:code|coding)|without.*(?:code|coding)/i.test(users.at(-1)?.content ?? '')
  if (explicitGoalChange && ['concepts', 'pseudocode', 'code'].includes(packet.requestedGoal)
    && packet.goalEvidence.trim().length >= 8
    && normalize(users.at(-1)?.content ?? '').includes(normalize(packet.goalEvidence))) {
    state.goal = packet.requestedGoal as LearningGoal
  }
  // Validate provenance. Meaning is judged by the model, not by phrase templates.
  for (const evidence of packet.demonstrated) {
    if (!isConcept(evidence.concept) || typeof evidence.quote !== 'string') continue
    const quote = normalize(evidence.quote)
    if (quote.length < 8 || !users.some(user => normalize(user.content).includes(quote))) continue
    if (!state.demonstrated.some(item => item.concept === evidence.concept)) state.demonstrated.push(evidence)
  }
  state.taught = [...new Set([...state.taught, ...packet.taught.filter(isConcept)])]
  const known = new Set(state.demonstrated.map(item => item.concept))
  if (packet.questionConcept !== 'none' && isConcept(packet.questionConcept)) {
    state.questions[packet.questionConcept] = (state.questions[packet.questionConcept] ?? 0) + 1
  }
  // Completion is conceptual, not a claim that code was written or executed.
  if (state.problemSlug === 'contains-duplicate') {
    state.complete = hasDemonstratedApproach(state) && known.has('repeat_case')
      && (known.has('no_repeat_case') || state.taught.includes('no_repeat_case'))
  }
  return state
}

function lessonPrompt(problem: Problem | undefined, state: LessonState): string {
  return `You are a patient teacher helping a student understand ${problem?.title ?? 'a DSA topic'}.
Problem: ${problem?.description ?? 'Discuss their topic.'}
Examples: ${problem?.examples.map(example => `${example.input} => ${example.output}`).join('; ') ?? ''}
Student's learning goal: ${state.goal}. For concepts, no programming is required and understanding the idea is a complete outcome. For pseudocode, use plain-language steps. For code, ask their preferred language before teaching syntax. Never choose JavaScript or treat okay as permission to code.

WHAT THIS STUDENT ALREADY DEMONSTRATED:
${state.demonstrated.map(item => `- ${item.concept}: student said ${JSON.stringify(item.quote)}`).join('\n') || 'No demonstrated understanding recorded yet.'}
WHAT YOU ALREADY EXPLAINED: ${state.taught.join(', ') || 'none'}
ALREADY ASKED CHECKS: ${JSON.stringify(state.questions)}
CONCEPT LESSON COMPLETE: ${state.complete}

The lesson memory has already assessed what the student demonstrated. Trust its distinctions: goal is the task, memory/membership are the approach, repeat_case is an actual repeated value, and no_repeat_case is a distinct case. Acknowledgment is not new evidence. Do not invent additional mastery.

After they describe keeping earlier values and checking repeats, acknowledge that and move forward. After they identify one repeated value, NEVER ask them to identify another equivalent repeat. Instead address the missing no-repeat case, or finish. Ask each concept at most once; if they ignore that question, EXPLAIN the answer rather than asking again. For [4,7,9], all values differ, so the process finishes without a repeat and the answer is false. Include no_repeat_case in taught when you explain this. Summarize and let them finish once approach and repeat are demonstrated and the no-repeat case has been covered. State which ideas THEY demonstrated versus what YOU explained. Do not restart a completed lesson. New specific questions are still welcome.

When the learner refers to [1,2,1], keep that example; do not silently change it to [1,2,3,1] and suggest stopping after its first two values. Stopping early is justified only when processing an actual repeated occurrence.
If they lack a prerequisite, define it and perform one tiny action with its result before a small application. Answer side questions directly. Arrays plus loops are a VALID way to search; do not reject a loop or force a Set as a correction. Recording extra occurrences can work, but the task only needs a boolean. If they identify the repeated number, clarify that we return true rather than the number itself. Ambiguity calls for clarification, not automatic praise.
If asked about a Set: it stores distinct values. Membership checks whether a value is present. In JavaScript, has(x) returns a boolean and add(x) returns the Set. Check before adding to distinguish earlier occurrences from the current item.

Output only the requested JSON. Choose a SHORT helpful reply based on the assessed lesson memory. Use at most one useful question. No unsolicited code. questionConcept must identify what your question tests: goal, approach, repeat_case, no_repeat_case, set_basics, other, or none. Do not test an already demonstrated concept again. taught contains only concepts actually explained in THIS reply. requestedGoal is unchanged unless the latest learner explicitly requests a new goal; goalEvidence must quote that request, not a problem restatement. Completion is conceptual, NEVER a claim that code was executed or verified.`

}

export async function generateLessonTurn(
  messages: LessonMessage[], problem: Problem | undefined, selectedGoal: LearningGoal,
  createCompletion: Parameters<typeof generateTutorReply>[1],
  notes = '',
): Promise<{ reply: string; lesson: LessonState; attempts: number }> {
  let state = getLessonState(messages, problem?.slug)
  const current = messages.findLast(message => message.role === 'user')?.content ?? ''
  const explicitlyRequestedCode = requestsFullSolution(current) && /\b(?:code|coding|implementation|function|programming|javascript|python|java|js)\b/i.test(current)
  const effectiveGoal = explicitlyRequestedCode ? 'code' : selectedGoal
  state.goal = effectiveGoal
  // Keep the detailed duplicate-detection curriculum scoped to its actual problem.
  // Other problems retain open tutoring with their own statement and goal context.
  if (problem?.slug !== 'contains-duplicate') {
    const prompt = buildSystemPrompt(problem) + `\nLEARNING GOAL: ${effectiveGoal}. For concepts, explain the idea without requiring coding, and offer a stopping point when understood. For pseudocode, use plain-language steps. For code, ask the preferred language if unknown; never assume JavaScript. Do not apply a duplicate-detection lesson to a different problem.`
    const payload = buildChatHistoryPayload(prompt, messages, notes)
    const reply = effectiveGoal === 'pseudocode'
      ? await generateTutorReply(payload, createCompletion)
      : await generateTeachingReply(payload, current, createCompletion)
    return { reply, lesson: state, attempts: 1 }
  }
  const prerequisite = prerequisiteExplanation(state, current)
  if (prerequisite) return { reply: prerequisite, lesson: state, attempts: 0 }
  state = await assessLearnerUnderstanding(state, messages, createCompletion)
  if (state.complete && selectedGoal === 'concepts' && isAcknowledgment(current)) {
    return { reply: 'You can stop here: your conceptual lesson is complete. Coding is optional, and you can return to it whenever you want.', lesson: state, attempts: 0 }
  }
  const full = requestsFullSolution(current)
  const payload = buildChatHistoryPayload(lessonPrompt(problem, state) + '\nLATEST LEARNER MESSAGE (assess this in context): ' + JSON.stringify(current) + '\nNever ask for a data structure name before teaching it. A plan using a list and comparisons is valid; do not replace it with a Set as a correction.', messages, notes)
  let lastErrors: string[] = []
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await generateTutorReply(payload, createCompletion, undefined, { responseFormat: 'json', jsonSchema: LESSON_REPLY_SCHEMA, temperature: 0.2 })
    let errors: string[] = []
    try {
      const parsed = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''))
      // The response writer cannot award mastery to itself. Only the separate learner check can.
      const packet = { ...parsed, demonstrated: [] } as LessonPacket
      if (typeof packet.reply !== 'string' || !packet.reply.trim() || !Array.isArray(packet.demonstrated)
        || !Array.isArray(packet.taught) || typeof packet.goalEvidence !== 'string'
        || ![...LESSON_CONCEPTS, 'none'].includes(packet.questionConcept)) throw new Error('Invalid lesson packet')
      if (packet.questionConcept === 'memory' || packet.questionConcept === 'membership') packet.questionConcept = 'approach'
      const next = applyLessonPacket(state, packet, messages, effectiveGoal)

      const demonstrated = next.demonstrated.some(item => item.concept === packet.questionConcept)
      if (packet.questionConcept !== 'none' && packet.questionConcept !== 'other'
        && (demonstrated || (state.questions[packet.questionConcept] ?? 0) >= 1)
        && !/\b(?:again|revisit|another example|practice more)\b/i.test(current)) {
        // Retain a useful explanation but remove the redundant trailing check.
        // This avoids paying for another model call just to rephrase a question.
        const explanation = withoutQuestion(packet.reply)
        if (explanation && explanation !== packet.reply.trim()) {
          packet.reply = explanation
          next.questions = { ...state.questions }
          const coreKnown = hasDemonstratedApproach(next) && next.demonstrated.some(item => item.concept === 'repeat_case')
          if (coreKnown && !next.taught.includes('no_repeat_case') && !next.demonstrated.some(item => item.concept === 'no_repeat_case')) {
            packet.reply += ' For [4,7,9], all values differ, so checking the whole input finds no repeat and the answer is false.'
            next.taught.push('no_repeat_case')
            next.complete = true
          }
        } else if (state.problemSlug === 'contains-duplicate') {
          next.questions = { ...state.questions }
          packet.reply = teachMissingPiece(next, packet.questionConcept)
        } else errors.push('Repeated check of an already demonstrated or already checked concept; explain a missing concept or finish instead')
      }
      if (next.goal === 'concepts') {
        packet.reply = removeCodingInvitations(packet.reply) || teachMissingPiece(next)
        if (packet.nextAction === 'offer_code') packet.nextAction = next.complete ? 'finish' : 'explain'
      }
      if (next.goal === 'concepts' && (packet.nextAction === 'offer_code' || /(?:how would you|let'?s|now|try to)\s+(?:start|write|code|implement)|start your code|in JavaScript/i.test(packet.reply))) errors.push('Unrequested coding in a concept-only lesson')
      if (next.goal === 'concepts' && next.complete && !state.complete) {
        packet.reply = conceptLessonSummary(next)
        // The completion summary is generated from validated state, never a model claim of mastery.
        errors = errors.filter(error => !['too many sentences for one small step', 'too long for one teaching step', 'complete solution recipe'].includes(error))
      }
      if (state.complete && next.goal === 'concepts' && !/\?|\b(?:why|how|what|tell me|explain|can u|can you)\b/i.test(current)) {
        // A finished lesson may acknowledge further examples, but must not assign more work.
        const sentences = packet.reply.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [packet.reply]
        packet.reply = sentences.filter(sentence => !sentence.includes('?') && !/\blet'?s\b|the next step|we (?:need|must)|you (?:need|must)|now,?\s+(?:we|you)|try (?:this|another|a)|how would you/i.test(sentence)).slice(0, 3).join(' ').trim()
        if (!packet.reply) packet.reply = 'The conceptual lesson is complete; coding is optional.'
        if (packet.nextAction === 'finish') packet.reply = (packet.reply.match(/[^.!?]+[.!?]+/)?.[0] ?? packet.reply).trim() + ' The concept lesson is already complete; further practice is optional.'
        next.questions = { ...state.questions }
      }
      if (next.goal === 'concepts' && /\bset\b/i.test(current) && /\?|\b(?:how|what|tell|know|explain)\b/i.test(current)) {
        packet.reply = 'A Set stores each distinct value once. To check for a repeat, ask whether the current value is already present before adding it. If the Set contains 1 and 2, checking for 1 answers yes, while checking for 3 answers no. You can understand and practice that idea without writing code.'
        next.taught = [...new Set([...next.taught, 'set_basics' as const])]
        next.questions = { ...state.questions }
        errors = []
      }
      if (next.goal === 'concepts') {
        packet.reply = paceConcreteExercises(packet.reply, next, state)
        packet.reply = truthfulStudentReply(packet.reply, next) || (next.complete ? conceptLessonSummary(next) : teachMissingPiece(next))
      }
      if (!full && next.goal === 'concepts') {
        errors.push(...guidedReplyViolations(packet.reply).filter(error =>
          error !== 'too many sentences for one small step'
          && error !== 'lecture outline instead of one small step'
          && !((next.complete || hasDemonstratedApproach(next)) && error === 'complete solution recipe')))
      }
      if (!errors.length) return { reply: packet.reply, lesson: next, attempts: attempt + 1 }
      if (attempt === 1 && next.goal === 'concepts' && next.problemSlug === 'contains-duplicate') {
        next.questions = { ...state.questions }
        return { reply: teachMissingPiece(next, packet.questionConcept === 'none' ? undefined : packet.questionConcept), lesson: next, attempts: 2 }
      }
    } catch (error) { errors.push(error instanceof Error ? error.message : 'Invalid lesson packet') }
    lastErrors = errors
    payload[0].content += `\nREWRITE REQUIRED: ${errors.join('; ')}. Use lesson memory. Respond to the latest meaning, teach the missing piece directly, or close the concept lesson. Keep all required JSON fields.`
  }
  const error = new Error(`The teacher could not produce a consistent lesson step after one rewrite: ${lastErrors.join('; ')}`) as Error & { lesson: LessonState }
  error.lesson = state
  throw error
}
