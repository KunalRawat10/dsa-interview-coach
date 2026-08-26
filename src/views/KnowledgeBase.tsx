import { useEffect, useState } from 'react'
import { embedText } from '../lib/embeddings'
import { chunkText, saveChunks, getAllChunks, clearChunks, deleteChunk, type NoteChunk } from '../lib/notesStore'
import type { TabId } from '../App'

interface KnowledgeBaseProps {
    onNavigate: (tab: TabId) => void
}

export default function KnowledgeBase({ onNavigate }: KnowledgeBaseProps) {
    const [title, setTitle] = useState('')
    const [notes, setNotes] = useState('')
    const [status, setStatus] = useState('')
    const [busy, setBusy] = useState(false)
    const [chunks, setChunks] = useState<NoteChunk[]>([])

    const refresh = async () => setChunks(await getAllChunks())

    useEffect(() => {
        refresh()
    }, [])

    const handleSave = async () => {
        if (!notes.trim()) return
        setBusy(true)
        try {
            const pieces = chunkText(notes)
            const saved: NoteChunk[] = []
            for (let i = 0; i < pieces.length; i++) {
                setStatus(`Embedding chunk ${i + 1} of ${pieces.length}...`)
                const embedding = await embedText(pieces[i], (pct: number) =>
                    setStatus(`Loading embedding model (one-time, ~25MB)... ${pct}%`)
                )
                saved.push({
                    id: `${Date.now()}-${i}`,
                    sourceTitle: title.trim() || 'Untitled notes',
                    text: pieces[i],
                    embedding,
                })
            }
            await saveChunks(saved)
            setNotes('')
            setTitle('')
            setStatus(`Saved ${saved.length} chunk${saved.length === 1 ? '' : 's'}.`)
            await refresh()
        } catch (err) {
            console.error(err)
            setStatus('Something went wrong embedding your notes.')
        } finally {
            setBusy(false)
        }
    }

    const handleDelete = async (id: string) => {
        await deleteChunk(id)
        await refresh()
    }

    const handleClearAll = async () => {
        await clearChunks()
        await refresh()
    }

    const grouped = chunks.reduce<Record<string, NoteChunk[]>>((acc, c) => {
        acc[c.sourceTitle] = acc[c.sourceTitle] || []
        acc[c.sourceTitle].push(c)
        return acc
    }, {})

    return (
        <div className="animate-fade-in space-y-6">
            <div>
                <button
                    onClick={() => onNavigate('dashboard')}
                    className="text-sm text-text-tertiary hover:text-accent mb-3"
                >
                    ← Back to Observatory
                </button>
                <h2 className="text-2xl font-medium">Knowledge Base</h2>
                <p className="text-sm text-text-tertiary mt-1">
                    Paste your DSA notes here. The Socratic Chamber retrieves and grounds its hints in
                    them — nothing ever leaves your browser.
                </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-raised p-5 space-y-3">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Source title, e.g. 'Striver A2Z — Sliding Window'"
                    className="w-full bg-surface/50 border border-border-subtle rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
                />
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={8}
                    placeholder="Paste your notes here..."
                    className="w-full bg-surface/50 border border-border-subtle rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-accent/50"
                />
                <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-text-muted">{status}</span>
                    <button
                        onClick={handleSave}
                        disabled={busy || !notes.trim()}
                        className="shrink-0 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-40 transition-all"
                    >
                        {busy ? 'Embedding...' : 'Save & Embed'}
                    </button>
                </div>
            </div>

            {Object.keys(grouped).length > 0 && (
                <div className="rounded-xl border border-border-subtle bg-surface-raised p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-text-secondary">
                            Stored notes ({chunks.length} chunks)
                        </h3>
                        <button onClick={handleClearAll} className="text-xs text-danger hover:underline">
                            Clear all
                        </button>
                    </div>
                    {Object.entries(grouped).map(([src, items]) => (
                        <div key={src} className="space-y-2">
                            <div className="text-xs font-medium text-accent">
                                {src} — {items.length} chunk{items.length > 1 ? 's' : ''}
                            </div>
                            {items.slice(0, 3).map((c) => (
                                <div
                                    key={c.id}
                                    className="flex items-start justify-between gap-3 text-xs text-text-tertiary bg-surface/40 rounded-lg px-3 py-2"
                                >
                                    <span className="line-clamp-2">{c.text}</span>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="text-text-muted hover:text-danger shrink-0"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {items.length > 3 && (
                                <div className="text-[11px] text-text-muted pl-1">+ {items.length - 3} more</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}