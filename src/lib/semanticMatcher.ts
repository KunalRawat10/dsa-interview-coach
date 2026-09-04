// ─────────────────────────────────────────────────────────────────────────────
// Semantic Matcher — Hybrid Embedding-Based Concept Recognition Layer
// ─────────────────────────────────────────────────────────────────────────────

import { embedText } from './embeddings'
import {
  type ConceptPrototype,
  GRAPH_SEMANTIC_PROTOTYPES,
  SEMANTIC_THRESHOLDS,
} from './semanticCorpus'

export interface SemanticMatch {
  conceptId: string
  conceptType: 'NODE' | 'EDGE'
  score: number
  prototypeId: string
}

interface EmbeddedPrototype {
  prototype: ConceptPrototype
  embedding: number[]
}

let prototypeEmbeddingsPromise: Promise<EmbeddedPrototype[]> | null = null

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1)
}

export async function getPrototypeEmbeddings(): Promise<EmbeddedPrototype[]> {
  if (!prototypeEmbeddingsPromise) {
    prototypeEmbeddingsPromise = (async () => {
      const embedded: EmbeddedPrototype[] = []
      for (const p of GRAPH_SEMANTIC_PROTOTYPES) {
        const vec = await embedText(p.text)
        embedded.push({ prototype: p, embedding: vec })
      }
      return embedded
    })()
  }
  return prototypeEmbeddingsPromise
}

export async function matchSemanticConcepts(
  userText: string,
  activeTargetNodeId?: string,
  activeTargetEdgeId?: string,
  problemSlug?: string
): Promise<SemanticMatch[]> {
  const trimmed = userText.trim()
  if (!trimmed || trimmed.length < 3) return []

  const queryEmbedding = await embedText(trimmed)
  const prototypes = await getPrototypeEmbeddings()

  const bestScorePerConcept = new Map<string, SemanticMatch>()

  for (const item of prototypes) {
    if (problemSlug && item.prototype.problemSlug && item.prototype.problemSlug !== problemSlug) {
      continue
    }

    const similarity = cosineSimilarity(queryEmbedding, item.embedding)
    if (similarity < SEMANTIC_THRESHOLDS.reject) continue

    const isActiveTarget =
      item.prototype.conceptId === activeTargetNodeId ||
      item.prototype.conceptId === activeTargetEdgeId

    const isOpeningDiscovery =
      activeTargetNodeId === 'goal' && item.prototype.conceptType === 'NODE'

    const threshold = isActiveTarget
      ? SEMANTIC_THRESHOLDS.activeTarget
      : isOpeningDiscovery
      ? SEMANTIC_THRESHOLDS.openingDiscovery
      : item.prototype.conceptType === 'EDGE'
      ? SEMANTIC_THRESHOLDS.edgeJustification
      : SEMANTIC_THRESHOLDS.global

    if (similarity >= threshold) {
      const candidate: SemanticMatch = {
        conceptId: item.prototype.conceptId,
        conceptType: item.prototype.conceptType,
        score: similarity,
        prototypeId: item.prototype.id,
      }

      const existing = bestScorePerConcept.get(item.prototype.conceptId)
      if (!existing || candidate.score > existing.score) {
        bestScorePerConcept.set(item.prototype.conceptId, candidate)
      }
    }
  }

  return Array.from(bestScorePerConcept.values()).sort((a, b) => b.score - a.score)
}
