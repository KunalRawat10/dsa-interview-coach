import { motion } from 'motion/react'
import { Activity } from 'lucide-react'

export default function ComplexityPreview() {
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
          COMPLEXITY
        </div>

        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#F2F1EC] tracking-tight leading-[1.1] mb-4">
          Not just the answer. <br />
          <span className="text-[#4A72FF]">The why behind it.</span>
        </h2>

        <p className="font-sans text-base sm:text-lg text-[#8E94A0] max-w-xl mx-auto leading-relaxed">
          Understand time and space complexity at a fundamental level.
        </p>
      </motion.div>

      {/* Large Product Analysis Window (Exact Screenshot Layout) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 18 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border border-[#222733] bg-[#0A0D14] shadow-2xl shadow-black/80 overflow-hidden"
      >
        {/* Top Window Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1C202A] bg-[#0D1017]">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-[#4A72FF]" />
            <span className="text-xs font-mono text-[#F2F1EC]">
              patternos / complexity / analysis
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#4ADE80] bg-[#12241C] border border-[#234A38] px-2 py-0.5 rounded font-bold">
              Time: O(n)
            </span>
            <span className="text-[#4ADE80] bg-[#12241C] border border-[#234A38] px-2 py-0.5 rounded font-bold">
              Space: O(1)
            </span>
          </div>
        </div>

        {/* 2-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[440px]">
          {/* Left: Code Structure (5 cols) */}
          <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-[#1C202A] p-5 sm:p-6 bg-[#0B0E15] flex flex-col justify-between space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#5C6370] mb-2">
                Algorithm Loop Structure
              </div>
              <div className="p-3.5 rounded-lg bg-[#07090E] border border-[#1C202A] font-mono text-xs text-[#8E94A0] space-y-1 leading-relaxed">
                <div><span className="text-[#4A72FF]">left</span>, <span className="text-[#4A72FF]">right</span> = 0, len(h) - 1</div>
                <div><span className="text-[#4A72FF]">while</span> left &lt; right:</div>
                <div className="pl-4 text-[#5C6370]"># Monotonic interval contraction</div>
                <div className="pl-4"><span className="text-[#4A72FF]">if</span> h[left] &lt; h[right]:</div>
                <div className="pl-8 text-[#F2F1EC]">left += 1  <span className="text-[#4A72FF]">// O(1)</span></div>
                <div className="pl-4"><span className="text-[#4A72FF]">else</span>:</div>
                <div className="pl-8 text-[#F2F1EC]">right -= 1 <span className="text-[#4A72FF]">// O(1)</span></div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#07090E] border border-[#1C202A] font-mono text-[11px] text-[#5C6370] space-y-1">
              <div>Total elements: <span className="text-[#F2F1EC]">n</span></div>
              <div>Max iterations: <span className="text-[#4A72FF]">n - 1</span></div>
              <div>Work per iteration: <span className="text-[#4ADE80]">O(1)</span></div>
            </div>
          </div>

          {/* Right: Detailed 'Why' Proofs (7 cols) */}
          <div className="lg:col-span-7 p-5 sm:p-6 bg-[#07090E] flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              {/* Why O(n) Time */}
              <div className="p-4 rounded-lg bg-[#0D1017] border border-[#1C202A] space-y-2">
                <div className="text-xs font-mono font-semibold text-[#4ADE80] uppercase">
                  Why O(n) time?
                </div>
                <ul className="text-xs text-[#8E94A0] space-y-1.5 font-sans">
                  <li className="flex items-start gap-2">
                    <span className="text-[#4ADE80]">•</span>
                    <span>Two pointers start at opposite ends of the array</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4ADE80]">•</span>
                    <span>Exactly one pointer moves per step</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4ADE80]">•</span>
                    <span>Pointers meet after at most n - 1 steps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4ADE80]">•</span>
                    <span>Each step takes O(1) constant time</span>
                  </li>
                </ul>
              </div>

              {/* Why O(1) Space */}
              <div className="p-4 rounded-lg bg-[#0D1017] border border-[#1C202A] space-y-2">
                <div className="text-xs font-mono font-semibold text-[#4ADE80] uppercase">
                  Why O(1) space?
                </div>
                <ul className="text-xs text-[#8E94A0] space-y-1.5 font-sans">
                  <li className="flex items-start gap-2">
                    <span className="text-[#4ADE80]">•</span>
                    <span>Only two pointer variables used (left, right)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#4ADE80]">•</span>
                    <span>No auxiliary data structures allocated</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Quote Box */}
            <div className="p-3.5 rounded-lg bg-[#0E1424] border border-[#223356] text-xs font-sans text-[#8E94A0] leading-relaxed">
              &ldquo;Because the search space shrinks monotonically, we eliminate entire branches of possibilities without checking them — turning O(n²) into O(n).&rdquo;
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
