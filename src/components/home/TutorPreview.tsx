import { motion } from 'motion/react'
import type { TabId } from '../../App'
import { Bot, User, Send } from 'lucide-react'

interface TutorPreviewProps {
  onNavigate: (tab: TabId) => void
}

export default function TutorPreview({ onNavigate }: TutorPreviewProps) {
  return (
    <section className="py-24 sm:py-32 relative border-t border-[#1C2029]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Socratic Chat Interface (6 cols) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 18 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-6 order-2 lg:order-1"
        >
          <div className="rounded-xl border border-[#222733] bg-[#0A0D14] shadow-2xl shadow-black/80 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1C202A] bg-[#0D1017]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-[#131B2E] border border-[#223356] flex items-center justify-center text-[#4A72FF]">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#F2F1EC]">PatternOS Tutor</div>
                  <div className="text-[10px] font-mono text-[#5C6370]">Container With Most Water</div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10141D] text-[#4ADE80] border border-[#1E232E]">
                ● Socratic Mode
              </span>
            </div>

            {/* Conversation Messages */}
            <div className="p-4 sm:p-5 space-y-3.5 font-sans text-xs bg-[#07090E]">
              {/* User 1 */}
              <div className="flex items-start justify-end gap-2.5">
                <div className="p-3 rounded-lg bg-[#141A29] border border-[#263558] text-[#F2F1EC] max-w-sm">
                  How should I approach this problem?
                </div>
                <div className="w-6 h-6 rounded bg-[#1A1F2C] border border-[#262B36] flex items-center justify-center text-[#8E94A0] shrink-0 mt-1">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Tutor 1 */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-[#141C30] border border-[#223356] flex items-center justify-center text-[#4A72FF] shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3.5 rounded-lg bg-[#0D1017] border border-[#1C202A] text-[#F2F1EC] max-w-md space-y-1.5 leading-relaxed">
                  What happens if you consider the two boundaries independently?
                </div>
              </div>

              {/* User 2 */}
              <div className="flex items-start justify-end gap-2.5">
                <div className="p-3 rounded-lg bg-[#141A29] border border-[#263558] text-[#F2F1EC] max-w-sm">
                  The shorter boundary limits the maximum area.
                </div>
                <div className="w-6 h-6 rounded bg-[#1A1F2C] border border-[#262B36] flex items-center justify-center text-[#8E94A0] shrink-0 mt-1">
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Tutor 2 */}
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded bg-[#141C30] border border-[#223356] flex items-center justify-center text-[#4A72FF] shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3.5 rounded-lg bg-[#0D1017] border border-[#1C202A] text-[#F2F1EC] max-w-md space-y-1.5 leading-relaxed">
                  Exactly. What does that suggest about which pointer should move?
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-[#1C202A] bg-[#0D1017] flex items-center justify-between gap-2">
              <input
                type="text"
                placeholder="Ask a question..."
                className="w-full bg-transparent text-xs text-[#F2F1EC] placeholder-[#5C6370] focus:outline-none font-sans"
              />
              <button
                onClick={() => onNavigate('practice')}
                className="w-7 h-7 rounded bg-[#4A72FF] hover:bg-[#3B61E8] text-white flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Editorial Headline & Bullet Points (6 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 xl:col-span-6 order-1 lg:order-2"
        >
          <div className="text-xs font-mono text-[#4A72FF] tracking-wide uppercase mb-3 font-semibold">
            AI TUTOR
          </div>

          <h2 className="font-display font-extrabold text-4xl sm:text-6xl text-[#F2F1EC] tracking-tight leading-[1.05] mb-6">
            A mentor, <br />
            not an answer <br />
            <span className="text-[#4A72FF]">engine.</span>
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#8E94A0] mb-8 leading-relaxed max-w-xl">
            The AI tutor doesn&apos;t give you code. It asks Socratic questions that guide you to discover the pattern and invariant yourself.
          </p>

          <ul className="space-y-4 mb-9 font-sans text-xs sm:text-sm text-[#F2F1EC] max-w-lg">
            <li className="flex items-start gap-3">
              <span className="text-[#4A72FF] font-bold">•</span>
              <span>Invariant-directed questioning</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#4A72FF] font-bold">•</span>
              <span>Context-aware of your current progress</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#4A72FF] font-bold">•</span>
              <span>Never spoils the solution before you try</span>
            </li>
          </ul>

          <button
            onClick={() => onNavigate('practice')}
            className="px-6 py-3 rounded-md bg-[#4A72FF] hover:bg-[#3B61E8] text-white font-sans font-medium text-sm cursor-pointer transition-colors shadow-sm"
          >
            <span>Try with AI Tutor</span>
          </button>
        </motion.div>
      </div>
    </section>
  )
}
