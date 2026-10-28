import { useState } from 'react'
import { downloadLessons, type OfflineProgress } from '../lib/offlineLessons'
export default function OfflineLessons() {
  const [progress, setProgress] = useState<OfflineProgress>({ state: 'idle', message: '' })
  const save = async () => {
    try { await downloadLessons(setProgress) }
    catch (error) { setProgress({ state: 'error', message: error instanceof Error ? error.message : 'Could not save lessons.' }) }
  }
  return <div className="mb-4 rounded-lg border border-border-subtle p-3 text-xs">
    <button disabled={progress.state === 'saving'} onClick={save} className="text-accent underline disabled:opacity-50">{progress.state === 'saving' ? 'Saving…' : 'Save core lessons for offline use'}</button>
    <p className="text-text-tertiary mt-1">Saves problem statements, workshop exercises and explanations. Open-ended AI chat needs a separately downloaded model and compatible graphics.</p>
    {progress.message && <p role="status" className="mt-2">{progress.message}</p>}
  </div>
}
