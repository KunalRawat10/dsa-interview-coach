import { pipeline, env, type Text2TextGenerationPipeline } from '@xenova/transformers'
import { CPU_MODEL_ID } from '../lib/cpuTutor'

env.allowLocalModels = false
// One WASM thread works without SharedArrayBuffer or cross-origin isolation.
env.backends.onnx.wasm.numThreads = 1
env.backends.onnx.wasm.proxy = false
let generator: Text2TextGenerationPipeline | null = null
self.onmessage = async event => {
  const { id, type, prompt } = event.data as { id: number; type: string; prompt: string }
  try {
    if (type === 'load') {
      generator = await pipeline('text2text-generation', CPU_MODEL_ID, {
        quantized: true,
        progress_callback: (progress: { status?: string; progress?: number; file?: string }) => {
          if (progress.status === 'progress') self.postMessage({ id, type: 'progress', text: `Downloading CPU Light… ${Math.round(progress.progress ?? 0)}%` })
        },
      })
      self.postMessage({ id, type: 'ready', text: '' })
    } else {
      if (!generator) throw new Error('Load CPU Light first.')
      const result = await generator(prompt, { max_new_tokens: 96, do_sample: false, repetition_penalty: 1.15 })
      const output = Array.isArray(result) ? result[0] : result
      if (!output || !('generated_text' in output) || !output.generated_text.trim()) throw new Error('CPU Light returned an empty reply. Your conversation is kept.')
      self.postMessage({ id, type: 'result', text: output.generated_text })
    }
  } catch (error) {
    self.postMessage({ id, type: 'error', error: error instanceof Error ? error.message : 'CPU Light failed.' })
  }
}
