import { pipeline, env } from '@xenova/transformers'

// Local model files only — no remote inference calls, no server round-trip.
env.allowLocalModels = false

type Extractor = any
let extractorPromise: Promise<Extractor> | null = null

function getExtractor(onProgress?: (pct: number) => void): Promise<Extractor> {
    if (!extractorPromise) {
        extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
            quantized: true,
            progress_callback: (data: any) => {
                if (data?.status === 'progress' && typeof data.progress === 'number') {
                    onProgress?.(Math.round(data.progress))
                }
            },
        })
    }
    return extractorPromise
}

// ~25MB one-time download, cached by the browser after — a fraction of the
// 1.5GB chat model, and only triggered when the user actually has notes.
export async function embedText(text: string, onProgress?: (pct: number) => void): Promise<number[]> {
    const extractor = await getExtractor(onProgress)
    const output = await extractor(text, { pooling: 'mean', normalize: true })
    return Array.from(output.data as Float32Array)
}