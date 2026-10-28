import { useEffect, useState } from 'react'
import type { TabId } from '../App'
import { useScrollY } from '../hooks/useScrollY'

interface NavbarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'constellation', label: 'Patterns' },
  { id: 'practice', label: 'Practice' },
  { id: 'complexity', label: 'Complexity' },
  { id: 'knowledge', label: 'Notes' },
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
        scrolled || activeTab !== 'home'
          ? 'border-b border-ink-700 bg-ink-950 shadow-sm shadow-black/20'
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
            PatternOS<span className="text-[#ad4c2c]">.</span>
          </span>
        </button>

        {/* Nav Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onTabChange(tab.id)}
                className={`px-3.5 py-1.5 text-xs sm:text-sm font-sans font-medium rounded-md transition-colors cursor-pointer ${
                  isActive
                    ? 'text-accent-300 bg-accent-500/10 border border-accent-500/25'
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
            <span>Open workbook ↗</span>
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
              Open workbook ↗
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="shrink-0" aria-hidden="true">
      <rect x="1" y="1" width="26" height="26" rx="2" fill="#315b49" />
      <path d="M8 21V7h6a4 4 0 010 8H8" stroke="#fffdf8" strokeWidth="1.6" strokeLinecap="square" />
      <path d="M21 4v4" stroke="#d5a978" strokeWidth="2" />
    </svg>
  )
}
