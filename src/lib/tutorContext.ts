// ─────────────────────────────────────────────────────────────────────────────
// PatternOS Structured Tutor Context — Lightweight Prompt Enrichment
// ─────────────────────────────────────────────────────────────────────────────

import type { Problem } from '../data/problems'
import type { ApproachGraph } from './problemGraphs'
import { type LearnerMentalModel, isNodeGrounded, isNodeCausal } from './mentalModel'
import type { PlannerDecision } from './pedagogicalPlanner'
import type { LearnerInterpretation } from './socraticInterpreter'

export interface StructuredTutorContextParams {
  graph: ApproachGraph
  model: LearnerMentalModel
  decision: PlannerDecision
  interpretation?: LearnerInterpretation
}

export function formatStructuredTutorContext(
  problem?: Problem,
  context?: StructuredTutorContextParams
): string {
  if (!context || !problem) return ''

  const { graph, model, decision, interpretation } = context

  // 1. Demonstrated vs Partial vs Remaining Concepts
  const demonstrated: string[] = []
  const partial: string[] = []
  const remaining: string[] = []

  for (const node of graph.nodes) {
    const record = model.nodes[node.id]
    if (isNodeGrounded(record, node)) {
      demonstrated.push(node.label)
    } else if (
      record &&
      (record.state === 'NAMED' ||
        (record.recognition > 0 && isNodeCausal(node) && (record.causalUnderstanding ?? 0) < 0.5))
    ) {
      partial.push(`${node.label} (recognized, but causal mechanism or purpose is incomplete)`)
    } else {
      remaining.push(node.label)
    }
  }

  // 2. Current Focus & Goal
  const focusLabel = decision.targetNode?.label ?? decision.targetNodeId ?? 'Understanding Problem Goal'
  const task = decision.cognitiveTask
  const action = decision.action
  const edgeRelation = decision.targetEdge ? `Related Relationship: ${decision.targetEdge.semanticMeaning}` : ''

  // 3. Misconceptions (Deterministic signal from Interpreter)
  const hasMisconceptions = Boolean(
    interpretation && interpretation.misconceptions && interpretation.misconceptions.length > 0
  )
  const misconceptionBlock = hasMisconceptions
    ? `
ACTIVE MISCONCEPTIONS DETECTED:
${interpretation!.misconceptions
  .map(
    (m) =>
      `- ${m}${interpretation!.misconceptionExplanation ? `: ${interpretation!.misconceptionExplanation}` : ''}`
  )
  .join('\n')}`
    : ''

  // 4. Alternative Strategies (Deterministic problem metadata)
  const hasStrategies = Boolean(
    problem.alternativeStrategies && problem.alternativeStrategies.length > 0
  )
  const strategiesBlock = hasStrategies
    ? `
VALID ALGORITHMIC STRATEGIES TO RESPECT:
${problem.alternativeStrategies!.map((a) => `- ${a}`).join('\n')}`
    : ''

  const promptBlock = `
CURRENT DETERMINISTIC TUTOR STATE (SITUATIONAL AWARENESS):
- Pedagogical Focus: "${focusLabel}"
- Cognitive Task: ${task} (Action: ${action})
${edgeRelation ? `- ${edgeRelation}\n` : ''}
- Demonstrated Knowledge:
${demonstrated.length > 0 ? demonstrated.map((d) => `  * ${d}`).join('\n') : '  * None yet (session start)'}
${partial.length > 0 ? `- Partially Understood / Needs Deepening:\n${partial.map((p) => `  * ${p}`).join('\n')}` : ''}
- Remaining Concepts to Establish:
${remaining.slice(0, 4).map((r) => `  * ${r}`).join('\n')}${misconceptionBlock}${strategiesBlock ? `\n${strategiesBlock}` : ''}

INSTRUCTIONS FOR SYNTHESIZING RESPONSE:
1. Translate the current pedagogical focus into natural, encouraging Socratic dialogue.
2. DO NOT ask the learner to rediscover what is already listed under "Demonstrated Knowledge".
3. If the learner answered with a valid alternative (e.g. sorting), discuss its tradeoffs (time/space) rather than forcing only one data structure.
4. If the learner gave partial understanding, validate what was right and probe the missing mechanism.
5. NEVER expose internal node IDs, state metrics, or algorithmic spoilers in your message.
6. Ask exactly ONE focused question to advance to the next step (2-4 sentences max).${
  hasMisconceptions
    ? `\n7. When ACTIVE MISCONCEPTIONS DETECTED is present, do NOT validate, praise, or reinforce the learner's incorrect reasoning. Address the misconception first while remaining Socratic. Do not reveal the optimal solution or hidden graph destination.`
    : ''
}`

  return promptBlock.trim()
}
