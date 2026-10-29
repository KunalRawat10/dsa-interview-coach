import { useMemo, useState, useRef } from 'react'
import { useVisibleMotion } from '../hooks/useVisibleMotion'
import { fitPatternNodes, MAP_WIDTH, MAP_HEIGHT } from '../lib/patternMapLayout'
import { useProgress } from '../hooks/useProgress'

interface PatternLayout {
  id: string
  name: string
  x: number
  y: number
  desc: string
}

// Layout + descriptions only — mastery/solved/streak now come from real progress state.
const PATTERNS: PatternLayout[] = [
  { id: 'arrays', name: 'Arrays', x: 0.15, y: 0.35, desc: 'Linear data structure. Foundation of most algorithms.' },
  { id: 'two-pointers', name: 'Two Pointers', x: 0.35, y: 0.2, desc: 'Efficient traversal technique for sorted arrays.' },
  { id: 'sliding-window', name: 'Sliding Window', x: 0.55, y: 0.25, desc: 'Subarray/substring problems with fixed/variable size.' },
  { id: 'stack', name: 'Stack', x: 0.25, y: 0.55, desc: 'LIFO structure. Used for parentheses, monotonic stacks.' },
  { id: 'queue', name: 'Queue', x: 0.45, y: 0.5, desc: 'FIFO structure. BFS, sliding window maximum.' },
  { id: 'linked-list', name: 'Linked List', x: 0.65, y: 0.4, desc: 'Dynamic linear collection. Fast insertion/deletion.' },
  { id: 'tree', name: 'Tree', x: 0.2, y: 0.75, desc: 'Hierarchical structure. DFS, BFS, traversals.' },
  { id: 'bst', name: 'BST', x: 0.4, y: 0.7, desc: 'Ordered tree for efficient search/insert/delete.' },
  { id: 'heap', name: 'Heap', x: 0.6, y: 0.65, desc: 'Complete binary tree. Priority queues, median finder.' },
  { id: 'graph', name: 'Graph', x: 0.3, y: 0.9, desc: 'Network of nodes. DFS, BFS, Dijkstra, Union-Find.' },
  { id: 'dp', name: 'Dynamic Programming', x: 0.7, y: 0.8, desc: 'Optimal substructure. Memoization and tabulation.' },
  { id: 'greedy', name: 'Greedy', x: 0.8, y: 0.55, desc: 'Local optimal choices. Activity selection, Huffman.' },
]

const CONNECTIONS: [string, string][] = [
  ['arrays', 'two-pointers'],
  ['two-pointers', 'sliding-window'],
  ['arrays', 'stack'],
  ['stack', 'queue'],
  ['queue', 'linked-list'],
  ['linked-list', 'tree'],
  ['tree', 'bst'],
  ['bst', 'heap'],
  ['tree', 'graph'],
  ['graph', 'dp'],
  ['greedy', 'dp'],
  ['arrays', 'linked-list'],
]

function getColor(mastered: number): [number, number, number] {
  if (mastered > 0.6) return [49, 91, 73]
  if (mastered > 0.3) return [155, 104, 31]
  if (mastered > 0) return [176, 62, 48]
  return [95, 111, 96]
}

