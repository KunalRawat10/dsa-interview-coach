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
  extractActiveThreadFromContent,
  getDefaultActiveThread,
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

export { extractActiveThread, extractActiveThreadFromContent, getDefaultActiveThread, serializeActiveThread }
export type { ActiveThread, ActiveThreadFrame, MessageHistoryItem, LearnerMentalModel }

// ─── Reconstruct Mental Model From History ───────────────────────────────────

export function reconstructMentalModel(
  history: MessageHistoryItem[],
  currentText: string,
  graph: ApproachGraph,
  problem?: Problem
): { model: LearnerMentalModel; currentInterpretation: LearnerInterpretation } {
  let model = createInitialMentalModel(graph)

  // Chronologically trace history and associate each user turn with the ActiveThread snapshot in effect
  let runningThread = getDefaultActiveThread()
  const turnsWithThread: { text: string; thread: ActiveThread }[] = []

  for (const item of history) {
    if (item.role === 'assistant') {
      const parsedThread = extractActiveThreadFromContent(item.content)
      if (parsedThread) {
        runningThread = parsedThread
      }
    } else if (item.role === 'user') {
      turnsWithThread.push({
        text: item.content,
        thread: runningThread,
      })
    }
  }

  // Determine whether currentText is already recorded as the last user turn in history
  const isCurrentInHistory =
    history.length > 0 &&
    history[history.length - 1].role === 'user' &&
    history[history.length - 1].content === currentText

  let priorTurns: { text: string; thread: ActiveThread }[]
  let currentTurnThread: ActiveThread

  if (isCurrentInHistory) {
    priorTurns = turnsWithThread.slice(0, -1)
    currentTurnThread = turnsWithThread[turnsWithThread.length - 1]?.thread ?? runningThread
  } else {
    priorTurns = turnsWithThread
    currentTurnThread = runningThread
  }

  // Replay prior user turns with their respective historical ActiveThreads
  for (const turn of priorTurns) {
    const interpretation = interpretLearnerMessage(turn.text, problem, turn.thread, graph)
    model = applyInterpretationDelta(model, interpretation, graph)
  }

  // Interpret current turn using its corresponding ActiveThread
  const currentInterpretation = interpretLearnerMessage(currentText, problem, currentTurnThread, graph)
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

  const isRePrompt =
    activeThread.current.targetNodeId === decision.targetNodeId &&
    activeThread.current.targetEdgeId === decision.targetEdgeId &&
    currentInterpretation.touchedNodeIds.length === 0

  const renderedText = renderSocraticResponse(
    decision.action,
    decision.cognitiveTask,
    decision.targetNode,
    decision.targetEdge,
    currentInterpretation,
    problem,
    graph,
    isRePrompt
  )

  const metaComment = serializeActiveThread(decision.newThread)
  const fullResponseWithMeta = `${renderedText}\n${metaComment}`

  console.log('[LITE DEBUG] TURN', {
    userMessage: userText,
    historyLength: history.length,
    history: history.slice(-5).map((m) => ({ role: m.role, content: m.content.slice(0, 100) })),
    activeThread,
    decision: {
      action: decision.action,
      cognitiveTask: decision.cognitiveTask,
      targetNodeId: decision.targetNodeId,
      targetEdgeId: decision.targetEdgeId,
      scoreTrace: decision.scoreTrace,
    },
    mentalModelNodes: Object.keys(model.nodes).map((k) => ({
      id: k,
      state: model.nodes[k].state,
      confidence: model.nodes[k].confidence,
    })),
    renderedResponse: renderedText,
    serializedActiveThread: metaComment,
  })

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