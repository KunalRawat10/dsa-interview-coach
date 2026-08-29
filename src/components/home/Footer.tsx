import type { TabId } from '../../App'

interface FooterProps {
  onNavigate: (tab: TabId) => void
}

interface FooterLink {
  label: string
  tab?: TabId
}

interface FooterColumn {
  title: string
  links: FooterLink[]
}

export default function Footer({ onNavigate }: FooterProps) {
  const handleScrollTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const columns: FooterColumn[] = [
    {
      title: 'Product',
      links: [
        { label: 'Constellation', tab: 'constellation' as TabId },
        { label: 'Practice', tab: 'practice' as TabId },
        { label: 'AI Tutor', tab: 'practice' as TabId },
        { label: 'Complexity', tab: 'complexity' as TabId },
        { label: 'Knowledge', tab: 'knowledge' as TabId },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Pattern Library' },
        { label: 'Learning Paths' },
        { label: 'Documentation' },
        { label: 'Blog' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About' },
        { label: 'Mission' },
        { label: 'Contact' },
        { label: 'Privacy' },
      ],
    },
  ]

  return (
    <footer className="border-t border-white/[0.08] bg-ink-950 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <button
              type="button"
              onClick={handleScrollTop}
              aria-label="PatternOS home"
              className="flex items-center gap-2.5 cursor-pointer group select-none transition-opacity hover:opacity-90 active:opacity-80 p-0 bg-transparent border-0 text-left"
            >
              <Logo />
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-paper-50">
                PatternOS
              </span>
            </button>
            <p className="mt-4 max-w-xs text-xs sm:text-sm leading-relaxed text-paper-400">
              Think in patterns, not solutions. A platform for building
              algorithmic intuition.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <div className="mb-4 font-mono text-xs uppercase tracking-wider text-paper-500 font-semibold">
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.tab ? (
                      <button
                        onClick={() => onNavigate(link.tab!)}
                        className="text-xs sm:text-sm text-paper-400 transition-colors hover:text-paper-100 cursor-pointer"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <span className="text-xs sm:text-sm text-paper-400 hover:text-paper-100 transition-colors cursor-pointer">
                        {link.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-6 sm:flex-row">
          <p className="font-mono text-xs text-paper-500">
            PatternOS — Think in patterns, not solutions.
          </p>
          <div className="flex items-center gap-6">
            <span className="font-mono text-xs text-paper-500 transition-colors hover:text-paper-200 cursor-pointer">
              Terms
            </span>
            <span className="font-mono text-xs text-paper-500 transition-colors hover:text-paper-200 cursor-pointer">
              Privacy
            </span>
            <span className="font-mono text-xs text-paper-500 transition-colors hover:text-paper-200 cursor-pointer">
              GitHub
            </span>
          </div>
        </div>
      </div>
    </footer>
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
