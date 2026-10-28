import { embedText } from './embeddings'
import { getAllChunks, retrieveRelevant, type NoteChunk } from './notesStore'

// Skips loading the embedding model entirely if the user has no notes saved —
// zero cost for anyone who hasn't used the Knowledge Base yet.
export async function retrieveForQuery(
    query: string,
    topK = 2,
    lightweight = false,
): Promise<{ chunk: NoteChunk; score: number }[]> {
    const all = await getAllChunks()
    if (all.length === 0) return []
    if (lightweight) {
        const words = [...new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [])]
        return all.map(chunk => ({ chunk, score: words.filter(word => chunk.text.toLowerCase().includes(word)).length }))
            .filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, topK)
    }
    const queryEmbedding = await embedText(query)
    return retrieveRelevant(queryEmbedding, topK)
}
