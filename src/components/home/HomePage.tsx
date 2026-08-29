import { useRevealAll } from '../../hooks/useReveal'
import type { TabId } from '../../App'
import Hero from './Hero'
import Problem from './Problem'
import Method from './Method'
import ConstellationSection from './ConstellationSection'
import Practice from './Practice'
import Tutor from './Tutor'
import Complexity from './Complexity'
import Knowledge from './Knowledge'
import Loop from './Loop'
import CTA from './CTA'
import Footer from './Footer'

interface HomePageProps {
  onNavigate: (tab: TabId) => void
}

export default function HomePage({ onNavigate }: HomePageProps) {
  useRevealAll()

  return (
    <div className="w-full bg-ink-950 text-paper-100 font-sans selection:bg-accent-500/30 selection:text-paper-50">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        {/* 1. Hero: Think in patterns. Not solutions. */}
        <Hero onNavigate={onNavigate} />

        {/* 2. Problem: You solved it before. But can you recognize it again? */}
        <Problem />

        {/* 3. Method: From problem to intuition, one step at a time. */}
        <Method />

        {/* 4. Constellation: Preserved v0 3-Pane PatternOS Constellation */}
        <ConstellationSection onNavigate={onNavigate} />

        {/* 5. Practice: Guided reasoning, not revealed answers. */}
        <Practice />

        {/* 6. AI Tutor: A mentor, not an answer engine. */}
        <Tutor />

        {/* 7. Complexity: Not just the answer. The why behind it. */}
        <Complexity />

        {/* 8. Knowledge: Your personal DSA memory. */}
        <Knowledge />

        {/* 9. Complete Loop: One system. Not five disconnected tools. */}
        <Loop />

        {/* 10. Final CTA: Stop memorizing. Start seeing. */}
        <CTA onNavigate={onNavigate} />
      </main>

      {/* 11. Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  )
}
