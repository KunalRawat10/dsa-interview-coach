import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

interface Pattern {
  id: string
  name: string
  x: number
  y: number
  mastered: number
  desc: string
  solved: number
  streak: number
}

const PATTERNS: Pattern[] = [
  { id: 'arrays', name: 'Arrays', x: 0.15, y: 0.35, mastered: 0.85, desc: 'Linear data structure. Foundation of most algorithms.', solved: 24, streak: 5 },
  { id: 'two-pointers', name: 'Two Pointers', x: 0.35, y: 0.2, mastered: 0.7, desc: 'Efficient traversal technique for sorted arrays.', solved: 18, streak: 3 },
  { id: 'sliding-window', name: 'Sliding Window', x: 0.55, y: 0.25, mastered: 0.5, desc: 'Subarray/substring problems with fixed/variable size.', solved: 12, streak: 2 },
  { id: 'stack', name: 'Stack', x: 0.25, y: 0.55, mastered: 0.75, desc: 'LIFO structure. Used for parentheses, monotonic stacks.', solved: 15, streak: 4 },
  { id: 'queue', name: 'Queue', x: 0.45, y: 0.5, mastered: 0.6, desc: 'FIFO structure. BFS, sliding window maximum.', solved: 10, streak: 1 },
  { id: 'linked-list', name: 'Linked List', x: 0.65, y: 0.4, mastered: 0.9, desc: 'Dynamic linear collection. Fast insertion/deletion.', solved: 20, streak: 6 },
  { id: 'tree', name: 'Tree', x: 0.2, y: 0.75, mastered: 0.35, desc: 'Hierarchical structure. DFS, BFS, traversals.', solved: 8, streak: 0 },
  { id: 'bst', name: 'BST', x: 0.4, y: 0.7, mastered: 0.55, desc: 'Ordered tree for efficient search/insert/delete.', solved: 11, streak: 2 },
  { id: 'heap', name: 'Heap', x: 0.6, y: 0.65, mastered: 0.25, desc: 'Complete binary tree. Priority queues, median finder.', solved: 5, streak: 0 },
  { id: 'graph', name: 'Graph', x: 0.3, y: 0.9, mastered: 0.15, desc: 'Network of nodes. DFS, BFS, Dijkstra, Union-Find.', solved: 3, streak: 0 },
  { id: 'dp', name: 'Dynamic Programming', x: 0.7, y: 0.8, mastered: 0.2, desc: 'Optimal substructure. Memoization and tabulation.', solved: 4, streak: 0 },
  { id: 'greedy', name: 'Greedy', x: 0.8, y: 0.55, mastered: 0.65, desc: 'Local optimal choices. Activity selection, Huffman.', solved: 13, streak: 3 },
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
  if (mastered > 0.6) return [74, 222, 128]
  if (mastered > 0.3) return [251, 191, 36]
  return [248, 113, 113]
}

export default function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Pattern | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.constellation-title'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      )
      gsap.fromTo(
        el.querySelectorAll('.constellation-canvas-wrap'),
        { scale: 0.95, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out', delay: 0.2 }
      )
      gsap.fromTo(
        el.querySelectorAll('.constellation-panel'),
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.4 }
      )
    }, el)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx2d.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()

    const mouse = { x: -1000, y: -1000 }
    let hovered: Pattern | null = null
    let time = 0
    let raf: number

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    const onClick = () => {
      if (hovered) setSelected(hovered)
    }

    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('click', onClick)
    window.addEventListener('resize', resize)

    const draw = () => {
      time += 0.015
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx2d.clearRect(0, 0, w, h)

      hovered = null

      for (const [from, to] of CONNECTIONS) {
        const a = PATTERNS.find((p) => p.id === from)!
        const b = PATTERNS.find((p) => p.id === to)!
        const avg = (a.mastered + b.mastered) / 2
        const ax = a.x * w
        const ay = a.y * h + Math.sin(time + a.x * 5) * 2
        const bx = b.x * w
        const by = b.y * h + Math.sin(time + b.x * 5) * 2

        ctx2d.beginPath()
        ctx2d.moveTo(ax, ay)
        ctx2d.lineTo(bx, by)
        ctx2d.strokeStyle = 'rgba(107, 140, 255, ' + (avg * 0.3) + ')'
        ctx2d.lineWidth = 1
        ctx2d.stroke()
      }

      for (const p of PATTERNS) {
        const x = p.x * w
        const y = p.y * h + Math.sin(time + p.x * 8) * 3
        const r = 5 + p.mastered * 7
        const dist = Math.hypot(mouse.x - x, mouse.y - y)
        const isHovered = dist < r + 10
        if (isHovered) hovered = p

        const [cr, cg, cb] = getColor(p.mastered)

        const g = ctx2d.createRadialGradient(x, y, 0, x, y, r * 4)
        g.addColorStop(0, 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (p.mastered * 0.25) + ')')
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx2d.fillStyle = g
        ctx2d.beginPath()
        ctx2d.arc(x, y, r * 4, 0, Math.PI * 2)
        ctx2d.fill()

        ctx2d.beginPath()
        ctx2d.arc(x, y, r, 0, Math.PI * 2)
        ctx2d.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.4 + p.mastered * 0.6) + ')'
        ctx2d.fill()
        ctx2d.strokeStyle = isHovered ? 'rgba(255,255,255,0.9)' : 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.5 + p.mastered * 0.5) + ')'
        ctx2d.lineWidth = isHovered ? 2 : 1
        ctx2d.stroke()

        ctx2d.fillStyle = isHovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'
        ctx2d.font = (isHovered ? '500' : '400') + ' 11px system-ui, sans-serif'
        ctx2d.textAlign = 'center'
        ctx2d.fillText(p.name, x, y + r + 14)
      }

      raf = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(raf)
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const selectedColor = selected ? getColor(selected.mastered) : [107, 140, 255]

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="constellation-title text-center space-y-2">
        <h2 className="text-3xl font-medium">Algorithmic Constellation</h2>
        <p className="text-text-tertiary text-sm">Hover nodes to explore. Click to see your mastery details.</p>
      </div>

      <div className="flex gap-4">
        <div className="constellation-canvas-wrap flex-1 h-[500px] rounded-xl border border-border-subtle overflow-hidden relative bg-surface/50">
          <canvas ref={canvasRef} className="w-full h-full block" />
          <div className="absolute bottom-3 left-3 flex gap-4 text-xs bg-void/80 px-3 py-2 rounded-lg backdrop-blur">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" /> Mastered
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-warning" /> Learning
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-danger" /> Weak
            </span>
          </div>
        </div>

        <div className="constellation-panel w-72 rounded-xl border border-border-subtle bg-surface-raised p-5 space-y-4">
          {selected ? (
            <>
              <div>
                <h3 className="text-lg font-medium mb-1">{selected.name}</h3>
                <p className="text-sm text-text-tertiary leading-relaxed">{selected.desc}</p>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: Math.round(selected.mastered * 100) + '%', background: 'rgb(' + selectedColor[0] + ',' + selectedColor[1] + ',' + selectedColor[2] + ')' }} />
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center">
                  <div className="text-xl font-medium text-accent font-[tabular-nums]">{Math.round(selected.mastered * 100)}%</div>
                  <div className="text-[10px] text-text-muted mt-0.5">mastery</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-medium text-accent font-[tabular-nums]">{selected.solved}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">solved</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-medium text-accent font-[tabular-nums]">{selected.streak}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">streak</div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-2">
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