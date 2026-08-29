import { motion } from 'motion/react'
import type { TabId } from '../../App'
import { ArrowRight, Compass } from 'lucide-react'

interface HomeHeroProps {
  onNavigate: (tab: TabId) => void
}

const leftVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export default function HomeHero({ onNavigate }: HomeHeroProps) {
  return (
    <section className="relative min-h-[84vh] flex flex-col justify-between pt-10 sm:pt-16 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center flex-1">
        {/* Left column: Message & Typography (5 cols) */}
        <motion.div
          variants={leftVariants}
          initial="hidden"
          animate="visible"
          className="lg:col-span-6 xl:col-span-5 flex flex-col items-start text-left z-10"
        >
          {/* Eyebrow */}
          <motion.div
            variants={itemVariants}
            className="text-xs font-mono text-[#4A72FF] tracking-wider uppercase mb-5 font-semibold"
          >
            A NEW WAY TO LEARN DSA
          </motion.div>

          {/* Headline */}
          <h1 className="font-display font-extrabold text-5xl sm:text-6xl md:text-7xl lg:text-[4.75rem] tracking-tight leading-[1.02] text-[#F2F1EC] mb-6">
            <motion.span variants={itemVariants} className="block">
              Think in
            </motion.span>
            <motion.span
              variants={itemVariants}
              className="block text-[#4A72FF]"
            >
              patterns.
            </motion.span>
            <motion.span variants={itemVariants} className="block text-[#F2F1EC]">
              Not solutions.
            </motion.span>
          </h1>

          {/* Supporting Paragraph */}
          <motion.p
            variants={itemVariants}
            className="font-sans text-base sm:text-lg text-[#8E94A0] max-w-lg mb-8 leading-relaxed font-normal"
          >
            PatternOS teaches you to recognize underlying algorithmic patterns instead of memorizing individual solutions. Build intuition that lasts.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto"
          >
            <button
              onClick={() => onNavigate('practice')}
              className="px-7 py-3.5 rounded-md bg-[#4A72FF] hover:bg-[#3B61E8] text-white font-sans font-medium text-sm sm:text-base shadow-sm cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('constellation')}
              className="px-7 py-3.5 rounded-md bg-[#0D1016] hover:bg-[#141822] border border-[#222733] text-[#F2F1EC] font-sans font-medium text-sm sm:text-base cursor-pointer flex items-center justify-center gap-2 transition-colors"
            >
              <Compass className="w-4 h-4 text-[#4A72FF]" />
              <span>Explore Patterns</span>
            </button>
          </motion.div>

          {/* Supporting indicators */}
          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-wrap items-center gap-4 text-xs font-mono text-[#5C6370]"
          >
            <span>40+ patterns</span>
            <span>•</span>
            <span>Interactive visualizations</span>
            <span>•</span>
            <span>Spaced repetition</span>
          </motion.div>
        </motion.div>

        {/* Right column: Large PatternOS Product/Algorithm Visual (7 cols) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="lg:col-span-6 xl:col-span-7 relative flex items-center justify-center lg:justify-end z-10"
        >
          <div className="relative w-full rounded-xl border border-[#222733] bg-[#0A0D14] p-5 sm:p-6 shadow-2xl shadow-black/80 overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#1C202A] text-xs font-mono">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#4A72FF]" />
                <span className="text-[#8E94A0]">patternos / patterns / <strong className="text-[#F2F1EC]">two-pointers</strong></span>
              </div>
              <span className="text-[#4A72FF] bg-[#141C30] px-2 py-0.5 rounded border border-[#223356] text-[11px]">
                O(N) Time
              </span>
            </div>

            {/* Array Dissection */}
            <div className="rounded-lg bg-[#07090E] border border-[#1C202A] p-4 sm:p-5 space-y-4 font-mono text-xs">
              <div>
                <div className="flex items-center justify-between text-[11px] text-[#8E94A0] mb-2">
                  <span>ARRAY SEARCH SPACE</span>
                  <span className="text-[#4A72FF]">left: 0 → right: 6</span>
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center select-none">
                  {[
                    { val: 1, idx: 0, pointer: 'L' },
                    { val: 8, idx: 1 },
                    { val: 6, idx: 2 },
                    { val: 2, idx: 3 },
                    { val: 5, idx: 4 },
                    { val: 4, idx: 5 },
                    { val: 8, idx: 6, pointer: 'R' },
                  ].map((cell) => {
                    const isPointer = !!cell.pointer

                    return (
                      <div key={cell.idx} className="flex flex-col items-center">
                        <div
                          className={`w-full py-2.5 sm:py-3 rounded border font-semibold transition-colors ${
                            isPointer
                              ? 'bg-[#141C30] border-[#4A72FF] text-[#F2F1EC]'
                              : 'bg-[#0D1016] border-[#1C202A] text-[#5C6370]'
                          }`}
                        >
                          {cell.val}
                        </div>
                        <div className="text-[10px] text-[#5C6370] mt-1">
                          {isPointer ? <span className="text-[#4A72FF] font-bold">{cell.pointer}</span> : cell.idx}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Invariant Highlight Box */}
              <div className="p-3.5 rounded bg-[#10141D] border border-[#222E46] space-y-1">
                <div className="text-[11px] text-[#4A72FF] font-semibold uppercase tracking-wider">
                  Invariant: left wall &lt; right wall → move left
                </div>
                <p className="text-xs text-[#8E94A0] font-sans leading-relaxed">
                  The shorter line limits the area. Moving the taller line can only decrease the width without increasing the limiting height.
                </p>
              </div>

              {/* Code Snippet Box */}
              <div className="p-3 rounded bg-[#0D1016] border border-[#1C202A] text-[11px] text-[#8E94A0] leading-relaxed">
                <div><span className="text-[#4A72FF]">while</span> left &lt; right:</div>
                <div className="pl-4">area = (right - left) * <span className="text-[#4A72FF]">min</span>(h[left], h[right])</div>
                <div className="pl-4"><span className="text-[#4A72FF]">if</span> h[left] &lt; h[right]: <span className="text-[#F2F1EC]">left += 1</span> <span className="text-[#4A72FF]">else:</span> <span className="text-[#F2F1EC]">right -= 1</span></div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="mt-3.5 pt-3 border-t border-[#1C202A] flex items-center justify-between text-xs font-mono text-[#5C6370]">
              <span>Deduction: Eliminated quadratic O(N²) search space</span>
              <button
                onClick={() => onNavigate('practice')}
                className="text-[#4A72FF] hover:underline cursor-pointer font-medium"
              >
                Inspect pattern →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
