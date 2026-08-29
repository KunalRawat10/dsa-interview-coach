import { useState } from 'react'
import { motion } from 'motion/react'
import type { TabId } from '../../App'
import { Search, Sparkles, ArrowRight, ArrowDown, BookOpen } from 'lucide-react'

interface KnowledgePreviewProps {
  onNavigate: (tab: TabId) => void
}

const memorySteps = [
  {
    step: '01',
    name: 'Learn',
    desc: 'Study a pattern or solve a problem',
  },
  {
    step: '02',
    name: 'Save',
    desc: 'Store your notes and insights',
  },
  {
    step: '03',
    name: 'Retrieve',
    desc: 'PatternOS finds relevant notes when you need them',
  },
  {
    step: '04',
    name: 'Connect',
    desc: 'Your knowledge base grows and interconnects over time',
  },
]

export default function KnowledgePreview({ onNavigate }: KnowledgePreviewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  return (
    <section className="py-24 sm:py-32 relative border-t border-[#1C2029]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: 4-Step Vertical Memory Flow (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex flex-col items-start"
        >
          <div className="text-xs font-mono text-[#4A72FF] tracking-wide uppercase mb-3 font-semibold">
            KNOWLEDGE
          </div>

          <h2 className="font-display font-extrabold text-4xl sm:text-6xl text-[#F2F1EC] tracking-tight leading-[1.05] mb-6">
            Your personal <br />
            <span className="text-[#8E94A0]">DSA memory.</span>
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#8E94A0] mb-8 leading-relaxed">
            Save notes, connect ideas, and PatternOS retrieves your stored knowledge to ground
            future answers in what you&apos;ve already learned.
          </p>

          {/* 4 Process Cards Connected by Arrows */}
          <div className="space-y-2 w-full">
            {memorySteps.map((step, idx) => (
              <div key={step.step}>
                <div className="p-3.5 rounded-lg bg-[#0A0D14] border border-[#1E232E] flex items-center gap-3">
                  <span className="font-mono text-xs font-semibold text-[#4A72FF] shrink-0">
                    {step.step}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-[#F2F1EC] mr-2">{step.name}</span>
                    <span className="text-xs text-[#8E94A0] font-sans">{step.desc}</span>
                  </div>
                </div>
                {idx < memorySteps.length - 1 && (
                  <div className="pl-6 py-1 text-[#4A72FF]/40 flex items-center">
                    <ArrowDown className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigate('knowledge')}
            className="mt-8 px-6 py-3 rounded-md bg-[#4A72FF] hover:bg-[#3B61E8] text-white font-sans font-medium text-sm flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
          >
            <span>Open Knowledge Base</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Right Column: Knowledge Base Product Window (7 cols) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 18 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7"
        >
          <div className="rounded-xl border border-[#222733] bg-[#0A0D14] shadow-2xl shadow-black/80 overflow-hidden">
            {/* Header Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#1C202A] bg-[#0D1017]">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-[#4A72FF]" />
                <span className="text-xs font-mono text-[#F2F1EC]">
                  patternos / knowledge base
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#5C6370]">12 notes stored</span>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-1 sm:grid-cols-12 min-h-[440px]">
              {/* Left Sub-Sidebar (4 cols) */}
              <div className="sm:col-span-4 border-b sm:border-b-0 sm:border-r border-[#1C202A] p-4 bg-[#0B0E15] space-y-3.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5C6370]" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded bg-[#10141D] border border-[#1E232E] text-xs text-[#F2F1EC] placeholder-[#5C6370] focus:outline-none focus:border-[#4A72FF]"
                  />
                </div>

                <div className="space-y-1 pt-1 font-mono text-xs">
                  {[
                    { id: 'all', label: 'ALL NOTES' },
                    { id: 'two-pointers', label: 'Two Pointers' },
                    { id: 'sliding-window', label: 'Sliding Window' },
                    { id: 'binary-search', label: 'Binary Search' },
                    { id: 'dp', label: 'Dynamic Programming' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`w-full text-left px-3 py-1.5 rounded transition-colors cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-[#151B28] text-[#4A72FF] font-medium border border-[#222E46]'
                          : 'text-[#8E94A0] hover:text-[#F2F1EC]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Notes Stream (8 cols) */}
              <div className="sm:col-span-8 p-4 sm:p-5 bg-[#07090E] space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Note 1 */}
                  <div className="p-3.5 rounded-lg bg-[#0D1017] border border-[#222E46] text-xs">
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#5C6370] mb-1">
                      <span className="text-[#4A72FF] font-medium">Two Pointers</span>
                      <div className="flex items-center gap-2">
                        <span>Sep 28</span>
                        <span className="text-[#4ADE80] font-sans flex items-center gap-0.5">
                          ★ Match
                        </span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-sm text-[#F2F1EC] mb-1">
                      Two Pointers — when to move which side
                    </h4>
                    <p className="text-[11px] text-[#8E94A0] leading-relaxed mb-2 font-sans">
                      The key insight: moving the shorter boundary is the only move that can improve the result. Moving the taller one can only shrink or maintain the area...
                    </p>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-[#5C6370]">
                      <span className="px-1.5 py-0.5 rounded bg-[#10141D] border border-[#1E232E]">
                        #two-pointers
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#10141D] border border-[#1E232E]">
                        #invariant
                      </span>
                    </div>
                  </div>

                  {/* Note 2 */}
                  <div className="p-3.5 rounded-lg bg-[#0D1017] border border-[#1C202A] text-xs">
                    <div className="flex items-center justify-between font-mono text-[11px] text-[#5C6370] mb-1">
                      <span className="text-[#D19A66] font-medium">Sliding Window</span>
                      <span>Sep 27</span>
                    </div>
                    <h4 className="font-semibold text-sm text-[#F2F1EC] mb-1">
                      Sliding Window vs Two Pointers
                    </h4>
                    <p className="text-[11px] text-[#8E94A0] leading-relaxed mb-2 font-sans">
                      Sliding Window maintains a contiguous range; Two Pointers can be non-contiguous. Window is about what&apos;s inside; pointers are about boundaries...
                    </p>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-[#5C6370]">
                      <span className="px-1.5 py-0.5 rounded bg-[#10141D] border border-[#1E232E]">
                        #sliding-window
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#10141D] border border-[#1E232E]">
                        #intuition
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Match Notification */}
                <div className="p-2.5 rounded-md bg-[#10192A] border border-[#223356] flex items-center gap-2 text-xs font-mono text-[#4A72FF]">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>RETRIEVED: 2 notes matched &quot;two pointers invariant&quot;</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
