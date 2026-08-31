// ─────────────────────────────────────────────────────────────────────────────
// Pedagogical Planner — Candidate Scoring & Pedagogical Action Decision
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ApproachGraph,
  CognitiveTask,
  PedagogicalAction,
  ConceptNode,
  ConceptEdge,
} from './problemGraphs'
import type { LearnerMentalModel } from './mentalModel'
import type { ActiveThread } from './activeThread'
import type { LearnerInterpretation } from './socraticInterpreter'

export interface PlannerDecision {
  action: PedagogicalAction
  cognitiveTask: CognitiveTask
  targetNodeId?: string
  targetEdgeId?: string
  targetNode?: ConceptNode
  targetEdge?: ConceptEdge
  newThread: ActiveThread
  scoreTrace?: string
}

interface CandidateEvaluation {
  nodeId?: string
  edgeId?: string
  cognitiveTask: CognitiveTask
  action: PedagogicalAction
  score: number
  rationale: string
}

export function planPedagogicalAction(
  model: LearnerMentalModel,
  thread: ActiveThread,
  interpretation: LearnerInterpretation,
  graph: ApproachGraph
): PlannerDecision {
  const currentFrame = thread.current

  // ── 1. HIGH-PRIORITY INTERRUPT: Learner Question ───────────────────────────
  if (interpretation.isQuestion) {
    const questionTargetId = interpretation.questionTargetNodeId ?? currentFrame.targetNodeId ?? 'goal'
    const targetNode = graph.nodes.find((n) => n.id === questionTargetId)
    const newReturnStack = [...thread.returnStack, currentFrame]

    const newThread: ActiveThread = {
      current: {
        approachId: graph.id,
        targetNodeId: questionTargetId,
        cognitiveTask: 'EXPLAIN',
        pedagogicalAction: 'ANSWER_QUESTION_AND_RESUME',
      },
      returnStack: newReturnStack,
    }

    return {
      action: 'ANSWER_QUESTION_AND_RESUME',
      cognitiveTask: 'EXPLAIN',
      targetNodeId: questionTargetId,
      targetNode,
      newThread,
      scoreTrace: 'High-priority learner question interrupt; pushed current frame onto return stack.',
    }
  }

  // ── 2. HIGH-PRIORITY: Active Misconception Correction ─────────────────────
  if (model.activeMisconceptions.length > 0) {
    const targetNodeId = currentFrame.targetNodeId ?? 'goal'
    const targetNode = graph.nodes.find((n) => n.id === targetNodeId)

    const newThread: ActiveThread = {
      current: {
        approachId: graph.id,
        targetNodeId,
        cognitiveTask: 'CORRECT',
        pedagogicalAction: 'CORRECT_MISCONCEPTION',
      },
      returnStack: thread.returnStack,
    }

    return {
      action: 'CORRECT_MISCONCEPTION',
      cognitiveTask: 'CORRECT',
      targetNodeId,
      targetNode,
      newThread,
      scoreTrace: `Active misconception (${model.activeMisconceptions[0]}); prioritized immediate correction.`,
    }
  }

  // ── 3. HIGH-PRIORITY: Alternative Approach Exploration ────────────────────
  if (interpretation.suggestedApproachId && interpretation.suggestedApproachId !== graph.id) {
    const altGraphId = interpretation.suggestedApproachId
    const newThread: ActiveThread = {
      current: {
        approachId: altGraphId,
        targetNodeId: 'sorting_structure',
        cognitiveTask: 'COMPARE',
        pedagogicalAction: 'EXPLORE_ALTERNATIVE_APPROACH',
      },
      returnStack: thread.returnStack,
    }

    return {
      action: 'EXPLORE_ALTERNATIVE_APPROACH',
      cognitiveTask: 'COMPARE',
      targetNodeId: 'sorting_structure',
      newThread,
      scoreTrace: `Learner suggested alternative approach (${altGraphId}); switching active subgraph.`,
    }
  }

  // ── 4. HIGH-PRIORITY: Passive Agreement -> Test Concrete Application ──────
  if (interpretation.isPassiveAgreement) {
    const targetNodeId = currentFrame.targetNodeId ?? 'hit_branch'
    const targetNode = graph.nodes.find((n) => n.id === targetNodeId)

    const newThread: ActiveThread = {
      current: {
        approachId: graph.id,
        targetNodeId,
        cognitiveTask: 'APPLY',
        pedagogicalAction: 'TEST_CONCRETE_APPLICATION',
      },
      returnStack: thread.returnStack,
    }

    return {
      action: 'TEST_CONCRETE_APPLICATION',
      cognitiveTask: 'APPLY',
      targetNodeId,
      targetNode,
      newThread,
      scoreTrace: 'Passive agreement detected; issuing concrete 1-step application test.',
    }
  }

  // ── 5. RESUME INTERRUPTED STACK (If Return Stack Exists and Question Resolved) ──
  if (thread.returnStack.length > 0 && currentFrame.pedagogicalAction === 'ANSWER_QUESTION_AND_RESUME') {
    const resumedFrame = thread.returnStack[thread.returnStack.length - 1]
    const remainingStack = thread.returnStack.slice(0, -1)
    const targetNode = graph.nodes.find((n) => n.id === resumedFrame.targetNodeId)
    const targetEdge = graph.edges.find((e) => e.id === resumedFrame.targetEdgeId)

    const newThread: ActiveThread = {
      current: resumedFrame,
      returnStack: remainingStack,
    }

    return {
      action: resumedFrame.pedagogicalAction,
      cognitiveTask: resumedFrame.cognitiveTask,
      targetNodeId: resumedFrame.targetNodeId,
      targetEdgeId: resumedFrame.targetEdgeId,
      targetNode,
      targetEdge,
      newThread,
      scoreTrace: 'Popped return stack to resume original pre-interruption conversational task.',
    }
  }

  // ── 6. IMPLEMENTATION READINESS CHECK ───────────────────────────────────────
  const operationalBranches = graph.nodes.filter((n) => n.category === 'OPERATIONAL_BRANCH')
  const allBranchesGrounded =
    operationalBranches.length > 0 &&
    operationalBranches.every((n) => {
      const rec = model.nodes[n.id]
      return rec && (rec.state === 'ARTICULATED' || rec.state === 'APPLIED')
    })

  if (allBranchesGrounded) {
    const termNode = graph.nodes.find((n) => n.category === 'TERMINATION') ?? operationalBranches[operationalBranches.length - 1]
    const termRecord = model.nodes[termNode.id]

    // Determine if the learner has already responded to the code implementation prompt
    const hasProvidedImplementation =
      currentFrame.pedagogicalAction === 'OFFER_CODE_IMPLEMENTATION' ||
      interpretation.hasCode ||
      termRecord?.state === 'APPLIED' ||
      termRecord?.state === 'ARTICULATED' ||
      interpretation.touchedNodeIds.includes(termNode.id)

    const isInitialOffer = !hasProvidedImplementation && currentFrame.pedagogicalAction !== 'OFFER_CODE_IMPLEMENTATION'

    const cognitiveTask: CognitiveTask = isInitialOffer ? 'IMPLEMENT' : 'SUMMARIZE'

    const newThread: ActiveThread = {
      current: {
        approachId: graph.id,
        targetNodeId: termNode.id,
        cognitiveTask,
        pedagogicalAction: 'OFFER_CODE_IMPLEMENTATION',
      },
      returnStack: thread.returnStack,
    }

    return {
      action: 'OFFER_CODE_IMPLEMENTATION',
      cognitiveTask,
      targetNodeId: termNode.id,
      targetNode: termNode,
      newThread,
      scoreTrace: isInitialOffer
        ? 'All operational branches articulated; learner is ready for code implementation.'
        : 'Learner provided code implementation / summary; validating and concluding solution.',
    }
  }

  // ── 7. CANDIDATE SCORING & SELECTION ───────────────────────────────────────
  // Locality Focus: The primary node learner just touched, or the node coach just asked about
  const focusNodeId = interpretation.primaryTouchedNodeId ?? interpretation.touchedNodeIds[0] ?? currentFrame.targetNodeId ?? 'goal'
  const focusNode = graph.nodes.find((n) => n.id === focusNodeId)
  const candidates: CandidateEvaluation[] = []

  // A. Candidate: Fragility on current focus node
  const focusRecord = model.nodes[focusNodeId]
  if (focusRecord && focusRecord.confidence === 'FRAGILE') {
    candidates.push({
      nodeId: focusNodeId,
      cognitiveTask: 'JUSTIFY',
      action: 'ANCHOR_FRAGILE_KNOWLEDGE',
      score: 95,
      rationale: `Learner gave fragile/hedged reasoning on ${focusNodeId}; anchor before moving.`,
    })
  }

  // B. Candidate: Deepening named-only focus node
  if (focusRecord && focusRecord.state === 'NAMED') {
    candidates.push({
      nodeId: focusNodeId,
      cognitiveTask: 'JUSTIFY',
      action: 'DEEPEN_PARTIAL_REASONING',
      score: 90,
      rationale: `Learner named ${focusNodeId} without explaining mechanism.`,
    })
  }

  // C. Candidate: Adjacent Outgoing / Incoming Edges
  for (const edge of graph.edges) {
    const edgeRecord = model.edges[edge.id]
    const fromRecord = model.nodes[edge.from]
    const toNode = graph.nodes.find((n) => n.id === edge.to)

    // Prerequisites check: origin must be articulated and destination prereqs met
    const originGrounded = fromRecord && (fromRecord.state === 'ARTICULATED' || fromRecord.state === 'APPLIED')
    const prereqsMet = toNode
      ? toNode.prerequisiteNodeIds.every((pId) => {
          const rec = model.nodes[pId]
          return rec && (rec.state === 'ARTICULATED' || rec.state === 'APPLIED')
        })
      : true

    if (!originGrounded || !prereqsMet) continue

    let score = 50
    // 1. Locality bonus: direct connection to focus node
    if (edge.from === focusNodeId || edge.to === focusNodeId) score += 50
    // 2. Sibling edge proximity: originates from focus node's prerequisite
    const isSiblingEdge = focusNode && focusNode.prerequisiteNodeIds.includes(edge.from)
    if (isSiblingEdge) score += 25
    // 3. Thread continuity bonus
    if (edge.id === currentFrame.targetEdgeId) score += 20
    // 4. Unclaimed edge value
    if (!edgeRecord || edgeRecord.state === 'UNCLAIMED') score += 30
    // 5. Downstream unblocking value
    const downstreamCount = graph.edges.filter((e) => e.from === edge.to).length
    score += downstreamCount * 5

    // Penalty if destination node is already articulated/applied
    const destRecord = model.nodes[edge.to]
    if (destRecord && (destRecord.state === 'ARTICULATED' || destRecord.state === 'APPLIED')) {
      score -= 60
    }

    candidates.push({
      edgeId: edge.id,
      nodeId: edge.to,
      cognitiveTask: 'JUSTIFY',
      action: 'PROBE_ADJACENT_RELATIONSHIP',
      score,
      rationale: `Adjacent edge ${edge.id} (${edge.from} -> ${edge.to}) with prereqs met.`,
    })
  }

  // D. Candidate: Unarticulated Prerequisite-Ready Nodes
  for (const node of graph.nodes) {
    const nodeRecord = model.nodes[node.id]
    const isUnresolved = !nodeRecord || nodeRecord.state === 'UNKNOWN' || nodeRecord.state === 'NAMED'
    if (!isUnresolved) continue

    const prereqsMet = node.prerequisiteNodeIds.every((pId) => {
      const rec = model.nodes[pId]
      return rec && (rec.state === 'ARTICULATED' || rec.state === 'APPLIED')
    })
    if (!prereqsMet) continue

    let score = 50
    if (node.id === focusNodeId) score += 40

    // Proximity to focus node: direct edge adjacency
    const isAdjacent = graph.edges.some((e) => (e.from === focusNodeId && e.to === node.id) || (e.from === node.id && e.to === focusNodeId))
    if (isAdjacent) score += 30

    // Shared prerequisite / sibling branch proximity (e.g. hit_branch & miss_branch)
    const sharesPrereq =
      focusNode &&
      focusNode.id !== node.id &&
      node.prerequisiteNodeIds.length > 0 &&
      node.prerequisiteNodeIds.some((pId) => focusNode.prerequisiteNodeIds.includes(pId))
    if (sharesPrereq) score += 25

    // Prerequisite depth bonus: deeper frontier nodes are prioritized over root nodes
    score += node.prerequisiteNodeIds.length * 10

    // Downstream grounding penalty: if downstream dependent nodes are already articulated,
    // this upstream node has been implicitly bypassed/subsumed (e.g. goal when set_structure is known)
    const hasDownstreamGrounded = graph.edges.some(
      (e) => e.from === node.id && (model.nodes[e.to]?.state === 'ARTICULATED' || model.nodes[e.to]?.state === 'APPLIED')
    )
    if (hasDownstreamGrounded) {
      score -= 40
    }

    // Task definition based on category
    let task: CognitiveTask = 'IDENTIFY'
    if (node.category === 'BOTTLENECK' || node.category === 'INVARIANT_MECHANISM') task = 'EXPLAIN'
    if (node.category === 'OPERATIONAL_BRANCH') task = 'APPLY'

    candidates.push({
      nodeId: node.id,
      cognitiveTask: task,
      action: 'DEEPEN_PARTIAL_REASONING',
      score,
      rationale: `Prerequisite-ready unarticulated node ${node.id}.`,
    })
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score)
  const bestCandidate = candidates[0] ?? {
    nodeId: 'goal',
    cognitiveTask: 'IDENTIFY' as CognitiveTask,
    action: 'DEEPEN_PARTIAL_REASONING' as PedagogicalAction,
    score: 10,
    rationale: 'Fallback to goal node.',
  }

  const targetNode = graph.nodes.find((n) => n.id === bestCandidate.nodeId)
  const targetEdge = graph.edges.find((e) => e.id === bestCandidate.edgeId)

  const newThread: ActiveThread = {
    current: {
      approachId: graph.id,
      targetNodeId: bestCandidate.nodeId,
      targetEdgeId: bestCandidate.edgeId,
      cognitiveTask: bestCandidate.cognitiveTask,
      pedagogicalAction: bestCandidate.action,
    },
    returnStack: thread.returnStack,
  }

  return {
    action: bestCandidate.action,
    cognitiveTask: bestCandidate.cognitiveTask,
    targetNodeId: bestCandidate.nodeId,
    targetEdgeId: bestCandidate.edgeId,
    targetNode,
    targetEdge,
    newThread,
    scoreTrace: `Selected ${bestCandidate.action} on ${bestCandidate.nodeId ?? bestCandidate.edgeId} (Score: ${bestCandidate.score}) — ${bestCandidate.rationale}`,
  }
}
