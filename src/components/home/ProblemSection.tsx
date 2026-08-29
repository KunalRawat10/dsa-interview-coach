import { motion } from 'motion/react'
import { XCircle, CheckCircle2 } from 'lucide-react'

export default function ProblemSection() {
  return (
    <section className="py-24 sm:py-32 relative border-t border-[#1C2029]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mb-14"
      >
        <div className="text-xs font-mono text-[#4A72FF] tracking-wide uppercase mb-3 font-semibold">
          THE PROBLEM
        </div>

        <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-[#F2F1EC] tracking-tight leading-[1.1]">
          You solved it before. <br />
          <span className="text-[#8E94A0]">But can you recognize it again?</span>
        </h2>
      </motion.div>

      {/* Side-by-Side Comparison Cards (Exact Screenshot Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch">
        {/* Left: Without Patterns */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-xl border border-[#262B36] bg-[#0A0D14] p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 pb-4 mb-6 border-b border-[#1C202A]">
              <XCircle className="w-4 h-4 text-[#E06C75]" />
              <span className="font-mono text-xs font-semibold text-[#E06C75] tracking-wider uppercase">
                WITHOUT PATTERNS
              </span>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-[#8E94A0] font-sans">
              <li className="flex items-start gap-2.5">
                <span className="text-[#E06C75] font-bold">•</span>
                <span>Memorize 400+ problems individually</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#E06C75] font-bold">•</span>
                <span>Forget solutions within weeks</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#E06C75] font-bold">•</span>
                <span>Freeze when problem wording changes</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#E06C75] font-bold">•</span>
                <span>No framework for unseen problems</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#E06C75] font-bold">•</span>
                <span>False confidence in mock interviews</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 p-3.5 rounded-lg bg-[#11141D] border border-[#1E232E] text-xs font-mono text-[#E06C75] flex items-center justify-between">
            <span>Average retention after 30 days:</span>
            <span className="font-bold text-sm">18%</span>
          </div>
        </motion.div>

        {/* Right: With PatternOS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          className="rounded-xl border border-[#223356] bg-[#0A0E18] p-6 sm:p-8 flex flex-col justify-between shadow-xl shadow-black/40"
        >
          <div>
            <div className="flex items-center gap-2 pb-4 mb-6 border-b border-[#1C2436]">
              <CheckCircle2 className="w-4 h-4 text-[#4A72FF]" />
              <span className="font-mono text-xs font-semibold text-[#4A72FF] tracking-wider uppercase">
                WITH PATTERNOS
              </span>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-[#F2F1EC] font-sans">
              <li className="flex items-start gap-2.5">
                <span className="text-[#4A72FF] font-bold">•</span>
                <span>Learn 24 fundamental patterns</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#4A72FF] font-bold">•</span>
                <span>Recognize patterns across problem types</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#4A72FF] font-bold">•</span>
                <span>Invariants guide every step of the solution</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#4A72FF] font-bold">•</span>
                <span>Systematically approach unseen problems</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#4A72FF] font-bold">•</span>
                <span>Retention powered by spaced repetition</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 p-3.5 rounded-lg bg-[#10192A] border border-[#223356] text-xs font-mono text-[#4A72FF] flex items-center justify-between">
            <span>Average retention after 30 days:</span>
            <span className="font-bold text-sm text-[#4ADE80]">84%</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Quote Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
        className="mt-8 p-4 sm:p-5 rounded-xl border border-[#222733] bg-[#0A0D14] text-center font-mono text-xs sm:text-sm text-[#8E94A0] leading-relaxed"
      >
        &ldquo;The difference between solving 500 problems and understanding 24 patterns is the difference between memorization and mastery.&rdquo;
      </motion.div>
    </section>
  )
}
