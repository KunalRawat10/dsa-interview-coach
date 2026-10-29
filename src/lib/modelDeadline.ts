// A local worker can stop responding without rejecting its pending promise.
export async function withModelDeadline<T>(work: () => Promise<T>, timeoutMs: number, onTimeout?: () => void): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      work(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          try { onTimeout?.() } catch { /* A cancellation error must not leave the chat waiting. */ }
          reject(new Error('The local model timed out. Try a smaller model or installed desktop AI.'))
        }, timeoutMs)
      }),
    ])
  } finally { clearTimeout(timer) }
}

export function browserLoadProgress(progress: number, text: string): string {
  const pct = Math.max(0, Math.min(100, Math.round(progress * 100)))
  if (/Loading model from cache/i.test(text)) return `Loading downloaded model into graphics memory… ${pct}%`
  if (/Fetching param|fetch params/i.test(text)) return `Downloading model files… ${pct}%`
  return 'Preparing the browser model…'
}
