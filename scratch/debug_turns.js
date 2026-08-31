import { evaluateDialogueStep } from '../src/lib/liteSocratic.js'
import { PROBLEMS } from '../src/data/problems.js'

const problem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')

const turns = [
  "I'd compare every number against the others.",
  "Maybe O(n²)?",
  "Why is it n²?",
  "Oh because we'd keep checking stuff we've already seen.",
  "So maybe store the previous numbers?",
  "Set?",
  "Why is Set faster?",
  "Okay, got it.",
  "So if the number is already there that's the duplicate right?",
  "And if it's not in the set we add it.",
  "Then return false at the end if none found."
]

const history = [{ role: 'assistant', content: 'Where would you like to start? What stands out about the inputs or what the problem is asking for?' }]

for (let i = 0; i < turns.length; i++) {
  const userMsg = turns[i]
  console.log(`\n============================================================`)
  console.log(`TURN ${i + 1}: Learner said "${userMsg}"`)
  const trace = evaluateDialogueStep(userMsg, problem, history)
  console.log(`ACTIVE THREAD BEFORE:`, trace.activeThread.current)
  console.log(`INTERPRETATION touchedNodeIds:`, trace.interpretation.touchedNodeIds)
  console.log(`INTERPRETATION confidence:`, trace.interpretation.confidence)
  console.log(`INTERPRETATION isQuestion:`, trace.interpretation.isQuestion)
  console.log(`INTERPRETATION isPassiveAgreement:`, trace.interpretation.isPassiveAgreement)
  console.log(`MENTAL MODEL NODES:`, Object.entries(trace.mentalModel.nodes).filter(([k, v]) => v.state !== 'UNKNOWN').map(([k, v]) => `${k}:${v.state}(${v.confidence})`))
  console.log(`PLANNER DECISION:`, {
    action: trace.decision.action,
    cognitiveTask: trace.decision.cognitiveTask,
    targetNodeId: trace.decision.targetNodeId,
    targetEdgeId: trace.decision.targetEdgeId,
    scoreTrace: trace.decision.scoreTrace
  })
  console.log(`RENDERED RESPONSE: "${trace.renderedText}"`)

  history.push({ role: 'user', content: userMsg })
  history.push({ role: 'assistant', content: trace.fullResponseWithMeta })
}
