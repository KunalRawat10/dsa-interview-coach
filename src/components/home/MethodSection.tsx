import { motion } from 'motion/react'
import { ArrowRight, Eye, Compass, Layers, Key, Code2 } from 'lucide-react'

const stages = [
  {
    num: '01',
    name: 'Understand',
    sub: 'Read & identify problem constraints',
    Icon: Eye,
  },
  {
    num: '02',
    name: 'Observe',
    sub: 'Look for structural clues & properties',
    Icon: Compass,
  },
  {
    num: '03',
    name: 'Pattern',
    sub: 'Map to a known algorithmic pattern',
    Icon: Layers,
  },
  {
    num: '04',
    name: 'Invariant',
    sub: 'Identify the rule that must hold true',
    Icon: Key,
    highlight: true,
  },
  {
    num: '05',
    name: 'Implement',
    sub: 'Write clean, pattern-grounded code',
    Icon: Code2,
  },
]

export default function MethodSection() {
  return (
    <section className="py-24 sm:py-32 relative border-t border-[#1C2029]">
      {/* Centered Heading & Subtext */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <div className="text-xs font-mono text-[#4A72FF] tracking-wide uppercase mb-3 font-semibold">
          THE LEARNING METHOD
        </div>

        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#F2F1EC] tracking-tight leading-[1.1] mb-4">
          From problem to intuition, <br />
          <span className="text-[#4A72FF]">one step at a time.</span>
        </h2>

        <p className="font-sans text-base sm:text-lg text-[#8E94A0] max-w-2xl mx-auto leading-relaxed">
          PatternOS doesn&apos;t hand you the answer. It walks you through the reasoning that makes the answer inevitable.
        </p>
      </motion.div>

      {/* 5 Connected Pipeline Stages */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
        {stages.map((stage, idx) => {
          const { Icon } = stage
          return (
            <div
              key={stage.num}
              className={`relative rounded-xl border p-4 sm:p-5 flex flex-col justify-between ${
                stage.highlight
                  ? 'bg-[#0E1526] border-[#4A72FF]/50 shadow-xl shadow-black/50 ring-1 ring-[#4A72FF]/20'
                  : 'bg-[#0A0D14] border-[#222733]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-mono text-xs font-semibold ${stage.highlight ? 'text-[#4A72FF]' : 'text-[#5C6370]'}`}>
                    {stage.num}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-md border flex items-center justify-center ${
                      stage.highlight
                        ? 'bg-[#141F3C] border-[#4A72FF]/40 text-[#4A72FF]'
                        : 'bg-[#141822] border-[#222733] text-[#8E94A0]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="font-display font-semibold text-base text-[#F2F1EC] mb-1">
                  {stage.name}
                </div>

                <p className="font-sans text-[11px] sm:text-xs text-[#8E94A0] leading-snug">
                  {stage.sub}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-[#1C202A] flex items-center justify-between text-[10px] font-mono text-[#5C6370]">
                <span>Phase {stage.num}</span>
                {idx < stages.length - 1 ? (
                  <ArrowRight className="w-3 h-3 text-[#4A72FF]/50" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4A72FF]" />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Example 3Sum Invariant Decomposition Box (Matching Screenshot) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-xl border border-[#222733] bg-[#0A0D14] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
      >
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#1C202A] pb-4 md:pb-0 md:pr-6 space-y-1">
          <div className="text-[11px] font-mono text-[#4A72FF] uppercase font-semibold">
            EXAMPLE: 3SUM
          </div>
          <div className="font-display font-bold text-base text-[#F2F1EC]">
            Find all unique triplets that sum to zero
          </div>
          <p className="text-xs text-[#5C6370] font-mono">
            Time: O(N²) · Space: O(1)
          </p>
        </div>

        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-[#8E94A0]">
          <div className="p-2.5 rounded bg-[#07090E] border border-[#1C202A]">
            <span className="text-[#4A72FF] font-bold mr-1.5">1.</span> Sort array to enable two pointers
          </div>
          <div className="p-2.5 rounded bg-[#07090E] border border-[#1C202A]">
            <span className="text-[#4A72FF] font-bold mr-1.5">2.</span> Fix first element, two pointers for rest
          </div>
          <div className="p-2.5 rounded bg-[#10192A] border border-[#223356] text-[#F2F1EC]">
            <span className="text-[#4A72FF] font-bold mr-1.5">3.</span> Invariant: sum &lt; 0 → left++, sum &gt; 0 → right--
          </div>
          <div className="p-2.5 rounded bg-[#07090E] border border-[#1C202A]">
            <span className="text-[#4A72FF] font-bold mr-1.5">4.</span> Skip duplicates to ensure unique triplets
          </div>
        </div>
      </motion.div>
    </section>
  )
}
