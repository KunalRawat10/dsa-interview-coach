import { embedText } from './embeddings'
import { getAllChunks, retrieveRelevant, type NoteChunk } from './notesStore'

// Skips loading the embedding model entirely if the user has no notes saved —
// zero cost for anyone who hasn't used the Knowledge Base yet.
export async function retrieveForQuery(
    query: string,
    topK = 2
): Promise<{ chunk: NoteChunk; score: number }[]> {
    const all = await getAllChunks()
    if (all.length === 0) return []
    const queryEmbedding = await embedText(query)
    return retrieveRelevant(queryEmbedding, topK)
}