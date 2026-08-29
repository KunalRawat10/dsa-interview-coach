import { useState } from 'react'
import { motion } from 'motion/react'
import type { TabId } from '../../App'
import { ArrowRight, Search } from 'lucide-react'

interface ConstellationPreviewProps {
  onNavigate: (tab: TabId) => void
}

interface PatternInfo {
  id: string
  name: string
  status: 'mastered' | 'in-progress' | 'not-started'
  x: number // percentage
  y: number // percentage
  desc: string
  invariant: string
  progress: string
  progressPercent: number
  connected: {
    id: string
    name: string
    reason: string
    status: 'mastered' | 'in-progress' | 'not-started'
  }[]
}

const patterns: PatternInfo[] = [
  {
    id: 'monotonic-stack',
    name: 'Monotonic Stack',
    status: 'mastered',
    x: 85,
    y: 54,
    desc: 'A stack kept sorted so the next greater or smaller element is available in O(1).',
    invariant: 'Anything popped can never be the answer for a later index.',
    progress: '0/11',
    progressPercent: 10,
    connected: [
      {
        id: 'sliding-window',
        name: 'Sliding Window',
        reason: 'Window extrema in constant time',
        status: 'in-progress',
      },
    ],
  },
  {
    id: 'two-pointers',
    name: 'Two Pointers',
    status: 'mastered',
    x: 44,
    y: 50,
    desc: 'Traverse sorted sequences simultaneously from opposite ends to eliminate quadratic search spaces.',
    invariant: 'Moving the limiting boundary is the only transition that can improve the objective.',
    progress: '8/12',
    progressPercent: 67,
    connected: [
      {
        id: 'sliding-window',
        name: 'Sliding Window',
        reason: 'Subarray bounds expansion/contraction',
        status: 'in-progress',
      },
      {
        id: 'fast-slow',
        name: 'Fast & Slow Pointers',
        reason: 'Velocity ratio cycle detection',
        status: 'in-progress',
      },
      {
        id: 'binary-search',
        name: 'Binary Search',
        reason: 'Monotonic search space reduction',
        status: 'mastered',
      },
    ],
  },
  {
    id: 'sliding-window',
    name: 'Sliding Window',
    status: 'in-progress',
    x: 72,
    y: 28,
    desc: 'Maintain an expandable and contractable window invariant over continuous subarrays.',
    invariant: 'Expand right to find validity, contract left to achieve optimality.',
    progress: '5/14',
    progressPercent: 36,
    connected: [
      {
        id: 'two-pointers',
        name: 'Two Pointers',
        reason: 'Boundary coordination',
        status: 'mastered',
      },
      {
        id: 'monotonic-stack',
        name: 'Monotonic Stack',
        reason: 'Sliding window maximum in O(1)',
        status: 'mastered',
      },
    ],
  },
  {
    id: 'fast-slow',
    name: 'Fast & Slow Pointers',
    status: 'in-progress',
    x: 30,
    y: 24,
    desc: "Floyd's cycle-finding algorithm using pointer velocity ratios to detect cyclic structures.",
    invariant: 'Distance delta decreases by 1 on each step inside a loop.',
    progress: '4/8',
    progressPercent: 50,
    connected: [
      {
        id: 'two-pointers',
        name: 'Two Pointers',
        reason: 'Multi-pointer coordinate invariant',
        status: 'mastered',
      },
    ],
  },
  {
    id: 'prefix-sum',
    name: 'Prefix Sum',
    status: 'in-progress',
    x: 75,
    y: 74,
    desc: 'Precompute cumulative sums to answer contiguous range queries in O(1) time.',
    invariant: 'Sum(i, j) = Prefix[j] - Prefix[i-1] preserves range values without iteration.',
    progress: '3/9',
    progressPercent: 33,
    connected: [
      {
        id: 'sliding-window',
        name: 'Sliding Window',
        reason: 'Subarray sum optimization',
        status: 'in-progress',
      },
    ],
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    status: 'mastered',
    x: 30,
    y: 76,
    desc: 'Halve the search space monotonically at each step using a deterministic predicate.',
    invariant: 'The target value is guaranteed to reside entirely within [low, high].',
    progress: '11/12',
    progressPercent: 92,
    connected: [
      {
        id: 'two-pointers',
        name: 'Two Pointers',
        reason: 'Sorted range partition',
        status: 'mastered',
      },
    ],
  },
  {
    id: 'merge-intervals',
    name: 'Merge Intervals',
    status: 'not-started',
    x: 48,
    y: 88,
    desc: 'Sort interval bounds by start time to consolidate overlaps and resolve scheduling conflicts.',
    invariant: 'Adjacent intervals overlap if next.start <= curr.end.',
    progress: '0/7',
    progressPercent: 0,
    connected: [
      {
        id: 'two-pointers',
        name: 'Two Pointers',
        reason: 'Sorted boundary scan',
        status: 'mastered',
      },
    ],
  },
  {
    id: 'cyclic-sort',
    name: 'Cyclic Sort',
    status: 'not-started',
    x: 16,
    y: 48,
    desc: 'Place integers in [1, N] into their matching array indices in O(N) time with O(1) space.',
    invariant: 'Each swap places at least one element at its permanent destination.',
    progress: '0/6',
    progressPercent: 0,
    connected: [
      {
        id: 'two-pointers',
        name: 'Two Pointers',
        reason: 'Array position alignment',
        status: 'mastered',
      },
    ],
  },
]

