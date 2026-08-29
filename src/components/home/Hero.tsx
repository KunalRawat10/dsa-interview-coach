import { useEffect, useRef, useState } from 'react'
import type { TabId } from '../../App'

interface HeroProps {
  onNavigate: (tab: TabId) => void
}

const HEIGHTS = [8, 3, 7, 2, 6, 4, 5, 1, 5, 3]
const MAX_H = 8
const BAR_W = 44
const GAP = 4
const STEP = BAR_W + GAP

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden pt-24 pb-14 lg:pt-32 lg:pb-20">
      {/* Subtle Atmospheric Grid Background */}
      <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950 pointer-events-none" />
      <div
        className="absolute left-1/2 top-0 h-[550px] w-[850px] -translate-x-1/2 rounded-full opacity-[0.06] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, #2E72D0, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
          {/* Left: Editorial Headline & Actions */}
          <div className="reveal in-view">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-ink-600 bg-ink-850 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-accent-400" />
              </span>
              <span className="font-mono text-xs text-paper-300">
                DSA, reimagined for intuition
              </span>
            </div>

            {/* Target Editorial Line Breaks */}
            <h1 className="display-xl text-5xl text-paper-50 sm:text-6xl lg:text-7xl font-display font-bold tracking-[-0.03em] leading-[0.98]">
              Think in
              <br />
              <span className="text-accent-400">patterns.</span>
              <br />
              <span className="text-paper-400">Not solutions.</span>
            </h1>

            <p className="mt-6 max-w-md text-base sm:text-lg leading-relaxed text-paper-300">
              See the structure behind algorithmic problems, build intuition, and
              learn to solve unfamiliar problems without relying on memorized
              solutions.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('practice')}
                className="group inline-flex items-center gap-2 rounded-xl bg-accent-500 px-6 py-3.5 text-base font-medium text-white transition-all hover:bg-accent-400 hover:shadow-xl hover:shadow-accent-500/25 cursor-pointer"
              >
                <span>Start Learning</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform group-hover:translate-x-0.5">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
              <a
                href="#method"
                className="inline-flex items-center gap-2 rounded-xl border border-ink-500 px-6 py-3.5 text-base font-medium text-paper-200 transition-all hover:border-ink-400 hover:bg-ink-850 cursor-pointer"
              >
                See the method
              </a>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-6 text-sm text-paper-400 font-mono text-xs sm:text-sm">
              <span className="flex items-center gap-2">
                <CheckDot /> Five interconnected areas
              </span>
              <span className="flex items-center gap-2">
                <CheckDot /> Learn by reasoning
              </span>
            </div>
          </div>

          {/* Right: Balanced Two-Pointer Algorithm Visualization */}
          <div className="reveal in-view w-full overflow-hidden">
            <HeroVisualization />
          </div>
        </div>
      </div>
    </section>
  )
}

