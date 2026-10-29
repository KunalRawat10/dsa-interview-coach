type CpuMessage = { role: string; content: string }
export const CPU_MODEL_ID = 'Xenova/LaMini-Flan-T5-77M'
export function cpuTutorPrompt(messages: CpuMessage[]): string {
  const question = messages.findLast(message => message.role === 'user')?.content ?? ''
  const reference = messages.find(message => message.role === 'system')?.content ?? ''
  const previous = messages.findLast(message => message.role === 'assistant')?.content ?? ''
  const problem = reference.match(/Problem: ([^\n]+)/)?.[1] ?? ''
  const needsContext = /\b(?:problem|array|duplicate|repeat|algorithm|approach|this|that|same)\b/i.test(question)
  // This is an instruction model, not a chat-template model. A short direct
  // question works better than a long role-labelled conversation.
  return `Answer this programming question in plain language: ${question.slice(0, 900)}${needsContext ? `\nContext: ${problem.slice(0, 350)} ${previous.slice(0, 250)}` : ''}`
}
interface Pending { resolve: (text: string) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }
export class CpuTutorClient {
  private worker: Worker
  private nextId = 0
  private pending = new Map<number, Pending>()
  private progress: (text: string) => void
  private disposed = false
  private onFatal: (text: string) => void
  constructor(worker: Worker, progress: (text: string) => void, onFatal: (text: string) => void = () => {}) {
    this.worker = worker; this.progress = progress
    this.onFatal = onFatal
    worker.onmessage = event => {
      const data = event.data as { id: number; type: string; text?: string; error?: string }
      if (data.type === 'progress') { if (!this.disposed) this.progress(data.text ?? 'Loading CPU Light…'); return }
      const task = this.pending.get(data.id)
      if (!task) return
      clearTimeout(task.timer); this.pending.delete(data.id)
      if (data.error) task.reject(new Error(data.error)); else task.resolve(data.text ?? '')
    }
    worker.onerror = () => this.fail('CPU Light could not start. Check your connection and browser WebAssembly support.')
  }
  private request(type: 'load' | 'generate', prompt = ''): Promise<string> {
    if (this.disposed) return Promise.reject(new Error('CPU Light has been stopped. Load it again to continue.'))
    const id = ++this.nextId
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.fail('CPU Light took too long on this device. Your conversation has been kept; try again or use the workshop.')
      }, type === 'load' ? 180000 : 90000)
      this.pending.set(id, { resolve, reject, timer })
      this.worker.postMessage({ id, type, prompt })
    })
  }
  async load(): Promise<void> { await this.request('load') }
  async complete(messages: CpuMessage[]) {
    const content = await this.request('generate', cpuTutorPrompt(messages))
    return { choices: [{ message: { content } }] }
  }
  private fail(reason: string): void { this.dispose(reason); this.onFatal(reason) }
  dispose(reason = 'CPU Light was stopped.'): void {
    this.disposed = true; this.worker.terminate()
    for (const task of this.pending.values()) { clearTimeout(task.timer); task.reject(new Error(reason)) }
    this.pending.clear()
  }
}
