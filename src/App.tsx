import { useState, useRef, useEffect } from 'react'
import './App.css'
import gsap from 'gsap'
import Navbar from './components/Navbar'
import Background from './components/Background'
import Dashboard from './views/Dashboard'
import Constellation from './views/Constellation'
import Chat from './views/Chat'
import Analyzer from './views/Analyzer'

import KnowledgeBase from './views/KnowledgeBase'

export type TabId = 'dashboard' | 'constellation' | 'chat' | 'analyzer' | 'knowledge'

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const mainRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

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
    <div className="min-h-screen bg-void text-text-primary">
      <Background />
      <div className="relative z-10">
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
        <main ref={mainRef} className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
          {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
          {activeTab === 'constellation' && <Constellation />}
          {activeTab === 'chat' && <Chat />}
          {activeTab === 'analyzer' && <Analyzer />}
          {activeTab === 'knowledge' && <KnowledgeBase onNavigate={setActiveTab} />}
        </main>
      </div>
    </div>
  )
}