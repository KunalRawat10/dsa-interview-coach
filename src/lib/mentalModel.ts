// ─────────────────────────────────────────────────────────────────────────────
// Mental Model — Dynamic Relational Graph State & Delta Application
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ApproachGraph,
  NodeUnderstandingState,
  EdgeUnderstandingState,
  EpistemicConfidence,
  MisconceptionType,
} from './problemGraphs'
import type { LearnerInterpretation } from './socraticInterpreter'

export interface NodeStateRecord {
  state: NodeUnderstandingState
  confidence: EpistemicConfidence
  evidence: string[]
}

export interface EdgeStateRecord {
  state: EdgeUnderstandingState
  confidence: EpistemicConfidence
  evidence: string[]
}

export interface LearnerMentalModel {
  activeApproachId: string
  nodes: Record<string, NodeStateRecord>
  edges: Record<string, EdgeStateRecord>
  activeMisconceptions: MisconceptionType[]
}

export function createInitialMentalModel(graph: ApproachGraph): LearnerMentalModel {
  const nodes: Record<string, NodeStateRecord> = {}
  const edges: Record<string, EdgeStateRecord> = {}

  for (const node of graph.nodes) {
    nodes[node.id] = {
      state: 'UNKNOWN',
      confidence: 'SOLID',
      evidence: [],
    }
  }

  for (const edge of graph.edges) {
    edges[edge.id] = {
      state: 'UNCLAIMED',
      confidence: 'SOLID',
      evidence: [],
    }
  }

  return {
    activeApproachId: graph.id,
    nodes,
    edges,
    activeMisconceptions: [],
  }
}

export function applyInterpretationDelta(
  model: LearnerMentalModel,
  interpretation: LearnerInterpretation,
  graph: ApproachGraph
): LearnerMentalModel {
  // Clone to maintain immutability
  const nextModel: LearnerMentalModel = {
    activeApproachId: interpretation.suggestedApproachId ?? model.activeApproachId,
    nodes: { ...model.nodes },
    edges: { ...model.edges },
    activeMisconceptions: [...interpretation.misconceptions],
  }

  // 1. Passive agreement does NOT advance knowledge
  if (interpretation.isPassiveAgreement) {
    return nextModel
  }

  // 2. Misconceptions: If active misconception exists on touched node, do not mark as ARTICULATED
  if (interpretation.misconceptions.length > 0) {
    for (const nodeId of interpretation.touchedNodeIds) {
      const existing = nextModel.nodes[nodeId]
      nextModel.nodes[nodeId] = {
        state: existing ? (existing.state === 'UNKNOWN' ? 'NAMED' : existing.state) : 'NAMED',
        confidence: 'FRAGILE',
        evidence: [...(existing?.evidence ?? []), interpretation.rawText],
      }
    }
    return nextModel
  }

  // 3. Update Touched Nodes
  for (const nodeId of interpretation.touchedNodeIds) {
    const existing = nextModel.nodes[nodeId]
    const wordCount = interpretation.cleanedText.split(/\s+/).length
    const isContextual = interpretation.contextuallyMatchedNodeIds?.includes(nodeId)
    const isSingleWordOutOfContext = wordCount <= 1 && !isContextual && !interpretation.hasCode

    let newState: NodeUnderstandingState = 'ARTICULATED'
    if (isSingleWordOutOfContext && existing?.state !== 'ARTICULATED') {
      newState = 'NAMED'
    }
    if (interpretation.hasCode) {
      newState = 'APPLIED'
    }

    nextModel.nodes[nodeId] = {
      state: newState,
      confidence: interpretation.confidence,
      evidence: [...(existing?.evidence ?? []), interpretation.rawText],
    }
  }

  // 4. Update Touched Edges
  for (const edge of graph.edges) {
    if (interpretation.touchedEdgeIds.includes(edge.id)) {
      const existing = nextModel.edges[edge.id]
      const touchesBothNodes =
        interpretation.touchedNodeIds.includes(edge.from) && interpretation.touchedNodeIds.includes(edge.to)
      const hasCausalConnective =
        /\b(because|so that|so we don't|avoids?|instead of|prevents?|since|due to)\b/i.test(interpretation.rawText)
      const edgeState: EdgeUnderstandingState = touchesBothNodes || hasCausalConnective ? 'JUSTIFIED' : 'CLAIMED'

      nextModel.edges[edge.id] = {
        state: edgeState,
        confidence: interpretation.confidence,
        evidence: [...(existing?.evidence ?? []), interpretation.rawText],
      }
    }
  }

  return nextModel
}
