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
  recognition: number // 0..1: concept mentioned / recognized
  causalUnderstanding: number // 0..1: understands why/how it works or avoids redundant work
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

export function isNodeCausal(node: { category: string }): boolean {
  return node.category === 'BOTTLENECK' || node.category === 'INVARIANT_MECHANISM'
}

export function isNodeGrounded(record: NodeStateRecord | undefined, node?: { category: string }): boolean {
  if (!record) return false
  if (record.state === 'APPLIED') return true
  if (record.state === 'UNKNOWN') return false

  const requiresCausal = node ? isNodeCausal(node) : false
  if (requiresCausal) {
    if (record.recognition !== undefined && record.causalUnderstanding !== undefined) {
      return record.recognition >= 0.7 && record.causalUnderstanding >= 0.5
    }
    return record.state === 'ARTICULATED'
  }

  if (record.recognition !== undefined) {
    return record.recognition >= 0.7
  }
  return record.state === 'ARTICULATED'
}

export function createInitialMentalModel(graph: ApproachGraph): LearnerMentalModel {
  const nodes: Record<string, NodeStateRecord> = {}
  const edges: Record<string, EdgeStateRecord> = {}

  for (const node of graph.nodes) {
    nodes[node.id] = {
      state: 'UNKNOWN',
      confidence: 'SOLID',
      evidence: [],
      recognition: 0,
      causalUnderstanding: 0,
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
        recognition: Math.min(Math.max(existing?.recognition ?? 0, 0.4), 0.4),
        causalUnderstanding: 0,
      }
    }
    return nextModel
  }

  // Causal/relational evidence detection helpers
  const hasCausalConnective =
    /\b(because|so\s+that|so\s+we\s+(don'?t|can)|avoids?|instead\s+of|prevents?|eliminates|since|due\s+to|in\s+order\s+to|means\s+that|tells\s+us\s+that|proves|why|before\s+\w+|after\s+\w+|without\s+(having\s+to\s+|needing\s+to\s+)?(scan|loop|check|re-scan|search|look)|if\s+.*\b(then|means|is|we\s+found|return))\b/i.test(
      interpretation.rawText
    )

  const hasComplexityOrAvoidance =
    /\b(without\s+scanning|without\s+checking|without\s+looping|rescan|rescanning|from\s+scratch|quadratic|o\(n\^?2?\)|o\(1\)|constant\s+time|fast\s+lookup|instant\s+lookup|already\s+seen|seen\s+before|encountered\s+earlier|previous(ly)?\s+seen|already\s+there|already\s+in)\b/i.test(
      interpretation.rawText
    )

  // 3. Update Touched Nodes
  for (const nodeId of interpretation.touchedNodeIds) {
    const existing = nextModel.nodes[nodeId]
    const node = graph.nodes.find((n) => n.id === nodeId)
    const wordCount = interpretation.cleanedText.split(/\s+/).length
    const isContextual = interpretation.contextuallyMatchedNodeIds?.includes(nodeId)
    const isSingleWordOutOfContext = wordCount <= 1 && !isContextual && !interpretation.hasCode

    // Dimension 1: Recognition (0..1)
    let newRecognition = 1.0
    if (isSingleWordOutOfContext && (existing?.recognition ?? 0) < 0.5) {
      newRecognition = 0.5
    }
    const recognition = Math.max(existing?.recognition ?? 0, newRecognition)

    // Dimension 2: Causal Understanding (0..1)
    const adjacentNodeIds = graph.edges
      .filter((e) => e.from === nodeId || e.to === nodeId)
      .map((e) => (e.from === nodeId ? e.to : e.from))
    const touchesAdjacentNode = adjacentNodeIds.some((adjId) => interpretation.touchedNodeIds.includes(adjId))
    const touchesIncidentEdge = interpretation.touchedEdgeIds.some((eId) => {
      const e = graph.edges.find((x) => x.id === eId)
      return e && (e.from === nodeId || e.to === nodeId)
    })

    let calculatedCausal = 0.0
    if (touchesIncidentEdge) {
      calculatedCausal = hasCausalConnective ? 1.0 : 0.9
    } else if (hasCausalConnective && (touchesAdjacentNode || hasComplexityOrAvoidance)) {
      calculatedCausal = 0.95
    } else if (hasCausalConnective) {
      calculatedCausal = 0.85
    } else if (hasComplexityOrAvoidance) {
      calculatedCausal = 0.75
    } else if (touchesAdjacentNode) {
      calculatedCausal = 0.2
    }

    const causalUnderstanding = Math.max(existing?.causalUnderstanding ?? 0, calculatedCausal)

    // Derived Backward-Compatible NodeUnderstandingState
    const requiresCausal = node ? isNodeCausal(node) : false
    let newState: NodeUnderstandingState = 'UNKNOWN'

    if (interpretation.hasCode) {
      newState = 'APPLIED'
    } else if (isSingleWordOutOfContext && existing?.state !== 'ARTICULATED') {
      newState = 'NAMED'
    } else if (requiresCausal) {
      if (recognition >= 0.7 && causalUnderstanding >= 0.5) {
        newState = 'ARTICULATED'
      } else if (recognition >= 0.4) {
        newState = 'NAMED'
      } else {
        newState = existing?.state ?? 'UNKNOWN'
      }
    } else {
      if (recognition >= 0.7) {
        newState = 'ARTICULATED'
      } else if (recognition >= 0.4) {
        newState = 'NAMED'
      } else {
        newState = existing?.state ?? 'UNKNOWN'
      }
    }

    nextModel.nodes[nodeId] = {
      state: newState,
      confidence: interpretation.confidence,
      evidence: [...(existing?.evidence ?? []), interpretation.rawText],
      recognition,
      causalUnderstanding,
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
