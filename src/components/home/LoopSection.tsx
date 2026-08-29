import { motion } from 'motion/react'

const loopNodes = [
  {
    step: '01',
    title: 'Learn',
    sub: 'Study patterns',
    x: 50,
    y: 8,
  },
  {
    step: '02',
    title: 'Practice',
    sub: 'Solve problems',
    x: 88,
    y: 30,
  },
  {
    step: '03',
    title: 'Understand',
    sub: 'Find invariants',
    x: 88,
    y: 70,
  },
  {
    step: '04',
    title: 'Connect',
    sub: 'Link patterns',
    x: 50,
    y: 92,
  },
  {
    step: '05',
    title: 'Remember',
    sub: 'Save knowledge',
    x: 12,
    y: 70,
  },
  {
    step: '06',
    title: 'Apply',
    sub: 'New problems',
    x: 12,
    y: 30,
  },
]

export default function LoopSection() {
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
          THE COMPLETE LOOP
        </div>

        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#F2F1EC] tracking-tight leading-[1.1] mb-4">
          One system. <br />
          <span className="text-[#4A72FF]">Not five disconnected tools.</span>
        </h2>

        <p className="font-sans text-base sm:text-lg text-[#8E94A0] max-w-2xl mx-auto leading-relaxed">
          Every area of PatternOS feeds into the next. You learn, practice, understand,
          connect, remember — and then apply it all to a problem you&apos;ve never seen before.
        </p>
      </motion.div>

      {/* Hexagonal Restrained System Diagram */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-2xl mx-auto h-[440px] sm:h-[480px] flex items-center justify-center"
      >
        {/* Subtle Dashed Connectors */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <polygon
            points="336,40 591,150 591,350 336,460 81,350 81,150"
            fill="none"
            stroke="rgba(92, 99, 112, 0.2)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="hidden sm:block"
          />
          <circle
            cx="50%"
            cy="50%"
            r="105"
            fill="none"
            stroke="rgba(74, 114, 255, 0.08)"
            strokeWidth="1"
          />
          <circle
            cx="50%"
            cy="50%"
            r="155"
            fill="none"
            stroke="rgba(255, 255, 255, 0.02)"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        </svg>

        {/* Central PatternOS Core */}
        <div className="relative z-10 flex flex-col items-center justify-center p-6 rounded-full bg-[#0D1016] border border-[#222E46] shadow-2xl shadow-black/80 w-36 h-36 sm:w-44 sm:h-44 text-center">
          <span className="text-xl text-[#4A72FF] mb-1">◈</span>
          <span className="font-display font-bold text-base sm:text-lg text-[#F2F1EC]">
            PatternOS
          </span>
          <span className="font-mono text-[10px] sm:text-[11px] text-[#5C6370] mt-0.5">
            active loop
          </span>
        </div>

        {/* 6 Nodes */}
        {loopNodes.map((node) => (
          <div
            key={node.step}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center z-20"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#0E121A] border border-[#222733] flex items-center justify-center shadow-lg shadow-black/60 relative group hover:border-[#4A72FF] transition-colors">
              <span className="font-mono text-xs font-semibold text-[#4A72FF]">
                {node.step}
              </span>
            </div>
            <span className="font-display font-semibold text-xs sm:text-sm text-[#F2F1EC] mt-1.5">
              {node.title}
            </span>
            <span className="font-sans text-[10px] sm:text-[11px] text-[#5C6370]">
              {node.sub}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  )
}
