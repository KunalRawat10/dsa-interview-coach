import type { ModelRecord } from '@mlc-ai/web-llm'
import type { Problem } from '../data/problems'
import { generateTutorReply, type TutorMessage } from './conversationalTutor'
import { getLessonState, type LearningGoal, type LessonMessage } from './lessonTutor'
import { guidedReplyViolations } from './teachingPolicy'
import { asksAboutPrerequisite, concreteSingleStep, membershipOrderExplanation } from './tutorIntent'

// Choose by the installed runtime's memory estimates, not parameter count alone.
export function smallestCompatibleModel(models: ModelRecord[], features: ReadonlySet<string>): ModelRecord {
  const eligible = models.filter(model => /SmolLM2|Qwen2.5-(?:0.5|1.5)B-Instruct/.test(model.model_id)
    && model.low_resource_required && (model.required_features ?? []).every(feature => features.has(feature)))
  eligible.sort((a, b) => (a.vram_required_MB ?? Infinity) - (b.vram_required_MB ?? Infinity))
  if (!eligible.length) throw new Error('No compatible small model is available. Visual lessons remain available.')
  return eligible[0]
}

export function compactPayload(messages: TutorMessage[], problem: Problem | undefined, goal: LearningGoal, context: string) {
  const system = `You are a patient teacher. Reply in two short sentences. Answer the question. Goal: ${goal}. ${goal === 'concepts' ? 'Explain one idea. NO CODE. Coding is optional.' : goal === 'pseudocode' ? 'Use plain-language steps.' : 'Help with coding; ask their preferred language if unknown.'}
Problem: ${problem?.title ?? 'Student topic'}. ${problem?.description ?? ''}
${problem?.slug === 'contains-duplicate' ? 'Verified facts: return true if any value repeats, otherwise false after checking all values. A list of previously seen values is a valid plan. A Set retains ALL distinct values, not only the last value added; check membership BEFORE adding. Do not force a Set if the student has another valid plan.' : ''}
When asked to compare membership costs: an unsorted list can scan up to all its values, stopping if a match is found. Common hash-based Sets offer expected/average O(1) membership, not a guarantee for every lookup. Answer the comparison without repeating the definition.
${context.slice(0, 1600)}`
  const recent: TutorMessage[] = []
  let size = 0
  for (const message of messages.slice(-8).reverse()) {
    const content = message.content.replace(/<!--lite:[\s\S]*?-->/g, '').slice(-1800)
    if (recent.length && size + content.length > 3600) break
    recent.unshift({ role: message.role, content }); size += content.length
  }
  while (recent[0]?.role === 'assistant') recent.shift()
  return [{ role: 'system', content: system }, ...recent]
}
export async function generateSmallModelTurn(messages: LessonMessage[], problem: Problem | undefined, goal: LearningGoal, complete: Parameters<typeof generateTutorReply>[1], context = '') {
  const lesson = getLessonState(messages, problem?.slug)
  lesson.goal = goal
  // Tiny models explain; independently checked exercises provide learning evidence.
  // Do not let unverified model prose award mastery.
  const current = messages.findLast(message => message.role === 'user')?.content ?? ''
  const verified = verifiedSmallStep(current, problem, context, lesson.questions.other ?? 0)
  // Short prerequisite answers use checked content directly. Open questions still use AI.
  if (verified.direct && (goal === 'concepts' || (goal === 'pseudocode' && membershipOrderExplanation(current)))) return { reply: verified.reply, lesson, attempts: 0 }
  const draft = await generateTutorReply(compactPayload(messages, problem, goal, context), complete, undefined, { temperature: 0.2, maxTokens: 128 })
  const repeated = messages.filter(message => message.role === 'assistant').slice(-3).some(message => similarReply(message.content, draft))
  const falseSetMemory = /\bset\b[^.!?]*\b(?:only|just)\b[^.!?]*\b(?:last|latest|most recent)\b/i.test(draft)
  const unsafe = goal === 'concepts' && (falseSetMemory || repeated || guidedReplyViolations(draft).length > 0 || /```|\b(?:def|function)\s+\w+|\b(?:seen|set)\.(?:add|has)\(|solution\s*:|automatically removed|array is empty|you (?:have )?mastered|you fully understand|(?:exercise|learning) record|you(?:'re| are) (?:right|correct)/i.test(draft) || draft.length > 700)
  const reply = unsafe ? verified.reply : draft
  if (unsafe) lesson.questions.other = (lesson.questions.other ?? 0) + 1
  return { reply, lesson, attempts: 1 }
}

function similarReply(a: string, b: string): boolean {
  const words = (text: string) => new Set(text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean))
  const left = words(a), right = words(b)
  const overlap = [...left].filter(word => right.has(word)).length
  return overlap / Math.max(left.size, right.size, 1) > 0.82
}

function verifiedSmallStep(current: string, problem: Problem | undefined, context: string, step: number): { reply: string; direct: boolean } {
  const text = current.toLowerCase()
  const asking = /\?|\b(?:what|how|why|explain|tell|show|help|dont know|don't know|not understand|no idea)\b/.test(text)
  if (problem?.slug === 'contains-duplicate') {
    const order = membershipOrderExplanation(current)
    if (order) return { direct: true, reply: order }
    const singleStep = concreteSingleStep(current)
    if (singleStep) return { direct: true, reply: singleStep }
    // Evaluate a small, explicitly requested example from its actual values.
    // No model judgement or required answer wording is needed for this fact.
    const example = text.match(/\[\s*(-?\d+(?:\s*,\s*-?\d+)*)\s*\]/)
    if (asking && example && /\b(?:result|answer|false|true|repeat|duplicate)\b/.test(text)) {
      const values = example[1].split(',').map(Number)
      if (values.length <= 12 && values.every(Number.isSafeInteger)) {
        const repeatedAt = values.findIndex((value, index) => values.indexOf(value) < index)
        return { direct: true, reply: repeatedAt < 0
          ? `For [${values.join(',')}], every value is different, so after checking all ${values.length} values the answer is false.`
          : `For [${values.join(',')}], ${values[repeatedAt]} at position ${repeatedAt + 1} matches an earlier ${values[repeatedAt]}, so the answer is true.` }
      }
    }
  }
  if (asksAboutPrerequisite(text, 'set')) return { direct: true, reply: 'A Set stores each distinct value once. If it contains 1 and 2, checking for 1 answers yes and checking for 3 answers no. To find repeats, check whether the current value was seen BEFORE adding it.' }
  if (asksAboutPrerequisite(text, 'loop')) return { direct: true, reply: 'A loop repeats an action for each item. With [4,7,9], it can inspect 4, then 7, then 9. Your approach decides what to do with each value; knowing programming syntax is not required yet.' }
  if (asksAboutPrerequisite(text, 'array')) return { direct: true, reply: 'An array is an ordered list of values. In [4,7,4], the first and last positions contain equal values. Equal values in different positions count as a repeat.' }
  if (problem?.slug === 'contains-duplicate') {
    // These are teaching intents, not required answer phrases or mastery gates.
    // The tiny model remains available for questions outside these checked facts.
    if (/\b(?:it asks|question asks|task asks)\b/.test(text)) return { direct: true, reply: 'The question asks for true or false: does any value occur at least twice? In [4,7,4], the two 4s are equal, so the answer is true. You do not have to write code to explain this.' }
    if (/\b1\.2\b/.test(text)) return { direct: true, reply: 'Do you mean the two values 1 and 2, or the decimal value 1.2? They are different inputs. If you mean [1,2,1], the final 1 matches the earlier 1, so the answer is true.' }
    if (/sort/.test(text)) return { direct: true, reply: 'Sorting is another valid approach: it brings equal values next to each other. For [3,1,3], sorting gives [1,3,3], where the adjacent 3s reveal the repeat. It changes the order and usually costs O(n log n) time.' }
    const offersMemoryPlan = /\b(?:(?:could|can|would|should)\s+(?:i|we)\s+(?:keep|use|store|record|remember)|(?:i|we)\s+(?:(?:would|could|can|will)\s+)?(?:keep|use|store|record|remember))\b/.test(text) && /\b(?:guest|names?|list)\b/.test(text)
      && /\b(?:seen|already|earlier|before|remember|twice|repeat)\b/.test(text)
      && /\b(?:check|checking|compare|comparing|look|looking|match)\b/.test(text)
      && !/\b(?:only|just)\b[^.!?]*\b(?:last|latest|most recent)\b/.test(text)
    if (offersMemoryPlan) return { direct: true, reply: 'Your guest-list idea can work: the list remembers earlier values. Check whether each arriving value is already on it before adding that value. You can reason about this plan without knowing a data structure name.' }
    const asksForOneComparison = /\b(?:first|one|single)\s+(?:small\s+)?comparison\b|\bcompare\b.*\bonly one\b/.test(text)
    const asksToStart = /\b(?:approach|start|first step|one (?:small )?step)\b/.test(text)
      || /\b(?:how|where)\b[^.!?]*\bcheck\b/.test(text)
    if (asking && (asksForOneComparison || asksToStart)) return { direct: true, reply: 'Start with [4,7,4]. Compare only the first 4 with 7: they differ, so this pair is not a repeat. Which value could we compare that first 4 with next?' }
    if (/\bdata structure\b/.test(text)) return { direct: true, reply: 'A data structure is a way to organise values so you can work with them. A list can remember earlier numbers; a Set is another option that supports asking whether a value is already present. The important question is what you need to remember and check.' }
    if (/\bloop\b/.test(text)) return { direct: true, reply: 'A loop with comparisons is a valid direction. You can compare a value with earlier values or with later positions, as long as you never compare a position with itself. The seen-box workshop demonstrates the earlier-values approach.' }
    if (/\b(?:box|extra|some where else|somewhere else)\b/.test(text)) return { direct: true, reply: 'Once you find that a value already occurred, you do not need another box for that occurrence. Its match with an earlier value is enough to report true. Storing the extra occurrence is optional for this question.' }
    if (/\bstop\b/.test(text)) return { direct: true, reply: /\bstart\b/.test(text)
      ? 'The stopping rule depends on finding a match with an earlier value. Choosing not to write a value again is not the reason by itself; recognising that it already appeared is. For [1,2,1], the final 1 gives that evidence.'
      : 'Stopping at the second 1 works if your reason is that it matches the earlier 1. The question asks whether a repeat exists, so one confirmed match is enough. You can report true at that point.' }
    if (/\b(?:already|before|repeat|repeating)\b/.test(text) && !asking) return { direct: true, reply: /\b(?:1,2,3|1, 2, 3)\b/.test(text)
      ? 'For [1,2,3,1], the final 1 matches the earlier 1, so the result is true. Adding more different values before the match does not change the rule. The username exercise applies that same rule to text.'
      : 'When values at two different positions match, the result is true rather than the repeated number itself. To continue, think about how you could remember earlier values while examining the next number.' }
    if (/\b(?:cant|can't|cannot|dont|don't)\b.*\b(?:code|coding)\b/.test(text)) return { direct: true, reply: 'You can finish this lesson without coding. Use the seen-box workshop to show your reasoning by checking values. Your conceptual practice and coding progress are recorded separately.' }
    if (/^\s*(?:oh\s+)?(?:ok+k*|okay|thanks|thank you|got it)\b/i.test(text)) return { direct: true, reply: /transfer: completed/.test(context) ? 'You have completed the username transfer exercise. Your learning record shows whether feedback was needed. You can finish here; coding is optional.' : 'You can pause here or use the seen-box workshop to try the idea yourself. Coding is optional.' }
    const steps = [
      'The question asks for true or false: does any value occur at least twice? In [4,7,4], the two 4s are equal, so the answer is true. You do not have to write code to explain this.',
      'A list of earlier values is a valid way to remember what you have seen. Before adding a new value, compare it with that list. The workshop lets you try this with a visible seen box.',
      'When the seen box contains 1 and 2, the next 1 is already present. That is enough to report a repeat. You can stop checking as soon as you find one.',
      'For [4,7,9], each value is new. Only after checking all three can we conclude there is no repeat and return false. Try the no-repeat exercise if you want to practise that case.',
      /transfer: completed/.test(context)
        ? 'Your exercise record includes both the number cases and the username transfer case. You can finish here, revisit an explanation, or ask a specific follow-up. These exercises do not assess coding.'
        : 'You have the main idea available here: a repeat matches an earlier value, and no repeat requires checking the whole input. The workshop can check your reasoning directly whenever you choose. Coding is optional.',
    ]
    return { direct: false, reply: steps[Math.min(step, steps.length - 1)] }
  }
  return { direct: false, reply: `Let's keep this conceptual. ${problem?.description ?? 'Break the question into one small example.'} You can ask about a term or use a specific example; coding is optional.` }
}
