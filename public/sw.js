/* Core offline lessons only. Never cache local APIs, chat requests or AI models. */
const PREFIX = 'patternos-lessons-'
let currentCache
async function manifest() {
  const response = await fetch('/lesson-assets.json', { cache: 'no-store' })
  if (!response.ok) throw new Error('Use a production build to save offline lessons.')
  return response.json()
}
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('message', event => {
  if (event.data?.type !== 'SAVE_LESSONS') return
  event.waitUntil((async () => {
    let name
    try {
      const data = await manifest()
      name = PREFIX + data.version
      const cache = await caches.open(name)
      // addAll is atomic: do not report success for a partial pack.
      await cache.addAll(data.assets)
      currentCache = name
      for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== name) await caches.delete(key)
      event.ports[0]?.postMessage({ ok: true })
    } catch (error) {
      // addAll is atomic; preserve an existing pack if refreshing it failed.
      event.ports[0]?.postMessage({ ok: false, error: String(error.message ?? error) })
    }
  })())
})
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname === '/sw.js' || url.pathname === '/lesson-assets.json') return
  event.respondWith((async () => {
    const keys = await caches.keys()
    const name = currentCache ?? keys.find(key => key.startsWith(PREFIX))
    if (!name) return fetch(event.request)
    const cache = await caches.open(name)
    if (event.request.mode === 'navigate') {
      try { return await fetch(event.request) } catch { return (await cache.match('/index.html', { ignoreVary: true })) ?? Response.error() }
    }
    // Public versioned assets are identical across Origin/encoding headers.
    return (await cache.match(event.request, { ignoreVary: true })) ?? fetch(event.request)
  })())
})
