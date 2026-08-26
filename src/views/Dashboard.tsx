import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useProgress } from '../hooks/useProgress'
import type { TabId } from '../App'

gsap.registerPlugin(ScrollTrigger)

// Cards with a `tab` navigate on click. Cards without one are informational only.
const cards: Array<{
  id: string
  icon: string
  title: string
  desc: string
  span: string
  tab?: TabId
}> = [
    {
      id: 'chat',
      icon: '◉',
      title: 'Socratic Interview',
      desc: 'AI asks guiding questions before revealing answers. Learn to think, not memorize.',
      span: 'col-span-2',
      tab: 'chat',
    },
    {
      id: 'complexity',
      icon: '◈',
      title: 'Complexity Lens',
      desc: 'Paste code. Get instant Big-O analysis with animated visualizations.',
      span: 'col-span-1',
      tab: 'analyzer',
    },
    {
      id: 'constellation',
      icon: '✦',
      title: 'Pattern Map',
      desc: 'Visual constellation of DSA patterns. Track mastery across the algorithmic cosmos.',
      span: 'col-span-1',
      tab: 'constellation',
    },
    {
      id: 'weakness',
      icon: '◐',
      title: 'Weakness Radar',
      desc: 'Spaced repetition tracker identifies gaps and recommends the next problem.',
      span: 'col-span-1',
    },
    {
      id: 'rag',
      icon: '◊',
      title: 'Knowledge Base',
      desc: 'RAG-powered retrieval from your DSA notes. Grounded answers, no hallucination.',
      span: 'col-span-1',
      tab: 'knowledge',
    },
    {
      id: 'offline',
      icon: '◉',
      title: 'Works Offline',
      desc: 'Once loaded, everything runs locally. No API keys. No server bills. No internet needed.',
      span: 'col-span-1',
    },
  ]

interface DashboardProps {
  onNavigate: (tab: TabId) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { progress } = useProgress()

  const stats = [
    { value: String(progress.patternsMastered), label: 'Patterns mastered' },
    { value: String(progress.problemsSolved), label: 'Problems solved' },
    { value: String(progress.dayStreak), label: 'Day streak' },
  ]

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el.querySelectorAll('.hero-title'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.1 }
      )
      gsap.fromTo(
        el.querySelectorAll('.hero-subtitle'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', delay: 0.3 }
      )
      gsap.fromTo(
        el.querySelectorAll('.stat-item'),
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.5 }
      )
      gsap.fromTo(
        el.querySelectorAll('.bento-card'),
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el.querySelector('.bento-grid'),
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      )
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="space-y-10">
      <div className="text-center space-y-3 pt-4">
        <h1 className="hero-title text-4xl font-medium tracking-tight">
          Navigate the universe of algorithms
        </h1>
        <p className="hero-subtitle text-text-tertiary text-base max-w-xl mx-auto">
          Your personal DSA mentor. Entirely in your browser. Zero cost. Infinite practice.
        </p>
        <div className="flex justify-center gap-12 pt-4">
          {stats.map((s) => (
            <div key={s.label} className="stat-item text-center">
              <div className="text-3xl font-medium text-accent font-[tabular-nums]">
                {s.value}
              </div>
              <div className="text-xs text-text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        {progress.problemsSolved === 0 && (
          <button
            onClick={() => onNavigate('chat')}
            className="mt-2 text-sm text-accent font-medium hover:underline"
          >
            Start your first Socratic session →
          </button>
        )}
      </div>

      <div className="bento-grid grid grid-cols-3 gap-4">
        {cards.map((card) => {
          const clickable = Boolean(card.tab)
          return (
            <div
              key={card.id}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onNavigate(card.tab!) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') onNavigate(card.tab!)
                  }
                  : undefined
              }
              className={
                card.span +
                ' bento-card group p-6 rounded-xl border border-border-subtle bg-surface-raised hover:border-border-hover hover:-translate-y-0.5 hover:bg-surface-strong transition-all duration-250 ' +
                (clickable ? 'cursor-pointer' : 'cursor-default')
              }
            >
              <div className="w-10 h-10 mb-4 rounded-lg flex items-center justify-center bg-accent/10 text-accent text-lg transition-all duration-300 ease-out group-hover:bg-accent/20 group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(107,140,255,0.45)]">
                {card.icon}
              </div>
              <h3 className="text-base font-medium mb-2">{card.title}</h3>
              <p className="text-sm text-text-tertiary leading-relaxed">{card.desc}</p>
              {clickable && (
                <div className="mt-4 text-sm text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  Explore →
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}