export default function Constellation() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const motionActive = useVisibleMotion(mapRef, !paused)
  const { progress, recordPatternProgress, decreasePatternProgress } = useProgress()

  // Live-merged patterns: layout stays static, mastery/solved come from real state.
  const merged = useMemo(
    () =>
      PATTERNS.map((p) => {
        const stat = progress.patternProgress[p.id] ?? { mastered: 0, solved: 0 }
        return { ...p, mastered: stat.mastered, solved: stat.solved }
      }),
    [progress.patternProgress]
  )
  const nodes = useMemo(() => fitPatternNodes(merged), [merged])
  const positions = new Map(nodes.map(node => [node.id, node]))
  const selectedPattern = merged.find(pattern => pattern.id === selectedId) ?? null

  const selectedColor = selectedPattern ? getColor(selectedPattern.mastered) : [107, 140, 255]

  return (
    <div className="space-y-6">
      <div className="constellation-title space-y-2">
        <h2 className="text-3xl font-medium">Your pattern map</h2>
        <p className="text-text-tertiary text-sm">Follow the connections. Select a pattern to explore it.</p>
      </div>

      <div className="pattern-map-layout">
        <div ref={mapRef} className="workspace-panel pattern-map-graph" data-motion-active={motionActive}>
          <div className="pattern-map-key text-xs text-text-secondary" aria-label="Map legend">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success" /> Mastered</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning" /> Learning</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-danger" /> Weak</span>
            <span className="text-text-muted">Select a node to explore</span>
            <button className="pattern-motion-toggle" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? 'Resume motion' : 'Pause motion'}</button>
          </div>
          <div className="pattern-map-viewport">
            <svg className="pattern-map-svg" viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="group" aria-label="Algorithm pattern map" preserveAspectRatio="xMidYMid meet">
              {CONNECTIONS.map(([from, to]) => {
                const a = positions.get(from)!, b = positions.get(to)!
                const active = selectedId === from || selectedId === to
                return <g key={`${from}-${to}`} aria-hidden="true"><line className="pattern-map-edge" pathLength="1" x1={a.px} y1={a.py} x2={b.px} y2={b.py} stroke={active ? '#ad4c2c' : '#c4cbbc'} strokeWidth={active ? 1.8 : 1.2} /><line className={`pattern-map-flow${active ? ' is-connected' : ''}`} x1={a.px} y1={a.py} x2={b.px} y2={b.py} stroke={active ? '#ad4c2c' : '#7d947e'} strokeWidth="2" strokeDasharray="2 34" /></g>
              })}
              {nodes.map(node => {
                const color = `rgb(${getColor(node.mastered).join(',')})`
                return <g key={node.id} className="pattern-map-node" role="button" tabIndex={0} aria-label={`${node.name}, ${Math.round(node.mastered * 100)} percent mastery`} aria-pressed={selectedId === node.id} onClick={() => setSelectedId(node.id)} onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(node.id) }
                }}>
                  <title>{node.name}</title>
                  <circle cx={node.px} cy={node.py} r="22" fill="transparent" />
                  <circle className="pattern-node-halo" cx={node.px} cy={node.py} r="13" fill={color} style={{ animationDelay: `${nodes.indexOf(node) * -.4}s` }} aria-hidden="true" />
                  <circle className="pattern-node-ring" cx={node.px} cy={node.py} r="16" fill="#f5ebe0" stroke="#ad4c2c" strokeWidth="1.5" />
                  <circle cx={node.px} cy={node.py} r={7 + node.mastered * 4} fill={color} />
                  <text x={node.px} y={node.py + 29} textAnchor="middle" fill="#414d3f" fontFamily="Segoe UI, sans-serif" fontSize="13">{node.name}</text>
                </g>
              })}
            </svg>
          </div>
        </div>

        <div className="workspace-panel pattern-map-panel p-5 space-y-4">
          {selectedPattern ? (
            <div key={selectedPattern.id} className="pattern-detail-enter space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-1">{selectedPattern.name}</h3>
                <p className="text-sm text-text-tertiary leading-relaxed">{selectedPattern.desc}</p>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: Math.round(selectedPattern.mastered * 100) + '%',
                    background: 'rgb(' + selectedColor[0] + ',' + selectedColor[1] + ',' + selectedColor[2] + ')',
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="text-center">
                  <div className="text-xl font-medium text-accent font-[tabular-nums]">
                    {Math.round(selectedPattern.mastered * 100)}%
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">mastery</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-medium text-accent font-[tabular-nums]">{selectedPattern.solved}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">solved</div>
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="text-[11px] text-text-muted">Solved one — how hard was it?</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => recordPatternProgress(selectedPattern.id, 'easy')}
                    className="py-2 rounded-lg bg-success/10 text-success text-xs font-medium hover:bg-success/20 transition-colors"
                  >
                    Easy
                  </button>
                  <button
                    onClick={() => recordPatternProgress(selectedPattern.id, 'medium')}
                    className="py-2 rounded-lg bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 transition-colors"
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => recordPatternProgress(selectedPattern.id, 'hard')}
                    className="py-2 rounded-lg bg-danger/10 text-danger text-xs font-medium hover:bg-danger/20 transition-colors"
                  >
                    Hard
                  </button>
                </div>
                <button
                  onClick={() => decreasePatternProgress(selectedPattern.id)}
                  disabled={selectedPattern.mastered === 0 && selectedPattern.solved === 0}
                  className="w-full py-2 rounded-lg bg-surface/60 text-text-tertiary text-xs font-medium hover:bg-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  − Undo / mark as struggled
                </button>
              </div>
              {selectedPattern.mastered === 0 && (
                <p className="text-[11px] text-text-muted text-center">
                  Not started yet — practice this in the Socratic Chamber or mark it here as you go.
                </p>
              )}
            </div>
          ) : (
            <div className="min-h-[270px] flex flex-col items-center justify-center text-text-muted space-y-2">
              <div className="text-3xl">✦</div>
              <p className="text-sm">Select a pattern</p>
              <p className="text-xs text-text-muted">Click any node on the graph</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
