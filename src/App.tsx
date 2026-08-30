import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import gsap from 'gsap'
import Navbar from './components/Navbar'
import AppDock from './components/AppDock'
import Background from './components/Background'
import HomeBackground from './components/home/HomeBackground'
import HomePage from './components/home/HomePage'
import Constellation from './views/Constellation'
import Chat from './views/Chat'
import Analyzer from './views/Analyzer'
import KnowledgeBase from './views/KnowledgeBase'

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
  const isPractice = activeTab === 'practice' || activeTab === 'chat'

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
    if (mainRef.current && !isFirstRender.current) {
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      )
    }
    isFirstRender.current = false
  }, [activeTab])

  return (
    <div className="min-h-screen bg-void text-text-primary flex flex-col font-sans relative overflow-x-hidden">
      {/* Home uses dark flowing algorithmic background; other pages use their existing Silk background */}
      {isHome ? <HomeBackground /> : <Background />}

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar activeTab={activeTab} onTabChange={handleTabChange} />
        <main
          ref={mainRef}
          className={`flex-1 w-full mx-auto ${
            isHome
              ? 'pt-0 pb-28 sm:pb-36'
              : isPractice
                ? 'px-6 pt-24 pb-32 max-w-6xl'
                : 'px-6 pt-24 pb-32 max-w-5xl'
          }`}
        >
          {isHome && <HomePage onNavigate={handleTabChange} />}
          {activeTab === 'constellation' && <Constellation />}
          {(activeTab === 'practice' || activeTab === 'chat') && <Chat />}
          {(activeTab === 'complexity' || activeTab === 'analyzer') && <Analyzer />}
          {activeTab === 'knowledge' && <KnowledgeBase onNavigate={handleTabChange} />}
        </main>
        {/* AppDock is globally mounted and interactive across all pages */}
        <AppDock activeTab={activeTab} onNavigate={handleTabChange} />
      </div>
    </div>
  )
}