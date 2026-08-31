import { liteRespond, reconstructMentalModel, evaluateDialogueStep } from '../src/lib/liteSocratic.ts'
import { interpretLearnerMessage } from '../src/lib/socraticInterpreter.ts'
import { extractActiveThread } from '../src/lib/activeThread.ts'
import { PROBLEMS } from '../src/data/problems.ts'
import { getActiveGraph } from '../src/lib/problemGraphs.ts'

const cdProblem = PROBLEMS.find((p) => p.slug === 'contains-duplicate')!
const graphCD = getActiveGraph('contains-duplicate')

const history = [
  {
    role: 'assistant' as const,
    content: `**${cdProblem.title}**\n---\nWhere would you like to start?\n<!--lite:{"current":{"approachId":"canonical","targetNodeId":"goal","cognitiveTask":"IDENTIFY","pedagogicalAction":"DEEPEN_PARTIAL_REASONING"},"returnStack":[]}-->`,
  },
]

function runStep(historyArr: any[], userText: string) {
  const userMsg = { role: 'user' as const, content: userText }
  const nextMessages = [...historyArr, userMsg]
  const step = evaluateDialogueStep(userMsg.content, cdProblem, nextMessages)
  const fullReply = step.fullResponseWithMeta
  const visibleReply = fullReply.replace(/<!--lite:[\s\S]*?-->/, '').trim()
  const nextHistory = [...nextMessages, { role: 'assistant' as const, content: fullReply }]
  return { visibleReply, fullReply, step, nextHistory }
}

const s1 = runStep(history, 'Use a Set')
console.log('Turn 1:', s1.visibleReply)
console.log('Turn 1 Thread:', s1.step.decision.newThread.current)

const s2 = runStep(s1.nextHistory, 'bcs complexity is O(1)')
console.log('\nTurn 2:', s2.visibleReply)
console.log('Turn 2 Thread:', s2.step.decision.newThread.current)

const s3 = runStep(
  s2.nextHistory,
  "I'll loop through the array, check if the number is already in the Set, return true if it is, otherwise add it to the Set. If I finish the loop, return false."
)
console.log('\nTurn 3:', s3.visibleReply)
console.log('Turn 3 Thread:', s3.step.decision.newThread.current)
console.log('Turn 3 Interpretation Touched:', s3.step.interpretation.touchedNodeIds)
console.log('Turn 3 Mental Model Nodes:', Object.entries(s3.step.mentalModel.nodes).map(([k, v]) => `${k}:${v.state}`))
console.log('Turn 3 Decision:', s3.step.decision)