function CheckDot() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <circle cx="7" cy="7" r="6" stroke="#2C313A" strokeWidth="1" />
      <path d="M4 7l2 2 4-4" stroke="#4B8FE7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function HeroVisualization() {
  const [left, setLeft] = useState(0)
  const [right, setRight] = useState(HEIGHTS.length - 1)
  const [maxArea, setMaxArea] = useState(0)
  const [phase, setPhase] = useState(0)
  const [bestPair, setBestPair] = useState<[number, number] | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let l = 0
    let r = HEIGHTS.length - 1
    let best = 0
    let bestL = l
    let bestR = r
    let step = 0

    const runStep = () => {
      if (l >= r) {
        setPhase(4)
        setBestPair([bestL, bestR])
        setMaxArea(best)
        timerRef.current = setTimeout(() => {
          l = 0
          r = HEIGHTS.length - 1
          best = 0
          bestL = 0
          bestR = HEIGHTS.length - 1
          step = 0
          setBestPair(null)
          setPhase(0)
          setLeft(0)
          setRight(HEIGHTS.length - 1)
          setMaxArea(0)
          timerRef.current = setTimeout(runStep, 1000)
        }, 3500)
        return
      }

      setLeft(l)
      setRight(r)
      setPhase(step < 2 ? 1 : 2)

      const width = r - l
      const h = Math.min(HEIGHTS[l], HEIGHTS[r])
      const area = width * h
      if (area > best) {
        best = area
        bestL = l
        bestR = r
      }
      setMaxArea(best)

      if (HEIGHTS[l] < HEIGHTS[r]) {
        l++
      } else {
        r--
      }
      step++
      timerRef.current = setTimeout(runStep, 850)
    }

    timerRef.current = setTimeout(runStep, 1200)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const waterLeft = left * STEP
  const waterWidth = (right - left) * STEP
  const waterH = Math.min(HEIGHTS[left], HEIGHTS[right]) * (BAR_W / MAX_H)
  const containerH = MAX_H * (BAR_W / MAX_H)

  return (
    <div className="product-frame hero-product-glass overflow-hidden">
      {/* Window bar */}
      <div className="product-bar">
        <span className="product-dot bg-error-500/70" />
        <span className="product-dot bg-warning-500/70" />
        <span className="product-dot bg-success-500/70" />
        <span className="ml-3 font-mono text-xs text-paper-400 truncate">
          patternos — practice / container-with-most-water
        </span>
        <span className="ml-auto font-mono text-xs text-accent-400 shrink-0">
          Two Pointers
        </span>
      </div>

      {/* Visualization area */}
      <div className="relative bg-ink-900/90 px-4 sm:px-6 pb-5 pt-6 overflow-x-auto">
        {/* Phase label */}
        <div className="mb-4 flex items-center justify-between min-w-[340px]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-paper-400">
              {phase === 0 && 'Initializing...'}
              {phase === 1 && 'Scanning — compare boundaries'}
              {phase === 2 && 'Move shorter pointer inward'}
              {phase === 4 && 'Optimal container found'}
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-paper-400">area</span>
            <span className="text-gold-300 font-bold">{maxArea}</span>
          </div>
        </div>

        {/* Bar chart */}
        <div className="relative min-w-[340px]" style={{ height: containerH + 40 }}>
          {/* Water fill */}
          <div
            className="absolute bottom-8 rounded-md bg-accent-500/15 border border-accent-400/30 transition-all duration-700 ease-out"
            style={{
              left: waterLeft,
              width: waterWidth + BAR_W,
              height: waterH,
            }}
          />

          {/* Bars */}
          <div className="absolute bottom-8 flex items-end" style={{ gap: GAP }}>
            {HEIGHTS.map((h, i) => {
              const isLeft = i === left
              const isRight = i === right
              const isBest = bestPair && (i === bestPair[0] || i === bestPair[1])
              return (
                <div
                  key={i}
                  className="relative rounded-t-md transition-all duration-500"
                  style={{
                    width: BAR_W,
                    height: h * (BAR_W / MAX_H),
                    background: isBest
                      ? '#1A4788'
                      : isLeft || isRight
                        ? '#2E72D0'
                        : '#1A1D24',
                    border: isBest
                      ? '1px solid #4B8FE7'
                      : isLeft || isRight
                          ? '1px solid #71A8F6'
                          : '1px solid #22262E',
                  }}
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[10px] text-paper-400">
                    {h}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Pointer labels */}
          <div className="absolute bottom-0 flex items-end" style={{ gap: GAP }}>
            {HEIGHTS.map((_, i) => (
              <div key={i} style={{ width: BAR_W }} className="flex flex-col items-center">
                {i === left && (
                  <span className="mb-1 font-mono text-[10px] font-bold text-accent-300">
                    L
                  </span>
                )}
                {i === right && (
                  <span className="mb-1 font-mono text-[10px] font-bold text-gold-300">
                    R
                  </span>
                )}
                {(i !== left && i !== right) && <span className="mb-1 h-3.5" />}
              </div>
            ))}
          </div>
        </div>

        {/* Invariant reveal */}
        <div className="mt-4 rounded-lg border border-ink-600 bg-ink-800 p-4 min-w-[340px]">
          <div className="mb-1.5 font-mono text-xs text-paper-400">INVARIANT</div>
          <p className="text-xs sm:text-sm leading-relaxed text-paper-200">
            Moving the shorter boundary is the only move that can
            <span className="text-accent-300 font-medium"> potentially improve</span> the result.
          </p>
        </div>
      </div>
    </div>
  )
}
