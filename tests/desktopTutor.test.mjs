import test from 'node:test'
import assert from 'node:assert/strict'
import { desktopCompletion, findDesktopModel } from '../src/lib/desktopTutor.ts'
import { generateTutorReply } from '../src/lib/conversationalTutor.ts'

test('desktop stream handles split UTF-8 and JSON records without losing text', async t => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  const wire = new TextEncoder().encode(
    JSON.stringify({ message: { content: 'A guest list ' } }) + '\n' +
    JSON.stringify({ message: { content: 'remembers café visitors.' }, done: true }),
  )
  let request
  globalThis.fetch = async (url, options) => {
    request = { url, body: JSON.parse(options.body) }
    return new Response(new ReadableStream({ start(controller) {
      for (let i = 0; i < wire.length; i += 7) controller.enqueue(wire.slice(i, i + 7))
      controller.close()
    } }))
  }
  const reply = await generateTutorReply([{ role: 'user', content: 'my analogy' }], async payload => desktopCompletion('qwen2.5-coder:7b', payload))
  assert.equal(reply, 'A guest list remembers café visitors.')
  assert.equal(request.url, '/api/local-chat')
  assert.equal(request.body.messages[0].content, 'my analogy')
})

test('desktop disconnect and service errors reject rather than looking like success', async t => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  globalThis.fetch = async () => new Response('{"message":{"content":"partial"}}\n')
  await assert.rejects(generateTutorReply([], async p => desktopCompletion('model', p)), /disconnected/)
  globalThis.fetch = async () => new Response('{"error":"out of memory"}\n')
  await assert.rejects(generateTutorReply([], async p => desktopCompletion('model', p)), /out of memory/)
  globalThis.fetch = async () => new Response('Unavailable', { status: 503 })
  await assert.rejects(findDesktopModel(), /Start Ollama/)
})

test('desktop discovery chooses an installed supported model and handles missing models', async t => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  globalThis.fetch = async () => Response.json({ models: [{ name: 'qwen2.5:7b' }, { name: 'qwen2.5-coder:7b' }] })
  assert.equal(await findDesktopModel(), 'qwen2.5:7b')
  globalThis.fetch = async () => Response.json({ models: [] })
  await assert.rejects(findDesktopModel(), /No supported desktop model/)
})

test('beginner teaching asks Ollama to enforce explanation and example fields', async t => {
  const original = globalThis.fetch
  t.after(() => { globalThis.fetch = original })
  let body
  globalThis.fetch = async (_url, options) => {
    body = JSON.parse(options.body)
    return new Response('{"message":{"content":"step"},"done":true}\n')
  }
  for await (const chunk of desktopCompletion('qwen2.5:7b', [], { responseFormat: 'json' })) assert.ok(chunk)
  assert.deepEqual(body.format.required, ['explanation', 'workedExample', 'checkQuestion'])
  assert.equal(body.format.additionalProperties, false)
})
