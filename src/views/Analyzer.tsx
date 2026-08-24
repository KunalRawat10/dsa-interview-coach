import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'

interface AnalysisResult {
  timeComplexity: string
  spaceComplexity: string
  loops: number
  recursion: boolean
  dataStructures: string[]
  patterns: string[]
  edgeCases: string[]
}

const DEFAULT_CODE = `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`

function analyzeCode(code: string): AnalysisResult {
  let loops = 0
  let recursion = false
  const dataStructures: string[] = []
  const patterns: string[] = []
  const edgeCases: string[] = []

  const lines = code.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    if (/^for\s*\(/.test(trimmed) || /^while\s*\(/.test(trimmed)) {
      loops++
    }

    if (/^function\s+(\w+)/.test(trimmed)) {
      const funcName = trimmed.match(/^function\s+(\w+)/)?.[1]
      if (funcName) {
        const declIndex = code.indexOf('function ' + funcName)
        const callIndex = code.indexOf(funcName + '(')
        if (callIndex > declIndex + 15) {
          recursion = true
        }
      }
    }

    if (/new\s+Map\s*\(/.test(line)) dataStructures.push('Hash Map')
    if (/new\s+Set\s*\(/.test(line)) dataStructures.push('Hash Set')
    if (/new\s+Array\s*\(/.test(line) || /\[\s*\]/.test(line)) dataStructures.push('Array')
    if (/new\s+Object\s*\(/.test(line) || /\{\s*\}/.test(line)) dataStructures.push('Object')
  }

  let timeComplexity = 'O(1)'
  if (recursion) {
    timeComplexity = 'O(2^n) or O(n) — check memoization'
  } else if (loops === 1) {
    timeComplexity = 'O(n)'
  } else if (loops === 2) {
    timeComplexity = 'O(n²)'
  } else if (loops >= 3) {
    timeComplexity = 'O(n³) or worse'
  }

  let spaceComplexity = 'O(1)'
  if (dataStructures.includes('Hash Map') || dataStructures.includes('Hash Set')) {
    spaceComplexity = 'O(n)'
  } else if (loops > 0) {
    spaceComplexity = 'O(1) auxiliary'
  }

  if (dataStructures.includes('Hash Map')) patterns.push('Hash Map / Complement Search')
  if (loops === 1 && dataStructures.includes('Array')) patterns.push('Single Pass')
  if (loops === 2) patterns.push('Nested Iteration')
  if (recursion) patterns.push('Recursion / Divide & Conquer')

  edgeCases.push('Empty input array')
  edgeCases.push('No valid pair exists')
  edgeCases.push('Duplicate values handling')
  if (code.includes('target')) edgeCases.push('Target not achievable')

  return {
    timeComplexity,
    spaceComplexity,
    loops,
    recursion,
    dataStructures: [...new Set(dataStructures)],
    patterns: [...new Set(patterns)],
    edgeCases: [...new Set(edgeCases)],
  }
}

function complexityToPercent(complexity: string): number {
  if (complexity.includes('O(1)')) return 10
  if (complexity.includes('O(log n)')) return 25
  if (complexity.includes('O(n)')) return 40
  if (complexity.includes('O(n log n)')) return 60
  if (complexity.includes('O(n²)')) return 80
  if (complexity.includes('O(2^n)')) return 95
  if (complexity.includes('O(n³)')) return 100
  return 50
}

export default function Analyzer() {
  const [code, setCode] = useState(DEFAULT_CODE)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.analyzer-header'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      )
      gsap.fromTo(
        el.querySelectorAll('.analyzer-left'),
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.2 }
      )
      gsap.fromTo(
        el.querySelectorAll('.analyzer-right'),
        { x: 30, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: 0.3 }
      )
    }, el)

    return () => ctx.revert()
  }, [])

  const analyze = () => {
    const analysis = analyzeCode(code)
    setResult(analysis)
  }

  return (
    <div ref={containerRef} className="h-[calc(100vh-140px)] flex flex-col">
      <div className="analyzer-header text-center space-y-1 mb-4">
        <h2 className="text-2xl font-medium">Complexity Forge</h2>
        <p className="text-text-tertiary text-sm">Paste your code. Get instant Big-O analysis.</p>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
        <div className="analyzer-left flex flex-col rounded-xl border border-border-subtle overflow-hidden bg-surface-raised">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-strong">
            <span className="text-sm font-medium">Your Code</span>
            <button
              onClick={analyze}
              className="px-4 py-1.5 bg-accent text-black rounded-lg text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Analyze Complexity
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-transparent p-4 text-sm font-mono text-text-secondary leading-relaxed resize-none outline-none"
            style={{ fontFamily: 'monospace' }}
          />
        </div>

        <div className="analyzer-right flex flex-col rounded-xl border border-border-subtle overflow-hidden bg-surface-raised">
          <div className="px-4 py-3 border-b border-border-subtle bg-surface-strong">
            <span className="text-sm font-medium">Analysis Result</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {result ? (
              <>
                <div>
                  <h4 className="text-sm text-text-secondary mb-2">Time Complexity</h4>
                  <div className="text-2xl font-medium text-accent font-[tabular-nums]">
                    {result.timeComplexity}
                  </div>
                  <div className="mt-2 h-2 rounded-full overflow-hidden bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-700"
                      style={{ width: complexityToPercent(result.timeComplexity) + '%' }}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm text-text-secondary mb-2">Space Complexity</h4>
                  <div className="text-2xl font-medium text-accent font-[tabular-nums]">
                    {result.spaceComplexity}
                  </div>
                  <div className="mt-2 h-2 rounded-full overflow-hidden bg-surface-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-700"
                      style={{ width: complexityToPercent(result.spaceComplexity) + '%' }}
                    />
                  </div>
                </div>

                {result.patterns.length > 0 && (
                  <div>
                    <h4 className="text-sm text-text-secondary mb-2">Patterns Detected</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.patterns.map((p) => (
                        <span
                          key={p}
                          className="px-3 py-1 rounded-lg text-xs bg-accent-dim text-accent border border-accent/20"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {result.dataStructures.length > 0 && (
                  <div>
                    <h4 className="text-sm text-text-secondary mb-2">Data Structures Used</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.dataStructures.map((ds) => (
                        <span
                          key={ds}
                          className="px-3 py-1 rounded-lg text-xs bg-surface-muted text-text-tertiary border border-border-subtle"
                        >
                          {ds}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="text-center p-3 rounded-lg bg-surface-muted border border-border-subtle">
                    <div className="text-xl font-medium text-accent">{result.loops}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">loops detected</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-surface-muted border border-border-subtle">
                    <div className="text-xl font-medium text-accent">{result.recursion ? 'Yes' : 'No'}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">recursion</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-surface-muted border border-border-subtle">
                    <div className="text-xl font-medium text-accent">{result.dataStructures.length}</div>
                    <div className="text-[10px] text-text-muted mt-0.5">data structures</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm text-text-secondary mb-2">Edge Cases to Consider</h4>
                  <ul className="space-y-1.5">
                    {result.edgeCases.map((ec) => (
                      <li key={ec} className="text-sm text-text-tertiary flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        {ec}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted space-y-2">
                <div className="text-3xl">◈</div>
                <p className="text-sm">Click "Analyze Complexity" to see results</p>
                <p className="text-xs text-text-muted">Paste code on the left and run analysis</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}