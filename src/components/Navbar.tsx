import type { TabId } from '../App'

interface NavbarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const tabs: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Observatory' },
  { id: 'constellation', label: 'Constellation' },
  { id: 'chat', label: 'Socratic Chamber' },
  { id: 'analyzer', label: 'Complexity Forge' },
]

export default function Navbar({ activeTab, onTabChange }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-void/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="text-xl">◈</span>
        <span className="text-lg font-medium tracking-wide">DSA Coach</span>
      </div>
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-surface-strong text-text-primary'
                : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-raised'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}