import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { debugChatHistory, debugChatHistoryRaw, debugSessionLifecycle } from './lib/chatHistory'

// Explicit top-level global registration ensuring survival through Vite/Rollup production build
if (typeof window !== 'undefined') {
  window.debugChatHistory = debugChatHistory
  window.debugChatHistoryRaw = debugChatHistoryRaw
  window.debugSessionLifecycle = debugSessionLifecycle
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