const graphEdges: [string, string][] = [
  ['two-pointers', 'sliding-window'],
  ['two-pointers', 'fast-slow'],
  ['two-pointers', 'binary-search'],
  ['two-pointers', 'merge-intervals'],
  ['two-pointers', 'cyclic-sort'],
  ['sliding-window', 'monotonic-stack'],
  ['sliding-window', 'prefix-sum'],
  ['fast-slow', 'cyclic-sort'],
  ['prefix-sum', 'merge-intervals'],
]

export default function ConstellationPreview({ onNavigate }: ConstellationPreviewProps) {
  const [selectedId, setSelectedId] = useState<string>('monotonic-stack')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const selectedPattern = patterns.find((p) => p.id === selectedId) || patterns[0]

  const filteredPatterns = patterns.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const isConnectedToSelected = (nodeId: string) => {
    if (nodeId === selectedId) return true
    return graphEdges.some(
      ([a, b]) => (a === selectedId && b === nodeId) || (b === selectedId && a === nodeId)
    )
  }

  const getStatusColor = (status: 'mastered' | 'in-progress' | 'not-started') => {
    switch (status) {
      case 'mastered':
        return '#4A72FF' // blue
      case 'in-progress':
        return '#D19A66' // amber
      case 'not-started':
        return '#5C6370' // gray
    }
  }

  return (
    <section className="py-20 sm:py-28 relative border-t border-[#1C2029]">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mb-12"
      >
        <div className="text-xs font-mono text-[#4A72FF] tracking-wide uppercase mb-3">
          Constellation
        </div>

        <h2 className="font-display font-bold text-3xl sm:text-5xl text-[#F2F1EC] tracking-tight leading-[1.1] mb-4">
          Patterns don&apos;t exist in isolation.
        </h2>

        <p className="font-sans text-base sm:text-lg text-[#8E94A0] max-w-3xl leading-relaxed">
          Two Pointers is one idea away from Sliding Window, and one proof away from Binary Search.
          Constellation is the map of those relationships — so learning one pattern tells you where
          to go next, and why the next one will feel familiar.
        </p>
      </motion.div>

      {/* 3-Pane Product Window (Reference Image 2: v0 Design) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 18 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border border-[#222733] bg-[#0A0D14] shadow-2xl shadow-black/80 overflow-hidden"
      >
        {/* Top Window Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1C202A] bg-[#0D1017] text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-[#8E94A0]">patternos</span>
            <span className="text-[#4A72FF]">/</span>
            <span className="text-[#F2F1EC] font-medium">constellation</span>
          </div>
          <div className="flex items-center gap-2 text-[#5C6370] text-[11px]">
            <span>8 patterns</span>
            <span>•</span>
            <span>9 relations</span>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
          {/* Left Pane: Pattern Navigation / List (3 cols) */}
          <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[#1C202A] p-4 flex flex-col justify-between bg-[#0B0E15]">
            <div className="space-y-3">
              {/* Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#5C6370]" />
                <input
                  type="text"
                  placeholder="Filter patterns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#10141D] border border-[#1E232E] text-xs text-[#F2F1EC] placeholder-[#5C6370] focus:outline-none focus:border-[#4A72FF]"
                />
              </div>

              {/* Pattern List */}
              <div className="space-y-1 pt-1">
                {filteredPatterns.map((p) => {
                  const isSelected = p.id === selectedId
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#151B28] text-[#F2F1EC] font-medium border border-[#222E46]'
                          : 'text-[#8E94A0] hover:text-[#F2F1EC] hover:bg-[#10141D]'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: getStatusColor(p.status) }}
                      />
                      <span className="truncate">{p.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bottom button */}
            <div className="pt-4 mt-4 border-t border-[#1C202A]">
              <button
                onClick={() => onNavigate('constellation')}
                className="w-full py-2 px-3 rounded-md bg-[#131824] hover:bg-[#1A2234] border border-[#222E46] text-xs font-mono text-[#4A72FF] hover:text-[#7090FF] flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>Launch Graph</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Pane: Connected Algorithmic Graph (6 cols) */}
          <div className="lg:col-span-6 relative bg-[#07090E] p-4 flex flex-col justify-between overflow-hidden min-h-[360px] lg:min-h-[480px]">
            {/* Subtle Coordinate Grid Texture */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* Graph SVG Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {graphEdges.map(([fromId, toId]) => {
                const fromNode = patterns.find((p) => p.id === fromId)
                const toNode = patterns.find((p) => p.id === toId)
                if (!fromNode || !toNode) return null

                const isConnected =
                  (fromId === selectedId && toId === selectedId) ||
                  fromId === selectedId ||
                  toId === selectedId

                return (
                  <line
                    key={`${fromId}-${toId}`}
                    x1={`${fromNode.x}%`}
                    y1={`${fromNode.y}%`}
                    x2={`${toNode.x}%`}
                    y2={`${toNode.y}%`}
                    stroke={isConnected ? '#4A72FF' : 'rgba(92, 99, 112, 0.3)'}
                    strokeWidth={isConnected ? '2' : '1'}
                    strokeDasharray={isConnected ? undefined : '3 3'}
                  />
                )
              })}
            </svg>

            {/* Interactive Graph Nodes */}
            <div className="absolute inset-0">
              {patterns.map((p) => {
                const isSelected = p.id === selectedId
                const isConnected = isConnectedToSelected(p.id)

                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform ${
                      isSelected ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      {/* Node circle & halo */}
                      <div className="relative flex items-center justify-center">
                        {isSelected && (
                          <div className="absolute -inset-2 rounded-full border border-[#4A72FF] animate-ping opacity-30" />
                        )}
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'ring-4 ring-[#4A72FF]/30 border-2 border-white'
                              : isConnected
                              ? 'ring-2 ring-white/10'
                              : 'opacity-70'
                          }`}
                          style={{ backgroundColor: getStatusColor(p.status) }}
                        />
                      </div>
                      {/* Node label */}
                      <span
                        className={`mt-1.5 font-mono text-[10px] sm:text-[11px] whitespace-nowrap px-1.5 py-0.5 rounded transition-colors ${
                          isSelected
                            ? 'bg-[#151B28] text-[#F2F1EC] font-semibold border border-[#263558]'
                            : 'text-[#8E94A0] bg-[#0A0D14]/80'
                        }`}
                      >
                        {p.name}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Bottom Status Legend */}
            <div className="relative z-10 mt-auto pt-4 flex items-center gap-4 text-[11px] font-mono text-[#8E94A0] bg-[#07090E]/90 px-3 py-1.5 rounded-md border border-[#1C202A] w-fit">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4A72FF]" /> Mastered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#D19A66]" /> In progress
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#5C6370]" /> Not started
              </span>
            </div>
          </div>

          {/* Right Pane: Selected Pattern Inspector (3 cols) */}
          <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-[#1C202A] p-5 flex flex-col justify-between bg-[#0B0E15]">
            <div className="space-y-4">
              <div>
                <div className="text-[11px] font-mono text-[#5C6370] uppercase tracking-wider mb-1">
                  Pattern
                </div>
                <h3 className="font-display font-bold text-xl text-[#F2F1EC]">
                  {selectedPattern.name}
                </h3>
              </div>

              <p className="font-sans text-xs text-[#8E94A0] leading-relaxed">
                {selectedPattern.desc}
              </p>

              {/* Invariant Card */}
              <div className="p-3.5 rounded-lg bg-[#10141D] border border-[#1E232E]">
                <div className="text-[11px] font-mono text-[#D19A66] font-medium mb-1">
                  Invariant
                </div>
                <p className="text-xs text-[#F2F1EC] font-sans leading-relaxed">
                  {selectedPattern.invariant}
                </p>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#8E94A0] mb-1.5">
                  <span>Progress</span>
                  <span className="text-[#F2F1EC]">{selectedPattern.progress}</span>
                </div>
                <div className="h-1.5 w-full bg-[#151922] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#4A72FF] rounded-full transition-all duration-300"
                    style={{ width: `${selectedPattern.progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Connected Patterns */}
              <div>
                <div className="text-[11px] font-mono text-[#5C6370] uppercase tracking-wider mb-2">
                  Connected patterns
                </div>
                <div className="space-y-2">
                  {selectedPattern.connected.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className="p-2.5 rounded-lg bg-[#10141D] border border-[#1E232E] hover:border-[#2A3346] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs font-medium text-[#F2F1EC] mb-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: getStatusColor(item.status) }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <div className="text-[11px] text-[#5C6370] font-sans">
                        {item.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('constellation')}
              className="mt-6 w-full py-2.5 px-4 rounded-md bg-[#4A72FF] hover:bg-[#3B61E8] text-white font-sans font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span>Explore in Constellation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
