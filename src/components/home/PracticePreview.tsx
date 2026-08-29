import { useState } from 'react'
import { motion } from 'motion/react'
import type { TabId } from '../../App'
import { ArrowRight, Play, CheckCircle2, FileCode, Sparkles } from 'lucide-react'

interface PracticePreviewProps {
  onNavigate: (tab: TabId) => void
}

export default function PracticePreview({ onNavigate }: PracticePreviewProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const handleRun = () => {
    setIsRunning(true)
    setTimeout(() => {
      setIsRunning(false)
      setHasRun(true)
    }, 350)
  }

  return (
    <section className="py-24 sm:py-32 relative border-t border-[#1C2029]">
      {/* Centered Heading & Subtext */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto mb-14"
      >
        <div className="text-xs font-mono text-[#4A72FF] tracking-wide uppercase mb-3 font-semibold">
          PRACTICE
        </div>

        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#F2F1EC] tracking-tight leading-[1.1] mb-4">
          Guided reasoning, <br />
          <span className="text-[#4A72FF]">not revealed answers.</span>
        </h2>

        <p className="font-sans text-base sm:text-lg text-[#8E94A0] max-w-xl mx-auto leading-relaxed">
          Solve problems in an environment designed to build intuition, not just pass tests.
        </p>
      </motion.div>

      {/* Large Product Workspace Window (Exact Screenshot Layout) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 18 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border border-[#222733] bg-[#0A0D14] shadow-2xl shadow-black/80 overflow-hidden"
      >
        {/* Top Window Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1C202A] bg-[#0D1017]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2A3140]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#2A3140]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#2A3140]" />
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#131722] border border-[#1E232E] text-xs text-[#8E94A0] font-mono">
              <FileCode className="w-3.5 h-3.5 text-[#4A72FF]" />
              <span>solution.py</span>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-xs text-[#5C6370]">
            <span className="text-[#4A72FF]">Two Pointers</span>
            <span>•</span>
            <span className="text-[#D19A66]">Medium</span>
          </div>
        </div>

        {/* Workspace Body: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
          {/* Left Column: Problem & Histogram Bar Visual (5 cols) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#1C202A] p-5 sm:p-6 bg-[#0B0E15] flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-[#5C6370]">Problem 11</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#2A2012] border border-[#44331C] text-[#D19A66]">
                    Medium
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-[#F2F1EC]">
                  Container With Most Water
                </h3>
              </div>

              {/* Bar Chart Histogram Visual */}
              <div className="p-3.5 rounded-lg bg-[#07090E] border border-[#1C202A] space-y-2">
                <div className="text-[10px] font-mono text-[#5C6370] uppercase">
                  Height Distribution Graph
                </div>
                <div className="h-20 flex items-end justify-between gap-1.5 px-2 pt-2 pb-1 border-b border-[#1C202A]">
                  {[
                    { h: 20, isP: true, label: 'L' },
                    { h: 70, isP: false },
                    { h: 55, isP: false },
                    { h: 25, isP: false },
                    { h: 45, isP: false },
                    { h: 35, isP: false },
                    { h: 65, isP: false },
                    { h: 80, isP: true, label: 'R' },
                  ].map((bar, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                      <div
                        style={{ height: `${bar.h}%` }}
                        className={`w-full rounded-t transition-all ${
                          bar.isP ? 'bg-[#4A72FF]' : 'bg-[#182030]'
                        }`}
                      />
                      <span className="text-[9px] font-mono text-[#5C6370] mt-1">
                        {bar.label || i}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invariant Note */}
              <div className="p-3.5 rounded-lg bg-[#10141D] border border-[#1E232E] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#4A72FF]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Core Invariant</span>
                </div>
                <p className="text-xs text-[#8E94A0] leading-relaxed font-sans">
                  The shorter boundary limits maximum area. Moving the taller boundary can only decrease or maintain area.
                </p>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#5C6370]">
              Constraints: n ≥ 2, height[i] ≥ 0
            </div>
          </div>

          {/* Right Column: Code Editor & Execution Console (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#07090E]">
            {/* Code Content */}
            <div className="p-5 sm:p-6 font-mono text-xs text-[#8E94A0] overflow-x-auto leading-relaxed space-y-1">
              <div><span className="text-[#4A72FF]">class</span> <span className="text-[#F2F1EC]">Solution</span>:</div>
              <div className="pl-4">
                <span className="text-[#4A72FF]">def</span> <span className="text-[#F2F1EC]">maxArea</span>(self, height: <span className="text-[#5C6370]">List[int]</span>) -&gt; <span className="text-[#5C6370]">int</span>:
              </div>
              <div className="pl-8 text-[#F2F1EC]">left, right = 0, len(height) - 1</div>
              <div className="pl-8 text-[#F2F1EC]">max_water = 0</div>
              <br />
              <div className="pl-8"><span className="text-[#4A72FF]">while</span> left &lt; right:</div>
              <div className="pl-12 text-[#8E94A0]">
                area = (right - left) * <span className="text-[#4A72FF]">min</span>(height[left], height[right])
              </div>
              <div className="pl-12 text-[#F2F1EC]">
                max_water = <span className="text-[#4A72FF]">max</span>(max_water, area)
              </div>
              <br />
              <div className="pl-12"><span className="text-[#4A72FF]">if</span> height[left] &lt; height[right]:</div>
              <div className="pl-16 text-[#F2F1EC]">left += 1</div>
              <div className="pl-12"><span className="text-[#4A72FF]">else</span>:</div>
              <div className="pl-16 text-[#F2F1EC]">right -= 1</div>
              <br />
              <div className="pl-8"><span className="text-[#4A72FF]">return</span> max_water</div>
            </div>

            {/* Bottom Test Run Strip */}
            <div className="p-4 border-t border-[#1C202A] bg-[#0D1017] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div>
                {hasRun ? (
                  <span className="text-[#4ADE80] flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ✓ All test cases passed (3ms)
                  </span>
                ) : (
                  <span className="text-[#8E94A0]">
                    Status: Ready for evaluation
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="px-4 py-2 rounded-md bg-[#4A72FF] hover:bg-[#3B61E8] text-white font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isRunning ? 'Evaluating...' : 'Run Code'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
