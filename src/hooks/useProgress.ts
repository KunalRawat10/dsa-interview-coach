import { useEffect, useState, useCallback } from 'react'

export type Difficulty = 'easy' | 'medium' | 'hard'

// Harder problems move mastery further per solve — this is the "accuracy"
// lever: a Hard solve should count for meaningfully more than an Easy one.
const DIFFICULTY_DELTA: Record<Difficulty, number> = {
    easy: 0.08,
    medium: 0.15,
    hard: 0.25,
}

export interface PatternStat {
    mastered: number // 0..1
    solved: number
}

export interface Progress {
    patternsMastered: number
    problemsSolved: number
    dayStreak: number
    lastActiveDate: string | null // ISO date, used to compute streak
    patternProgress: Record<string, PatternStat> // keyed by pattern id, e.g. 'two-pointers'
}

const STORAGE_KEY = 'dsa-coach:progress'

const ZERO_PROGRESS: Progress = {
    patternsMastered: 0,
    problemsSolved: 0,
    dayStreak: 0,
    lastActiveDate: null,
    patternProgress: {},
}

function loadProgress(): Progress {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return { ...ZERO_PROGRESS }
        return { ...ZERO_PROGRESS, ...JSON.parse(raw) }
    } catch {
        return { ...ZERO_PROGRESS }
    }
}

function saveProgress(p: Progress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
        // localStorage unavailable (private mode, quota) — fail silently, state still works in-session
    }
}

function bumpStreak(p: Progress): Progress {
    const today = new Date().toISOString().slice(0, 10)
    if (p.lastActiveDate === today) return p
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const continued = p.lastActiveDate === yesterday
    return {
        ...p,
        dayStreak: continued ? p.dayStreak + 1 : 1,
        lastActiveDate: today,
    }
}

export function useProgress() {
    const [progress, setProgress] = useState<Progress>(loadProgress)

    useEffect(() => {
        saveProgress(progress)
    }, [progress])

    const recordProblemSolved = useCallback(() =>
        setProgress((p) => bumpStreak({ ...p, problemsSolved: p.problemsSolved + 1 })), [])

    const recordPatternMastered = useCallback(() =>
        setProgress((p) => bumpStreak({ ...p, patternsMastered: p.patternsMastered + 1 })), [])

    // Bumps a specific pattern's mastery/solved count, weighted by how hard the
    // problem was — a Hard solve moves mastery further than an Easy one. Also
    // keeps the global solved counter in sync.
    const recordPatternProgress = useCallback((patternId: string, difficulty: Difficulty = 'medium') =>
        setProgress((p) => {
            const current = p.patternProgress[patternId] ?? { mastered: 0, solved: 0 }
            const nextMastered = Math.min(1, current.mastered + DIFFICULTY_DELTA[difficulty])
            return bumpStreak({
                ...p,
                problemsSolved: p.problemsSolved + 1,
                patternProgress: {
                    ...p.patternProgress,
                    [patternId]: { mastered: nextMastered, solved: current.solved + 1 },
                },
            })
        }), [])

    // The undo/struggled path — walks mastery and solved count back down by the
    // same weighting, floored at zero. Does not touch the streak.
    const decreasePatternProgress = useCallback((patternId: string, difficulty: Difficulty = 'medium') =>
        setProgress((p) => {
            const current = p.patternProgress[patternId] ?? { mastered: 0, solved: 0 }
            const nextMastered = Math.max(0, current.mastered - DIFFICULTY_DELTA[difficulty])
            const nextSolved = Math.max(0, current.solved - 1)
            return {
                ...p,
                problemsSolved: Math.max(0, p.problemsSolved - 1),
                patternProgress: {
                    ...p.patternProgress,
                    [patternId]: { mastered: nextMastered, solved: nextSolved },
                },
            }
        }), [])

    const recordActivity = useCallback(() => setProgress((p) => bumpStreak(p)), [])

    const resetProgress = useCallback(() => setProgress({ ...ZERO_PROGRESS }), [])

    return {
        progress,
        recordProblemSolved,
        recordPatternMastered,
        recordPatternProgress,
        decreasePatternProgress,
        recordActivity,
        resetProgress,
    }
}