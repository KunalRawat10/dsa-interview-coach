import { generateTutorReply } from './conversationalTutor'

// This detects a request for disclosure, not whether a student's answer is correct.
// All reasoning and choice of the next teaching step remain with the language model.
export function requestsFullSolution(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[’]/g, "'")
  if (/\b(?:don't|do not|without|avoid|no|not|never)\b[^.!?;\n]{0,55}\b(?:code|solution|answer|implementation|walkthrough)\b/.test(normalized)) return false
  if (/\b(?:just|only)\s+(?:the\s+)?(?:first|one|a single)\s+step\b|\b(?:code|example)\s+(?:for|of)\s+(?:a|one|the)\s+(?:loop|comparison|operation)\b/.test(normalized)) return false
  return /\b(?:give|show|write|provide|share|tell|explain|want|need|see|get|reveal)\b[^.!?;\n]{0,65}\b(?:full|complete|whole|entire|final)\s+(?:\w+\s+){0,3}(?:solution|answer|code|implementation|function|walkthrough|algorithm)\b/.test(normalized)
    || /\b(?:show|write|give|provide|share)\b[^.!?;\n]{0,35}\b(?:the |me |some |javascript |python |js |c\+\+ |java )*(?:code|implementation|function)\b/.test(normalized)
    || /\b(?:code|implement)\s+(?:it|this|the solution|the algorithm)\s+(?:for me|now|please)\b/.test(normalized)
}

export function guidedReplyViolations(text: string): string[] {
  const failures: string[] = []
  if (text.split(/\s+/).length > 110) failures.push('too long for one teaching step')
  if ((text.match(/[.!](?:\s+|$)/g) ?? []).length > 6) failures.push('too many sentences for one small step')
  if (/```|\bfunction\s+\w+\s*\(|\bdef\s+\w+\s*\(|\b(?:const|let|var)\s+\w+\s*=/.test(text)) failures.push('unsolicited implementation')
  if ((text.match(/\?/g) ?? []).length > 1) failures.push('more than one question')
  if (/^\s*(?:#{1,6}\s|\d+[.)]\s|[-*]\s)/m.test(text)) failures.push('lecture outline instead of one small step')
  // A full duplicate-checking recipe can leak without a fenced code block.
  if (/\b(?:set|hash|membership|seen|list)\b/i.test(text)
    && /\b(?:loop|iterate|each|every)\b/i.test(text)
    && /\breturn\s+true\b/i.test(text) && /\breturn\s+false\b/i.test(text)) {
    failures.push('complete solution recipe')
  }
  return failures
}

// Detect requests for more support, never judge the correctness of an answer.
export function needsWorkedExample(text: string): boolean {
  return /\b(?:idk|no idea|confused|beginner|never solved|don'?t (?:know|understand|get)|do not (?:know|understand)|not sure|stuck|teach me|show me (?:just )?(?:the )?(?:first|one|a single) step)\b/i.test(text.replace(/[’]/g, "'"))
}

function readWorkedTeachingStep(text: string): string {
  const raw = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const step = JSON.parse(raw) as Record<string, unknown>
  if (typeof step.explanation !== 'string' || !step.explanation.trim()
    || typeof step.workedExample !== 'string' || !step.workedExample.trim()
    || typeof step.checkQuestion !== 'string') throw new Error('Missing teaching step fields')
  if (step.explanation.includes('?') || step.workedExample.includes('?')) throw new Error('The explanation must teach before asking a question')
  if (step.workedExample.split(/\s+/).length > 45
    || (step.workedExample.match(/\b(?:then|next|after that|when we (?:see|reach)|when you (?:see|reach)|again)\b/gi) ?? []).length > 2) {
    throw new Error('The worked example traverses too much; perform only one comparison or operation')
  }
  return [step.explanation, step.workedExample, step.checkQuestion].map(part => (part as string).trim()).filter(Boolean).join(' ')
}

type Completion = Parameters<typeof generateTutorReply>[1]

export async function generateTeachingReply(
  payload: { role: string; content: string }[],
  currentUserText: string,
  createCompletion: Completion,
  onChunk?: (text: string) => void,
): Promise<string> {
  const fullSolution = requestsFullSolution(currentUserText)
  const support = needsWorkedExample(currentUserText)
  const contract = fullSolution
    ? '\n\nTHIS TURN: The student explicitly requested implementation or a full solution. You may provide it, with an explanation appropriate to their level.'
    : '\n\nTHIS TURN IS GUIDED TEACHING: Teach only ONE small idea in 2-4 short sentences, at most 110 words, with at most one question. No headings, lists, code block or complete solution recipe. If they lack knowledge, explain one prerequisite and demonstrate one tiny step before a simple check. A restatement of the problem deserves acknowledgment and a next small step, not an algorithm.'
  const supportContract = support
    ? `\nTHE STUDENT NEEDS INSTRUCTION NOW. Do not ask them how they would check, solve or approach the problem: they just said they do not know. Perform ONE concrete action yourself and state its outcome before asking a tiny prediction. For duplicate detection, you can actually compare 4 with 7 and explain that they differ, then ask what comparing 4 with another 4 tells us. For a term such as loop, define it and show how it moves from one item to the next. Do not introduce the whole optimized algorithm. Your reply must contain an explanation and a demonstrated action, not merely "look at the first number" followed by "how would you check it?".
For this support turn ONLY, output a JSON object with exactly three string fields: "explanation" (plain definition of the missing idea), "workedExample" (actually perform one concrete action and state its result; no question), "checkQuestion" (one small prediction or application of the action you just taught, or empty if no question is needed). No markdown wrapper. The app displays these fields as normal prose. Keep all fields together under 110 words. An example is an action PLUS its outcome, not a suggestion to look at something.`
    : ''
  const turnPayload = payload.map((message, index) => index === 0
    ? { ...message, content: message.content + contract + supportContract }
    : message)
  if (fullSolution) return generateTutorReply(turnPayload, createCompletion, onChunk)

  // Buffer guided replies so a rejected draft never streams spoilers to the student.
  // One bounded rewrite handles local models that ignore the short-turn contract.
  for (let attempt = 0; attempt < 2; attempt++) {
    const draft = await generateTutorReply(turnPayload, createCompletion, undefined, support ? { responseFormat: 'json' } : undefined)
    let text: string
    try {
      text = support ? readWorkedTeachingStep(draft) : draft
    } catch (error) {
      turnPayload[0].content += `\nThe last draft was withheld: ${error instanceof Error ? error.message : 'invalid teaching step'}. Return only the required JSON object with explanation, workedExample and checkQuestion. Demonstrate ONE operation with its outcome, not a traversal of the array. Use at most four sentences total.`
      continue
    }
    const violations = guidedReplyViolations(text)
    if (support && /(?:how (?:would|could|can|do) (?:you|we) (?:check|solve|start|approach|do)|can you (?:check|find|think of|come up with))/i.test(text)) {
      violations.push('asked the beginner for an unexplained method instead of demonstrating it')
    }
    if (!violations.length) {
      onChunk?.(text)
      return text
    }
    turnPayload[0] = {
      ...turnPayload[0],
      content: turnPayload[0].content + `\nYour previous draft was withheld because it had: ${violations.join(', ')}. Rewrite from scratch as just 2-3 plain sentences about the immediate concept. Explain a tiny example if needed, then ask ONE simple check. Do not enumerate the algorithm or give code.`,
    }
  }
  throw new Error('The model did not produce a focused teaching step after one rewrite.')
}

