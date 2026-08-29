import { useState } from 'react'
import WebLLMChat from '../components/WebLLMChat'

export default function Chat() {
  const [status, setStatus] = useState('Initializing...')

  return (
    <div className="animate-fade-in h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium">Socratic Chamber</h2>
          <p className="text-sm text-text-tertiary mt-1">
            AI-powered interview coaching. Your code never leaves your browser.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              status.includes('ready') ? 'bg-success' : status.includes('failed') ? 'bg-danger' : 'bg-warning animate-pulse'
            }`}
          />
          <span className="text-text-muted">{status}</span>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="h-full rounded-xl border border-border-subtle bg-surface/75 shadow-xl shadow-black/40 p-6">
        <WebLLMChat onStatusChange={setStatus} />
      </div>
    </div>
  )
}