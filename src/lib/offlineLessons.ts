export interface OfflineProgress { state: 'idle' | 'saving' | 'ready' | 'error'; message: string }
export async function downloadLessons(update: (progress: OfflineProgress) => void): Promise<void> {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) throw new Error('Offline lessons need HTTPS or localhost in a browser with service worker support.')
  update({ state: 'saving', message: 'Saving lessons and app files…' })
  const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  const worker = registration.active ?? registration.installing ?? registration.waiting
  if (!worker) throw new Error('Offline worker is not available yet. Please retry.')
  if (worker.state !== 'activated') await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => { worker.removeEventListener('statechange', changed); reject(new Error('Offline setup took too long. Please retry.')) }, 30000)
    function changed() { if (worker!.state === 'activated') { clearTimeout(timeout); worker!.removeEventListener('statechange', changed); resolve() } }
    worker.addEventListener('statechange', changed)
    changed()
  })
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel()
    const timeout = setTimeout(() => { channel.port1.close(); reject(new Error('Saving timed out. Check your connection and retry.')) }, 90000)
    channel.port1.onmessage = event => {
      clearTimeout(timeout); channel.port1.close()
      if (event.data.ok) { update({ state: 'ready', message: 'Core lessons saved. You can reopen Practice offline. AI model files are separate.' }); resolve() }
      else reject(new Error(event.data.error ?? 'Could not save all lesson files.'))
    }
    worker.postMessage({ type: 'SAVE_LESSONS' }, [channel.port2])
  })
}
