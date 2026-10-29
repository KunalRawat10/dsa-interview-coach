import type { TutorChunk, TutorCompletionOptions } from './conversationalTutor'

export const WORKED_STEP_SCHEMA = {
  type: 'object',
  properties: {
    explanation: { type: 'string', minLength: 1, description: 'One short definition or explanation of the missing idea.' },
    workedExample: { type: 'string', minLength: 1, description: 'Perform exactly ONE comparison or operation and state its result in at most two sentences. Never traverse the entire array.' },
    checkQuestion: { type: 'string', description: 'One small prediction applying the action just demonstrated, or empty.' },
  },
  required: ['explanation', 'workedExample', 'checkQuestion'],
  additionalProperties: false,
}

export async function findDesktopModel(): Promise<string> {
  const response = await fetch('/api/local-models', { signal: AbortSignal.timeout(5000) })
  if (!response.ok) throw new Error('Start Ollama on this computer, then retry desktop AI.')
  const data = await response.json() as { models?: { name: string }[] }
  const names = data.models?.map(model => model.name) ?? []
  const selected = ['qwen2.5:7b', 'qwen2.5-coder:7b', 'qwen2.5:1.5b', 'qwen2.5:0.5b'].find(name => names.includes(name))
  if (!selected) throw new Error('No supported desktop model found. Install qwen2.5:0.5b in Ollama, or use browser AI.')
  return selected
}

// Adapt Ollama's newline-delimited stream to the existing chat streaming interface.
export async function* desktopCompletion(
  model: string,
  messages: { role: string; content: string }[],
  options?: TutorCompletionOptions,
): AsyncGenerator<TutorChunk> {
  const response = await fetch('/api/local-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true, format: options?.responseFormat === 'json' ? options.jsonSchema ?? WORKED_STEP_SCHEMA : undefined, options: { temperature: options?.temperature ?? 0.3, num_predict: options?.maxTokens ?? 900, num_ctx: /:(?:0\.5|1\.5)b$/.test(model) ? 4096 : 8192 } }),
    signal: AbortSignal.timeout(120000),
  })
  if (!response.ok || !response.body) throw new Error('Desktop AI is unavailable. Check that Ollama is running.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let completed = false
  try {
    while (true) {
      const { value, done } = await reader.read()
      pending += decoder.decode(value, { stream: !done })
      const lines = pending.split('\n')
      pending = lines.pop() ?? ''
      if (done && pending.trim()) { lines.push(pending); pending = '' }
      for (const line of lines) {
        if (!line.trim()) continue
        const data = JSON.parse(line) as { error?: string; message?: { content?: string }; done?: boolean }
        if (data.error) throw new Error(data.error)
        if (data.message?.content) yield { choices: [{ delta: { content: data.message.content } }] }
        if (data.done) completed = true
      }
      if (done) break
    }
    if (!completed) throw new Error('Desktop AI disconnected before completing its reply.')
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}
