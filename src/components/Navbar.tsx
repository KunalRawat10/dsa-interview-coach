import { useEffect, useState } from 'react'
import type { TabId } from '../App'
import { useScrollY } from '../hooks/useScrollY'

interface NavbarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'constellation', label: 'Constellation' },
  { id: 'practice', label: 'Practice' },
  { id: 'complexity', label: 'Complexity' },
  { id: 'knowledge', label: 'Knowledge' },
]

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  const scrollY = useScrollY()
  const [mobileOpen, setMobileOpen] = useState(false)
  const scrolled = scrollY > 40

  useEffect(() => {
    setMobileOpen(false)
  }, [scrollY])

  const handleLogoClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if ('key' in e && e.key !== 'Enter' && e.key !== ' ') {
      return
    }
    e.preventDefault()
    if (activeTab !== 'home') {
      onTabChange('home')
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-ink-700 bg-ink-950/85 backdrop-blur-md shadow-lg shadow-black/40'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Official PatternOS Brand Vector Lockup */}
        <button
          type="button"
          onClick={handleLogoClick}
          onKeyDown={handleLogoClick}
          aria-label="PatternOS home"
          className="flex items-center gap-2.5 cursor-pointer group select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 rounded-md transition-opacity hover:opacity-95 active:opacity-80 p-0 bg-transparent border-0 shrink-0"
        >
          <Logo />
          <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-paper-50">
            PatternOS
          </span>
        </button>

        {/* Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-sans font-medium rounded-md transition-colors cursor-pointer ${
                  isActive
                    ? 'text-paper-50 bg-ink-800 border border-ink-600'
                    : 'text-paper-300 hover:text-paper-50 hover:bg-ink-900/60'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => onTabChange('practice')}
            className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-400 hover:shadow-lg hover:shadow-accent-500/20 cursor-pointer"
          >
            <span>Start Learning</span>
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-paper-200 md:hidden p-1.5 focus:outline-none cursor-pointer"
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {mobileOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="border-t border-ink-700 bg-ink-950/95 px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id)
                  setMobileOpen(false)
                }}
                className={`text-left text-sm py-1 transition-colors cursor-pointer ${
                  activeTab === tab.id ? 'text-paper-50 font-semibold' : 'text-paper-300 hover:text-paper-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => {
                onTabChange('practice')
                setMobileOpen(false)
              }}
              className="mt-2 rounded-lg bg-accent-500 px-4 py-2 text-center text-sm font-medium text-white cursor-pointer"
            >
              Start Learning
            </button>
          </nav>
        </div>
      )}
    </header>
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