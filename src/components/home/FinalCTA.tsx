import { motion } from 'motion/react'
import type { TabId } from '../../App'
import { ArrowRight } from 'lucide-react'

interface FinalCTAProps {
  onNavigate: (tab: TabId) => void
}

export default function FinalCTA({ onNavigate }: FinalCTAProps) {
  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <div className="border-t border-[#1C2029]">
      {/* Minimal Closing CTA Section */}
      <section className="py-28 sm:py-36 relative text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 18 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto flex flex-col items-center"
        >
          {/* Emblem Badge */}
          <div className="w-10 h-10 rounded-xl bg-[#0E121A] border border-[#222733] flex items-center justify-center text-[#4A72FF] mb-8 shadow-sm">
            <span className="text-lg">◈</span>
          </div>

          {/* Headline */}
          <h2 className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl text-[#F2F1EC] tracking-tight leading-[1.05] mb-5">
            Stop memorizing. <br />
            <span className="text-[#4A72FF]">Start seeing.</span>
          </h2>

          {/* Subtitle */}
          <p className="font-sans text-base sm:text-lg text-[#8E94A0] max-w-xl mx-auto mb-9 leading-relaxed">
            Build the intuition that stays with you. Learn to see the structure behind any
            algorithmic problem — and solve it from understanding.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('practice')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-md bg-[#4A72FF] hover:bg-[#3B61E8] text-white font-sans font-medium text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <span>Start Learning</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('constellation')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-md bg-[#0D1016] hover:bg-[#141822] border border-[#222733] text-[#F2F1EC] font-sans font-medium text-sm sm:text-base cursor-pointer transition-colors"
            >
              <span>Explore patterns</span>
            </button>
          </div>

          {/* Microcopy */}
          <div className="mt-6 text-xs text-[#5C6370] font-sans">
            Free to start. No credit card required.
          </div>
        </motion.div>
      </section>

      {/* Minimal Footer */}
      <footer className="pt-12 pb-20 border-t border-[#1C2029] text-xs font-sans text-[#8E94A0]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-3">
            <button
              type="button"
              onClick={handleScrollTop}
              aria-label="PatternOS home"
              className="flex items-center gap-2.5 cursor-pointer group select-none transition-opacity hover:opacity-90 active:opacity-80 p-0 bg-transparent border-0 text-left"
            >
              <Logo />
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#F2F1EC]">
                PatternOS
              </span>
            </button>
            <p className="text-xs text-[#5C6370] max-w-xs leading-relaxed">
              Think in patterns, not solutions. A platform for building algorithmic intuition.
            </p>
          </div>

          {/* Navigation Links Columns */}
          <div className="md:col-span-7 grid grid-cols-3 gap-6">
            {/* Product */}
            <div className="space-y-2.5">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#F2F1EC] font-medium">
                Product
              </div>
              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => onNavigate('constellation')}
                    className="text-[#8E94A0] hover:text-[#F2F1EC] transition-colors cursor-pointer"
                  >
                    Constellation
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('practice')}
                    className="text-[#8E94A0] hover:text-[#F2F1EC] transition-colors cursor-pointer"
                  >
                    Practice
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('practice')}
                    className="text-[#8E94A0] hover:text-[#F2F1EC] transition-colors cursor-pointer"
                  >
                    AI Tutor
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('complexity')}
                    className="text-[#8E94A0] hover:text-[#F2F1EC] transition-colors cursor-pointer"
                  >
                    Complexity
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => onNavigate('knowledge')}
                    className="text-[#8E94A0] hover:text-[#F2F1EC] transition-colors cursor-pointer"
                  >
                    Knowledge
                  </button>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div className="space-y-2.5">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#F2F1EC] font-medium">
                Resources
              </div>
              <ul className="space-y-2 text-xs text-[#8E94A0]">
                <li><span className="hover:text-[#F2F1EC] cursor-pointer">Pattern Library</span></li>
                <li><span className="hover:text-[#F2F1EC] cursor-pointer">Learning Paths</span></li>
                <li><span className="hover:text-[#F2F1EC] cursor-pointer">Documentation</span></li>
                <li><span className="hover:text-[#F2F1EC] cursor-pointer">Blog</span></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-2.5">
              <div className="font-mono text-[11px] uppercase tracking-wider text-[#F2F1EC] font-medium">
                Company
              </div>
              <ul className="space-y-2 text-xs text-[#8E94A0]">
                <li><span className="hover:text-[#F2F1EC] cursor-pointer">About</span></li>
                <li><span className="hover:text-[#F2F1EC] cursor-pointer">Mission</span></li>
                <li><span className="hover:text-[#F2F1EC] cursor-pointer">Contact</span></li>
                <li><span className="hover:text-[#F2F1EC] cursor-pointer">Privacy</span></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0">
      <rect width="28" height="28" rx="7" fill="#111317" stroke="#2C313A" strokeWidth="1" />
      <circle cx="9" cy="9" r="2.5" fill="#4B8FE7" />
      <circle cx="19" cy="9" r="2.5" fill="#2E72D0" />
      <circle cx="14" cy="19" r="2.5" fill="#C9A961" />
      <line x1="9" y1="9" x2="19" y2="9" stroke="#2C313A" strokeWidth="1.5" />
      <line x1="9" y1="9" x2="14" y2="19" stroke="#2C313A" strokeWidth="1.5" />
      <line x1="19" y1="9" x2="14" y2="19" stroke="#2C313A" strokeWidth="1.5" />
    </svg>
  )
}

