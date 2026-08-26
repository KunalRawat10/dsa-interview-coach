export interface NoteChunk {
    id: string
    sourceTitle: string
    text: string
    embedding: number[]
}

const DB_NAME = 'dsa-coach-notes'
const STORE_NAME = 'chunks'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = () => {
            const db = req.result
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' })
            }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

export async function saveChunks(chunks: NoteChunk[]): Promise<void> {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        chunks.forEach((c) => store.put(c))
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

export async function getAllChunks(): Promise<NoteChunk[]> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const req = tx.objectStore(STORE_NAME).getAll()
        req.onsuccess = () => resolve(req.result as NoteChunk[])
        req.onerror = () => reject(req.error)
    })
}

export async function deleteChunk(id: string): Promise<void> {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).delete(id)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

export async function clearChunks(): Promise<void> {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
    })
}

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0
    let normA = 0
    let normB = 0
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1)
}

export async function retrieveRelevant(
    queryEmbedding: number[],
    topK = 2,
    minScore = 0.35
): Promise<{ chunk: NoteChunk; score: number }[]> {
    const chunks = await getAllChunks()
    return chunks
        .map((chunk) => ({ chunk, score: cosineSimilarity(queryEmbedding, chunk.embedding) }))
        .filter((r) => r.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
}

// Paragraph-first chunker; long paragraphs get split on sentence boundaries
// so no chunk overwhelms the embedding model's effective context.
export function chunkText(raw: string, maxChars = 400): string[] {
    const paragraphs = raw
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    const chunks: string[] = []
    for (const p of paragraphs) {
        if (p.length <= maxChars) {
            chunks.push(p)
            continue
        }
        const sentences = p.split(/(?<=[.?!])\s+/)
        let current = ''
        for (const s of sentences) {
            if (current && (current + ' ' + s).length > maxChars) {
                chunks.push(current.trim())
                current = s
            } else {
                current = current ? current + ' ' + s : s
            }
        }
        if (current) chunks.push(current.trim())
    }
    return chunks
}