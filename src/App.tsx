import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react'
import './App.css'
import gsap from 'gsap'
import Navbar from './components/Navbar'
const HomePage = lazy(() => import('./components/home/FieldHome'))
const Constellation = lazy(() => import('./views/Constellation'))
const Chat = lazy(() => import('./views/Chat'))
const Analyzer = lazy(() => import('./views/Analyzer'))
const KnowledgeBase = lazy(() => import('./views/KnowledgeBase'))

export type TabId = 'home' | 'constellation' | 'practice' | 'complexity' | 'knowledge' | 'dashboard' | 'chat' | 'analyzer'

function getTabFromPath(): TabId {
  if (typeof window === 'undefined') return 'home'
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase()
  if (!path || path === 'home' || path === 'dashboard') return 'home'
  if (path === 'constellation') return 'constellation'
  if (path === 'practice' || path === 'chat') return 'practice'
  if (path === 'complexity' || path === 'analyzer') return 'complexity'
  if (path === 'knowledge') return 'knowledge'
  return 'home'
}

function getPathForTab(tab: TabId): string {
  if (tab === 'home' || tab === 'dashboard') return '/'
  if (tab === 'chat') return '/practice'
  if (tab === 'analyzer') return '/complexity'
  return `/${tab}`
}

export default function App() {
  const [activeTab, setActiveTabState] = useState<TabId>(getTabFromPath)
  const mainRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  const isHome = activeTab === 'home' || activeTab === 'dashboard'

  const handleTabChange = useCallback((nextTab: TabId) => {
    setActiveTabState((currentTab) => {
      if (currentTab === nextTab) return currentTab
      const nextPath = getPathForTab(nextTab)
      if (window.location.pathname !== nextPath) {
        window.history.pushState({ tab: nextTab }, '', nextPath)
      }
      return nextTab
    })
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath()
      setActiveTabState(tab)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (mainRef.current && !isFirstRender.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      )
    }
    isFirstRender.current = false
  }, [activeTab])

  return (
    <div className="theme-notebook min-h-screen bg-void text-text-primary flex flex-col font-sans relative overflow-x-hidden">
      {/* Home uses dark flowing algorithmic background; other pages use their existing Silk background */}

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
        <main
          ref={mainRef}
          className={`flex-1 w-full mx-auto ${!isHome ? 'workspace' : ''} ${
            isHome
              ? 'pt-0'
              : 'px-4 sm:px-6 pt-24 pb-12 max-w-6xl'
          }`}
        >
          <Suspense fallback={<p role="status" className="p-6 text-sm">Opening lesson…</p>}>
          {isHome && <HomePage onNavigate={handleTabChange} />}
          {activeTab === 'constellation' && <Constellation />}
          {(activeTab === 'practice' || activeTab === 'chat') && <Chat />}
          {(activeTab === 'complexity' || activeTab === 'analyzer') && <Analyzer />}
          {activeTab === 'knowledge' && <KnowledgeBase onNavigate={handleTabChange} />}
          </Suspense>
        </main>
        {/* AppDock is globally mounted and interactive across all pages */}
      </div>
    </div>
  )
}
