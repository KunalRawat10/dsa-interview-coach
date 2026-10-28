import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'

test('offline worker saves the pack, serves Practice without network, and excludes APIs and models', async () => {
  const handlers = new Map(), stores = new Map()
  let offline = false, failDownload = false
  const cacheApi = {
    keys: async () => [...stores.keys()], delete: async key => stores.delete(key),
    open: async key => {
      if (!stores.has(key)) stores.set(key, new Map())
      const store = stores.get(key)
      return { addAll: async urls => { if (failDownload) throw Error('Download failed'); for (const url of urls) store.set(url, new Response(url === '/index.html' ? 'saved lesson shell' : 'lesson script')) }, match: async (request, options) => {
        // Module requests can include Origin although the download did not.
        assert.equal(options?.ignoreVary, true, 'Versioned public assets must survive the module Origin header difference')
        return store.get(typeof request === 'string' ? request : new URL(request.url).pathname)?.clone()
      } }
    },
  }
  const context = vm.createContext({ self: { location: { origin: 'https://pattern.test' }, addEventListener: (type, handler) => handlers.set(type, handler), skipWaiting() {}, clients: { claim() {} } }, caches: cacheApi, Response, URL,
    fetch: async url => {
      if (offline) throw Error('Network unavailable')
      if (url === '/lesson-assets.json') return Response.json({ version: 'test', assets: ['/index.html', '/assets/Chat-test.js'] })
      return new Response('network')
    },
  })
  vm.runInContext(await readFile(new URL('../public/sw.js', import.meta.url), 'utf8'), context)
  async function save() {
    let pending, response
    handlers.get('message')({ data: { type: 'SAVE_LESSONS' }, ports: [{ postMessage: data => { response = data } }], waitUntil: promise => { pending = promise } })
    await pending; return response
  }
  assert.equal((await save()).ok, true)
  failDownload = true
  assert.equal((await save()).ok, false)
  // A failed refresh must not delete the previously downloaded pack.
  assert.equal(stores.get('patternos-lessons-test').size, 2)
  offline = true
  async function request(path, mode) {
    let pending
    handlers.get('fetch')({ request: { url: 'https://pattern.test' + path, method: 'GET', mode }, respondWith: promise => { pending = promise } })
    return pending
  }
  assert.equal(await (await request('/practice', 'navigate')).text(), 'saved lesson shell')
  assert.equal(await (await request('/assets/Chat-test.js', 'cors')).text(), 'lesson script')
  assert.equal(await request('/api/local-chat', 'cors'), undefined)
  assert.equal(await request('/sw.js', 'cors'), undefined)
  let intercepted = false
  handlers.get('fetch')({ request: { url: 'https://huggingface.co/model', method: 'GET' }, respondWith: () => { intercepted = true } })
  assert.equal(intercepted, false)
})
