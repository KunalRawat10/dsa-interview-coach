import { motion } from 'motion/react'
import { Layers, Bot, Activity, BookOpen } from 'lucide-react'

const capabilities = [
  {
    tag: '40+ Patterns',
    title: 'Core Algorithmic Blueprints',
    description: 'Master structural invariants across linear, graph, dynamic, and tree problems.',
    icon: Layers,
    accent: '#6D8CFF',
  },
  {
    tag: 'Socratic Tutor',
    title: 'Guided Reasoning Engine',
    description: 'Interactive questioning that teaches you how to think, not just gives code.',
    icon: Bot,
    accent: '#6D8CFF',
  },
  {
    tag: 'Complexity Analysis',
    title: 'Visual Big-O Invariants',
    description: 'Intuitive runtime analysis that connects mathematical constraints to code structure.',
    icon: Activity,
    accent: '#C9A66B',
  },
  {
    tag: 'Knowledge Base',
    title: 'Personal Pattern Memory',
    description: 'Spaced recall, cross-pattern connection maps, and structured synthesis notes.',
    icon: BookOpen,
    accent: '#C9A66B',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export default function StatsStrip() {
  return (
    <section className="py-12 sm:py-16 relative">
      <div className="text-center max-w-2xl mx-auto mb-9">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#292D34] bg-[#111419] mb-3 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6D8CFF]" />
          <span className="font-mono text-xs text-[#92959C]">
            System Capabilities
          </span>
        </div>
        <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#F2F1EC]">
          Everything you need to build algorithmic intuition
        </h3>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5"
      >
        {capabilities.map((item) => {
          const { icon: Icon } = item
          return (
            <motion.div
              key={item.tag}
              variants={cardVariants}
              className="relative rounded-xl border border-[#292D34] bg-[#111419] p-5 sm:p-6 transition-all duration-150 hover:border-[#3E434D] hover:bg-[#151920] group flex flex-col justify-between shadow-lg shadow-black/40"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-8 h-8 rounded-lg bg-[#151920] border border-[#292D34] flex items-center justify-center text-[#F2F1EC] group-hover:border-[#6D8CFF]/40 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[11px] font-medium" style={{ color: item.accent }}>
                    {item.tag}
                  </span>
                </div>

                <div className="font-display font-semibold text-base text-[#F2F1EC] mb-1.5">
                  {item.title}
                </div>

                <p className="font-sans text-xs sm:text-sm text-[#92959C] leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#292D34] flex items-center justify-between text-[11px] font-mono text-[#92959C]">
                <span>PatternOS Core</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#292D34] group-hover:bg-[#6D8CFF] transition-colors" />
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </section>
  )
}
