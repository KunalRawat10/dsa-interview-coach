// Replay through the same Vite proxy and desktop stream adapter used by the browser.
import { writeFile, mkdir } from 'node:fs/promises'
import { executeFullAITurnSafe } from '../src/components/WebLLMChat.tsx'
import { desktopCompletion, findDesktopModel } from '../src/lib/desktopTutor.ts'
import { PROBLEMS } from '../src/data/problems.ts'

const base = 'http://127.0.0.1:5176'
const originalFetch = globalThis.fetch
globalThis.fetch = (url, options) => originalFetch(new URL(url, base), options)
const model = await findDesktopModel()
if (model !== 'qwen2.5:7b') throw new Error(`Expected the comparison model qwen2.5:7b; got ${model}`)
const problem = PROBLEMS.find(item => item.slug === 'contains-duplicate')
const messages = []
const inputs = [
  'I think the question asks whether any number appears more than once. I want to understand the concept before writing code.',
  "I don't know what an array is. Can you explain it using just three numbers?",
  'I understand what an array is now, but I have no idea how to start solving this. Show me just one small step.',
  'Show me just the first comparison I should make. Don’t explain the whole solution.',
  'The first 4 and 7 are different, but the first and last 4 match. So there is a repeat, and we return true.\n\nIntroduce your own analogy',
  'Could I keep a guest list of numbers I have already seen and check whether each arriving number is already on it?',
  'For [4,7,9], none of the numbers repeats. After checking every number, I would return false. Is that right?',
  'I only wanted to understand the concept. I am not ready to code yet. Can we finish here?',
]
const report = { base, model, path: 'full guided tutor through browser desktop adapter', turns: [], failures: [] }
await mkdir('docs/reviews', { recursive: true })
for (const [index, content] of inputs.entries()) {
  messages.push({ role: 'user', content, learningGoal: 'concepts' })
  const started = Date.now()
  const result = await executeFullAITurnSafe({ userText: content, messages, problem, learningGoal: 'concepts', smallModel: false,
    createCompletion: async (payload, options) => desktopCompletion(model, payload, options) })
  report.turns.push({ student: content, reply: result.finalContent, seconds: (Date.now() - started) / 1000,
    usedFallback: result.usedFallback, lesson: result.lesson })
  if (result.usedFallback) report.failures.push(`Turn ${index + 1}: technical fallback`)
  if (index === 2 && /An array is an ordered list/.test(result.finalContent)) report.failures.push('Array acknowledgement repeated the definition')
  if (/```|function containsDuplicate/.test(result.finalContent)) report.failures.push(`Turn ${index + 1}: unsolicited code`)
  messages.push({ role: 'assistant', content: result.finalContent, lesson: result.lesson, replyFailed: result.usedFallback })
  await writeFile('docs/reviews/browser-desktop-parity.json', JSON.stringify(report, null, 2))
  console.log(`${index + 1}: ${result.finalContent}\n`)
}
console.log(`MODEL: ${model}; REPLIES: ${report.turns.length}; BOUNDED FAILURES: ${report.failures.length}`)
if (report.failures.length) process.exitCode = 1
