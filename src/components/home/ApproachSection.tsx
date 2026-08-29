import { motion } from 'motion/react'
import { Eye, Lightbulb, TrendingUp, BrainCircuit } from 'lucide-react'

const steps = [
  {
    step: '01',
    code: 'STRUCTURE',
    title: 'Understand Patterns',
    description: 'See the underlying structures and invariants that power algorithmic problems.',
    Icon: Eye,
    active: true,
  },
  {
    step: '02',
    code: 'INVARIANT',
    title: 'Practice Intuitively',
    description: 'Solve with Socratic guidance that builds genuine, lasting mental models.',
    Icon: Lightbulb,
    active: false,
  },
  {
    step: '03',
    code: 'OPTIMIZATION',
    title: 'Tackle Complexity',
    description: 'Gradually level up to multi-pointer coordination and amortized optimizations.',
    Icon: TrendingUp,
    active: false,
  },
  {
    step: '04',
    code: 'SYNTHESIS',
    title: 'Build Knowledge',
    description: 'Retain with multi-dimensional connection maps, summaries, and spaced recall.',
    Icon: BrainCircuit,
    active: false,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export default function ApproachSection() {
  return (
    <section className="py-14 sm:py-18 relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto mb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#292D34] bg-[#111419] mb-3.5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6D8CFF]" />
          <span className="font-mono text-xs text-[#92959C]">The Learning Method</span>
        </div>

        <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#F2F1EC] tracking-tight">
          How PatternOS changes the way you solve
        </h2>

        <p className="font-sans text-[#92959C] text-sm sm:text-base mt-2.5 max-w-xl mx-auto">
          Transform unstructured problems into deterministic solutions through invariant discovery:
        </p>

        {/* Editorial Pipeline Sequence */}
        <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#111419] border border-[#292D34] text-xs font-mono text-[#92959C]">
          <span>Problem</span>
          <span className="text-[#6D8CFF]">→</span>
          <span className="text-[#F2F1EC]">Structure</span>
          <span className="text-[#6D8CFF]">→</span>
          <span className="text-[#F2F1EC]">Pattern</span>
          <span className="text-[#C9A66B]">→</span>
          <span className="text-[#C9A66B] font-medium">Invariant</span>
          <span className="text-[#6D8CFF]">→</span>
          <span className="text-[#F2F1EC]">Solution</span>
        </div>
      </motion.div>

      {/* Connected 4-Stage Process Pipeline */}
      <div className="relative">
        {/* Horizontal Connector Line on Desktop */}
        <div className="hidden lg:block absolute top-1/2 left-6 right-6 -translate-y-5 pointer-events-none z-0">
          <div className="w-full h-px bg-[#292D34]" />
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 relative z-10"
        >
          {steps.map((item, index) => {
            const { Icon } = item
            return (
              <motion.div
                key={item.step}
                variants={cardVariants}
                className={`relative rounded-xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-150 ${
                  item.active
                    ? 'bg-[#151920] border-[#6D8CFF]/60 shadow-xl shadow-black/60 ring-1 ring-[#6D8CFF]/20'
                    : 'bg-[#111419] border-[#292D34] hover:border-[#3E434D] hover:bg-[#151920]'
                }`}
              >
                <div>
                  {/* Step header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`font-mono font-semibold text-xs ${item.active ? 'text-[#6D8CFF]' : 'text-[#92959C]'}`}>
                      0{index + 1}
                    </span>
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
                      item.active
                        ? 'bg-[#181E36] border-[#6D8CFF]/40 text-[#6D8CFF]'
                        : 'bg-[#151920] border-[#292D34] text-[#92959C]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-semibold text-base text-[#F2F1EC] mb-1.5">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="font-sans text-xs sm:text-sm text-[#92959C] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bottom identifier */}
                <div className="mt-5 pt-3 border-t border-[#292D34] flex items-center justify-between text-[11px] font-mono text-[#92959C]">
                  <span>{item.code}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-[#6D8CFF]' : 'bg-[#292D34]'}`} />
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
