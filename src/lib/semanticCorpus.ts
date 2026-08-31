// ─────────────────────────────────────────────────────────────────────────────
// Semantic Corpus — Prototype Descriptors for Graph Nodes & Relational Edges
// ─────────────────────────────────────────────────────────────────────────────

export interface ConceptPrototype {
  id: string
  conceptId: string
  conceptType: 'NODE' | 'EDGE'
  text: string
  problemSlug?: string
  approachId?: string
}

export const SEMANTIC_THRESHOLDS = {
  activeTarget: 0.68,
  global: 0.76,
  edgeJustification: 0.78,
  reject: 0.58,
} as const

export const GRAPH_SEMANTIC_PROTOTYPES: ConceptPrototype[] = [
  // ── Contains Duplicate Nodes ───────────────────────────────────────────────
  {
    id: 'node_cd_set_structure_1',
    conceptId: 'set_structure',
    conceptType: 'NODE',
    text: 'use a hash table or hash set data structure to store unique values',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_set_structure_2',
    conceptId: 'set_structure',
    conceptType: 'NODE',
    text: 'hash bucket collection for fast unique elements lookup container',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_memory_1',
    conceptId: 'memory',
    conceptType: 'NODE',
    text: 'keep track of previous elements and maintain history of examined values',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_memory_2',
    conceptId: 'memory',
    conceptType: 'NODE',
    text: 'remember numbers seen so far while scanning the array',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_lookup_1',
    conceptId: 'membership_lookup',
    conceptType: 'NODE',
    text: 'query the hash structure to check whether this value was already recorded',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_lookup_2',
    conceptId: 'membership_lookup',
    conceptType: 'NODE',
    text: 'instant constant time membership query to check existence in hash table',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_hit_1',
    conceptId: 'hit_branch',
    conceptType: 'NODE',
    text: 'finding an existing number confirms a duplicate so return true immediately',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_hit_2',
    conceptId: 'hit_branch',
    conceptType: 'NODE',
    text: 'if we have encountered this number before in the set that is a duplicate match',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_miss_1',
    conceptId: 'miss_branch',
    conceptType: 'NODE',
    text: 'if this value is new and not in the set save it and store it for later',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_miss_2',
    conceptId: 'miss_branch',
    conceptType: 'NODE',
    text: 'record unseen number into hash collection and continue scanning',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_term_1',
    conceptId: 'termination',
    conceptType: 'NODE',
    text: 'if we reach the end of the array without finding any duplicate return false',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'node_cd_term_2',
    conceptId: 'termination',
    conceptType: 'NODE',
    text: 'exhausting the list proves all numbers are distinct so return false after the loop',
    problemSlug: 'contains-duplicate',
  },

  // ── Contains Duplicate Edges (Relational Justifications) ────────────────────
  {
    id: 'edge_cd_bottleneck_to_memory_1',
    conceptId: 'bottleneck_to_memory',
    conceptType: 'EDGE',
    text: 'storing visited numbers eliminates the need to repeatedly rescan previous elements from scratch',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'edge_cd_memory_to_set_1',
    conceptId: 'memory_to_set',
    conceptType: 'EDGE',
    text: 'using a hash set allows instant O(1) lookup of remembered numbers without scanning the array again',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'edge_cd_set_to_lookup_1',
    conceptId: 'set_to_lookup',
    conceptType: 'EDGE',
    text: 'hashing calculates memory slot directly so membership check is instantaneous and constant time',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'edge_cd_lookup_to_hit_1',
    conceptId: 'lookup_to_hit',
    conceptType: 'EDGE',
    text: 'if the lookup succeeds it proves we already saw that number earlier in the scan so a duplicate exists',
    problemSlug: 'contains-duplicate',
  },
  {
    id: 'edge_cd_lookup_to_miss_1',
    conceptId: 'lookup_to_miss',
    conceptType: 'EDGE',
    text: 'if it is not present in the set store it so future elements can detect it as a duplicate',
    problemSlug: 'contains-duplicate',
  },
]
