// ─────────────────────────────────────────────────────────────────────────────
// PatternOS Lite Socratic Engine — Graph-Backed Cognitive Dialogue Orchestrator
// ─────────────────────────────────────────────────────────────────────────────
//
// Pipeline:
//   Learner Message
//        │
//        ▼
//   1. Ingest Invariable ActiveThread from history metadata
//        │
//        ▼
//   2. Socratic Interpreter (signal extraction & semantic interpretation)
//        │
//        ▼
//   3. Mental Model Delta Applicator (deterministic relational graph update)
//        │
//        ▼
//   4. Candidate-Scoring Pedagogical Planner (locality, prereqs, unblocking)
//        │
//        ▼
//   5. Socratic Renderer (constructs reflection + exactly ONE cognitive task)
//        │
//        ▼
//   6. Persist ActiveThread invisibly in assistant response
// ─────────────────────────────────────────────────────────────────────────────

import type { Problem } from '../data/problems'
import { type ApproachGraph, getActiveGraph } from './problemGraphs'
import {
  type ActiveThread,
  type ActiveThreadFrame,
  type MessageHistoryItem,
  extractActiveThread,
  serializeActiveThread,
} from './activeThread'
import {
  type LearnerMentalModel,
  createInitialMentalModel,
  applyInterpretationDelta,
} from './mentalModel'
import { interpretLearnerMessage, type LearnerInterpretation } from './socraticInterpreter'
import { planPedagogicalAction, type PlannerDecision } from './pedagogicalPlanner'
import { renderSocraticResponse } from './socraticRenderer'

export { extractActiveThread, serializeActiveThread }
export type { ActiveThread, ActiveThreadFrame, MessageHistoryItem, LearnerMentalModel }

// ─── Reconstruct Mental Model From History ───────────────────────────────────

export function reconstructMentalModel(
  history: MessageHistoryItem[],
  currentText: string,
  graph: ApproachGraph,
  problem?: Problem
): { model: LearnerMentalModel; currentInterpretation: LearnerInterpretation } {
  let model = createInitialMentalModel(graph)
  let activeThread = extractActiveThread([])

  // Replay user turns through interpreter and delta applicator
  const userTurns = history.filter((m) => m.role === 'user').map((m) => m.content)
  for (const turn of userTurns) {
    const interpretation = interpretLearnerMessage(turn, problem, activeThread, graph)
    model = applyInterpretationDelta(model, interpretation, graph)
  }

  // Interpret current turn
  activeThread = extractActiveThread(history)
  const currentInterpretation = interpretLearnerMessage(currentText, problem, activeThread, graph)
  model = applyInterpretationDelta(model, currentInterpretation, graph)

  return { model, currentInterpretation }
}

// ─── Evaluation Trace (For Inspection & Tests) ───────────────────────────────

export interface SocraticEvaluationTrace {
  activeThread: ActiveThread
  interpretation: LearnerInterpretation
  mentalModel: LearnerMentalModel
  decision: PlannerDecision
  renderedText: string
  fullResponseWithMeta: string
}

export function evaluateDialogueStep(
  userText: string,
  problem?: Problem,
  history: MessageHistoryItem[] = []
): SocraticEvaluationTrace {
  const activeThread = extractActiveThread(history)
  const graph = getActiveGraph(problem?.slug, activeThread.current.approachId)
  const { model, currentInterpretation } = reconstructMentalModel(history, userText, graph, problem)

  const decision = planPedagogicalAction(model, activeThread, currentInterpretation, graph)
  const renderedText = renderSocraticResponse(
    decision.action,
    decision.cognitiveTask,
    decision.targetNode,
    decision.targetEdge,
    currentInterpretation,
    problem,
    graph
  )

  const metaComment = serializeActiveThread(decision.newThread)
  const fullResponseWithMeta = `${renderedText}\n${metaComment}`

  return {
    activeThread,
    interpretation: currentInterpretation,
    mentalModel: model,
    decision,
    renderedText,
    fullResponseWithMeta,
  }
}

// ─── Backward-Compatible evaluateLearnerState (Adapter for Existing Tests) ───

export function evaluateLearnerState(
  userText: string,
  problem?: Problem,
  history: MessageHistoryItem[] = []
) {
  const trace = evaluateDialogueStep(userText, problem, history)
  return {
    learnerIntent: trace.interpretation.isQuestion
      ? 'FOLLOW_UP_QUESTION'
      : trace.interpretation.isPassiveAgreement
      ? 'CONFIRMATION'
      : trace.interpretation.isHedged
      ? 'HESITANT_ANSWER'
      : trace.decision.action === 'OFFER_CODE_IMPLEMENTATION'
      ? 'LEARNER_JUMP_AHEAD'
      : 'CORRECT_REASONED',
    pedagogicalMove: trace.decision.action,
    cognitiveTask: trace.decision.cognitiveTask,
    correctness: trace.interpretation.misconceptions.length > 0 ? 'incorrect' : 'correct',
    confidence: trace.interpretation.confidence === 'SOLID' ? 1.0 : 0.6,
    newlyDemonstrated: trace.interpretation.touchedNodeIds,
    previouslyDemonstrated: Object.keys(trace.mentalModel.nodes).filter(
      (k) => trace.mentalModel.nodes[k].state === 'ARTICULATED' || trace.mentalModel.nodes[k].state === 'APPLIED'
    ),
    stillMissing: Object.keys(trace.mentalModel.nodes).filter((k) => trace.mentalModel.nodes[k].state === 'UNKNOWN'),
    nextTarget: trace.decision.targetNodeId,
    reflection: trace.renderedText.split('.')[0] + '.',
    question: trace.renderedText,
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function liteRespond(
  userText: string,
  problem?: Problem,
  history: MessageHistoryItem[] = []
): string {
  const step = evaluateDialogueStep(userText, problem, history)
  return step.fullResponseWithMeta
}